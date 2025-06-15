import express from 'express';
import PushSubscription from '../models/PushSubscription.js';
import webpush from 'web-push';

const router = express.Router();

// Set VAPID keys for web-push
webpush.setVapidDetails(
  'mailto:mdtabibhasanayon@gmail.com', // IMPORTANT: Replace with a real email address for production
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// @route   GET /api/push/vapidPublicKey
// @desc    Get VAPID public key
// @access  Public
router.get('/vapidPublicKey', (req, res) => {
  res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// @route   POST /api/push/subscribe
// @desc    Register a push subscription
// @access  Private (requires authentication to associate with user)
router.post('/subscribe', async (req, res) => {
  const { subscription, userId } = req.body;

  if (!subscription || !userId) {
    return res.status(400).json({ msg: 'Subscription object and userId are required' });
  }

  try {
    const filter = { userId };
    const update = {
      endpoint: subscription.endpoint,
      keys: subscription.keys
    };
    const options = {
      upsert: true, // Create a new document if no document matches the filter
      new: true,    // Return the modified document rather than the original
      setDefaultsOnInsert: true // Apply schema defaults when creating new document
    };

    const updatedSubscription = await PushSubscription.findOneAndUpdate(
      filter,
      update,
      options
    );

    if (updatedSubscription) {
      console.log('Push subscription saved/updated for user:', userId);
      res.status(200).json({ msg: 'Subscription saved/updated successfully' });
    } else {
      // This case should ideally not be reached with upsert: true
      res.status(500).json({ msg: 'Failed to save or update subscription' });
    }
  } catch (error) {
    console.error('Error saving push subscription:', error.message);
    console.error(error.stack); // Log stack trace
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// @route   POST /api/push/unsubscribe
// @desc    Unregister a push subscription
// @access  Private (requires authentication)
router.post('/unsubscribe', async (req, res) => {
  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({ msg: 'Endpoint is required' });
  }

  try {
    const result = await PushSubscription.deleteOne({ endpoint });
    if (result.deletedCount === 0) {
      console.log('Attempted to remove non-existent push subscription:', endpoint);
      return res.status(200).json({ msg: 'Subscription not found or already removed' });
    }
    console.log('Push subscription removed:', endpoint);
    res.status(200).json({ msg: 'Subscription removed successfully' });
  } catch (error) {
    console.error('Error removing push subscription:', error.message);
    console.error(error.stack); // Log stack trace
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

export default router;
