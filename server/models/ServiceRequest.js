const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    profile: { type: mongoose.Schema.Types.ObjectId, ref: 'EntrepreneurProfile', required: true },
    serviceTitle: { type: String, required: true },
    price: { type: Number, required: true },
    details: { type: String, trim: true },
    preferredDate: Date,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceRequest', requestSchema);