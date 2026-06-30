const express = require('express');
const router = express.Router();
const { db, FieldValue } = require('../config/firebase');
const { protect } = require('../middleware/auth');

// Helper to populate friends list
const populateFriendsAndRequests = async (userData) => {
  const friendsPromise = (userData.friends || []).map(async (friendId) => {
    try {
      const snap = await db.collection('users').doc(friendId).get();
      if (snap.exists) {
        const d = snap.data();
        return { _id: snap.id, username: d.username, profilePic: d.profilePic, isOnline: d.isOnline };
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const requestsPromise = (userData.friendRequests || []).map(async (reqId) => {
    try {
      const snap = await db.collection('users').doc(reqId).get();
      if (snap.exists) {
        const d = snap.data();
        return { _id: snap.id, username: d.username, profilePic: d.profilePic };
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const populatedFriends = (await Promise.all(friendsPromise)).filter(f => f !== null);
  const populatedRequests = (await Promise.all(requestsPromise)).filter(r => r !== null);

  return {
    ...userData,
    friends: populatedFriends,
    friendRequests: populatedRequests
  };
};

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const populated = await populateFriendsAndRequests(req.user);
    res.json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.user.id);
    const updates = {};
    const userSnap = await userRef.get();
    const oldUserData = userSnap.data();
    const oldInterests = oldUserData.interests || [];
    const newInterests = req.body.interests || [];

    if (req.body.interests) {
      updates.interests = newInterests;

      // Track added/removed interests tags counters in the 'interests' collection
      const added = newInterests.filter(x => !oldInterests.includes(x));
      const removed = oldInterests.filter(x => !newInterests.includes(x));

      for (const tag of added) {
        const intRef = db.collection('interests').doc(tag.toLowerCase());
        const intSnap = await intRef.get();
        if (intSnap.exists) {
          await intRef.update({ count: (intSnap.data().count || 0) + 1 });
        } else {
          await intRef.set({ name: tag, count: 1 });
        }
      }

      for (const tag of removed) {
        const intRef = db.collection('interests').doc(tag.toLowerCase());
        const intSnap = await intRef.get();
        if (intSnap.exists) {
          const count = intSnap.data().count || 0;
          if (count <= 1) {
            await intRef.delete();
          } else {
            await intRef.update({ count: count - 1 });
          }
        }
      }
    }
    if (req.body.gender) updates.gender = req.body.gender;
    if (req.body.country) updates.country = req.body.country;
    if (req.body.language) updates.language = req.body.language;
    if (req.body.profilePic) updates.profilePic = req.body.profilePic;

    if (req.body.username) {
      const usernameRegex = /^[A-Za-z]{3,20}$/;
      if (!usernameRegex.test(req.body.username)) {
        return res.status(400).json({ success: false, message: 'Username can contain only letters.' });
      }

      if (req.body.username !== req.user.username) {
        const usernameExists = await db.collection('users')
          .where('username', '==', req.body.username)
          .limit(1)
          .get();

        if (!usernameExists.empty) {
          return res.status(400).json({ message: 'Username is already taken' });
        }
        updates.username = req.body.username;
      }
    }

    updates.updatedAt = new Date();
    await userRef.update(updates);

    const freshSnap = await userRef.get();
    const freshUser = freshSnap.data();

    res.json({
      _id: userRef.id,
      username: freshUser.username,
      email: freshUser.email,
      profilePic: freshUser.profilePic,
      isPremium: freshUser.isPremium,
      isAdmin: freshUser.isAdmin,
      interests: freshUser.interests,
      gender: freshUser.gender,
      country: freshUser.country,
      language: freshUser.language,
      referralCode: freshUser.referralCode || '',
      referralCount: freshUser.referralCount || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Block a user
// @route   POST /api/users/block/:id
// @access  Private
router.post('/block/:id', protect, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    if (targetUserId === req.user.id) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }

    const userRef = db.collection('users').doc(req.user.id);
    const userSnap = await userRef.get();
    const userData = userSnap.data();

    if (!userData.blockedUsers || !userData.blockedUsers.includes(targetUserId)) {
      await userRef.update({
        blockedUsers: FieldValue.arrayUnion(targetUserId),
        friends: FieldValue.arrayRemove(targetUserId)
      });
    }

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Unblock a user
// @route   POST /api/users/unblock/:id
// @access  Private
router.post('/unblock/:id', protect, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const userRef = db.collection('users').doc(req.user.id);

    await userRef.update({
      blockedUsers: FieldValue.arrayRemove(targetUserId)
    });

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Send Friend Request
// @route   POST /api/users/friends/request/:id
// @access  Private
router.post('/friends/request/:id', protect, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user.id) {
      return res.status(400).json({ message: 'Cannot add yourself' });
    }

    const targetUserRef = db.collection('users').doc(targetId);
    const targetUserSnap = await targetUserRef.get();

    if (!targetUserSnap.exists) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    const targetUserData = targetUserSnap.data();

    if (targetUserData.blockedUsers && targetUserData.blockedUsers.includes(req.user.id)) {
      return res.status(403).json({ message: 'You are blocked by this user' });
    }

    if (targetUserData.friends && targetUserData.friends.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    if (!targetUserData.friendRequests || !targetUserData.friendRequests.includes(req.user.id)) {
      await targetUserRef.update({
        friendRequests: FieldValue.arrayUnion(req.user.id)
      });
    }

    res.json({ message: 'Friend request sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Accept Friend Request
// @route   POST /api/users/friends/accept/:id
// @access  Private
router.post('/friends/accept/:id', protect, async (req, res) => {
  try {
    const requesterId = req.params.id;
    const userRef = db.collection('users').doc(req.user.id);
    const userSnap = await userRef.get();
    const userData = userSnap.data();

    if (!userData.friendRequests || !userData.friendRequests.includes(requesterId)) {
      return res.status(400).json({ message: 'No request from this user found' });
    }

    // Update current user
    await userRef.update({
      friends: FieldValue.arrayUnion(requesterId),
      friendRequests: FieldValue.arrayRemove(requesterId)
    });

    // Update requester
    const requesterRef = db.collection('users').doc(requesterId);
    await requesterRef.update({
      friends: FieldValue.arrayUnion(req.user.id)
    });

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Reject/Decline Friend Request
// @route   POST /api/users/friends/reject/:id
// @access  Private
router.post('/friends/reject/:id', protect, async (req, res) => {
  try {
    const requesterId = req.params.id;
    const userRef = db.collection('users').doc(req.user.id);

    await userRef.update({
      friendRequests: FieldValue.arrayRemove(requesterId)
    });

    res.json({ message: 'Friend request declined' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get Chat History
// @route   GET /api/users/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const chatsSnap = await db.collection('rooms')
      .where('participants', 'array-contains', req.user.id)
      .get();

    const chats = [];

    for (const doc of chatsSnap.docs) {
      const chat = doc.data();
      chat._id = doc.id;

      // Populate participants
      const populatedParts = [];
      for (const pId of (chat.participants || [])) {
        const pSnap = await db.collection('users').doc(pId).get();
        if (pSnap.exists) {
          const pd = pSnap.data();
          populatedParts.push({
            _id: pSnap.id,
            username: pd.username,
            profilePic: pd.profilePic,
            isPremium: pd.isPremium
          });
        }
      }
      chat.participants = populatedParts;
      chats.push(chat);
    }

    // Sort by updatedAt descending
    chats.sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt._seconds ? a.updatedAt._seconds * 1000 : a.updatedAt) : new Date(0);
      const dateB = b.updatedAt ? new Date(b.updatedAt._seconds ? b.updatedAt._seconds * 1000 : b.updatedAt) : new Date(0);
      return dateB - dateA;
    });

    res.json(chats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
