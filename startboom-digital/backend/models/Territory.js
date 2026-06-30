import mongoose from 'mongoose';

const territorySchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  // Territory Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    default: ''
  },
  
  // Location Data (from OpenStreetMap Nominatim)
  location: {
    displayName: String,  // e.g., "Mukono, Central Region, Uganda"
    latitude: Number,
    longitude: Number,
    osmId: String,        // OpenStreetMap ID
    osmType: String,      // node, way, or relation
    boundingBox: {
      south: Number,
      north: Number,
      west: Number,
      east: Number
    }
  },
  
  // Administrative levels for Uganda
  region: {
    type: String,
    trim: true,
    index: true
  },
  
  district: {
    type: String,
    trim: true,
    index: true
  },
  
  county: {
    type: String,
    trim: true
  },
  
  subcounty: {
    type: String,
    trim: true
  },
  
  // Assigned Agents
  assignedAgents: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedDate: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Territory Manager/Lead
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Performance Tracking
  stats: {
    totalClients: {
      type: Number,
      default: 0
    },
    activeClients: {
      type: Number,
      default: 0
    },
    totalDeals: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    lastUpdated: Date
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index for tenant + name uniqueness
territorySchema.index({ tenant: 1, name: 1 }, { unique: true });

// Geospatial index for location-based queries
territorySchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

// Method to add agent to territory
territorySchema.methods.addAgent = function(userId) {
  const existingAgent = this.assignedAgents.find(
    a => a.user.toString() === userId.toString()
  );
  
  if (existingAgent) {
    existingAgent.isActive = true;
    existingAgent.assignedDate = new Date();
  } else {
    this.assignedAgents.push({
      user: userId,
      assignedDate: new Date(),
      isActive: true
    });
  }
  
  return this.save();
};

// Method to remove agent from territory
territorySchema.methods.removeAgent = function(userId) {
  const agent = this.assignedAgents.find(
    a => a.user.toString() === userId.toString()
  );
  
  if (agent) {
    agent.isActive = false;
  }
  
  return this.save();
};

// Method to get active agents
territorySchema.methods.getActiveAgents = function() {
  return this.assignedAgents.filter(a => a.isActive);
};

const Territory = mongoose.model('Territory', territorySchema);

export default Territory;
