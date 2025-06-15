import express from 'express';
const router = express.Router();
import Notification from '../models/Notification.js';
import auth from '../middleware/auth.js'; // Assuming you have an auth middleware

// @route   GET api/notifications
// @desc    Get notifications for the logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id }) // Changed from user to recipient
      .sort({ createdAt: -1 })
      .populate({
        path: 'relatedId',
        model: 'Leave', // Assuming 'Leave' is the primary related model for now
        select: 'startDate endDate reason status employeeId'
      })
      .populate('sender', 'name profileImage'); // Populate sender details

    res.json(notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/notifications/read/:id
// @desc    Mark a notification as read
// @access  Private
router.put('/read/:id', auth, async (req, res) => {
  try {
    let notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    // Ensure the notification belongs to the logged-in user
    if (notification.recipient.toString() !== req.user.id) { // Changed from user to recipient
      return res.status(401).json({ msg: 'User not authorized' });
    }

    notification.status = 'read'; // Changed from isRead to status
    await notification.save();

    res.json({ msg: 'Notification marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/notifications/demo
// @desc    Remove all demo notifications (e.g., 'new_occasion' type)
// @access  Private (admin) - assuming auth middleware handles role
router.delete('/demo', auth, async (req, res) => {
  try {
    // Only allow admins to delete demo notifications
    // This assumes req.user.role is available from auth middleware
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to perform this action' });
    }

    // Delete notifications of type 'new_occasion' or 'other'
    await Notification.deleteMany({ type: { $in: ['new_occasion', 'other'] } });

    res.json({ msg: 'Demo notifications removed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/notifications/clear-all
// @desc    Delete all notifications for the logged-in user
// @access  Private
router.delete('/clear-all', auth, async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user.id });
    res.json({ msg: 'All notifications removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/notifications/:id
// @desc    Delete a specific notification
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    // Allow recipient or admin to delete the notification
    if (notification.recipient.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized to delete this notification' });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Notification removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
