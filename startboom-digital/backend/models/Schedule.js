import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Agent is required']
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client is required']
  },
  
  // Multi-Tenant Field
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
    max: [1440, 'Duration cannot exceed 24 hours']
  },
  type: {
    type: String,
    enum: {
      values: ['meeting', 'call', 'follow-up', 'task'],
      message: 'Type must be meeting, call, follow-up, or task'
    },
    required: [true, 'Type is required']
  },
  status: {
    type: String,
    enum: {
      values: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      message: 'Status must be scheduled, completed, cancelled, or rescheduled'
    },
    default: 'scheduled'
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  meetingLink: {
    type: String,
    trim: true
  },
  mode: {
    type: String,
    enum: {
      values: ['in-person', 'google-meet'],
      message: 'Mode must be in-person or google-meet'
    },
    required: [true, 'Mode is required']
  },
  attendees: {
    internal: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    external: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
      },
      company: {
        type: String,
        trim: true
      }
    }]
  },
  reminders: [{
    type: String,
    enum: ['15min', '30min', '1hr', '2hr', '1day', 'custom']
  }],
  customReminder: Date,
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'Priority must be low, medium, or high'
    },
    default: 'medium'
  },
  relatedDeal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal'
  },
  agenda: {
    type: String,
    maxlength: [1000, 'Agenda cannot exceed 1000 characters']
  },
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  clientResponse: {
    responded: {
      type: Boolean,
      default: false
    },
    response: {
      type: String,
      enum: ['accepted', 'declined', 'tentative', null],
      default: null
    },
    respondedAt: Date,
    notes: String
  },
  completedAt: Date,
  history: [{
    action: String,
    date: {
      type: Date,
      default: Date.now
    },
    notes: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Auto-generate Google Meet link for google-meet mode
scheduleSchema.pre('save', function(next) {
  if (this.mode === 'google-meet' && !this.meetingLink) {
    // Generate a Google Meet link (in a real implementation, you'd integrate with Google Calendar API)
    const meetCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    this.meetingLink = `https://meet.google.com/${meetCode}`;
    
    // Also set location to the Google Meet link for consistency
    this.location = this.meetingLink;
  }
  
  // Clear meeting link and set location to physical address if mode is in-person
  if (this.mode === 'in-person') {
    this.meetingLink = undefined;
    // Keep location as physical address for in-person meetings
  }
  
  next();
});

// Index for better query performance
scheduleSchema.index({ agent: 1, date: 1 });
scheduleSchema.index({ client: 1 });
scheduleSchema.index({ status: 1 });
scheduleSchema.index({ date: 1 });

// Virtual for formatted date
scheduleSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleString();
});

// Instance method to check if schedule is upcoming
scheduleSchema.methods.isUpcoming = function() {
  return this.date > new Date() && this.status === 'scheduled';
};

// Static method to get schedules by date range
scheduleSchema.statics.getByDateRange = function(startDate, endDate) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('client agent');
};

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;