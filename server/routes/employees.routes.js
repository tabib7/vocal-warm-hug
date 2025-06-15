
import express from 'express';
const router = express.Router();
import User from '../models/User.js';

// @route   GET api/employees
// @desc    Get all employees
// @access  Private
router.get('/', async (req, res) => {
  try {
    const employees = await User.find().select('-password').sort({ joinDate: -1 });
    res.json(employees);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/employees
// @desc    Create an employee
// @access  Private (admin/manager only)
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if employee with this email already exists
    let employee = await User.findOne({ email });
    
    if (employee) {
      return res.status(400).json({ msg: 'Employee with this email already exists' });
    }
    
    // Set profile image based on role
    const { role } = req.body;
    if (role === 'employee') {
      req.body.profileImage = 'https://i.imgur.com/grqcC37.png';
    } else if (role === 'admin' || role === 'manager') {
      req.body.profileImage = 'https://i.imgur.com/IwhrGDa.jpeg';
    } else {
      // Optional: Set a default image for other roles or if role is missing
      // req.body.profileImage = 'default_image_url.png';
    }

    employee = new User(req.body);
    await employee.save();
    
    res.json(employee);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/employees/:id
// @desc    Update an employee
// @access  Private (admin/manager only)
router.put('/:id', async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ msg: 'Employee not found' });
    }
    
    const updatedEmployee = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).select('-password');
    
    res.json(updatedEmployee);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/employees/:id
// @desc    Delete an employee
// @access  Private (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ msg: 'Employee not found' });
    }
    
    await User.findByIdAndRemove(req.params.id);
    
    res.json({ msg: 'Employee removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
