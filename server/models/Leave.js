
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const LeaveSchema = new Schema({
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['sick', 'vacation', 'personal', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  adminNotes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Leave', LeaveSchema);
