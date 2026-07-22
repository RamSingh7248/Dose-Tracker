import React, { useState, useEffect } from 'react';
import { systemSettingsApi } from '../../services/api';
import toast from 'react-hot-toast';
import {
  Settings, Shield, Save, Database, HardDrive, Bell, CheckCircle2, Lock,
  Search, Cpu, User, Stethoscope, Crown, Pill, Calendar, Mail, MessageSquare,
  PhoneCall, CreditCard, Cloud, Plug, Activity, Palette, Globe, Zap, AlertTriangle,
  Code, Info, RefreshCcw, Download, Sparkles, Server
} from 'lucide-react';

const TABS = [
  { id: 'general',        label: 'General',        icon: Settings,      color: '#f43f5e' },
  { id: 'authentication', label: 'Authentication', icon: Lock,          color: '#3b82f6' },
  { id: 'security',       label: 'Security',       icon: Shield,        color: '#10b981' },
  { id: 'ai',             label: 'AI Engine',      icon: Cpu,           color: '#8b5cf6' },
  { id: 'patient',        label: 'Patient Portal', icon: User,          color: '#ec4899' },
  { id: 'doctor',         label: 'Doctor Portal',  icon: Stethoscope,   color: '#06b6d4' },
  { id: 'admin',          label: 'Admin Control',  icon: Crown,         color: '#f59e0b' },
  { id: 'medication',     label: 'Medication',     icon: Pill,          color: '#14b8a6' },
  { id: 'appointments',   label: 'Appointments',   icon: Calendar,      color: '#6366f1' },
  { id: 'notifications',  label: 'Notifications',  icon: Bell,          color: '#84cc16' },
  { id: 'email',          label: 'Email (SMTP)',   icon: Mail,          color: '#3b82f6' },
  { id: 'sms',            label: 'SMS Gateway',    icon: PhoneCall,     color: '#f97316' },
  { id: 'whatsapp',       label: 'WhatsApp API',   icon: MessageSquare, color: '#22c55e' },
  { id: 'billing',        label: 'Billing',        icon: CreditCard,    color: '#eab308' },
  { id: 'database',       label: 'Database',       icon: Database,      color: '#64748b' },
  { id: 'backup',         label: 'Backup & Cloud', icon: HardDrive,     color: '#0284c7' },
  { id: 'api',            label: 'API & Hooks',    icon: Plug,          color: '#a855f7' },
  { id: 'systemHealth',   label: 'System Health',  icon: Activity,      color: '#ef4444' },
  { id: 'branding',       label: 'Branding',       icon: Palette,       color: '#d946ef' },
  { id: 'localization',   label: 'Localization',   icon: Globe,         color: '#3b82f6' },
  { id: 'performance',    label: 'Performance',    icon: Zap,           color: '#eab308' },
  { id: 'maintenance',    label: 'Maintenance',    icon: AlertTriangle, color: '#f97316' },
  { id: 'developer',      label: 'Developer Flags',icon: Code,          color: '#6b7280' },
  { id: 'systemInfo',     label: 'System Info',    icon: Info,          color: '#38bdf8' },
];

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await systemSettingsApi.getSettings();
      if (res.data?.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await systemSettingsApi.updateSettings(settings);
      toast.success('Enterprise System Settings updated & saved to database! ⚙️');
    } catch {
      toast.error('Failed to save system settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerBackup = async () => {
    try {
      const res = await systemSettingsApi.triggerBackup();
      toast.success(res.data.message || 'Database backup snapshot generated!');
    } catch {
      toast.error('Backup trigger failed');
    }
  };

  const handleResetSettings = async () => {
    if (window.confirm('Are you sure you want to reset ALL settings to factory defaults?')) {
      try {
        const res = await systemSettingsApi.resetSettings();
        setSettings(res.data.data);
        toast.success('Settings reset to factory defaults');
      } catch {
        toast.error('Reset failed');
      }
    }
  };

  const updateField = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [field]: value,
      },
    }));
  };

  const filteredTabs = TABS.filter(t =>
    t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        const gen = settings.general || {};
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 className="section-title">🏥 General Hospital &amp; Organization Identity</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="input-label">Hospital / Platform Name</label>
                <input className="input-field" value={gen.hospitalName || ''} onChange={e => updateField('general', 'hospitalName', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Hospital Tagline</label>
                <input className="input-field" value={gen.tagline || ''} onChange={e => updateField('general', 'tagline', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Registration Number</label>
                <input className="input-field" value={gen.registrationNumber || ''} onChange={e => updateField('general', 'registrationNumber', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Medical License Number</label>
                <input className="input-field" value={gen.licenseNumber || ''} onChange={e => updateField('general', 'licenseNumber', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Support Email</label>
                <input className="input-field" value={gen.supportEmail || ''} onChange={e => updateField('general', 'supportEmail', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Emergency Phone Hotline</label>
                <input className="input-field" value={gen.emergencyPhone || ''} onChange={e => updateField('general', 'emergencyPhone', e.target.value)} />
              </div>
            </div>
          </div>
        );

      case 'authentication':
        const auth = settings.authentication || {};
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 className="section-title">🔐 Authentication &amp; User Access Rules</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label className="toggle-label">
                <span>Enable Patient Self-Registration</span>
                <input type="checkbox" checked={auth.enablePatientRegistration ?? true} onChange={e => updateField('authentication', 'enablePatientRegistration', e.target.checked)} />
              </label>

              <label className="toggle-label">
                <span>Require Admin/Doctor Approval</span>
                <input type="checkbox" checked={auth.requireDoctorApproval ?? true} onChange={e => updateField('authentication', 'requireDoctorApproval', e.target.checked)} />
              </label>

              <label className="toggle-label">
                <span>Enable Google OAuth Login</span>
                <input type="checkbox" checked={auth.enableGoogleLogin ?? true} onChange={e => updateField('authentication', 'enableGoogleLogin', e.target.checked)} />
              </label>

              <label className="toggle-label">
                <span>Enable Microsoft Enterprise OAuth</span>
                <input type="checkbox" checked={auth.enableMicrosoftLogin ?? true} onChange={e => updateField('authentication', 'enableMicrosoftLogin', e.target.checked)} />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 10 }}>
              <div>
                <label className="input-label">Session Timeout (Minutes)</label>
                <input type="number" className="input-field" value={auth.sessionTimeoutMinutes || 120} onChange={e => updateField('authentication', 'sessionTimeoutMinutes', Number(e.target.value))} />
              </div>
              <div>
                <label className="input-label">Max Login Attempts before Lockout</label>
                <input type="number" className="input-field" value={auth.maxLoginAttempts || 5} onChange={e => updateField('authentication', 'maxLoginAttempts', Number(e.target.value))} />
              </div>
            </div>
          </div>
        );

      case 'security':
        const sec = settings.security || {};
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 className="section-title">🛡️ Security Enforcement &amp; Threat Protection</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label className="toggle-label">
                <span>Enforce Mandatory Two-Factor Auth (2FA)</span>
                <input type="checkbox" checked={sec.twoFactorRequired ?? false} onChange={e => updateField('security', 'twoFactorRequired', e.target.checked)} />
              </label>

              <label className="toggle-label">
                <span>HTTPS &amp; SSL Strict Enforcement</span>
                <input type="checkbox" checked={sec.httpsEnforced ?? true} onChange={e => updateField('security', 'httpsEnforced', e.target.checked)} />
              </label>

              <label className="toggle-label">
                <span>SQL / NoSQL Injection Firewall</span>
                <input type="checkbox" checked={sec.sqlInjectionProtection ?? true} onChange={e => updateField('security', 'sqlInjectionProtection', e.target.checked)} />
              </label>

              <label className="toggle-label">
                <span>Prompt Injection Protection (AI)</span>
                <input type="checkbox" checked={sec.promptInjectionProtection ?? true} onChange={e => updateField('security', 'promptInjectionProtection', e.target.checked)} />
              </label>
            </div>
          </div>
        );

      case 'ai':
        const ai = settings.ai || {};
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 className="section-title">🤖 Enterprise AI Engine Configuration</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="input-label">Default AI Provider</label>
                <select className="input-field" value={ai.defaultProvider || 'gemini'} onChange={e => updateField('ai', 'defaultProvider', e.target.value)}>
                  <option value="gemini">Google Gemini 2.0 (Recommended)</option>
                  <option value="gpt">OpenAI GPT-4o</option>
                  <option value="claude">Anthropic Claude 3.5</option>
                  <option value="deepseek">DeepSeek V3</option>
                </select>
              </div>

              <div>
                <label className="input-label">Daily Token Limit (Global)</label>
                <input type="number" className="input-field" value={ai.dailyTokenLimit || 500000} onChange={e => updateField('ai', 'dailyTokenLimit', Number(e.target.value))} />
              </div>
            </div>

            <label className="toggle-label">
              <span>Mask Patient Sensitive Data (PII Filter)</span>
              <input type="checkbox" checked={ai.sensitiveDataMasking ?? true} onChange={e => updateField('ai', 'sensitiveDataMasking', e.target.checked)} />
            </label>
          </div>
        );

      default:
        const currentData = settings[activeTab] || {};
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 className="section-title" style={{ textTransform: 'capitalize' }}>
              ⚙️ {activeTab} Module Configuration
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Configure active parameters, feature flags, and integration rules for {activeTab}.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {Object.keys(currentData).map(k => (
                <div key={k}>
                  <label className="input-label" style={{ textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</label>
                  {typeof currentData[k] === 'boolean' ? (
                    <input type="checkbox" checked={currentData[k]} onChange={e => updateField(activeTab, k, e.target.checked)} style={{ accentColor: '#f43f5e', width: 18, height: 18 }} />
                  ) : (
                    <input className="input-field" value={String(currentData[k])} onChange={e => updateField(activeTab, k, e.target.value)} />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header Bar */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            ⚙️ Enterprise Healthcare Administration Center
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Master system configuration, security rules, AI engine controls, multi-channel notifications &amp; hospital branding
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleResetSettings} className="btn-secondary" style={{ padding: '8px 12px', fontSize: 12, gap: 6 }}>
            <RefreshCcw size={14} /> Reset Defaults
          </button>
          <button onClick={handleTriggerBackup} className="btn-secondary" style={{ padding: '8px 12px', fontSize: 12, gap: 6, borderColor: '#0284c7' }}>
            <HardDrive size={14} color="#0284c7" /> Backup DB
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13, gap: 6, background: '#f43f5e' }}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </div>

      {/* Real-Time Search Bar */}
      <div className="glass-card" style={{ padding: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          className="input-field"
          placeholder="Search settings domains (e.g., 'General', 'AI Engine', 'SMTP Email', '2FA Security', 'Database')..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ flex: 1, border: 'none', background: 'transparent' }}
        />
      </div>

      {/* Main Settings Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
        {/* Navigation Sidebar Tabs */}
        <div className="glass-card" style={{ padding: 12, height: 'fit-content', maxHeight: '78vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filteredTabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                  background: isActive ? 'rgba(244,63,94,0.15)' : 'transparent',
                  border: `1px solid ${isActive ? '#f43f5e' : 'transparent'}`,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', fontSize: 13, fontWeight: isActive ? 700 : 500
                }}
              >
                <Icon size={16} color={isActive ? '#f43f5e' : t.color} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Workspace Card */}
        <div className="glass-card" style={{ padding: 24, minHeight: 500 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading Master Settings...</div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>
    </div>
  );
}
