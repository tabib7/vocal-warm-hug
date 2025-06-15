import express from 'express';
const router = express.Router();
import Task from '../models/Task.js';
import User from '../models/User.js';

// @route   GET api/tasks
// @desc    Get all tasks
// @access  Private
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    
    // Populate employee names
    const populatedTasks = await Promise.all(tasks.map(async (task) => {
      const employee = await User.findById(task.employeeId).select('name');
      return {
        ...task.toObject(),
        employeeName: employee ? employee.name : 'Unknown Employee'
      };
    }));
    
    res.json(populatedTasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/tasks/employee/:employeeId
// @desc    Get tasks for specific employee
// @access  Private
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const tasks = await Task.find({ employeeId }).sort({ createdAt: -1 });
    
    // Get employee name
    const employee = await User.findById(employeeId).select('name');
    
    const populatedTasks = tasks.map(task => ({
      ...task.toObject(),
      employeeName: employee ? employee.name : 'Unknown Employee'
    }));
    
    res.json(populatedTasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/tasks
// @desc    Create a task
// @access  Private
router.post('/', async (req, res) => {
  try {
    const newTask = new Task(req.body);
    const task = await newTask.save();
    
    // Add employee name to response
    const employee = await User.findById(task.employeeId).select('name');
    const taskWithEmployee = {
      ...task.toObject(),
      employeeName: employee ? employee.name : 'Unknown Employee'
    };
    
    res.json(taskWithEmployee);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    // Update completedAt if status changed to completed
    if (req.body.status === 'completed' && task.status !== 'completed') {
      req.body.completedAt = new Date();
    }
    
    // Remove completedAt if status is not completed
    if (req.body.status !== 'completed' && task.completedAt) {
      req.body.completedAt = undefined;
    }
    
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    // Add employee name to response
    const employee = await User.findById(updatedTask.employeeId).select('name');
    const taskWithEmployee = {
      ...updatedTask.toObject(),
      employeeName: employee ? employee.name : 'Unknown Employee'
    };
    
    res.json(taskWithEmployee);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    await Task.findByIdAndRemove(req.params.id);
    
    res.json({ msg: 'Task deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
