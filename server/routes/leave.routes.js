
import express from 'express';
const router = express.Router();
import Leave from '../models/Leave.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js'; // Import Notification model
import PushSubscription from '../models/PushSubscription.js'; // Import PushSubscription model
import webpush from 'web-push'; // Import web-push library

// @route   GET api/leave
// @desc    Get all leave requests
// @access  Private (admin/manager)
router.get('/', async (req, res) => {
  const io = req.app.get('socketio'); // Get io instance
  try {
    const leaveRequests = await Leave.find().sort({ createdAt: -1 });
    
    // Populate with employee details
    const populatedRequests = await Promise.all(leaveRequests.map(async (leave) => {
      const employee = await User.findById(leave.employeeId).select('name department position');
      let approver = null;
      
      if (leave.adminId) { // Changed from approvedBy to adminId
        approver = await User.findById(leave.adminId).select('name');
      }
      
      return {
        ...leave.toObject(),
        employeeName: employee ? employee.name : 'Unknown Employee',
        department: employee ? employee.department : 'Unknown',
        position: employee ? employee.position : 'Unknown',
        approverName: approver ? approver.name : null
      };
    }));
    
    res.json(populatedRequests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/leave/employee/:employeeId
// @desc    Get leave requests for specific employee
// @access  Private
router.get('/employee/:employeeId', async (req, res) => {
  const io = req.app.get('socketio'); // Get io instance
  try {
    const employeeId = req.params.employeeId;
    const leaveRequests = await Leave.find({ employeeId }).sort({ createdAt: -1 });
    
    // Get employee name
    const employee = await User.findById(employeeId).select('name');
    
    const populatedRequests = await Promise.all(leaveRequests.map(async (leave) => {
      let approver = null;
      if (leave.adminId) { // Changed from approvedBy to adminId
        approver = await User.findById(leave.adminId).select('name');
      }
      
      return {
        ...leave.toObject(),
        employeeName: employee ? employee.name : 'Unknown Employee',
        approverName: approver ? approver.name : null
      };
    }));
    
    res.json(populatedRequests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/leave
// @desc    Request leave
// @access  Private
router.post('/', async (req, res) => {
  const io = req.app.get('socketio'); // Get io instance
  try {
    const { employeeId, startDate, endDate, reason, type } = req.body;

    const newLeaveRequest = new Leave({
      employeeId,
      startDate,
      endDate,
      reason,
      type,
      status: 'pending' // Ensure status is pending on creation
    });
    const leaveRequest = await newLeaveRequest.save();
    
    // Add employee name to response
    const employee = await User.findById(leaveRequest.employeeId).select('name department position');
    
    const leaveWithEmployee = {
      ...leaveRequest.toObject(),
      employeeName: employee ? employee.name : 'Unknown Employee',
      department: employee ? employee.department : 'Unknown',
      position: employee ? employee.position : 'Unknown'
    };

    // Create notification for admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      const notification = new Notification({
        recipient: admin._id,
        sender: employeeId,
        type: 'leave_request',
        message: `${employee.name} has requested a leave from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}.`,
        relatedId: leaveRequest._id,
        onModel: 'Leave', // Add onModel field
        status: 'unread'
      });
      await notification.save();
      // Emit to admin if connected
      io.to(admin._id.toString()).emit('new_notification', notification); // Assuming rooms are by user ID
    }

    // Send push notifications to admins
    const adminSubscriptions = await PushSubscription.find({ userId: { $in: admins.map(a => a._id) } });
    const payloadToAdmins = JSON.stringify({
      title: 'New Leave Request!',
      body: `${employee.name} has requested a leave from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}.`,
      icon: '/favicon.ico',
      data: {
        url: '/leave',
        leaveId: leaveRequest._id
      }
    });

    for (const sub of adminSubscriptions) {
      try {
        await webpush.sendNotification(sub, payloadToAdmins);
        console.log('Push notification sent to admin:', sub.userId);
      } catch (pushError) {
        console.error('Failed to send push notification to admin:', pushError.message);
        if (pushError.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id });
          console.log('Removed expired push subscription:', sub._id);
        }
      }
    }
    
    res.status(201).json(leaveWithEmployee);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/leave/:id
// @desc    Update leave request (approve/reject)
// @access  Private (admin/manager)
router.put('/:id', async (req, res) => {
  const io = req.app.get('socketio'); // Get io instance
  try {
    const { status, adminId, adminNotes } = req.body; // Get status and adminId from body

    const leaveRequest = await Leave.findById(req.params.id);
    
    if (!leaveRequest) {
      return res.status(404).json({ msg: 'Leave request not found' });
    }
    
    // Update leave request
    leaveRequest.status = status;
    leaveRequest.adminId = adminId; // Set adminId
    leaveRequest.adminNotes = adminNotes || ''; // Set adminNotes
    await leaveRequest.save();

    const updatedRequest = leaveRequest; // Use the saved leaveRequest

    // Add employee and approver names to response
    const employee = await User.findById(updatedRequest.employeeId).select('name department position');
    let approver = null;
    
    if (updatedRequest.adminId) { // Changed from approvedBy to adminId
      approver = await User.findById(updatedRequest.adminId).select('name');
    }
    
    const leaveWithNames = {
      ...updatedRequest.toObject(),
      employeeName: employee ? employee.name : 'Unknown Employee',
      department: employee ? employee.department : 'Unknown',
      position: employee ? employee.position : 'Unknown',
      approverName: approver ? approver.name : null
    };

    // Create notification for the employee who requested the leave
    const notificationMessage = status === 'approved'
      ? `Your leave request from ${new Date(leaveRequest.startDate).toLocaleDateString()} to ${new Date(leaveRequest.endDate).toLocaleDateString()} has been APPROVED.`
      : `Your leave request from ${new Date(leaveRequest.startDate).toLocaleDateString()} to ${new Date(leaveRequest.endDate).toLocaleDateString()} has been DECLINED. Reason: ${adminNotes || 'No reason provided.'}`;

    const employeeNotification = new Notification({
      recipient: leaveRequest.employeeId,
      sender: adminId, // The admin who approved/declined
      type: 'leave_status_update',
      message: notificationMessage,
      relatedId: leaveRequest._id,
      onModel: 'Leave', // Add onModel field
      status: 'unread'
    });
    await employeeNotification.save();
    
    // Emit to employee if connected
    io.to(leaveRequest.employeeId.toString()).emit('new_notification', employeeNotification); // Assuming rooms are by user ID

    // Send push notification to the employee
    const employeeSubscription = await PushSubscription.findOne({ userId: leaveRequest.employeeId });
    if (employeeSubscription) {
      const payloadToEmployee = JSON.stringify({
        title: `Leave Request ${status === 'approved' ? 'Approved' : 'Declined'}!`,
        body: notificationMessage,
        icon: '/favicon.ico',
        data: {
          url: '/profile', // Assuming employee can see their leave status on profile
          leaveId: leaveRequest._id
        }
      });
      try {
        await webpush.sendNotification(employeeSubscription, payloadToEmployee);
        console.log('Push notification sent to employee:', employeeSubscription.userId);
      } catch (pushError) {
        console.error('Failed to send push notification to employee:', pushError.message);
        if (pushError.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: employeeSubscription._id });
          console.log('Removed expired push subscription:', employeeSubscription._id);
        }
      }
    }
    
    res.json(leaveWithNames);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
