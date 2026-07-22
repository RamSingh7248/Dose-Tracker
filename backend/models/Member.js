const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Member name is required'],
      trim: true,
    },
    relationship: {
      type: String,
      enum: ['self', 'spouse', 'father', 'mother', 'parent', 'child', 'children', 'grandparent', 'grandparents', 'sibling', 'other'],
      default: 'other',
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: 'prefer_not_to_say',
    },
    avatar: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '#8b5cf6',
    },
    allergies: [{ type: String }],
    conditions: [{ type: String }],
    notes: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Member', MemberSchema);
