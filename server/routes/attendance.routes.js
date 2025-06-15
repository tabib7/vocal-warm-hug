
import express from 'express';
const router = express.Router();
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';

// @route   GET api/attendance
// @desc    Get all attendance records
// @access  Private (admin/manager)
router.get('/', async (req, res) => {
  try {
    const attendance = await Attendance.find().sort({ date: -1 });
    
    // Populate with employee details
    const populatedAttendance = await Promise.all(attendance.map(async (record) => {
      const employee = await User.findById(record.employeeId).select('name');
      return {
        ...record.toObject(),
        employeeName: employee ? employee.name : 'Unknown Employee'
      };
    }));
    
    res.json(populatedAttendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/attendance/employee/:employeeId
// @desc    Get attendance for specific employee
// @access  Private
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const attendance = await Attendance.find({ employeeId }).sort({ date: -1 });
    
    // Get employee name
    const employee = await User.findById(employeeId).select('name');
    
    const populatedAttendance = attendance.map(record => ({
      ...record.toObject(),
      employeeName: employee ? employee.name : 'Unknown Employee'
    }));
    
    res.json(populatedAttendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/attendance/clockin
// @desc    Clock in
// @access  Private
router.post('/clockin', async (req, res) => {
  try {
    const { employeeId, lateReason } = req.body;
    
    // Check if already clocked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const existingRecord = await Attendance.findOne({
      employeeId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    if (existingRecord) {
      return res.status(400).json({ msg: 'Already clocked in today' });
    }
    
    const clockInTime = new Date();
    
    const newAttendance = new Attendance({
      employeeId,
      date: today,
      clockInTime,
      lateReason,
      status: 'present'
    });
    
    const attendance = await newAttendance.save();
    
    // Add employee name to response
    const employee = await User.findById(employeeId).select('name');
    const attendanceWithEmployee = {
      ...attendance.toObject(),
      employeeName: employee ? employee.name : 'Unknown Employee'
    };
    
    res.json(attendanceWithEmployee);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/attendance/clockout/:id
// @desc    Clock out
// @access  Private
router.put('/clockout/:id', async (req, res) => {
  try {
    const { earlyLeaveReason } = req.body; // Changed from clockOutReason
    
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ msg: 'Attendance record not found' });
    }
    
    attendance.clockOutTime = new Date();
    attendance.earlyLeaveReason = earlyLeaveReason; // Changed from clockOutReason
    attendance.status = 'clocked_out'; // Set status to clocked_out
    
    const updatedAttendance = await attendance.save();
    
    // Add employee name to response
    const employee = await User.findById(updatedAttendance.employeeId).select('name');
    const attendanceWithEmployee = {
      ...updatedAttendance.toObject(),
      employeeName: employee ? employee.name : 'Unknown Employee'
    };
    
    res.json(attendanceWithEmployee);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/attendance/punch/:id
// @desc    Add an additional punch (break, lunch, etc.) to an attendance record
// @access  Private
router.put('/punch/:id', async (req, res) => {
  try {
    const { type, time, reason } = req.body; // type: 'break_start', 'break_end', 'lunch_start', 'lunch_end', 'other'

    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({ msg: 'Attendance record not found' });
    }

    attendance.additionalPunches.push({ type, time: time || new Date(), reason });

    // Update status based on punch type (optional, but good for real-time status)
    if (type === 'break_start') {
      attendance.status = 'on_break';
    } else if (type === 'lunch_start') {
      attendance.status = 'on_lunch';
    } else if (type === 'breakfast_start') { // Handle breakfast start
      attendance.status = 'on_breakfast';
    } else if (type === 'break_end' || type === 'lunch_end' || type === 'breakfast_end') { // Handle all ends
      attendance.status = 'present'; // Assuming returning to present after break/lunch/breakfast
    }

    const updatedAttendance = await attendance.save();

    // Add employee name to response
    const employee = await User.findById(updatedAttendance.employeeId).select('name');
    const attendanceWithEmployee = {
      ...updatedAttendance.toObject(),
      employeeName: employee ? employee.name : 'Unknown Employee'
    };

    res.json(attendanceWithEmployee);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
