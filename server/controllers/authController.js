const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  return { _id: user._id, name: user.name, email: user.email };
}

function readNewUser(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (name.length < 2) return { error: 'Name must be at least 2 characters' };
  if (name.length > 40) return { error: 'Name is too long' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid email' };
  if (password.length < 6) return { error: 'Password must be at least 6 characters' };
  if (password.length > 64) return { error: 'Password is too long' };

  return { name, email, password };
}

async function register(req, res) {
  try {
    const parsed = readNewUser(req.body || {});
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const existing = await User.findOne({ email: parsed.email });
    if (existing) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const hashed = await bcrypt.hash(parsed.password, 10);
    const user = await User.create({
      name: parsed.name,
      email: parsed.email,
      password: hashed,
    });

    res.status(201).json({
      token: signToken(user._id),
      user: publicUser(user),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email is already registered' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function login(req, res) {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Wrong email or password' });
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      return res.status(401).json({ message: 'Wrong email or password' });
    }

    res.json({
      token: signToken(user._id),
      user: publicUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

function me(req, res) {
  res.json(publicUser(req.user));
}

module.exports = { register, login, me };
