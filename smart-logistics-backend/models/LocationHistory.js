const mongoose = require('mongoose');

const locationHistorySchema = new mongoose.Schema({
  shipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment',
    required: true,
    index: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  speed: {
    type: Number,
    default: null
  },
  heading: {
    type: Number,
    default: null
  },
  accuracy: {
    type: Number,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for fast route playback queries (shipment + time ordered)
locationHistorySchema.index({ shipment: 1, timestamp: 1 });

module.exports = mongoose.model('LocationHistory', locationHistorySchema);