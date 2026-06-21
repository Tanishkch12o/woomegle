const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

const getTodayString = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

// @desc    Get dashboard analytics/stats
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const totalUsersSnap = await db.collection('users').get();
    const totalUsers = totalUsersSnap.size;

    const bannedUsersSnap = await db.collection('users').where('isBanned', '==', true).get();
    const bannedUsers = bannedUsersSnap.size;

    const totalReportsSnap = await db.collection('reports').get();
    const totalReports = totalReportsSnap.size;

    const pendingReportsSnap = await db.collection('reports').where('status', '==', 'pending').get();
    const pendingReports = pendingReportsSnap.size;

    const activeUsersSnap = await db.collection('users').where('isOnline', '==', true).get();
    const activeUsers = activeUsersSnap.size;

    // Fetch daily records and sum revenue
    const analyticsRecordsSnap = await db.collection('analytics').get();
    let totalRevenue = 0;
    const dailyRecords = [];

    analyticsRecordsSnap.forEach(doc => {
      const rec = doc.data();
      rec.id = doc.id;
      totalRevenue += (rec.totalRevenue || 0);
      dailyRecords.push(rec);
    });

    // Handle today's record
    const todayStr = getTodayString();
    const todayRef = db.collection('analytics').doc(todayStr);
    const todaySnap = await todayRef.get();

    if (!todaySnap.exists) {
      await todayRef.set({
        date: todayStr,
        totalUsers,
        activeUsers,
        totalMatches: 0,
        totalReports,
        totalRevenue: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      await todayRef.update({
        totalUsers,
        activeUsers,
        totalReports,
        updatedAt: new Date()
      });
    }

    res.json({
      summary: {
        totalUsers,
        activeUsers,
        bannedUsers,
        totalReports,
        pendingReports,
        totalRevenue
      },
      dailyRecords
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving admin statistics' });
  }
});

// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Private/Admin
router.get('/reports', protect, admin, async (req, res) => {
  try {
    const reportsSnap = await db.collection('reports').orderBy('createdAt', 'desc').get();
    const reports = [];

    for (const doc of reportsSnap.docs) {
      const report = doc.data();
      report._id = doc.id;

      // Populate reported user
      const reportedUserSnap = await db.collection('users').doc(report.reportedUser).get();
      if (reportedUserSnap.exists) {
        const rud = reportedUserSnap.data();
        report.reportedUser = {
          _id: reportedUserSnap.id,
          username: rud.username,
          email: rud.email,
          isBanned: rud.isBanned,
          profilePic: rud.profilePic
        };
      } else {
        report.reportedUser = null;
      }

      // Populate reporter
      const reporterSnap = await db.collection('users').doc(report.reporter).get();
      if (reporterSnap.exists) {
        const rpd = reporterSnap.data();
        report.reporter = {
          _id: reporterSnap.id,
          username: rpd.username,
          email: rpd.email
        };
      } else {
        report.reporter = null;
      }

      reports.push(report);
    }

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving reports' });
  }
});

// @desc    Resolve or dismiss a report
// @route   PUT /api/admin/reports/:id/resolve
// @access  Private/Admin
router.put('/reports/:id/resolve', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status update' });
    }

    const reportRef = db.collection('reports').doc(req.params.id);
    const reportSnap = await reportRef.get();

    if (!reportSnap.exists) {
      return res.status(404).json({ message: 'Report not found' });
    }

    await reportRef.update({
      status,
      updatedAt: new Date()
    });

    res.json({ message: `Report successfully marked as ${status}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating report' });
  }
});

// @desc    Ban a user
// @route   POST /api/admin/users/:id/ban
// @access  Private/Admin
router.post('/users/:id/ban', protect, admin, async (req, res) => {
  try {
    const { banReason } = req.body;
    const userRef = db.collection('users').doc(req.params.id);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = userSnap.data();
    if (userData.isAdmin) {
      return res.status(400).json({ message: 'Cannot ban an admin user' });
    }

    await userRef.update({
      isBanned: true,
      banReason: banReason || 'Violating platform guidelines',
      isOnline: false,
      socketId: null,
      updatedAt: new Date()
    });

    await db.collection('bans').doc(req.params.id).set({
      userId: req.params.id,
      username: userData.username,
      banReason: banReason || 'Violating platform guidelines',
      bannedBy: req.user.username,
      bannedAt: new Date()
    });

    res.json({ message: 'User has been banned successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error banning user' });
  }
});

// @desc    Unban a user
// @route   POST /api/admin/users/:id/unban
// @access  Private/Admin
router.post('/users/:id/unban', protect, admin, async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.params.id);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    await userRef.update({
      isBanned: false,
      banReason: '',
      updatedAt: new Date()
    });

    await db.collection('bans').doc(req.params.id).delete();

    res.json({ message: 'User has been unbanned successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error unbanning user' });
  }
});

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
  try {
    const usersSnap = await db.collection('users').orderBy('createdAt', 'desc').get();
    const users = [];

    usersSnap.forEach(doc => {
      const u = doc.data();
      delete u.password;
      u._id = doc.id;
      users.push(u);
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving users' });
  }
});

module.exports = router;
