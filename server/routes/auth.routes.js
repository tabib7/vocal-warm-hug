
import express from 'express';
const router = express.Router();
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// JWT Secret Key (ideally should be in .env)
const JWT_SECRET = 'ems_jwt_secret';

// Sample admin users for initial setup - similar to the frontend demo accounts
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    department: 'Management',
    position: 'System Administrator',
    joinDate: new Date('2020-01-15'),
    profileImage: 'https://i.imgur.com/IwhrGDa.jpeg', // Admin image
  },
  {
    name: 'Manager User',
    email: 'manager@example.com',
    password: 'manager123',
    role: 'manager',
    department: 'Development',
    position: 'Team Lead',
    joinDate: new Date('2021-03-10'),
    profileImage: 'https://i.imgur.com/IwhrGDa.jpeg', // Manager image
  },
  {
    name: 'Employee User',
    email: 'employee@example.com',
    password: 'employee123',
    role: 'employee',
    department: 'Development',
    position: 'Software Developer',
    joinDate: new Date('2022-05-20'),
    profileImage: 'https://i.imgur.com/grqcC37.png', // Employee image
  }
];

// Initialize sample users
const initSampleUsers = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      await User.insertMany(sampleUsers);
      console.log('Sample users created successfully');
    }
  } catch (error) {
    console.error('Error initializing sample users:', error);
  }
};

// Call the function when the server starts
initSampleUsers();

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid email or password' });
    }

    if (user.password !== password) {
      return res.status(400).json({ msg: 'Invalid email or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toObject();

    // Send response with token and user data
    res.json({
      ...userWithoutPassword,
      token
    });
  } catch (err) {
    console.error('Server error during login:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/user
// @desc    Get user by ID
// @access  Private
router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
