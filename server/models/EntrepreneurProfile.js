const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true, trim: true },
    skillType: { type: String, required: true, trim: true }, // e.g. Cobbler, Potter, Tailor
    bio: { type: String, trim: true },
    experienceYears: { type: Number, min: 0, default: 0 },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    phone: { type: String, trim: true },
    services: [
      {
        title: { type: String, required: true },
        description: String,
        price: { type: Number, min: 0, required: true },
      },
    ],
    available: { type: Boolean, default: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EntrepreneurProfile', profileSchema);