const jwt = require('jsonwebtoken');
const { db, FieldValue } = require('../config/firebase');
const matchManager = require('./matchManager');

const QUEUE_FALLBACK_MS = 30_000; // 30 seconds

const getTodayString = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

module.exports = (io) => {
  const socketRooms = new Map();
  // Map of socketId -> NodeJS.Timeout for the 30s expand prompt
  const expandTimers = new Map();
  let onlineCount = 0;

  // ─── Socket Auth Middleware ────────────────────────────────────────────────
  io.use(async (socket, next) => {
    const origin = socket.handshake.headers.origin || socket.handshake.headers.referer;
    if (origin && !["https://woomegle.com", "https://www.woomegle.com"].includes(origin.replace(/\/$/, ''))) {
      console.warn(`[SOCKET.IO ORIGIN WARNING] Connection originating from unexpected origin: ${origin}`);
    }

    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      console.log(`[SOCKET.IO HANDSHAKE] No token provided for socket ${socket.id}, assigning guest status.`);
      socket.user = {
        _id: 'guest_' + socket.id,
        username: 'Guest_' + Math.floor(1000 + Math.random() * 9000),
        isPremium: false,
        interests: [],
        gender: 'unspecified',
        country: 'Global',
        language: 'English',
        isGuest: true
      };
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_super_secret_key_vibecall_2026');

      const userSnap = await db.collection('users').doc(decoded.id).get();
      if (!userSnap.exists) return next(new Error('User not found'));

      const user = userSnap.data();
      user._id = userSnap.id;

      if (user.isBanned) return next(new Error('User is banned'));

      socket.user = user;
      socket.user.isGuest = false;
    } catch (err) {
      console.error('[SOCKET.IO HANDSHAKE ERROR] Socket authentication failed:', err.message);
      socket.user = {
        _id: 'guest_' + socket.id,
        username: 'Guest_' + Math.floor(1000 + Math.random() * 9000),
        isPremium: false,
        interests: [],
        gender: 'unspecified',
        country: 'Global',
        language: 'English',
        isGuest: true
      };
    }
    next();
  });

  // ─── Connection ────────────────────────────────────────────────────────────
  io.on('connection', async (socket) => {
    onlineCount++;
    console.log(`User connected: ${socket.user.username} (${socket.id}). Online count: ${onlineCount}`);

    if (!socket.user.isGuest) {
      try {
        await db.collection('users').doc(socket.user._id).update({
          isOnline: true,
          socketId: socket.id,
          updatedAt: new Date()
        });
      } catch (err) {
        console.error('Error updating user online status:', err.message);
      }
    }

    socket.emit('connection-success', { username: socket.user.username, onlineCount });
    io.emit('online-count-update', { onlineCount });

    // ─── Join Queue ──────────────────────────────────────────────────────────
    socket.on('join-queue', async (data) => {
      const { filters } = data || {};

      cleanupSocketRoom(socket);
      clearExpandTimer(socket.id);

      // Always re-fetch user from Firestore for fresh premium / gender status
      let freshUser = socket.user;
      if (!socket.user.isGuest) {
        try {
          const userSnap = await db.collection('users').doc(socket.user._id).get();
          if (userSnap.exists) {
            freshUser = userSnap.data();
            freshUser._id = userSnap.id;
            freshUser.isGuest = false;
          }
        } catch (e) {
          console.error('Error fetching fresh user details:', e);
        }
      }

      // ── SERVER-SIDE PREMIUM ENFORCEMENT ──────────────────────────────────
      // Never trust client-sent gender filter for non-premium users
      const sanitisedFilters = { ...(filters || {}) };
      if (!freshUser.isPremium) {
        sanitisedFilters.gender = 'unspecified';
      }

      const queueUserObj = {
        socketId: socket.id,
        userId: freshUser._id.toString(),
        username: freshUser.username,
        profilePic: freshUser.profilePic || '',
        interests: freshUser.interests || [],
        gender: freshUser.gender || 'unspecified',   // actual gender from DB
        country: freshUser.country || 'Global',
        language: freshUser.language || 'English',
        isPremium: freshUser.isPremium || false,
        isGuest: freshUser.isGuest || false,
        filters: sanitisedFilters
      };

      console.log(`User joining queue: ${queueUserObj.username} | gender: ${queueUserObj.gender} | pref: ${sanitisedFilters.gender || 'any'} | premium: ${queueUserObj.isPremium}`);

      const matchResult = matchManager.addToQueue(queueUserObj);

      if (matchResult) {
        handleMatch(matchResult);
      } else {
        socket.emit('waiting');

        // Start 30-second expand prompt timer
        const timer = setTimeout(() => {
          // Only fire if user is still in queue (not matched)
          const stillWaiting = matchManager.getExpiredUsers(30)
            .some(u => u.socketId === socket.id);

          if (stillWaiting) {
            console.log(`[Expand Prompt] Sending to ${queueUserObj.username} after 30s`);
            socket.emit('search-expand-prompt', {
              message: 'No match found yet. Expand your gender preference to "Any Gender"?'
            });
          }
        }, QUEUE_FALLBACK_MS);

        expandTimers.set(socket.id, timer);
      }
    });

    // ─── Skip ────────────────────────────────────────────────────────────────
    socket.on('skip', () => {
      console.log(`User skipped: ${socket.user.username}`);
      clearExpandTimer(socket.id);
      cleanupSocketRoom(socket);
      socket.emit('skipped');
    });

    // ─── Leave Queue ─────────────────────────────────────────────────────────
    socket.on('leave-queue', () => {
      clearExpandTimer(socket.id);
      matchManager.removeFromQueue(socket.id);
    });

    // ─── WebRTC Signaling ─────────────────────────────────────────────────────
    socket.on('signal', (payload) => {
      io.to(payload.to).emit('signal', { from: socket.id, signal: payload.signal });
    });

    // ─── Direct WebRTC Events (Offer / Answer / ICE Candidate / Join / Leave) ──
    socket.on('offer', (payload) => {
      if (payload && payload.to) {
        io.to(payload.to).emit('offer', { from: socket.id, sdp: payload.sdp, offer: payload.offer });
      }
    });

    socket.on('answer', (payload) => {
      if (payload && payload.to) {
        io.to(payload.to).emit('answer', { from: socket.id, sdp: payload.sdp, answer: payload.answer });
      }
    });

    socket.on('ice-candidate', (payload) => {
      if (payload && payload.to) {
        io.to(payload.to).emit('ice-candidate', { from: socket.id, candidate: payload.candidate });
      }
    });

    socket.on('join', (data) => {
      console.log(`User joined room/queue via 'join': ${socket.user.username}`);
      if (data && data.roomId) {
        socket.join(data.roomId);
      }
    });

    socket.on('leave', (data) => {
      console.log(`User left room/queue via 'leave': ${socket.user.username}`);
      if (data && data.roomId) {
        socket.leave(data.roomId);
      }
      clearExpandTimer(socket.id);
      matchManager.removeFromQueue(socket.id);
    });

    // ─── Chat Messaging ───────────────────────────────────────────────────────
    socket.on('send-message', async (payload) => {
      const { roomId, chatDbId, text } = payload;
      if (!roomId || !text) return;

      const msgObj = {
        sender: socket.user.isGuest ? null : socket.user._id,
        senderName: socket.user.username,
        text,
        timestamp: new Date()
      };

      socket.to(roomId).emit('receive-message', msgObj);

      if (chatDbId && !socket.user.isGuest) {
        try {
          const roomRef = db.collection('rooms').doc(chatDbId);
          const roomSnap = await roomRef.get();
          if (roomSnap.exists) {
            await roomRef.update({
              messages: FieldValue.arrayUnion({
                sender: socket.user._id,
                senderName: socket.user.username,
                text,
                timestamp: msgObj.timestamp
              }),
              updatedAt: new Date()
            });
          }
        } catch (err) {
          console.error('Error saving chat message to Firestore:', err.message);
        }
      }
    });

    // ─── Typing Indicator ─────────────────────────────────────────────────────
    socket.on('typing', (payload) => {
      const { roomId, isTyping } = payload;
      if (!roomId) return;
      socket.to(roomId).emit('typing', { username: socket.user.username, isTyping });
    });

    // ─── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      onlineCount--;
      console.log(`User disconnected: ${socket.user.username} (${socket.id}). Online count: ${onlineCount}`);

      clearExpandTimer(socket.id);
      matchManager.removeFromQueue(socket.id);
      cleanupSocketRoom(socket);

      if (!socket.user.isGuest) {
        try {
          await db.collection('users').doc(socket.user._id).update({
            isOnline: false,
            socketId: null,
            updatedAt: new Date()
          });
        } catch (err) {
          console.error('Database update error on disconnect in Firestore:', err.message);
        }
      }

      io.emit('online-count-update', { onlineCount });
    });
  });

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function clearExpandTimer(socketId) {
    const timer = expandTimers.get(socketId);
    if (timer) {
      clearTimeout(timer);
      expandTimers.delete(socketId);
    }
  }

  async function handleMatch({ user1, user2 }) {
    const roomId = `room_${user1.socketId}_${user2.socketId}`;

    const socket1 = io.sockets.sockets.get(user1.socketId);
    const socket2 = io.sockets.sockets.get(user2.socketId);

    if (socket1 && socket2) {
      // Clear any pending expand timers for both users
      clearExpandTimer(user1.socketId);
      clearExpandTimer(user2.socketId);

      socket1.join(roomId);
      socket2.join(roomId);
      socketRooms.set(user1.socketId, roomId);
      socketRooms.set(user2.socketId, roomId);

      let chatDbId = roomId;
      if (!user1.isGuest && !user2.isGuest) {
        try {
          await db.collection('rooms').doc(roomId).set({
            roomId,
            participants: [user1.userId, user2.userId],
            messages: [],
            startTime: new Date(),
            endTime: null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } catch (err) {
          console.error('Error creating chat record in Firestore:', err.message);
        }
      }

      socket1.emit('matched', {
        roomId,
        chatDbId,
        peer: {
          socketId: user2.socketId,
          username: user2.username,
          profilePic: user2.profilePic,
          interests: user2.interests,
          country: user2.country,
          language: user2.language,
          isPremium: user2.isPremium,
          isGuest: user2.isGuest,
          userId: user2.userId,
          gender: user2.gender
        },
        initiateCall: true
      });

      socket2.emit('matched', {
        roomId,
        chatDbId,
        peer: {
          socketId: user1.socketId,
          username: user1.username,
          profilePic: user1.profilePic,
          interests: user1.interests,
          country: user1.country,
          language: user1.language,
          isPremium: user1.isPremium,
          isGuest: user1.isGuest,
          userId: user1.userId,
          gender: user1.gender
        },
        initiateCall: false
      });

      // Analytics
      const todayStr = getTodayString();
      try {
        const todayRef = db.collection('analytics').doc(todayStr);
        const todaySnap = await todayRef.get();
        if (todaySnap.exists) {
          await todayRef.update({ totalMatches: (todaySnap.data().totalMatches || 0) + 1, updatedAt: new Date() });
        } else {
          await todayRef.set({
            date: todayStr,
            totalMatches: 1,
            totalUsers: (await db.collection('users').get()).size,
            activeUsers: 0,
            totalReports: 0,
            totalRevenue: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      } catch (err) {
        console.error('Analytics update error in Firestore:', err.message);
      }

      console.log(`Matched: ${user1.username} (${user1.gender}) & ${user2.username} (${user2.gender}) in room ${roomId}`);
    } else {
      // One socket dropped between match finding and notification — re-queue the surviving one
      if (socket1) { matchManager.addToQueue(user1); socket1.emit('waiting'); }
      if (socket2) { matchManager.addToQueue(user2); socket2.emit('waiting'); }
    }
  }

  function cleanupSocketRoom(socket) {
    const roomId = socketRooms.get(socket.id);
    if (!roomId) return;

    socket.to(roomId).emit('peer-left', {
      username: socket.user.username,
      message: 'Peer disconnected.'
    });

    const clients = io.sockets.adapter.rooms.get(roomId);
    if (clients) {
      for (const clientId of clients) {
        const clientSocket = io.sockets.sockets.get(clientId);
        if (clientSocket) {
          clientSocket.leave(roomId);
          socketRooms.delete(clientId);
        }
      }
    }

    const roomRef = db.collection('rooms').doc(roomId);
    roomRef.get()
      .then(snap => {
        if (snap.exists) {
          roomRef.update({ endTime: new Date(), updatedAt: new Date() })
            .catch(err => console.error('Error updating Chat endTime in Firestore:', err.message));
        }
      })
      .catch(err => console.error('Error checking Chat room existence in Firestore:', err.message));

    socketRooms.delete(socket.id);
  }
};
