const HealthEvent = require('../models/HealthEvent');

// @desc    Get all health events
// @route   GET /api/health-events
// @access  Private
const getHealthEvents = async (req, res) => {
  try {
    const filter = { user: req.user.id };
    if (req.query.type && req.query.type !== 'all') filter.type = req.query.type;
    if (req.query.from || req.query.to) {
      filter.eventDate = {};
      if (req.query.from) filter.eventDate.$gte = new Date(req.query.from);
      if (req.query.to) filter.eventDate.$lte = new Date(req.query.to);
    }
    const events = await HealthEvent.find(filter)
      .populate('linkedAppointment', 'title appointmentDate')
      .populate('linkedMedication', 'name icon color')
      .sort('-eventDate');
    res.json({ success: true, count: events.length, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create health event
// @route   POST /api/health-events
// @access  Private
const createHealthEvent = async (req, res) => {
  try {
    req.body.user = req.user.id;
    const event = await HealthEvent.create(req.body);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update health event
// @route   PUT /api/health-events/:id
// @access  Private
const updateHealthEvent = async (req, res) => {
  try {
    const event = await HealthEvent.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete health event
// @route   DELETE /api/health-events/:id
// @access  Private
const deleteHealthEvent = async (req, res) => {
  try {
    const event = await HealthEvent.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getHealthEvents, createHealthEvent, updateHealthEvent, deleteHealthEvent };
