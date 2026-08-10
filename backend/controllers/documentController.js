const HealthDocument = require('../models/HealthDocument');
const crypto = require('crypto');
const path   = require('path');
const { emitDashboardEvent } = require('../services/socketEmitter');

// @desc    Get all documents
// @route   GET /api/documents
// @access  Private
const getDocuments = async (req, res) => {
  try {
    const filter = { user: req.user.id };

    // Soft delete filter (default: false)
    if (req.query.trash === 'true') {
      filter.isDeleted = true;
    } else {
      filter.isDeleted = false;
    }

    if (req.query.type && req.query.type !== 'all') filter.type = req.query.type;
    if (req.query.folder && req.query.folder !== 'all') filter.folder = req.query.folder;

    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { tags: { $regex: req.query.search, $options: 'i' } },
        { notes: { $regex: req.query.search, $options: 'i' } },
        { folder: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Sorting options
    let sortOption = '-createdAt';
    if (req.query.sortBy) {
      if (req.query.sortBy === 'name_asc') sortOption = 'title';
      else if (req.query.sortBy === 'name_desc') sortOption = '-title';
      else if (req.query.sortBy === 'size_asc') sortOption = 'fileSize';
      else if (req.query.sortBy === 'size_desc') sortOption = '-fileSize';
      else if (req.query.sortBy === 'date_asc') sortOption = 'createdAt';
      else if (req.query.sortBy === 'date_desc') sortOption = '-createdAt';
    }

    const documents = await HealthDocument.find(filter).sort(sortOption).lean();
    res.json({ success: true, count: documents.length, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload document
// @route   POST /api/documents/upload
// @access  Private
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const doc = await HealthDocument.create({
      user: req.user.id,
      title: req.body.title || req.file.originalname,
      type: req.body.type || 'other',
      folder: req.body.folder || 'General',
      fileUrl: `/uploads/documents/${req.file.filename}`,
      fileType: req.file.mimetype,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      notes: req.body.notes || '',
    });

    // 🔴 Real-time dashboard update
    emitDashboardEvent('report.uploaded', { documentId: doc._id, userId: req.user.id, type: doc.type });

    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private
const updateDocument = async (req, res) => {
  try {
    const update = {};
    if (req.body.title) update.title = req.body.title;
    if (req.body.type) update.type = req.body.type;
    if (req.body.folder) update.folder = req.body.folder;
    if (req.body.tags) {
      update.tags = Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags);
    }
    if (req.body.notes !== undefined) update.notes = req.body.notes;

    const doc = await HealthDocument.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      update,
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    // 🔴 Real-time: update dashboard counters
    emitDashboardEvent('report.updated', { documentId: doc._id, userId: req.user.id, type: doc.type });

    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete document (Soft delete or Hard delete)
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res) => {
  try {
    const doc = await HealthDocument.findOne({ _id: req.params.id, user: req.user.id });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    if (doc.isDeleted) {
      await HealthDocument.findOneAndDelete({ _id: req.params.id, user: req.user.id });
      emitDashboardEvent('report.deleted', { documentId: req.params.id, userId: req.user.id });
      res.json({ success: true, message: 'Document permanently deleted' });
    } else {
      doc.isDeleted = true;
      doc.deletedAt = new Date();
      await doc.save();
      emitDashboardEvent('report.deleted', { documentId: req.params.id, userId: req.user.id });
      res.json({ success: true, message: 'Document moved to Trash' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Restore document
// @route   POST /api/documents/:id/restore
// @access  Private
const restoreDocument = async (req, res) => {
  try {
    const doc = await HealthDocument.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isDeleted: false, deletedAt: null },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    emitDashboardEvent('report.uploaded', { documentId: doc._id, userId: req.user.id, type: doc.type });
    res.json({ success: true, data: doc, message: 'Document restored successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload document new version
// @route   POST /api/documents/:id/version
// @access  Private
const uploadVersion = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const doc = await HealthDocument.findOne({ _id: req.params.id, user: req.user.id });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    // Store current state in versions array
    doc.versions.push({
      fileUrl: doc.fileUrl,
      originalName: doc.originalName,
      fileSize: doc.fileSize,
      fileType: doc.fileType,
      uploadedAt: doc.updatedAt || doc.createdAt,
    });

    // Overwrite main details with the new version
    doc.fileUrl = `/uploads/documents/${req.file.filename}`;
    doc.originalName = req.file.originalname;
    doc.fileSize = req.file.size;
    doc.fileType = req.file.mimetype;

    await doc.save();
    res.json({ success: true, data: doc, message: 'New version uploaded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Share document (generate token)
// @route   POST /api/documents/:id/share
// @access  Private
const shareDocument = async (req, res) => {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const doc = await HealthDocument.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isShared: true, sharedToken: token, sharedAt: new Date() },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, data: doc, shareLink: `/api/documents/shared/${token}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unshare document
// @route   POST /api/documents/:id/unshare
// @access  Private
const unshareDocument = async (req, res) => {
  try {
    const doc = await HealthDocument.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isShared: false, sharedToken: null, sharedAt: null },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Access shared document (public)
// @route   GET /api/documents/shared/:token
// @access  Public
const getSharedDocument = async (req, res) => {
  try {
    const doc = await HealthDocument.findOne({ sharedToken: req.params.token, isShared: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Shared document not found or link expired' });
    res.json({ success: true, data: { title: doc.title, type: doc.type, fileUrl: doc.fileUrl, fileType: doc.fileType, sharedAt: doc.sharedAt } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDocuments,
  uploadDocument,
  updateDocument,
  deleteDocument,
  restoreDocument,
  uploadVersion,
  shareDocument,
  unshareDocument,
  getSharedDocument,
};
