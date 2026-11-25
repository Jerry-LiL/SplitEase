const mongoose = require('mongoose');

// Each member gets an _id. Expenses store that id, not the person's name.
const memberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
});

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [memberSchema],
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Group', groupSchema);
