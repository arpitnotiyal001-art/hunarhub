const express = require('express');
const Product = require('../models/Product');
const Profile = require('../models/EntrepreneurProfile');
const upload = require('../middleware/upload');
const { uploadBuffer, deleteImage } = require('../utils/uploadImage');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const handleUpload = (req, res, next) =>
  upload.array('images', 4)(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });

const uploadAll = (files = []) => Promise.all(files.map((f) => uploadBuffer(f.buffer)));

// Create product (approved entrepreneurs only)
router.post('/', protect, authorize('entrepreneur'), handleUpload, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(400).json({ message: 'Create your profile first' });
    if (profile.status !== 'approved') {
      return res.status(403).json({ message: 'Your profile must be approved by an admin first' });
    }
    const { name, description, price, stock } = req.body;
    const images = await uploadAll(req.files);
    const product = await Product.create({ profile: profile._id, name, description, price, stock, images });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// My own products
router.get('/mine', protect, authorize('entrepreneur'), async (req, res) => {
  const profile = await Profile.findOne({ user: req.user._id });
  if (!profile) return res.json([]);
  res.json(await Product.find({ profile: profile._id }).sort({ createdAt: -1 }));
});

// Update my product
router.put('/:id', protect, authorize('entrepreneur'), handleUpload, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    const product = profile && (await Product.findOne({ _id: req.params.id, profile: profile._id }));
    if (!product) return res.status(404).json({ message: 'Product not found' });

    ['name', 'description', 'price', 'stock', 'isActive'].forEach((k) => {
      if (req.body[k] !== undefined) product[k] = req.body[k];
    });
    if (req.files && req.files.length) {
      if (product.images.length + req.files.length > 4) {
        return res.status(400).json({ message: 'A product can have at most 4 images' });
      }
      product.images.push(...(await uploadAll(req.files)));
    }
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete my product and its images
router.delete('/:id', protect, authorize('entrepreneur'), async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    const product = profile && (await Product.findOne({ _id: req.params.id, profile: profile._id }));
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await Promise.all(product.images.map((i) => deleteImage(i.publicId)));
    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Public: list products from approved entrepreneurs
router.get('/', async (req, res) => {
  try {
    const { q, minPrice, maxPrice, page = 1, limit = 12 } = req.query;
    const approvedIds = await Profile.find({ status: 'approved' }).distinct('_id');
    const filter = { profile: { $in: approvedIds }, isActive: true };
    if (q) filter.name = new RegExp(escapeRegex(q), 'i');
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    const p = Math.max(Number(page), 1);
    const l = Math.min(Math.max(Number(limit), 1), 50);
    const [items, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l)
        .populate('profile', 'businessName city skillType'),
      Product.countDocuments(filter),
    ]);
    res.json({ items, total, page: p, pages: Math.ceil(total / l) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public: one product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isActive: true })
      .populate('profile', 'businessName city skillType status phone');
    if (!product || product.profile.status !== 'approved') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: 'Invalid product id' });
  }
});

module.exports = router;