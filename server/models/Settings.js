
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const SettingsSchema = new Schema({
  companyName: {
    type: String,
    default: 'Employee Management System'
  },
  companyAddress: {
    type: String,
    default: '123 Main Street, City, Country'
  },
  systemEmail: {
    type: String,
    default: 'system@example.com'
  },
  dateFormat: {
    type: String,
    default: 'MM/DD/YYYY'
  },
  timeFormat: {
    type: String,
    default: '12 Hour (AM/PM)'
  },
  workHours: {
    start: {
      type: String,
      default: '07:00' // Matches original UI
    },
    end: {
      type: String,
      default: '16:00' // Matches original UI
    }
  },
  officeHalfTimeStart: {
    type: String,
    default: '13:00'
  },
  officeHalfTimeEnd: {
    type: String,
    default: '14:15'
  },
  breakTime: {
    start: {
      type: String,
      default: '08:00' // Default breakfast start time
    },
    end: {
      type: String,
      default: '08:30' // Default breakfast end time
    },
    duration: {
      type: Number,
      default: 20 // Matches original UI (Breakfast Time)
    },
    allowedPerDay: {
      type: Number,
      default: 2
    }
  },
  lunchTime: {
    duration: {
      type: Number,
      default: 60 // in minutes
    }
  },
  lunchTimeAfterHalfTime: {
    type: Number,
    default: 30 // Default value in minutes
  },
  lateArrivalThreshold: {
    type: Number,
    default: 15
  },
  geoVerification: {
    type: Boolean,
    default: false
  },
  autoClockOut: {
    type: Boolean,
    default: false
  },
  workingDays: {
    monday: { type: Boolean, default: true },
    tuesday: { type: Boolean, default: true },
    wednesday: { type: Boolean, default: true },
    thursday: { type: Boolean, default: true },
    friday: { type: Boolean, default: true },
    saturday: { type: Boolean, default: false },
    sunday: { type: Boolean, default: false }
  },
  holidays: [{
    name: String,
    date: Date
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Settings', SettingsSchema);
