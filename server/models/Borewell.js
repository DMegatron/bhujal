const mongoose = require('mongoose');

const borewellSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer reference is required']
  },
  location: {
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },
    address: {
      type: String,
      trim: true
    }
  },
  wellType: {
    type: String,
    required: [true, 'Well type is required'],
    enum: ['dug-well', 'drilled-well', 'tube-well', 'other']
  },
  depthType: {
    type: String,
    required: [true, 'Depth type is required'],
    maxlength: [100, 'Depth type cannot exceed 100 characters']
  },
  wallType: {
    type: String,
    maxlength: [100, 'Wall type cannot exceed 100 characters']
  },
  supplySystem: {
    type: String,
    maxlength: [100, 'Supply system cannot exceed 100 characters']
  },
  exactDepth: {
    type: Number,
    default: 0,
    min: [0, 'Depth cannot be negative']
  },
  motorOperated: {
    type: Boolean,
    default: false
  },
  authoritiesAware: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  waterLevel: {
    current: {
      type: Number,
      min: [0, 'Water level cannot be negative']
    },
    predicted: {
      type: Number,
      min: [0, 'Predicted water level cannot be negative']
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'dry'],
    default: 'active'
  },
  isPublic: {
    type: Boolean,
    default: true // Whether this borewell data should be visible to other users
  }
}, {
  timestamps: true
});

// Indexes for performance
borewellSchema.index({ customer: 1 });
borewellSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
borewellSchema.index({ wellType: 1 });
borewellSchema.index({ status: 1 });
borewellSchema.index({ isPublic: 1 });

// Compound index for geospatial queries
borewellSchema.index({ 
  'location.latitude': 1, 
  'location.longitude': 1, 
  isPublic: 1 
});

module.exports = mongoose.model('Borewell', borewellSchema);
