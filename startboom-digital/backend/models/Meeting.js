import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Multi-Tenant Field
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required']
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    enum: ['Google Meet', 'In Person'],
    required: true
  },
  googleMeetLink: {
    type: String,
    validate: {
      validator: function(v) {
        // Only validate Google Meet link if location is Google Meet
        if (this.location === 'Google Meet') {
          return v && v.includes('meet.google.com');
        }
        return true; // No validation required for In Person
      },
      message: 'Valid Google Meet link is required for Google Meet meetings'
    }
  },
  notes: String,
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate Google Meet link if location is Google Meet and no link provided
meetingSchema.pre('save', function(next) {
  if (this.location === 'Google Meet' && !this.googleMeetLink) {
    // Generate a Google Meet link (in a real implementation, you'd integrate with Google Calendar API)
    // For now, we'll create a placeholder that can be updated later
    const meetCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    this.googleMeetLink = `https://meet.google.com/${meetCode}`;
  }
  
  // Clear Google Meet link if location is In Person
  if (this.location === 'In Person') {
    this.googleMeetLink = undefined;
  }
  
  next();
});

export default mongoose.model('Meeting', meetingSchema);