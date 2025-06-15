
import express from 'express';
const router = express.Router();
import Settings from '../models/Settings.js';

// Initialize default settings
const initDefaultSettings = async () => {
  try {
    const count = await Settings.countDocuments();
    if (count === 0) {
      const defaultSettings = new Settings({
        companyName: 'Employee Management System',
        companyAddress: '123 Main Street, City, Country',
        systemEmail: 'system@example.com',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12 Hour (AM/PM)',
        workHours: {
          start: '07:00',
          end: '16:00'
        },
        officeHalfTimeStart: '13:00',
        officeHalfTimeEnd: '14:15',
        breakTime: {
          duration: 20,
          allowedPerDay: 2
        },
        lunchTime: {
          duration: 60
        },
        lunchTimeAfterHalfTime: 30, // Default value in minutes
        lateArrivalThreshold: 15,
        geoVerification: false,
        autoClockOut: false,
        workingDays: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false
        },
        holidays: []
      });
      
      await defaultSettings.save();
      console.log('Default settings created successfully');
    }
  } catch (error) {
    console.error('Error initializing default settings:', error);
  }
};

// Call the function when the server starts
initDefaultSettings();

// @route   GET api/settings
// @desc    Get settings
// @access  Private
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    
    if (!settings) {
      return res.status(404).json({ msg: 'Settings not found' });
    }
    
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/settings
// @desc    Update settings
// @access  Private (admin only)
router.put('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
      settings.updatedAt = Date.now();
    }
    
    await settings.save();
    
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
