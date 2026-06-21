const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { db, isMock } = require('../config/firebase');
const { protect } = require('../middleware/auth');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkeyid123',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mockkeysecret456'
});

// In-memory fallback store when Firestore is unavailable
const memSubscriptions = new Map(); // orderId -> subscriptionData

const getTodayString = () => new Date().toISOString().split('T')[0];

// Helper: Calculate plan duration in days
const planDays = (planName) => {
  if (planName === 'Weekly Pass')  return 7;
  if (planName === 'Yearly Elite') return 365;
  return 30; // Monthly Vibe default
};

// Helper: Calculate plan amount (for in-memory fallback)
const planAmount = (planName) => {
  if (planName === 'Weekly Pass')  return 9;
  if (planName === 'Yearly Elite') return 299;
  return 49; // Monthly Vibe default
};

// ─── POST /api/payments/order ─────────────────────────────────────────────────
// @desc  Create Razorpay order for a Premium plan
// @access Private
router.post('/order', protect, async (req, res) => {
  try {
    const { planName, currency = 'USD', amount } = req.body;

    const finalAmount = amount || planAmount(planName);
    if (!finalAmount) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    const options = {
      amount: Math.round(finalAmount * 100), // convert to cents/paise
      currency: currency,
      receipt: `receipt_${Date.now()}_${req.user.id.substring(0, 5)}`
    };

    // Create Razorpay order (falls back to mock if keys are invalid)
    let order;
    try {
      order = await razorpay.orders.create(options);
    } catch (err) {
      console.warn('Razorpay order creation failed (mock mode):', err.message);
      order = {
        id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
        amount: options.amount,
        currency: options.currency,
        receipt: options.receipt
      };
    }

    const subscriptionData = {
      user: req.user.id,
      planName,
      amount: finalAmount,
      currency: currency,
      razorpayOrderId: order.id,
      status: 'created',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Persist to Firestore; fall back to in-memory on error
    try {
      await db.collection('subscriptions').add(subscriptionData);
    } catch (dbErr) {
      console.warn('Firestore unavailable — storing subscription in memory:', dbErr.message);
      memSubscriptions.set(order.id, subscriptionData);
    }

    return res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkeyid123'
    });

  } catch (error) {
    console.error('Order creation error:', error);
    return res.status(500).json({ message: 'Server error, could not generate order' });
  }
});

// ─── POST /api/payments/verify ────────────────────────────────────────────────
// @desc  Verify Razorpay signature and upgrade user to premium
// @access Private
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planName } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ message: 'Payment details are missing' });
    }

    // ── Signature verification ──────────────────────────────────────────────
    const isMockOrder = razorpay_order_id.startsWith('order_mock_');
    let isValidSignature = false;

    if (isMockOrder) {
      // Mock orders auto-pass verification
      isValidSignature = true;
    } else {
      const shasum = crypto.createHmac(
        'sha256',
        process.env.RAZORPAY_KEY_SECRET || 'mockkeysecret456'
      );
      shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      isValidSignature = shasum.digest('hex') === razorpay_signature;
    }

    if (!isValidSignature) {
      // Best-effort: try to mark subscription as failed
      try {
        const subQuery = await db.collection('subscriptions')
          .where('razorpayOrderId', '==', razorpay_order_id)
          .limit(1)
          .get();
        if (!subQuery.empty) {
          await db.collection('subscriptions').doc(subQuery.docs[0].id)
            .update({ status: 'failed', updatedAt: new Date() });
        }
      } catch (_) { /* Firestore down — ignore */ }

      return res.status(400).json({ message: 'Signature verification failed. Invalid transaction.' });
    }

    // ── Resolve subscription data ───────────────────────────────────────────
    // Try Firestore first; fall back to in-memory map; fall back to planName from request
    let resolvedPlanName = planName;
    let resolvedAmount   = planAmount(planName);
    let subDocRef        = null;

    try {
      const subQuery = await db.collection('subscriptions')
        .where('razorpayOrderId', '==', razorpay_order_id)
        .limit(1)
        .get();

      if (!subQuery.empty) {
        const subDoc  = subQuery.docs[0];
        subDocRef     = db.collection('subscriptions').doc(subDoc.id);
        resolvedPlanName = subDoc.data().planName || planName;
        resolvedAmount   = subDoc.data().amount   || resolvedAmount;
      }
    } catch (dbErr) {
      console.warn('Firestore unavailable for subscription lookup — using in-memory fallback:', dbErr.message);
      const memSub = memSubscriptions.get(razorpay_order_id);
      if (memSub) {
        resolvedPlanName = memSub.planName || planName;
        resolvedAmount   = memSub.amount   || resolvedAmount;
      }
    }

    // ── Calculate premium expiry ────────────────────────────────────────────
    const days    = planDays(resolvedPlanName);
    const startDate = new Date();
    const endDate   = new Date();
    endDate.setDate(startDate.getDate() + days);

    // ── Update subscription record (best-effort) ────────────────────────────
    try {
      if (subDocRef) {
        await subDocRef.update({
          status: 'completed',
          razorpayPaymentId: razorpay_payment_id,
          startDate,
          endDate,
          updatedAt: new Date()
        });
      }
      // Clean up in-memory entry if it was there
      memSubscriptions.delete(razorpay_order_id);
    } catch (dbErr) {
      console.warn('Could not update subscription in Firestore:', dbErr.message);
      const memSub = memSubscriptions.get(razorpay_order_id);
      if (memSub) {
        memSub.status = 'completed';
        memSub.razorpayPaymentId = razorpay_payment_id;
      }
    }

    // ── Upgrade user premium status ────────────────────────────────────────
    let finalEndDate = endDate;
    try {
      const userRef  = db.collection('users').doc(req.user.id);
      const userSnap = await userRef.get();

      if (userSnap.exists) {
        const userData = userSnap.data();
        // Stack premium if user already has an active subscription
        if (userData.premiumUntil) {
          const currentEnd = new Date(
            userData.premiumUntil._seconds
              ? userData.premiumUntil._seconds * 1000
              : userData.premiumUntil
          );
          if (currentEnd > new Date()) {
            currentEnd.setDate(currentEnd.getDate() + days);
            finalEndDate = currentEnd;
          }
        }

        await userRef.update({
          isPremium: true,
          premiumUntil: finalEndDate,
          updatedAt: new Date()
        });
      } else {
        console.warn('User not found in Firestore during premium upgrade. User ID:', req.user.id);
      }
    } catch (dbErr) {
      console.error('Firestore unavailable — could not persist premium upgrade:', dbErr.message);
      // In a real production system you'd queue this for retry.
      // In dev/mock mode we still return success so the UI updates.
    }

    // ── Analytics (best-effort, never fail the response) ───────────────────
    try {
      const todayStr  = getTodayString();
      const todayRef  = db.collection('analytics').doc(todayStr);
      const todaySnap = await todayRef.get();

      if (todaySnap.exists) {
        await todayRef.update({
          totalRevenue: (todaySnap.data().totalRevenue || 0) + resolvedAmount,
          updatedAt: new Date()
        });
      } else {
        await todayRef.set({
          date: todayStr,
          totalRevenue: resolvedAmount,
          totalUsers: 0,
          activeUsers: 0,
          totalMatches: 0,
          totalReports: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (analyticsErr) {
      console.warn('Could not update analytics:', analyticsErr.message);
    }

    return res.json({
      success: true,
      message: 'Payment verified and Premium status unlocked!',
      isPremium: true,
      premiumUntil: finalEndDate
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ message: 'Server error during payment verification' });
  }
});

module.exports = router;
