const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    profile: { type: mongoose.Schema.Types.ObjectId, ref: 'EntrepreneurProfile', required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: String,
        price: Number,
        quantity: { type: Number, min: 1, required: true },
      },
    ],
    total: { type: Number, required: true },
    deliveryAddress: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    note: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
