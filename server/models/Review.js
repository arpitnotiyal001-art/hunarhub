const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    profile: { type: mongoose.Schema.Types.ObjectId, ref: 'EntrepreneurProfile', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

reviewSchema.index({ order: 1 }, { unique: true, partialFilterExpression: { order: { $type: 'objectId' } } });
reviewSchema.index({ request: 1 }, { unique: true, partialFilterExpression: { request: { $type: 'objectId' } } });

module.exports = mongoose.model('Review', reviewSchema);