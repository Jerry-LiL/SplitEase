const mongoose = require('mongoose');
const Group = require('../models/Group');

async function findOwnedGroup(groupId, userId) {
  if (!mongoose.isValidObjectId(groupId)) return null;
  return Group.findOne({ _id: groupId, owner: userId });
}

async function createGroup(req, res) {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }
    if (name.length > 60) {
      return res.status(400).json({ message: 'Group name is too long' });
    }

    const group = await Group.create({
      name,
      owner: req.user._id,
      members: [],
    });

    res.status(201).json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function listGroups(req, res) {
  try {
    const groups = await Group.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getGroup(req, res) {
  try {
    const group = await findOwnedGroup(req.params.id, req.user._id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function addMember(req, res) {
  try {
    const group = await findOwnedGroup(req.params.id, req.user._id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!name) {
      return res.status(400).json({ message: 'Member name is required' });
    }
    if (name.length > 40) {
      return res.status(400).json({ message: 'Member name is too long' });
    }
    if (group.members.length >= 20) {
      return res.status(400).json({ message: 'A group can have at most 20 members' });
    }

    const duplicate = group.members.some(
      (member) => member.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      return res.status(400).json({ message: 'That member is already in the group' });
    }

    group.members.push({ name });
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  findOwnedGroup,
  createGroup,
  listGroups,
  getGroup,
  addMember,
};
