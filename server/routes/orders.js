const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Profile = require('../models/EntrepreneurProfile');
const { protect, authorize } = require('../middleware/auth');
const { canMove, getActor } = require('../utils/statusFlow');

const router = express.Router();

// Place an order (customer)
router.post('/', protect, authorize('customer'), async (req, res) => {
  const reserved = [];
  try {
    const { items, deliveryAddress, phone, note } = req.body;
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: 'Order needs at least one item' });
    }
    if (!deliveryAddress) return res.status(400).json({ message: 'Delivery address is required' });

    const qtyMap = new Map();
    for (const i of items) {
      const qty = Number(i.quantity);
      if (!i.productId || !Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ message: 'Each item needs productId and a whole quantity of 1 or more' });
      }
      qtyMap.set(String(i.productId), (qtyMap.get(String(i.productId)) || 0) + qty);
    }

    const products = await Product.find({ _id: { $in: [...qtyMap.keys()] }, isActive: true })
      .populate('profile', 'status');
    if (products.length !== qtyMap.size) {
      return res.status(400).json({ message: 'One or more products are unavailable' });
    }
    const profileIds = new Set(products.map((p) => String(p.profile._id)));
    if (profileIds.size > 1) {
      return res.status(400).json({ message: 'Order items must all be from one entrepreneur' });
    }
    if (products[0].profile.status !== 'approved') {
      return res.status(400).json({ message: 'This entrepreneur is not available' });
    }

    const lines = products.map((p) => ({
      product: p._id,
      name: p.name,
      price: p.price,
      quantity: qtyMap.get(String(p._id)),
    }));

    for (const line of lines) {
      const r = await Product.updateOne(
        { _id: line.product, stock: { $gte: line.quantity } },
        { $inc: { stock: -line.quantity } }
      );
      if (r.modifiedCount === 0) throw new Error(`Not enough stock for ${line.name}`);
      reserved.push(line);
    }

    const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    const order = await Order.create({
      customer: req.user._id,
      profile: products[0].profile._id,
      items: lines,
      total,
      deliveryAddress,
      phone,
      note,
    });
    res.status(201).json(order);
  } catch (err) {
    await Promise.all(
      reserved.map((l) => Product.updateOne({ _id: l.product }, { $inc: { stock: l.quantity } }))
    );
    res.status(400).json({ message: err.message });
  }
});

// My orders (customer)
router.get('/mine', protect, authorize('customer'), async (req, res) => {
  const orders = await Order.find({ customer: req.user._id })
    .sort({ createdAt: -1 })
    .populate('profile', 'businessName city phone');
  res.json(orders);
});

// Orders I received (entrepreneur), optional ?status=pending
router.get('/received', protect, authorize('entrepreneur'), async (req, res) => {
  const profile = await Profile.findOne({ user: req.user._id });
  if (!profile) return res.json([]);
  const filter = { profile: profile._id };
  if (req.query.status) filter.status = req.query.status;
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .populate('customer', 'name email');
  res.json(orders);
});

// Change status
router.patch('/:id/status', protect, authorize('customer', 'entrepreneur'), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const actor = await getActor(req.user, order);
    if (!actor) return res.status(403).json({ message: 'This is not your order' });
    if (!canMove(actor, order.status, status)) {
      return res.status(400).json({ message: `A ${actor} cannot change an order from ${order.status} to ${status}` });
    }

    const updated = await Order.findOneAndUpdate(
      { _id: order._id, status: order.status },
      { status },
      { new: true }
    );
    if (!updated) return res.status(409).json({ message: 'Order was just updated, please retry' });

    if (['rejected', 'cancelled'].includes(status)) {
      await Promise.all(
        updated.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } }))
      );
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Invalid order id' });
  }
});

module.exports = router;