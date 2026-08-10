const path = require('path');
const fs   = require('fs');
const Prescription = require('../models/Prescription');
const Medication   = require('../models/Medication');
const Reminder     = require('../models/Reminder');
const { emitDashboardEvent } = require('../services/socketEmitter');

// @desc    Get all prescriptions
// @route   GET /api/prescriptions
// @access  Private
const getPrescriptions = async (req, res) => {
  try {
    const filter = { user: req.user.id };
    if (req.query.status) filter.status = req.query.status;
    const prescriptions = await Prescription.find(filter)
      .populate('doctor', 'name specialization')
      .sort('-createdAt');
    res.json({ success: true, count: prescriptions.length, data: prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single prescription
// @route   GET /api/prescriptions/:id
// @access  Private
const getPrescription = async (req, res) => {
  try {
    const rx = await Prescription.findOne({ _id: req.params.id, user: req.user.id })
      .populate('doctor', 'name specialization hospital');
    if (!rx) return res.status(404).json({ success: false, message: 'Prescription not found' });
    res.json({ success: true, data: rx });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload prescription
// @route   POST /api/prescriptions/upload
// @access  Private
const uploadPrescription = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const isImage = req.file.mimetype.startsWith('image/');
    const rx = await Prescription.create({
      user: req.user.id,
      doctor: req.body.doctor || null,
      doctorName: req.body.doctorName || '',
      hospitalName: req.body.hospitalName || '',
      fileUrl: `/uploads/prescriptions/${req.file.filename}`,
      fileType: isImage ? 'image' : 'pdf',
      originalName: req.file.originalname,
      fileSize: req.file.size,
      notes: req.body.notes || '',
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      status: 'pending',
    });

    // 🔴 Real-time dashboard update
    emitDashboardEvent('prescription.created', {
      prescriptionId: rx._id,
      userId:         req.user.id,
    });

    res.status(201).json({ success: true, data: rx });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Manually save extracted data
// @route   PUT /api/prescriptions/:id/extract
// @access  Private
const saveExtractedData = async (req, res) => {
  try {
    const { medicines, rawText, notes, confidence } = req.body;
    const rx = await Prescription.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        extractedData: { medicines: medicines || [], rawText: rawText || '', notes: notes || '', confidence: confidence || 0 },
        status: 'processed',
      },
      { new: true }
    );
    if (!rx) return res.status(404).json({ success: false, message: 'Prescription not found' });
    res.json({ success: true, data: rx });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create medications from extracted prescription
// @route   POST /api/prescriptions/:id/create-medications
// @access  Private
const createMedicationsFromRx = async (req, res) => {
  try {
    const rx = await Prescription.findOne({ _id: req.params.id, user: req.user.id });
    if (!rx) return res.status(404).json({ success: false, message: 'Prescription not found' });

    const medicines = req.body.medicines || rx.extractedData?.medicines || [];
    if (medicines.length === 0) {
      return res.status(400).json({ success: false, message: 'No medicines to create' });
    }

    const freqMap = {
      'once daily': 'once_daily',
      'twice daily': 'twice_daily',
      'three times daily': 'three_times_daily',
      'thrice daily': 'three_times_daily',
      'four times daily': 'four_times_daily',
      'as needed': 'as_needed',
      'weekly': 'weekly',
    };

    const timesMap = {
      once_daily: ['08:00'],
      twice_daily: ['08:00', '20:00'],
      three_times_daily: ['08:00', '14:00', '20:00'],
      four_times_daily: ['08:00', '12:00', '16:00', '20:00'],
      as_needed: [],
      weekly: ['08:00'],
    };

    const created = [];
    for (const med of medicines) {
      const freqLower = (med.frequency || '').toLowerCase();
      const frequency = freqMap[freqLower] || 'once_daily';

      // Generate times based on morning, afternoon, night
      let times = [];
      if (med.morning) times.push('08:00');
      if (med.afternoon) times.push('14:00');
      if (med.night) times.push('20:00');

      // Fallback if no specific times checked
      if (times.length === 0) {
        times = timesMap[frequency] || ['08:00'];
      }

      let instructionsStr = med.instructions || '';
      if (med.foodInstructions && med.foodInstructions !== 'no_preference') {
        const foodStr = med.foodInstructions.replace('_', ' ');
        instructionsStr = instructionsStr 
          ? `${instructionsStr} (${foodStr})` 
          : `Take ${foodStr}`;
      }

      const medication = await Medication.create({
        user: req.user.id,
        name: med.name,
        dosage: med.dosage || '1',
        dosageUnit: 'tablet',
        frequency,
        times,
        instructions: instructionsStr,
        category: 'prescription',
        prescribedBy: rx.doctorName || '',
        isActive: true,
        startDate: new Date(),
        // New fields
        morning: !!med.morning,
        afternoon: !!med.afternoon,
        night: !!med.night,
        foodInstructions: med.foodInstructions || 'no_preference',
        linkedPrescription: rx._id,
      });

      // Create reminders for each time
      for (const time of medication.times) {
        await Reminder.create({
          user: req.user.id,
          medication: medication._id,
          time,
          label: `Take ${medication.name}`,
          isActive: true,
        });
      }

      created.push(medication);
    }

    if (created.length > 0) {
      emitDashboardEvent('medication.created', {
        userId: req.user.id,
        count: created.length,
      });
    }

    res.status(201).json({
      success: true,
      message: `Created ${created.length} medication(s) with reminders`,
      data: created,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete prescription
// @route   DELETE /api/prescriptions/:id
// @access  Private
const deletePrescription = async (req, res) => {
  try {
    const rx = await Prescription.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!rx) return res.status(404).json({ success: false, message: 'Prescription not found' });

    // 🔴 Real-time
    emitDashboardEvent('prescription.deleted', { prescriptionId: req.params.id, userId: req.user.id });

    res.json({ success: true, message: 'Prescription removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Extract data from prescription using Gemini AI
// @route   POST /api/prescriptions/:id/extract-ai
// @access  Private
const extractPrescriptionWithAI = async (req, res) => {
  try {
    const rx = await Prescription.findOne({ _id: req.params.id, user: req.user.id });
    if (!rx) return res.status(404).json({ success: false, message: 'Prescription not found' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not configured in server/.env. Running simulated prescription scanner.');
      
      const mockMedicines = [
        {
          name: "Paracetamol",
          dosage: "650mg",
          frequency: "three_times_daily",
          morning: true,
          afternoon: true,
          night: true,
          duration: "5 days",
          instructions: "Take after meals",
          foodInstructions: "after_food"
        },
        {
          name: "Amoxicillin",
          dosage: "500mg",
          frequency: "twice_daily",
          morning: true,
          afternoon: false,
          night: true,
          duration: "7 days",
          instructions: "Take with water",
          foodInstructions: "with_food"
        }
      ];

      rx.extractedData = {
        medicines: mockMedicines,
        rawText: "Mock extraction: GEMINI_API_KEY not configured. Paracetamol 650mg TDS, Amoxicillin 500mg BD.",
        confidence: 100
      };
      rx.status = 'processed';
      await rx.save();

      return res.json({
        success: true,
        data: rx,
        message: "Simulated AI scan complete (no GEMINI_API_KEY in server/.env)"
      });
    }

    const filePath = path.join(__dirname, '..', rx.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Uploaded file not found on server' });
    }

    // Convert file to base64
    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString('base64');

    // Detect MIME type based on fileUrl extension
    const ext = path.extname(rx.fileUrl).toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === '.pdf') mimeType = 'application/pdf';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';

    const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];
    let response = null;
    let errText = '';

    for (const modelName of modelsToTry) {
      const resAttempt = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "You are an expert medical assistant. Scan this prescription and extract all medicine details. Return a JSON object with a single key 'medicines' which is an array of objects. Each object MUST contain these keys: 'name' (medicine name), 'dosage' (e.g. 500mg, 1 tablet), 'frequency' (one of: 'once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'as_needed', 'weekly', 'custom'), 'morning' (boolean indicating if taken in morning), 'afternoon' (boolean indicating if taken in afternoon), 'night' (boolean indicating if taken in night), 'duration' (e.g. 5 days, 1 week), 'instructions' (e.g. at bedtime), 'foodInstructions' (one of: 'before_food', 'after_food', 'with_food', 'no_preference'). If any detail is not specified, return an empty string for text fields or false for booleans."
                  },
                  {
                    inlineData: {
                      mimeType,
                      data: base64Data
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1
            }
          })
        }
      );

      if (resAttempt.ok) {
        response = resAttempt;
        break;
      } else {
        errText = await resAttempt.text();
        console.warn(`Prescription scan model ${modelName} failed:`, errText);
      }
    }

    if (!response) {
      return res.status(500).json({ success: false, message: `Gemini API Error: ${errText}` });
    }

    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      return res.status(500).json({ success: false, message: 'AI failed to parse document' });
    }

    const parsed = JSON.parse(textResult);

    // Save extractedData to database and update status
    rx.extractedData = {
      medicines: parsed.medicines || [],
      rawText: textResult,
      confidence: 95,
    };
    rx.status = 'processed';
    await rx.save();

    res.json({ success: true, data: rx });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPrescriptions, getPrescription, uploadPrescription, saveExtractedData, createMedicationsFromRx, deletePrescription, extractPrescriptionWithAI };
