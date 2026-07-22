import React, { useState } from 'react';
import AIChatWindow from '../components/ai/AIChatWindow';
import AISettingsModal from '../components/ai/AISettingsModal';
import AIPrescriptionScannerModal from '../components/ai/AIPrescriptionScannerModal';
import AIDashboardAnalytics from '../components/ai/AIDashboardAnalytics';
import GlobalAISearchModal from '../components/ai/GlobalAISearchModal';
import {
  Sparkles, Sliders, ScanLine, Search, Bot, Activity, ChevronDown, ChevronUp
} from 'lucide-react';

const FEATURE_SHORTCUTS = [
  { icon: '🩸', label: 'Blood Report Analysis', prompt: 'Explain my complete blood count (CBC) and blood sugar report results in simple terms.' },
  { icon: '🧠', label: 'MRI / CT Summary',       prompt: 'Summarize my MRI and CT Scan findings and explain key medical terms.' },
  { icon: '🩻', label: 'X-Ray & ECG Summary',    prompt: 'Explain what an ECG reading and chest X-Ray summary means for my heart health.' },
  { icon: '🥗', label: 'Diet & Exercise Tips',    prompt: 'Give me personalized diet and exercise suggestions that are safe with my active medications.' },
  { icon: '💧', label: 'Water & Sleep Tracker',   prompt: 'Provide hydration and sleep improvement advice tailored to my daily medicine schedule.' },
  { icon: '⚠️', label: 'Drug Interaction Check', prompt: 'Check for drug interactions between my active medications and dietary supplements.' },
];

export default function EnterpriseAIHub() {
  const [showSettings, setShowSettings] = useState(false);
  const [showRxScanner, setShowRxScanner] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activePrompt, setActivePrompt] = useState('');

  const handleShortcutClick = (promptText) => {
    setActivePrompt(promptText);
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 90px)' }}>
      {/* Header Bar */}
      <div className="page-header" style={{ marginBottom: 12 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            🤖 AI Health Assistant
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            Instant intelligent guidance for medications, lab reports, imaging &amp; health queries
          </p>
        </div>

        {/* Action Toolbar */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="btn-secondary"
            style={{ padding: '8px 12px', fontSize: 12, gap: 6, borderColor: showAnalytics ? 'var(--accent-purple)' : 'var(--border-color)' }}
          >
            <Activity size={14} color="var(--accent-purple)" />
            <span>AI Analytics</span>
            {showAnalytics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <button onClick={() => setShowSearch(true)} className="btn-secondary" style={{ padding: '8px 12px', fontSize: 12, gap: 6 }}>
            <Search size={14} /> Global Search
          </button>

          <button onClick={() => setShowRxScanner(true)} className="btn-secondary" style={{ padding: '8px 12px', fontSize: 12, gap: 6, borderColor: 'rgba(6,182,212,0.4)' }}>
            <ScanLine size={14} color="#06b6d4" />
            <span style={{ color: '#06b6d4' }}>Rx Scanner</span>
          </button>

          <button onClick={() => setShowSettings(true)} className="btn-secondary" style={{ padding: '8px 12px', fontSize: 12, gap: 6 }}>
            <Sliders size={14} color="var(--accent-purple)" /> AI Settings
          </button>
        </div>
      </div>

      {/* Collapsible Analytics Section */}
      {showAnalytics && <AIDashboardAnalytics />}

      {/* Quick Topic Shortcut Chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 10, flexShrink: 0 }}>
        {FEATURE_SHORTCUTS.map((f, i) => (
          <button
            key={i}
            onClick={() => handleShortcutClick(f.prompt)}
            className="btn-secondary"
            style={{
              padding: '7px 14px', fontSize: 12, borderRadius: 20, whiteSpace: 'nowrap',
              flexShrink: 0, gap: 6, cursor: 'pointer', transition: 'all 0.2s',
              background: activePrompt === f.prompt ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
              borderColor: activePrompt === f.prompt ? 'var(--accent-purple)' : 'var(--border-color)',
            }}
          >
            <span>{f.icon}</span> <span>{f.label}</span>
          </button>
        ))}
      </div>

      {/* Centralized Chat Window Workspace */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <AIChatWindow category="patient_health" defaultProvider="gemini" externalPrompt={activePrompt} />
      </div>

      {/* Modals */}
      <AISettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <AIPrescriptionScannerModal isOpen={showRxScanner} onClose={() => setShowRxScanner(false)} />
      <GlobalAISearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </div>
  );
}

