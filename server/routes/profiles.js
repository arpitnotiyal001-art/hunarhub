const express = require('express');
const Profile = require('../models/EntrepreneurProfile');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const EDITABLE = [
  'businessName', 'skillType', 'bio', 'experienceYears',
  'city', 'state', 'phone', 'services', 'available',
];
const pick = (body) =>
  Object.fromEntries(EDITABLE.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Create own profile (starts as pending)
router.post('/', protect, authorize('entrepreneur'), async (req, res) => {
  try {
    if (await Profile.findOne({ user: req.user._id })) {
      return res.status(400).json({ message: 'Profile already exists' });
    }
    const profile = await Profile.create({ ...pick(req.body), user: req.user._id });
    res.status(201).json(profile);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get own profile
router.get('/me', protect, authorize('entrepreneur'), async (req, res) => {
  const profile = await Profile.findOne({ user: req.user._id });
  if (!profile) return res.status(404).json({ message: 'No profile yet' });
  res.json(profile);
});

// Update own profile
router.put('/me', protect, authorize('entrepreneur'), async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      pick(req.body),
      { returnDocument: 'after', runValidators: true }
    );
    if (!profile) return res.status(404).json({ message: 'No profile yet' });
    res.json(profile);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Public: list approved profiles with search, filters and pagination
router.get('/', async (req, res) => {
  try {
    const { skill, city, q, maxPrice, page = 1, limit = 12 } = req.query;
    const filter = { status: 'approved' };
    if (skill) filter.skillType = new RegExp(`^${escapeRegex(skill)}$`, 'i');
    if (city) filter.city = new RegExp(escapeRegex(city), 'i');
    if (maxPrice) filter['services.price'] = { $lte: Number(maxPrice) };
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ businessName: rx }, { bio: rx }, { 'services.title': rx }];
    }
    const p = Math.max(Number(page), 1);
    const l = Math.min(Math.max(Number(limit), 1), 50);
    const [items, total] = await Promise.all([
      Profile.find(filter).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l)
        .populate('user', 'name'),
      Profile.countDocuments(filter),
    ]);
    res.json({ items, total, page: p, pages: Math.ceil(total / l) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public: one approved profile
router.get('/:id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ _id: req.params.id, status: 'approved' })
      .populate('user', 'name');
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(400).json({ message: 'Invalid profile id' });
  }
});

module.exports = router;