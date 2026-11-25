const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error('Set MONGO_URI and JWT_SECRET in server/.env');
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Four parameters mark this as Express's error handler.
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON' });
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

const port = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(port, () => {
      console.log('API running on port ' + port);
    });
  })
  .catch((err) => {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  });
