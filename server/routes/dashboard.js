const express = require('express');
const User = require('../models/User');
const Profile = require('../models/EntrepreneurProfile');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ServiceRequest = require('../models/ServiceRequest');
const Review = require('../models/Review');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const statusCounts = (rows) => {
  const counts = { pending: 0, accepted: 0, rejected: 0, completed: 0, cancelled: 0 };
  rows.forEach((r) => { counts[r._id] = r.count; });
  return counts;
};
const byStatus = (Model, match = {}) =>
  Model.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
const sumCompleted = async (Model, field, match = {}) => {
  const [row] = await Model.aggregate([
    { $match: { ...match, status: 'completed' } },
    { $group: { _id: null, total: { $sum: field } } },
  ]);
  return row ? row.total : 0;
};
const monthlyCompleted = (Model, field, match, since) =>
  Model.aggregate([
    { $match: { ...match, status: 'completed', updatedAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$updatedAt' } },
        total: { $sum: field },
      },
    },
  ]);
const round1 = (n) => Math.round(n * 10) / 10;

// Entrepreneur dashboard
router.get('/entrepreneur', protect, authorize('entrepreneur'), async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Create your profile first' });

    const match = { profile: profile._id };
    const now = new Date();
    const since = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [orderRows, requestRows, orderEarn, requestEarn, products, orderMonths, requestMonths] =
      await Promise.all([
        byStatus(Order, match),
        byStatus(ServiceRequest, match),
        sumCompleted(Order, '$total', match),
        sumCompleted(ServiceRequest, '$price', match),
        Product.countDocuments(match),
        monthlyCompleted(Order, '$total', match, since),
        monthlyCompleted(ServiceRequest, '$price', match, since),
      ]);

    const months = {};
    [...orderMonths, ...requestMonths].forEach((m) => {
      months[m._id] = (months[m._id] || 0) + m.total;
    });
    const monthlyEarnings = Object.keys(months)
      .sort()
      .map((month) => ({ month, total: months[month] }));

    res.json({
      profileStatus: profile.status,
      available: profile.available,
      rating: { average: profile.ratingAverage, count: profile.ratingCount },
      products,
      orders: statusCounts(orderRows),
      requests: statusCounts(requestRows),
      earnings: {
        fromOrders: orderEarn,
        fromServices: requestEarn,
        total: orderEarn + requestEarn,
      },
      monthlyEarnings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin analytics
router.get('/admin', protect, authorize('admin'), async (req, res) => {
  try {
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      registeredEntrepreneurs, totalCustomers, approvedProfiles, pendingProfiles,
      orderUsers, requestUsers, orderRows, requestRows,
      orderRevenue, requestRevenue, salesRow, ratingRow, topSkills,
    ] = await Promise.all([
      User.countDocuments({ role: 'entrepreneur' }),
      User.countDocuments({ role: 'customer' }),
      Profile.countDocuments({ status: 'approved' }),
      Profile.countDocuments({ status: 'pending' }),
      Order.distinct('customer', { createdAt: { $gte: since30 } }),
      ServiceRequest.distinct('customer', { createdAt: { $gte: since30 } }),
      byStatus(Order),
      byStatus(ServiceRequest),
      sumCompleted(Order, '$total'),
      sumCompleted(ServiceRequest, '$price'),
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $unwind: '$items' },
        { $group: { _id: null, units: { $sum: '$items.quantity' } } },
      ]),
      Review.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]),
      Profile.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: '$skillType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const activeUsers = new Set([...orderUsers, ...requestUsers].map(String)).size;
    const requests = statusCounts(requestRows);
    const requestTotal = Object.values(requests).reduce((a, b) => a + b, 0);
    const converted = requests.accepted + requests.completed;
    const totalEarnings = orderRevenue + requestRevenue;

    res.json({
      registeredEntrepreneurs,
      approvedProfiles,
      pendingProfiles,
      totalCustomers,
      activeUsersLast30Days: activeUsers,
      orders: statusCounts(orderRows),
      requests,
      serviceRequestConversionRate: requestTotal ? round1((converted / requestTotal) * 100) : 0,
      productSalesVolume: salesRow[0] ? salesRow[0].units : 0,
      totalEarnings,
      averageEntrepreneurEarnings: approvedProfiles ? round1(totalEarnings / approvedProfiles) : 0,
      averageRating: ratingRow[0] ? round1(ratingRow[0].avg) : 0,
      totalReviews: ratingRow[0] ? ratingRow[0].count : 0,
      topSkills: topSkills.map((s) => ({ skill: s._id, entrepreneurs: s.count })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;