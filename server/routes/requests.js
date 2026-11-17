const express = require('express');
const ServiceRequest = require('../models/ServiceRequest');
const Profile = require('../models/EntrepreneurProfile');
const { protect, authorize } = require('../middleware/auth');
const { canMove, getActor } = require('../utils/statusFlow');

const router = express.Router();

// Create a service request (customer)
router.post('/', protect, authorize('customer'), async (req, res) => {
  try {
    const { profileId, serviceId, details, preferredDate } = req.body;
    const profile = await Profile.findOne({ _id: profileId, status: 'approved' });
    if (!profile) return res.status(404).json({ message: 'Entrepreneur not found' });
    if (!profile.available) {
      return res.status(400).json({ message: 'This entrepreneur is not taking requests right now' });
    }
    const service = profile.services.id(serviceId);
    if (!service) return res.status(400).json({ message: 'Service not found' });

    const request = await ServiceRequest.create({
      customer: req.user._id,
      profile: profile._id,
      serviceTitle: service.title,
      price: service.price,
      details,
      preferredDate,
    });
    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// My requests (customer)
router.get('/mine', protect, authorize('customer'), async (req, res) => {
  const list = await ServiceRequest.find({ customer: req.user._id })
    .sort({ createdAt: -1 })
    .populate('profile', 'businessName city phone');
  res.json(list);
});

// Requests I received (entrepreneur)
router.get('/received', protect, authorize('entrepreneur'), async (req, res) => {
  const profile = await Profile.findOne({ user: req.user._id });
  if (!profile) return res.json([]);
  const filter = { profile: profile._id };
  if (req.query.status) filter.status = req.query.status;
  const list = await ServiceRequest.find(filter)
    .sort({ createdAt: -1 })
    .populate('customer', 'name email');
  res.json(list);
});

// Change status
router.patch('/:id/status', protect, authorize('customer', 'entrepreneur'), async (req, res) => {
  try {
    const { status } = req.body;
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const actor = await getActor(req.user, request);
    if (!actor) return res.status(403).json({ message: 'This is not your request' });
    if (!canMove(actor, request.status, status)) {
      return res.status(400).json({ message: `A ${actor} cannot change a request from ${request.status} to ${status}` });
    }
    const updated = await ServiceRequest.findOneAndUpdate(
      { _id: request._id, status: request.status },
      { status },
      { returnDocument: 'after' }
    );
    if (!updated) return res.status(409).json({ message: 'Request was just updated, please retry' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Invalid request id' });
  }
});

module.exports = router;