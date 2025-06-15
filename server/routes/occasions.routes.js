
import express from 'express';
const router = express.Router();
import Occasion from '../models/Occasion.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import PushSubscription from '../models/PushSubscription.js'; // Import PushSubscription model
import webpush from 'web-push'; // Import web-push library

// @route   GET api/occasions
// @desc    Get all occasions
// @access  Private
router.get('/', async (req, res) => {
  try {
    const occasions = await Occasion.find().sort({ date: 1 });
    
    // Populate with creator details
    const populatedOccasions = await Promise.all(occasions.map(async (occasion) => {
      const creator = await User.findById(occasion.createdBy).select('name');
      return {
        ...occasion.toObject(),
        creatorName: creator ? creator.name : 'System'
      };
    }));
    
    res.json(populatedOccasions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/occasions
// @desc    Create an occasion
// @access  Private (admin/manager)
router.post('/', async (req, res) => {
  try {
    const { isShortOccasion } = req.body;

    if (!isShortOccasion) {
      if (!req.body.startDate || !req.body.endDate) {
        return res.status(400).json({ msg: 'Start date and end date are required for non-short occasions' });
      }
    } else {
      // Explicitly delete startDate and endDate for short occasions
      delete req.body.startDate;
      delete req.body.endDate;
    }

    // Set default type based on occasion type
    req.body.type = isShortOccasion ? 'event' : 'holiday';

    const newOccasion = new Occasion(req.body);

    const io = req.app.get('socketio'); // Get io instance
    const occasion = await newOccasion.save();

    // Fetch all users to send notifications
    const users = await User.find().select('_id');

    // Create notifications and emit real-time events
    for (const user of users) {
      const notification = new Notification({
        recipient: user._id,
        sender: occasion.createdBy, // The user who created the occasion
        type: 'new_occasion',
        message: `A new occasion "${occasion.name}" has been added for ${new Date(occasion.date).toLocaleDateString()}.`,
        relatedId: occasion._id,
        onModel: 'Occasion', // Specify the model
        status: 'unread'
      });
      await notification.save();
      // Emit to user if connected
      io.to(user._id.toString()).emit('new_notification', notification); // Assuming rooms are by user ID
    }

    // Send push notifications
    const pushSubscriptions = await PushSubscription.find({ userId: { $in: users.map(u => u._id) } });
    const payload = JSON.stringify({
      title: 'New Occasion!',
      body: `A new occasion "${occasion.name}" has been added for ${new Date(occasion.date).toLocaleDateString()}.`,
      icon: '/favicon.ico', // Path to your app icon
      data: {
        url: '/occasions', // URL to open when notification is clicked
        occasionId: occasion._id
      }
    });

    for (const sub of pushSubscriptions) {
      try {
        await webpush.sendNotification(sub, payload);
        console.log('Push notification sent to user:', sub.userId);
      } catch (pushError) {
        console.error('Failed to send push notification:', pushError.message);
        // If subscription is no longer valid, remove it from the database
        if (pushError.statusCode === 410) { // GONE status code
          await PushSubscription.deleteOne({ _id: sub._id });
          console.log('Removed expired push subscription:', sub._id);
        }
      }
    }

    // Add creator name to response
    const creator = await User.findById(occasion.createdBy).select('name');
    const occasionWithCreator = {
      ...occasion.toObject(),
      creatorName: creator ? creator.name : 'System'
    };

    res.status(201).json(occasionWithCreator);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/occasions/:id
// @desc    Update an occasion
// @access  Private (admin/manager)
router.put('/:id', async (req, res) => {
  try {
    const occasion = await Occasion.findById(req.params.id);
    
    if (!occasion) {
      return res.status(404).json({ msg: 'Occasion not found' });
    }
    
    const updatedOccasion = await Occasion.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    // Add creator name to response
    const creator = await User.findById(updatedOccasion.createdBy).select('name');
    const occasionWithCreator = {
      ...updatedOccasion.toObject(),
      creatorName: creator ? creator.name : 'System'
    };
    
    res.json(occasionWithCreator);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/occasions/:id
// @desc    Delete an occasion
// @access  Private (admin/manager)
router.delete('/:id', async (req, res) => {
  try {
    const occasion = await Occasion.findById(req.params.id);
    
    if (!occasion) {
      return res.status(404).json({ msg: 'Occasion not found' });
    }
    
    await Occasion.findByIdAndRemove(req.params.id);
    
    res.json({ msg: 'Occasion deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/occasions/read/:id
// @desc    Mark occasion as read
// @access  Private
router.put('/read/:id', async (req, res) => {
  try {
    const occasion = await Occasion.findById(req.params.id);
    
    if (!occasion) {
      return res.status(404).json({ msg: 'Occasion not found' });
    }
    
    occasion.isRead = true;
    await occasion.save();
    
    res.json({ msg: 'Occasion marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
