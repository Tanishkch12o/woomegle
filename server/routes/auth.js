const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const firebase = require('../config/firebase');

// In-memory user store — used automatically when Firestore is unavailable
// Maps userId -> userObject
const memUsers = new Map();
let memIdCounter = 1;

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_super_secret_key_vibecall_2026', {
    expiresIn: '30d'
  });

// Safe wrapper around Firestore queries — returns null on error instead of throwing
const safeQuery = async (queryFn) => {
  try {
    return await queryFn();
  } catch (err) {
    // Service disabled, permission denied, or network error — fall through to in-memory
    return null;
  }
};

// ─── POST /api/auth/signup ────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, gender, country, language } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    const db = firebase.db; // read live reference every call

    // ── Check username uniqueness ─────────────────────────────────────────────
    const usernameSnap = await safeQuery(() =>
      db.collection('users').where('username', '==', username).limit(1).get()
    );

    // Firestore responded — check normally
    if (usernameSnap && !usernameSnap.empty) {
      return res.status(400).json({ message: 'Username is already taken' });
    }
    // Firestore unavailable — check in-memory store
    if (!usernameSnap) {
      const taken = [...memUsers.values()].some(u => u.username === username);
      if (taken) return res.status(400).json({ message: 'Username is already taken' });
    }

    // ── Check email uniqueness ────────────────────────────────────────────────
    const emailSnap = await safeQuery(() =>
      db.collection('users').where('email', '==', email).limit(1).get()
    );

    if (emailSnap && !emailSnap.empty) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }
    if (!emailSnap) {
      const taken = [...memUsers.values()].some(u => u.email === email);
      if (taken) return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // ── Hash password ─────────────────────────────────────────────────────────
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      username,
      email,
      password: hashedPassword,
      profilePic: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150',
      isPremium: false,
      premiumUntil: null,
      interests: [],
      gender: gender || 'unspecified',
      country: country || 'Global',
      language: language || 'English',
      blockedUsers: [],
      friends: [],
      friendRequests: [],
      isBanned: false,
      banReason: '',
      isAdmin: false,
      isOnline: false,
      socketId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // ── Persist user ──────────────────────────────────────────────────────────
    let userId;
    try {
      const docRef = await db.collection('users').add(newUser);
      userId = docRef.id;
    } catch (dbErr) {
      console.warn('Firestore unavailable for signup — using in-memory store:', dbErr.message);
      userId = `mem_${Date.now()}_${memIdCounter++}`;
      memUsers.set(userId, { ...newUser, _id: userId });
    }

    return res.status(201).json({
      _id: userId,
      username: newUser.username,
      email: newUser.email,
      profilePic: newUser.profilePic,
      isPremium: newUser.isPremium,
      isAdmin: newUser.isAdmin,
      interests: newUser.interests,
      gender: newUser.gender,
      country: newUser.country,
      language: newUser.language,
      token: generateToken(userId)
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Server error, please try again' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { loginIdentifier, password } = req.body;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    const db = firebase.db;

    // ── Look up user by email then username ───────────────────────────────────
    let userDoc = null;

    const emailSnap = await safeQuery(() =>
      db.collection('users').where('email', '==', loginIdentifier).limit(1).get()
    );

    if (emailSnap && !emailSnap.empty) {
      userDoc = { id: emailSnap.docs[0].id, data: emailSnap.docs[0].data() };
    } else if (emailSnap && emailSnap.empty) {
      // Firestore responded but no email match — try username
      const usernameSnap = await safeQuery(() =>
        db.collection('users').where('username', '==', loginIdentifier).limit(1).get()
      );
      if (usernameSnap && !usernameSnap.empty) {
        userDoc = { id: usernameSnap.docs[0].id, data: usernameSnap.docs[0].data() };
      }
    }

    // Firestore unavailable — check in-memory
    if (!emailSnap) {
      const found = [...memUsers.entries()].find(
        ([, u]) => u.email === loginIdentifier || u.username === loginIdentifier
      );
      if (found) {
        userDoc = { id: found[0], data: found[1] };
      }
    }

    if (!userDoc) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user     = userDoc.data;
    const userId   = userDoc.id;

    // ── Ban check ─────────────────────────────────────────────────────────────
    const banSnap = await safeQuery(() =>
      db.collection('bans').doc(userId).get()
    );
    if ((banSnap && banSnap.exists) || user.isBanned) {
      const reason = (banSnap && banSnap.exists) ? banSnap.data().banReason : user.banReason;
      return res.status(403).json({
        message: `Access denied. Your account is banned. Reason: ${reason || 'Unspecified'}`
      });
    }

    // ── Verify password ───────────────────────────────────────────────────────
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json({
      _id: userId,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      isPremium: user.isPremium,
      isAdmin: user.isAdmin,
      interests: user.interests,
      gender: user.gender,
      country: user.country,
      language: user.language,
      token: generateToken(userId)
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error, please try again' });
  }
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    const db = firebase.db;

    const userSnap = await safeQuery(() =>
      db.collection('users').where('email', '==', email).limit(1).get()
    );

    let userId = null;

    if (userSnap && !userSnap.empty) {
      userId = userSnap.docs[0].id;
    } else if (!userSnap) {
      // Firestore down — check in-memory
      const found = [...memUsers.entries()].find(([, u]) => u.email === email);
      if (found) userId = found[0];
    }

    if (!userId) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    const resetToken = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET || 'your_jwt_super_secret_key_vibecall_2026',
      { expiresIn: '15m' }
    );

    return res.json({
      message: 'Password reset link sent successfully to your email (Mock Mode)',
      resetToken,
      resetLink: `${process.env.CLIENT_URL || 'https://woomegle.com'}/reset-password/${resetToken}`
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Server error, please try again' });
  }
});

module.exports = router;
