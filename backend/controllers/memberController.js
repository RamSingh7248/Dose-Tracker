const Member = require('../models/Member');

const getMembers = async (req, res) => {
  try {
    const members = await Member.find({ user: req.user.id, isActive: true }).sort('name').lean();
    res.json({ success: true, count: members.length, data: members });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const createMember = async (req, res) => {
  try {
    req.body.user = req.user.id;
    if (!req.body.dateOfBirth) req.body.dateOfBirth = null;

    if (req.body.name) {
      const existing = await Member.findOne({ user: req.user.id, name: req.body.name.trim(), isActive: true }).lean();
      if (existing) {
        return res.status(200).json({ success: true, data: existing, message: 'Existing family member retrieved' });
      }
    }
    const member = await Member.create(req.body);
    res.status(201).json({ success: true, data: member });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const updateMember = async (req, res) => {
  try {
    const member = await Member.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true, runValidators: true });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, data: member });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const deleteMember = async (req, res) => {
  try {
    const member = await Member.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, message: 'Member removed' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

module.exports = { getMembers, createMember, updateMember, deleteMember };
