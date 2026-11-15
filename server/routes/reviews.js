const express = require('express');
const Review = require('../models/Review');
const Order = require('../models/Order');
const ServiceRequest = require('../models/ServiceRequest');
const Profile = require('../models/EntrepreneurProfile');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const updateRatingStats = async (profileId) => {
  const [stats] = await Review.aggregate([
    { $match: { profile: profileId } },
    { $group: { _id: '$profile', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Profile.findByIdAndUpdate(profileId, {
    ratingAverage: stats ? Math.round(stats.avg * 10) / 10 : 0,
    ratingCount: stats ? stats.count : 0,
  });
};

// Leave a review (customer, completed orders or requests only)
router.post('/', protect, authorize('customer'), async (req, res) => {
  try {
    const { orderId, requestId, rating, comment } = req.body;
    if (!!orderId === !!requestId) {
      return res.status(400).json({ message: 'Provide either orderId or requestId' });
    }
    const stars = Number(rating);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ message: 'Rating must be a whole number from 1 to 5' });
    }

    const Model = orderId ? Order : ServiceRequest;
    const doc = await Model.findOne({ _id: orderId || requestId, customer: req.user._id });
    if (!doc) return res.status(404).json({ message: 'Order or request not found' });
    if (doc.status !== 'completed') {
      return res.status(400).json({ message: 'You can only review completed orders or requests' });
    }

    const review = await Review.create({
      customer: req.user._id,
      profile: doc.profile,
      order: orderId || undefined,
      request: requestId || undefined,
      rating: stars,
      comment,
    });
    await updateRatingStats(doc.profile);
    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You already reviewed this' });
    }
    res.status(400).json({ message: err.message });
  }
});

// My reviews (customer)
router.get('/mine', protect, authorize('customer'), async (req, res) => {
  const reviews = await Review.find({ customer: req.user._id })
    .sort({ createdAt: -1 })
    .populate('profile', 'businessName');
  res.json(reviews);
});

// Public: reviews for one entrepreneur
router.get('/profile/:profileId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const p = Math.max(Number(page), 1);
    const l = Math.min(Math.max(Number(limit), 1), 50);
    const filter = { profile: req.params.profileId };
    const [items, total] = await Promise.all([
      Review.find(filter).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l)
        .populate('customer', 'name'),
      Review.countDocuments(filter),
    ]);
    res.json({ items, total, page: p, pages: Math.ceil(total / l) });
  } catch (err) {
    res.status(400).json({ message: 'Invalid profile id' });
  }
});

module.exports = router;