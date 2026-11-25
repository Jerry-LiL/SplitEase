const Expense = require('../models/Expense');
const { findOwnedGroup } = require('./groupController');
const { roundMoney, splitEqually, calculateBalances, buildSettlements } = require('../utils/balances');

function memberById(group, id) {
  if (id === undefined || id === null) return null;
  const idStr = String(id);
  for (const member of group.members) {
    if (member._id.toString() === idStr) return member;
  }
  return null;
}

function namesById(group) {
  const names = {};
  for (const member of group.members) {
    names[member._id.toString()] = member.name;
  }
  return names;
}

function presentExpense(expense, names) {
  const payerId = expense.paidBy.toString();
  const splits = [];
  for (const split of expense.splits) {
    const memberId = split.member.toString();
    splits.push({
      member: { _id: memberId, name: names[memberId] || 'Unknown' },
      amount: split.amount,
    });
  }

  return {
    _id: expense._id,
    description: expense.description,
    amount: expense.amount,
    splitType: expense.splitType,
    paidBy: { _id: payerId, name: names[payerId] || 'Unknown' },
    splits,
    createdAt: expense.createdAt,
  };
}

function readAmount(value) {
  const raw = Number(value);
  if (!Number.isFinite(raw) || raw <= 0) return null;
  const amount = roundMoney(raw);
  if (amount <= 0 || amount > 10000000) return null;
  return amount;
}

async function addExpense(req, res) {
  try {
    const group = await findOwnedGroup(req.params.id, req.user._id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (group.members.length === 0) {
      return res.status(400).json({ message: 'Add a member before recording an expense' });
    }

    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    if (!description) {
      return res.status(400).json({ message: 'Description is required' });
    }
    if (description.length > 80) {
      return res.status(400).json({ message: 'Description is too long' });
    }

    const amount = readAmount(req.body.amount);
    if (amount === null) {
      return res.status(400).json({ message: 'Enter an amount greater than 0' });
    }

    const payer = memberById(group, req.body.paidBy);
    if (!payer) {
      return res.status(400).json({ message: 'Choose a member who paid' });
    }

    const splitType = req.body.splitType;
    if (splitType !== 'equal' && splitType !== 'custom') {
      return res.status(400).json({ message: 'Split type must be equal or custom' });
    }

    let splits;
    if (splitType === 'equal') {
      if (!Array.isArray(req.body.memberIds) || req.body.memberIds.length === 0) {
        return res.status(400).json({ message: 'Pick at least one person to split with' });
      }

      const seen = {};
      const memberIds = [];
      for (const memberId of req.body.memberIds) {
        const member = memberById(group, memberId);
        if (!member) {
          return res.status(400).json({ message: 'Every person in the split must be in the group' });
        }
        const key = member._id.toString();
        if (seen[key]) {
          return res.status(400).json({ message: 'Duplicate member in the split' });
        }
        seen[key] = true;
        memberIds.push(member._id);
      }
      splits = splitEqually(amount, memberIds);
    } else {
      if (!Array.isArray(req.body.splits) || req.body.splits.length === 0) {
        return res.status(400).json({ message: 'Add a share for at least one member' });
      }

      splits = [];
      const seen = {};
      let sumPaise = 0;
      for (const split of req.body.splits) {
        const member = memberById(group, split && split.member);
        if (!member) {
          return res.status(400).json({ message: 'Every person in the split must be in the group' });
        }
        const key = member._id.toString();
        if (seen[key]) {
          return res.status(400).json({ message: 'Duplicate member in the split' });
        }
        seen[key] = true;

        const rawShare = Number(split.amount);
        if (!Number.isFinite(rawShare) || rawShare < 0) {
          return res.status(400).json({ message: 'Split amounts cannot be negative' });
        }
        const share = roundMoney(rawShare);
        splits.push({ member: member._id, amount: share });
        sumPaise += Math.round(share * 100);
      }

      if (sumPaise !== Math.round(amount * 100)) {
        return res.status(400).json({ message: 'Split amounts must add up to the total' });
      }
    }

    const expense = await Expense.create({
      group: group._id,
      description,
      amount,
      paidBy: payer._id,
      splitType,
      splits,
    });

    res.status(201).json(presentExpense(expense, namesById(group)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function listExpenses(req, res) {
  try {
    const group = await findOwnedGroup(req.params.id, req.user._id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const expenses = await Expense.find({ group: group._id }).sort({ createdAt: -1 });
    const names = namesById(group);
    const rows = [];
    for (const expense of expenses) {
      rows.push(presentExpense(expense, names));
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getSettlements(req, res) {
  try {
    const group = await findOwnedGroup(req.params.id, req.user._id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const expenses = await Expense.find({ group: group._id });
    const balances = calculateBalances(group.members, expenses);
    const settlements = buildSettlements(balances);
    res.json({ balances, settlements });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { addExpense, listExpenses, getSettlements };
