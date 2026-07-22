const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload, setUploadDir } = require('../middleware/upload');
const {
  getDocuments, uploadDocument, updateDocument,
  deleteDocument, restoreDocument, uploadVersion,
  shareDocument, unshareDocument, getSharedDocument,
} = require('../controllers/documentController');

// Public route (no auth)
router.get('/shared/:token', getSharedDocument);

// Protected routes
router.use(protect);

router.get('/', getDocuments);
router.post('/upload', setUploadDir('documents'), upload.single('file'), uploadDocument);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);
router.post('/:id/restore', restoreDocument);
router.post('/:id/version', setUploadDir('documents'), upload.single('file'), uploadVersion);
router.post('/:id/share', shareDocument);
router.post('/:id/unshare', unshareDocument);

module.exports = router;
