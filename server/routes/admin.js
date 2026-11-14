const express = require('express');
const Profile = require('../models/EntrepreneurProfile');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect, authorize('admin'));

// List profiles, filter by status (default: pending)
router.get('/profiles', async (req, res) => {
  const status = req.query.status || 'pending';
  const profiles = await Profile.find({ status })
    .sort({ createdAt: -1 })
    .populate('user', 'name email');
  res.json(profiles);
});

// Approve or reject
router.patch('/profiles/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const profile = await Profile.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    );
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(400).json({ message: 'Invalid profile id' });
  }
});

module.exports = router;