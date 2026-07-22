const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload, setUploadDir } = require('../middleware/upload');
const {
  getPrescriptions, getPrescription, uploadPrescription,
  saveExtractedData, createMedicationsFromRx, deletePrescription, extractPrescriptionWithAI,
} = require('../controllers/prescriptionController');

router.use(protect);

router.get('/', getPrescriptions);
router.get('/:id', getPrescription);
router.post('/upload', setUploadDir('prescriptions'), upload.single('file'), uploadPrescription);
router.put('/:id/extract', saveExtractedData);
router.post('/:id/extract-ai', extractPrescriptionWithAI);
router.post('/:id/create-medications', createMedicationsFromRx);
router.delete('/:id', deletePrescription);

module.exports = router;
