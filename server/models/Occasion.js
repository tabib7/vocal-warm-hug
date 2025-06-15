
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const OccasionSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  isShortOccasion: {
    type: Boolean,
    default: false
  },
  shortOccasionStartTime: {
    type: String, // Store time as a string
    required: function() { return this.isShortOccasion; } // Required if it is a short occasion
  },
  type: {
    type: String,
    enum: ['holiday', 'event', 'birthday', 'anniversary', 'other'],
    default: 'other'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Occasion', OccasionSchema);
