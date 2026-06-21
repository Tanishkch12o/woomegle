const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { protect } = require('../middleware/auth');

// AI Moderation classifier helper simulating abuse and nudity detection
const runAIModerationClassifier = (reason, details) => {
  const textToAnalyze = `${reason} ${details}`.toLowerCase();
  let suspectedViolation = false;
  let flaggedConfidence = 0.0;
  const categories = [];

  if (textToAnalyze.includes('nudity') || textToAnalyze.includes('nsfw') || textToAnalyze.includes('naked') || textToAnalyze.includes('sex') || textToAnalyze.includes('show')) {
    suspectedViolation = true;
    flaggedConfidence = 0.88;
    categories.push('nudity_or_sexual_content');
  }
  if (textToAnalyze.includes('abuse') || textToAnalyze.includes('harass') || textToAnalyze.includes('curse') || textToAnalyze.includes('bully') || textToAnalyze.includes('hate')) {
    suspectedViolation = true;
    flaggedConfidence = 0.92;
    categories.push('harassment_or_abuse');
  }
  if (textToAnalyze.includes('underage') || textToAnalyze.includes('child') || textToAnalyze.includes('minor') || textToAnalyze.includes('kid')) {
    suspectedViolation = true;
    flaggedConfidence = 0.96;
    categories.push('underage_user');
  }
  if (textToAnalyze.includes('spam') || textToAnalyze.includes('scam') || textToAnalyze.includes('cheat') || textToAnalyze.includes('bot')) {
    suspectedViolation = true;
    flaggedConfidence = 0.82;
    categories.push('spam_or_scams');
  }

  return {
    suspectedViolation,
    flaggedConfidence,
    categories,
    modelVersion: 'woomegle-guard-v1.5',
    processedAt: new Date()
  };
};

// @desc    Report a user
// @route   POST /api/reports
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { reportedUserId, reason, details } = req.body;

    if (!reportedUserId || !reason) {
      return res.status(400).json({ message: 'Please provide reported user and reason' });
    }

    if (reportedUserId === req.user.id) {
      return res.status(400).json({ message: 'You cannot report yourself' });
    }

    // Run AI Moderation Classifier
    const aiAnalysis = runAIModerationClassifier(reason, details);

    const reportObj = {
      reportedUser: reportedUserId,
      reporter: req.user.id,
      reason,
      details: details || '',
      status: aiAnalysis.suspectedViolation ? 'flagged' : 'pending',
      aiAnalysis,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('reports').add(reportObj);
    reportObj._id = docRef.id;

    // Increment infraction count and check for ban threshold if violation is confirmed
    if (aiAnalysis.suspectedViolation && aiAnalysis.flaggedConfidence >= 0.90) {
      const userRef = db.collection('users').doc(reportedUserId);
      const userSnap = await userRef.get();
      
      if (userSnap.exists) {
        const userData = userSnap.data();
        const infractions = (userData.reportInfractions || 0) + 1;
        const updates = {
          reportInfractions: infractions,
          updatedAt: new Date()
        };

        // If infractions reach 3 or more, auto-ban the user
        if (infractions >= 3) {
          updates.isBanned = true;
          updates.banReason = 'Auto-banned by AI Moderation due to cumulative visual/verbal infractions';
          updates.bannedAt = new Date();
          
          // Save to bans collection
          await db.collection('bans').add({
            userId: reportedUserId,
            username: userData.username || 'unknown',
            banReason: updates.banReason,
            bannedAt: updates.bannedAt
          });
        }

        await userRef.update(updates);
      }
    }

    res.status(201).json({ 
      message: 'Report submitted successfully. Our AI system has screened it.', 
      report: reportObj 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error, could not submit report' });
  }
});

module.exports = router;
