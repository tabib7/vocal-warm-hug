import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['new_occasion', 'leave_request', 'leave_status_update', 'other'],
    required: true
  },
  relatedId: { // Renamed from occasion to relatedId
    type: Schema.Types.ObjectId,
    refPath: 'onModel' // Dynamic reference based on onModel field
  },
  onModel: { // To store the model name for relatedId
    type: String,
    required: function() { return this.relatedId !== undefined; }, // Required if relatedId is present
    enum: ['Leave', 'Occasion'] // Add other models as needed
  },
  message: {
    type: String,
    required: true
  },
  status: { // Renamed from isRead to status
    type: String,
    enum: ['unread', 'read'],
    default: 'unread'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Notification', NotificationSchema);
