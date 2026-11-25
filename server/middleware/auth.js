const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

// Check the Bearer token and set req.user. Routes below this can trust it.
async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ message: 'Please log in' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.id || !mongoose.isValidObjectId(payload.id)) {
      return res.status(401).json({ message: 'Please log in' });
    }

    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ message: 'Please log in' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Please log in' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = auth;
