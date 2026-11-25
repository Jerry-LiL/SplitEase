const mongoose = require('mongoose');

// A split is just "this member owes this much of the bill".
const splitSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    paidBy: { type: mongoose.Schema.Types.ObjectId, required: true },
    splitType: { type: String, enum: ['equal', 'custom'], required: true },
    splits: [splitSchema],
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Expense', expenseSchema);
