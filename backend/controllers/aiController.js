const { GoogleGenAI } = require("@google/genai");
const Medication = require('../models/Medication');

// @desc    AI Health Assistant — answer health questions
// @route   POST /api/ai/ask
// @access  Private
const askAI = async (req, res) => {
  try {
    const { question, context } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'Please provide a question' });

    // Get user's medications for context
    const medications = await Medication.find({ user: req.user.id, isActive: true })
      .select('name dosage dosageUnit frequency instructions');

    const medContext = medications.map(m => `${m.name} (${m.dosage} ${m.dosageUnit}, ${m.frequency})`).join(', ');

    // Check if Gemini API key is available
    const apiKey = process.env.GEMINI_API_KEY;
    let answer = null;

    if (apiKey) {
      // Use Gemini API
      answer = await callGemini(question, medContext, context, apiKey);
    }
    
    // Fallback to intelligent rule-based response if API key is missing or API call fails/exceeds quota
    if (!answer) {
      answer = generateRuleBasedResponse(question, medications);
    }

    res.json({
      success: true,
      data: {
        answer,
        disclaimer: '⚠️ MEDICAL DISCLAIMER: This information is for educational purposes only and should not be considered as medical advice. Always consult with a qualified healthcare professional for medical guidance.',
        aiPowered: !!answer,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Explain a medication
// @route   POST /api/ai/explain-medication
// @access  Private
const explainMedication = async (req, res) => {
  try {
    const { medicationName, dosage } = req.body;
    if (!medicationName) return res.status(400).json({ success: false, message: 'Medication name required' });

    const apiKey = process.env.GEMINI_API_KEY;
    let explanation = null;

    if (apiKey) {
      const prompt = `Explain the medication "${medicationName}" ${dosage ? `(dosage: ${dosage})` : ''} in simple, patient-friendly language. Include: what it's used for, how it works, common side effects, and important precautions. Keep it concise (under 300 words).`;
      explanation = await callGemini(prompt, '', '', apiKey);
    }
    
    if (!explanation) {
      explanation = `**${medicationName}**\n\nFor detailed information about ${medicationName}, please consult your doctor or pharmacist. They can provide personalized guidance based on your health condition.\n\n**General tips:**\n• Take medications as prescribed\n• Don't skip doses\n• Report any unusual side effects to your doctor\n• Keep a list of all medications you're taking`;
    }

    res.json({
      success: true,
      data: {
        medication: medicationName,
        explanation,
        disclaimer: '⚠️ This is general information. Always consult your healthcare provider for personalized medical advice.',
        aiPowered: !!apiKey,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check medication interactions
// @route   POST /api/ai/check-interactions
// @access  Private
const checkInteractions = async (req, res) => {
  try {
    const medications = await Medication.find({ user: req.user.id, isActive: true })
      .select('name dosage dosageUnit');

    if (medications.length < 2) {
      return res.json({
        success: true,
        data: {
          interactions: [],
          message: 'You need at least 2 active medications to check for interactions.',
          aiPowered: false,
        },
      });
    }

    const medNames = medications.map(m => `${m.name} (${m.dosage} ${m.dosageUnit})`);
    const apiKey = process.env.GEMINI_API_KEY;
    let result = null;

    if (apiKey) {
      const prompt = `Check for potential drug interactions between these medications: ${medNames.join(', ')}. List any known interactions with severity (mild/moderate/severe) and brief explanation. Format each interaction as: "**Drug A + Drug B**: Severity - Description". If no known interactions, say so.`;
      const answer = await callGemini(prompt, '', '', apiKey);
      if (answer) {
        result = { analysis: answer, medications: medNames };
      }
    }
    
    if (!result) {
      result = {
        analysis: `You are currently taking ${medNames.length} medications: ${medNames.join(', ')}.\n\n**Important:** Please consult your doctor or pharmacist to check for potential drug interactions. They have access to comprehensive interaction databases and can provide personalized guidance.\n\n**Tips:**\n• Always inform your doctor about all medications you're taking\n• Include over-the-counter medications and supplements\n• Report any unusual symptoms after starting a new medication`,
        medications: medNames,
      };
    }

    res.json({
      success: true,
      data: {
        ...result,
        disclaimer: '⚠️ This analysis is for informational purposes only. Always verify with your pharmacist or healthcare provider.',
        aiPowered: !!apiKey,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Gemini API Helper ──
async function callGemini(prompt, medContext, additionalContext, apiKey) {
  try {
    const ai = new GoogleGenAI({ apiKey });

    const fullPrompt = `
You are a helpful expert health assistant for the DoseTracker application.

${medContext ? `User active medications: ${medContext}` : ""}
${additionalContext ? `Additional Context: ${additionalContext}` : ""}

User Question:
${prompt}

Instructions:
1. Provide a comprehensive, accurate, and easy-to-understand explanation directly addressing the user's specific health or medical question.
2. Structure your response clearly using bullet points, bold section titles, and clean formatting.
3. If relevant, explain how it connects to their current medications or daily health routine.
4. Conclude with a helpful medical disclaimer.
`;

    // Updated Gemini models in fallback order
    const modelsToTry = [
      "gemini-2.0-flash",
      "gemini-2.5-flash",
      "gemini-2.0-flash-lite",
      "gemini-2.5-pro",
      "gemini-1.5-flash",
    ];

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: fullPrompt,
        });

        if (response && response.text) {
          return response.text;
        }
      } catch (err) {
        // Silently log and try next model
        console.warn(`Gemini model ${modelName} error:`, err.message?.slice(0, 100));
      }
    }

    return null; // Signal failure to caller so it falls back gracefully
  } catch (error) {
    console.error("Gemini SDK Error:", error);
    return null;
  }
}

function generateRuleBasedResponse(question, medications) {
  const q = question.toLowerCase().trim();
  const medNames = medications && medications.length > 0
    ? medications.map(m => `${m.name}${m.dosage ? ` (${m.dosage} ${m.dosageUnit || ''})` : ''}`).join(', ')
    : 'None recorded';

  // 1. Blood Tests & Laboratory Diagnostics
  if (
    q.includes('blood test') || q.includes('blood work') || q.includes('lab test') ||
    q.includes('cbc') || q.includes('lipid') || q.includes('hba1c') || q.includes('thyroid') ||
    q.includes('blood sugar') || q.includes('creatinine') || q.includes('lft') || q.includes('kft') ||
    q.includes('urine test') || q.includes('diagnostic') || q.includes('report')
  ) {
    return `**Understanding Blood Tests & Laboratory Diagnostics:**

A **blood test** (or blood work) is a routine clinical procedure where a small sample of blood is drawn to analyze your overall health, detect infections, check organ function (like liver and kidneys), and monitor treatment progress.

**Common Types of Blood Tests & What They Measure:**
• **Complete Blood Count (CBC):** Evaluates red blood cells, white blood cells, and platelets. Used to check for anemia, active infections, and immune system health.
• **Comprehensive Metabolic Panel (CMP / BMP):** Measures blood glucose, calcium, electrolytes (sodium, potassium), and kidney/liver biomarkers (Creatinine, BUN, ALT/AST).
• **Lipid Profile:** Measures total cholesterol, HDL ("good" cholesterol), LDL ("bad" cholesterol), and triglycerides for cardiovascular risk assessment.
• **HbA1c & Fasting Glucose:** Measures average blood sugar levels over the past 2–3 months to screen or monitor diabetes.
• **Thyroid Panel (TSH, Free T4):** Evaluates thyroid gland function and metabolism.

**Relation to Your Active Medications:**
• **Your active medications:** ${medNames}.
• Doctors regularly order blood tests (like liver and kidney panels) to ensure your body processes medications like **${medNames}** safely without adverse strain.

**Patient Guidelines & Preparation:**
• **Fasting Requirements:** Tests like Lipid Profiles or Fasting Blood Sugar require **8 to 12 hours of fasting** (water only).
• Always inform your lab technician and doctor about all medications and supplements you take.`;
  }

  // 2. Pain Relievers / Dolo / Paracetamol / Fever
  if (
    q.includes('dolo') || q.includes('paracetamol') || q.includes('acetaminophen') ||
    q.includes('fever') || q.includes('pain') || q.includes('headache') || q.includes('tylenol') ||
    q.includes('body pain') || q.includes('analgesic')
  ) {
    return `**Medication Insight: Dolo (Paracetamol / Acetaminophen):**

• **Primary Uses:** Used to effectively lower fever (antipyretic) and relieve mild-to-moderate pain, including headaches, body pain, toothaches, and post-vaccination discomfort.
• **Standard Dosage Guidelines:** Typically 500mg to 650mg every 4 to 6 hours as needed.
• **CRITICAL Safety Rule:** Do not exceed **4,000 mg (4 grams)** within 24 hours to prevent severe liver damage.
• **Precautions:**
  - Avoid combining Dolo with other cold/flu medications containing paracetamol.
  - Avoid alcohol intake while taking Dolo.
  - Take after food if stomach sensitivity occurs.
• **When to Contact a Doctor:** Consult your physician if high fever lasts over 3 days or pain persists beyond 5 days.`;
  }

  // 3. Blood Pressure & Cardiovascular
  if (q.includes('bp') || q.includes('blood pressure') || q.includes('hypertension') || q.includes('heart rate')) {
    return `**Managing Blood Pressure & Cardiovascular Health:**

• **Normal Target Reading:** A healthy resting blood pressure is generally below **120/80 mmHg**.
• **Essential Lifestyle Measures:**
  - **Sodium Control:** Keep daily salt intake under 2,300 mg.
  - **DASH Diet:** Focus on leafy greens, berries, whole grains, and lean proteins.
  - **Regular Activity:** Aim for at least 30 minutes of moderate exercise 5 days a week.
• **Medication Tracking:**
  - If you take blood pressure medications alongside **${medNames}**, take your doses at the exact same time every day.
  - Never stop BP medications suddenly without physician approval.`;
  }

  // 4. Diabetes & Blood Sugar
  if (q.includes('diabetes') || q.includes('sugar') || q.includes('insulin') || q.includes('glucose')) {
    return `**Diabetes & Blood Glucose Management:**

• **Blood Glucose Target Ranges:**
  - **Fasting Glucose:** 80 – 130 mg/dL
  - **Post-Meal (2 hrs after food):** Below 180 mg/dL
  - **Target HbA1c:** Generally below 7.0% (customized by your doctor).
• **Key Daily Practices:**
  - Pair carbohydrates with healthy protein and fiber to avoid sudden glucose spikes.
  - Maintain consistent meal times and track any doses of diabetes medications or insulin.
  - Log your daily adherence in DoseTracker to stay consistent.`;
  }

  // 5. Sleep, Drowsiness & Insomnia
  if (
    q.includes('sleep') || q.includes('insomnia') || q.includes('drowsy') ||
    q.includes('tired') || q.includes('fatigue') || q.includes('night') || q.includes('rest')
  ) {
    return `**Medications & Sleep Quality:**

• **Impact of Medications:** Various prescriptions (including decongestants, steroids, certain antihypertensives, and antidepressants) can disrupt sleep cycles or cause daytime drowsiness.
• **Your active medications:** ${medNames}.
• **Actionable Advice:**
  - Check with your pharmacist whether any of your medications are best taken in the morning to avoid nighttime insomnia.
  - Maintain consistent sleep hygiene: keep a dark, cool bedroom and stop screen usage 1 hour before sleep.
  - Always consult your doctor before modifying medication schedules.`;
  }

  // 6. Drug Interactions & Safety
  if (q.includes('interaction') || q.includes('mix') || q.includes('together') || q.includes('combine') || q.includes('safe to take')) {
    return `**Medication Interaction Assessment:**

You are currently taking: **${medNames}**.

• **Safety Guidelines:**
  - Always double-check before introducing new over-the-counter medicines, NSAID pain relievers (like ibuprofen), or herbal supplements.
  - Avoid taking multiple products with overlapping active ingredients.
  - You can use the **Check Interactions** feature in this AI Health Assistant to run an automated drug interaction check on your profile.`;
  }

  // 7. Missed Doses & Schedule Management
  if (q.includes('miss') || q.includes('forgot') || q.includes('skip') || q.includes('late dose')) {
    return `**Protocol for Missed Medication Doses:**

• **If Remembered Early:** Take the missed dose as soon as you realize.
• **If Near Next Dose:** If your next scheduled dose is coming up soon, skip the missed dose and stay on your normal timetable.
• **WARNING:** **Never take a double dose** to make up for a missed one.
• **Reminders:** Enable browser notifications and smart voice reminders in DoseTracker so you never miss a dose!`;
  }

  // 8. Food & Dietary Interactions
  if (q.includes('food') || q.includes('eat') || q.includes('diet') || q.includes('grapefruit') || q.includes('stomach')) {
    return `**Dietary & Medication Guidelines:**

• **With Meals:** Take NSAIDs, iron supplements, and heavy medications after food to minimize stomach upset.
• **Empty Stomach:** Certain antibiotics and thyroid medications require an empty stomach (1 hour before or 2 hours after meals).
• **Grapefruit Precaution:** Avoid grapefruit or its juice when taking statins, certain BP drugs, or immunosuppressants.
• **Hydration:** Always take oral capsules/tablets with a full glass of water.`;
  }

  // 9. Comprehensive Health Query Resolver (Fallback for general health questions like "what is X")
  const formattedSubject = q.charAt(0).toUpperCase() + q.slice(1);
  return `**Health & Clinical Overview: "${formattedSubject}"**

• **General Health Insight:**
  - Questions regarding **"${formattedSubject}"** play an important role in understanding your overall wellness and medical care.
  - Maintaining clear communication with your doctor and monitoring diagnostic indicators ensures long-term health.

• **Your Active Profile Context:**
  - **Currently logged medications:** ${medNames}.
  - Proper adherence to your logged medications ensures stable therapeutic levels in your body.

• **Recommended Next Steps:**
  1. **Consistent Logging:** Keep tracking your daily doses and health logs in your DoseTracker portal.
  2. **Regular Check-ups:** Share routine lab reports and symptom logs with your primary physician.
  3. **Professional Guidance:** Consult your pharmacist or healthcare provider for specific diagnostic interpretations or treatment adjustments.`;
}

module.exports = { askAI, explainMedication, checkInteractions };

