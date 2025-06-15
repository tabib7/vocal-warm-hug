import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const AttendanceSchema = new Schema({
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  clockInTime: {
    type: Date,
    required: true
  },
  clockOutTime: {
    type: Date
  },
  lateReason: {
    type: String
  },
  earlyLeaveReason: { // Renamed from clockOutReason
    type: String
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'on_break', 'on_lunch', 'on_breakfast', 'clocked_out'], // Added on_breakfast
    default: 'present'
  },
  notes: { // This can still be general notes, but also used for late reasons
    type: String
  },
  additionalPunches: [ // Array for all other clock-in/out events
    {
      type: {
        type: String,
        enum: ['in', 'out', 'break_start', 'break_end', 'lunch_start', 'lunch_end', 'breakfast_start', 'breakfast_end', 'half_time_out', 'half_time_in', 'early_leave_punch', 'late_arrival_punch', 'other'], // Added breakfast_start, breakfast_end
        required: true
      },
      time: {
        type: Date,
        required: true
      },
      reason: { // Optional reason for specific punches
        type: String
      }
    }
  ]
}, { timestamps: true }); // Add timestamps for createdAt and updatedAt

export default mongoose.model('Attendance', AttendanceSchema);
