import React, { useState } from 'react';
import AIChatWindow from '../../components/ai/AIChatWindow';
import AISettingsModal from '../../components/ai/AISettingsModal';
import GlobalAISearchModal from '../../components/ai/GlobalAISearchModal';
import {
  Stethoscope, Sliders, Search, FileText, UserCheck, ShieldAlert,
  Sparkles, CheckSquare, Activity, LineChart
} from 'lucide-react';

const DOCTOR_SHORTCUTS = [
  { icon: '📝', label: 'SOAP Notes Draft',        prompt: 'Generate a structured SOAP note for a patient presenting with hypertension and mild fatigue.' },
  { icon: '🩺', label: 'Patient Risk Analysis',   prompt: 'Analyze high-risk patients with missed medication adherence in the past 14 days.' },
  { icon: '💊', label: 'Drug Interaction Check', prompt: 'Perform a comprehensive drug interaction and allergy audit for multi-medication prescriptions.' },
  { icon: '📊', label: 'Visit Summary Draft',    prompt: 'Draft a patient-friendly visit summary including lifestyle instructions and follow-up timeline.' },
  { icon: '🏥', label: 'ICD-10 Coding Aid',       prompt: 'Provide ICD-10 and CPT coding suggestions for essential hypertension and routine follow-up.' },
];

export default function DoctorAIClinicalHub() {
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 90px)' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 14 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            🩺 Doctor Clinical AI Assistant
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            AI Clinical Decision Support System for SOAP Notes, Patient Summaries &amp; Risk Analytics
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowSearch(true)} className="btn-secondary" style={{ padding: '8px 12px', fontSize: 12, gap: 6 }}>
            <Search size={14} /> Global AI Search
          </button>
          <button onClick={() => setShowSettings(true)} className="btn-secondary" style={{ padding: '8px 12px', fontSize: 12, gap: 6 }}>
            <Sliders size={14} color="#10b981" /> AI Settings
          </button>
        </div>
      </div>

      {/* Clinical Shortcuts */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 12 }}>
        {DOCTOR_SHORTCUTS.map((s, i) => (
          <button
            key={i}
            className="btn-secondary"
            style={{ padding: '8px 12px', fontSize: 12, borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0, gap: 6, borderColor: 'rgba(16,185,129,0.3)' }}
          >
            <span>{s.icon}</span> <span style={{ color: '#10b981' }}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Central Clinical AI Chat */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <AIChatWindow category="doctor_clinical" defaultProvider="gemini" isDoctor={true} />
      </div>

      <AISettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <GlobalAISearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </div>
  );
}
