const Profile = require('../models/EntrepreneurProfile');

const MOVES = {
  entrepreneur: { pending: ['accepted', 'rejected'], accepted: ['completed'] },
  customer: { pending: ['cancelled'] },
};

exports.canMove = (actor, from, to) => (MOVES[actor][from] || []).includes(to);

exports.getActor = async (user, doc) => {
  if (user.role === 'customer' && doc.customer.equals(user._id)) return 'customer';
  if (user.role === 'entrepreneur') {
    const profile = await Profile.findOne({ user: user._id });
    if (profile && doc.profile.equals(profile._id)) return 'entrepreneur';
  }
  return null;
};