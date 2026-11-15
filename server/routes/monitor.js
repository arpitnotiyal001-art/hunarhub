const express = require('express');
const Order = require('../models/Order');
const ServiceRequest = require('../models/ServiceRequest');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect, authorize('admin'));

const list = (Model, label) => async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const p = Math.max(Number(page), 1);
    const l = Math.min(Math.max(Number(limit), 1), 50);
    const [items, total] = await Promise.all([
      Model.find(filter).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l)
        .populate('customer', 'name email')
        .populate('profile', 'businessName city'),
      Model.countDocuments(filter),
    ]);
    res.json({ items, total, page: p, pages: Math.ceil(total / l) });
  } catch (err) {
    res.status(500).json({ message: `Could not load ${label}` });
  }
};

router.get('/orders', list(Order, 'orders'));
router.get('/requests', list(ServiceRequest, 'requests'));

module.exports = router;