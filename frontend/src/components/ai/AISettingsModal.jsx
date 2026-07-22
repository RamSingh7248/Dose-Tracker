import React, { useState, useEffect } from 'react';
import { aiHubApi } from '../../services/api';
import toast from 'react-hot-toast';
import { X, Sliders, Cpu, Sparkles, Volume2, ShieldCheck, Download, Trash2, Check } from 'lucide-react';

const PROVIDERS = [
  { id: 'gemini',   name: 'Google Gemini 2.0',  badge: 'Recommended', color: '#4285F4', desc: 'Fast, multimodal, high precision healthcare reasoning' },
  { id: 'gpt',      name: 'OpenAI GPT-4o',      badge: 'Enterprise',  color: '#10a37f', desc: 'Advanced clinical decision support & broad context' },
  { id: 'claude',   name: 'Anthropic Claude 3.5', badge: 'Clinical',  color: '#d97706', desc: 'Nuanced diagnostic writing & safety guardrails' },
  { id: 'deepseek', name: 'DeepSeek V3 / R1',   badge: 'Open Weight', color: '#8b5cf6', desc: 'High efficiency open-weight reasoning model' },
];

export default function AISettingsModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    defaultProvider: 'gemini',
    temperature: 0.7,
    responseLength: 'balanced',
    language: 'en',
    streamingEnabled: true,
    voiceEnabled: true,
  });

  useEffect(() => {
    if (isOpen) fetchSettings();
  }, [isOpen]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await aiHubApi.getSettings();
      if (res.data?.data) {
        setSettings(res.data.data);
      }
    } catch {
      toast.error('Failed to load AI Settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await aiHubApi.updateSettings(settings);
      toast.success('AI Settings updated successfully! ⚙️');
      onClose();
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExportChats = async () => {
    try {
      const res = await aiHubApi.getHistory();
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DoseTracker_AI_Conversations_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      toast.success('Chat history exported as JSON 📥');
    } catch {
      toast.error('Failed to export chat history');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div className="animate-fade-in-up" style={{
        background: 'var(--card-bg, #1a1c23)', border: '1px solid var(--border-color)',
        borderRadius: 16, width: '100%', maxWidth: 520, padding: 24, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sliders size={20} color="var(--accent-purple)" />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Enterprise AI Settings
              </h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Configure AI Engine Providers &amp; Preferences</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading AI Settings...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* AI Provider Selection */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Default AI Provider
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PROVIDERS.map(p => {
                  const isSelected = settings.defaultProvider === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSettings(prev => ({ ...prev, defaultProvider: p.id }))}
                      style={{
                        padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                        border: `1.5px solid ${isSelected ? p.color : 'var(--border-color)'}`,
                        background: isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Cpu size={16} color={p.color} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</span>
                          <span className="badge" style={{ background: `${p.color}20`, color: p.color, fontSize: 10 }}>{p.badge}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{p.desc}</div>
                      </div>
                      {isSelected && <Check size={18} color={p.color} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Temperature Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                <span>Creativity &amp; Precision (Temperature)</span>
                <span style={{ color: 'var(--accent-purple)' }}>{settings.temperature}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={settings.temperature}
                onChange={e => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                <span>0.0 (Strict / Clinical)</span>
                <span>0.7 (Balanced)</span>
                <span>1.0 (Creative)</span>
              </div>
            </div>

            {/* Response Length */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Response Detail Level
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {['concise', 'balanced', 'detailed'].map(len => (
                  <button
                    key={len}
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, responseLength: len }))}
                    style={{
                      padding: '8px', borderRadius: 8, textTransform: 'capitalize', fontSize: 12, fontWeight: 600,
                      border: `1px solid ${settings.responseLength === len ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                      background: settings.responseLength === len ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.02)',
                      color: settings.responseLength === len ? 'var(--text-primary)' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                  <Sparkles size={16} color="var(--accent-purple)" /> Real-Time Response Streaming
                </span>
                <input
                  type="checkbox"
                  checked={settings.streamingEnabled}
                  onChange={e => setSettings(prev => ({ ...prev, streamingEnabled: e.target.checked }))}
                  style={{ accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                  <Volume2 size={16} color="#06b6d4" /> Voice Input &amp; Audio Output
                </span>
                <input
                  type="checkbox"
                  checked={settings.voiceEnabled}
                  onChange={e => setSettings(prev => ({ ...prev, voiceEnabled: e.target.checked }))}
                  style={{ accentColor: '#06b6d4', cursor: 'pointer' }}
                />
              </label>
            </div>

            {/* Export History */}
            <div style={{ paddingTop: 14, borderTop: '1px solid var(--border-color)', display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={handleExportChats}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px', fontSize: 12, justifyContent: 'center', gap: 6 }}
              >
                <Download size={14} /> Export AI History (JSON)
              </button>
            </div>

            {/* Save Button */}
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: 14, fontWeight: 700, justifyContent: 'center' }}
            >
              {saving ? 'Saving Preferences...' : 'Save AI Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
