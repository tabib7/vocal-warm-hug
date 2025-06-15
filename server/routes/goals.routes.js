
import express from 'express';
const router = express.Router();
import Goal from '../models/Goal.js';
import User from '../models/User.js';

// @route   GET api/goals
// @desc    Get all goals
// @access  Private
router.get('/', async (req, res) => {
  try {
    const goals = await Goal.find().sort({ createdAt: -1 });
    
    // Populate employee names
    const populatedGoals = await Promise.all(goals.map(async (goal) => {
      const employee = await User.findById(goal.employeeId).select('name');
      return {
        ...goal.toObject(),
        employeeName: employee ? employee.name : 'Unknown Employee'
      };
    }));
    
    res.json(populatedGoals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/goals/employee/:employeeId
// @desc    Get goals for specific employee
// @access  Private
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const goals = await Goal.find({ employeeId }).sort({ createdAt: -1 });
    
    // Get employee name
    const employee = await User.findById(employeeId).select('name');
    
    const populatedGoals = goals.map(goal => ({
      ...goal.toObject(),
      employeeName: employee ? employee.name : 'Unknown Employee'
    }));
    
    res.json(populatedGoals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/goals
// @desc    Create a goal
// @access  Private
router.post('/', async (req, res) => {
  try {
    const newGoal = new Goal(req.body);
    const goal = await newGoal.save();
    
    // Add employee name to response
    const employee = await User.findById(goal.employeeId).select('name');
    const goalWithEmployee = {
      ...goal.toObject(),
      employeeName: employee ? employee.name : 'Unknown Employee'
    };
    
    res.json(goalWithEmployee);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/goals/:id
// @desc    Update a goal
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({ msg: 'Goal not found' });
    }
    
    // Update completedAt if status changed to completed
    if (req.body.status === 'completed' && goal.status !== 'completed') {
      req.body.completedAt = new Date();
    }
    
    // Remove completedAt if status is not completed
    if (req.body.status !== 'completed' && goal.completedAt) {
      req.body.completedAt = undefined;
    }
    
    const updatedGoal = await Goal.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    // Add employee name to response
    const employee = await User.findById(updatedGoal.employeeId).select('name');
    const goalWithEmployee = {
      ...updatedGoal.toObject(),
      employeeName: employee ? employee.name : 'Unknown Employee'
    };
    
    res.json(goalWithEmployee);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/goals/:id
// @desc    Delete a goal
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({ msg: 'Goal not found' });
    }
    
    await Goal.findByIdAndRemove(req.params.id);
    
    res.json({ msg: 'Goal deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
