const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_super_secret_key_vibecall_2026');

      // Get user from Firestore
      const userSnap = await db.collection('users').doc(decoded.id).get();

      if (!userSnap.exists) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      const userData = userSnap.data();
      userData.id = userSnap.id;
      userData._id = userSnap.id;

      // Check if user ID exists in the bans collection
      const banSnap = await db.collection('bans').doc(userSnap.id).get();
      if (banSnap.exists || userData.isBanned) {
        const reason = banSnap.exists ? banSnap.data().banReason : userData.banReason;
        return res.status(403).json({ message: `Access denied. Your account is banned. Reason: ${reason || 'Unspecified'}` });
      }

      req.user = userData;
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
