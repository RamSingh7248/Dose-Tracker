import React, { useState, useEffect } from 'react';
import { authApi, emergencyApi, memberApi } from '../services/api';
import { useAuth, applyThemeToDocument } from '../context/AuthContext';
import {
  User, Shield, Bell, Lock, Save, Heart, CheckCircle2,
  KeyRound, Globe, Phone, Mail, Palette, Download, Stethoscope,
  Users, Eye, RefreshCw, Sliders, Type, FileJson
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);

  // Form States
  const [profileForm, setProfileForm] = useState({
    name: '', email: '', phone: '', timezone: 'UTC', specialization: '', hospital: ''
  });

  const [healthForm, setHealthForm] = useState({
    bloodGroup: '', gender: '', dateOfBirth: '', height: '', weight: '',
    allergies: '', conditions: '', emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelationship: ''
  });

  const [notifPrefs, setNotifPrefs] = useState({
    notificationsEnabled: true, soundEnabled: true, voiceEnabled: true, emailEnabled: true
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Appearance & Theme State
  const [appearanceForm, setAppearanceForm] = useState({
    themeColor: 'purple',
    fontSize: 'normal',
    language: 'en',
    density: 'comfortable',
  });

  // Doctor Details State
  const [doctorForm, setDoctorForm] = useState({
    doctorName: '',
    doctorPhone: '',
    doctorEmail: '',
    hospitalAddress: '',
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const [meRes, emergencyRes, membersRes] = await Promise.allSettled([
        authApi.getMe(),
        emergencyApi.get(),
        memberApi.getAll(),
      ]);

      if (meRes.status === 'fulfilled') {
        const u = meRes.value.data.user;
        setProfileForm({
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          timezone: u.timezone || 'UTC',
          specialization: u.specialization || '',
          hospital: u.hospital || '',
        });
        setNotifPrefs({
          notificationsEnabled: u.notificationsEnabled ?? true,
          soundEnabled: true,
          voiceEnabled: true,
          emailEnabled: true,
        });
        setAppearanceForm({
          themeColor: u.themeColor || 'purple',
          fontSize: u.fontSize || 'normal',
          language: u.language || 'en',
          density: 'comfortable',
        });
        setDoctorForm({
          doctorName: u.doctorName || '',
          doctorPhone: u.doctorPhone || '',
          doctorEmail: u.doctorEmail || '',
          hospitalAddress: u.hospitalAddress || '',
        });
      }

      if (emergencyRes.status === 'fulfilled') {
        const h = emergencyRes.value.data.data;
        setHealthForm({
          bloodGroup: h.bloodGroup || '',
          gender: h.gender || '',
          dateOfBirth: h.dateOfBirth ? h.dateOfBirth.split('T')[0] : '',
          height: h.height !== null && h.height !== undefined ? String(h.height) : '',
          weight: h.weight !== null && h.weight !== undefined ? String(h.weight) : '',
          allergies: Array.isArray(h.allergies) ? h.allergies.join(', ') : '',
          conditions: Array.isArray(h.conditions) ? h.conditions.join(', ') : '',
          emergencyContactName: h.emergencyContact?.name || '',
          emergencyContactPhone: h.emergencyContact?.phone || '',
          emergencyContactRelationship: h.emergencyContact?.relationship || '',
        });
      }

      if (membersRes.status === 'fulfilled') {
        setFamilyMembers(membersRes.value.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load profile settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authApi.updateMe({
        name: profileForm.name,
        phone: profileForm.phone,
        timezone: profileForm.timezone,
        specialization: profileForm.specialization,
        hospital: profileForm.hospital,
      });

      if (updateUser) updateUser(res.data.user);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHealthProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        bloodGroup: healthForm.bloodGroup,
        gender: healthForm.gender,
        dateOfBirth: healthForm.dateOfBirth || null,
        height: healthForm.height !== '' ? Number(healthForm.height) : null,
        weight: healthForm.weight !== '' ? Number(healthForm.weight) : null,
        allergies: healthForm.allergies.split(',').map(s => s.trim()).filter(Boolean),
        conditions: healthForm.conditions.split(',').map(s => s.trim()).filter(Boolean),
        emergencyContact: {
          name: healthForm.emergencyContactName,
          phone: healthForm.emergencyContactPhone,
          relationship: healthForm.emergencyContactRelationship,
        },
      };

      await emergencyApi.update(payload);
      toast.success('Health profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save health profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAppearance = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authApi.updateMe(appearanceForm);
      if (updateUser) updateUser(res.data.user);
      applyThemeToDocument(appearanceForm.themeColor, appearanceForm.fontSize, appearanceForm.language);
      toast.success('🎨 Appearance & UI settings applied successfully!');
    } catch {
      toast.error('Failed to save appearance settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDoctorInfo = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authApi.updateMe(doctorForm);
      if (updateUser) updateUser(res.data.user);
      toast.success('Primary Doctor info updated');
    } catch {
      toast.error('Failed to update doctor info');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await authApi.exportData();
      const bundle = res.data.data;

      // Download JSON file
      const jsonStr = JSON.stringify(bundle, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DoseTracker_Health_Export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('🎉 Health record data exported successfully!');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (passwordForm.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setChangingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading settings...</p>
      </div>
    );
  }

  const tabList = [
    { id: 'profile',       label: 'Personal Profile',    icon: User },
    { id: 'health',        label: 'Health Profile ID',   icon: Heart },
    { id: 'notifications', label: 'Alert Preferences',   icon: Bell },
    { id: 'appearance',    label: 'Theme & UI',          icon: Palette },
    { id: 'doctor',        label: 'Primary Doctor',      icon: Stethoscope },
    { id: 'export',        label: 'Data Export',         icon: Download },
    { id: 'family',        label: 'Family Access',       icon: Users },
    { id: 'security',      label: 'Security',            icon: Lock },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">⚙️ Profile & Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Manage account credentials, health ID, primary doctor details, UI themes, and data exports
          </p>
        </div>
      </div>

      {/* Tab Selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabList.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={isActive ? 'btn-primary' : 'btn-secondary'}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 12 }}
            >
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Personal Profile */}
      {activeTab === 'profile' && (
        <div className="glass-card" style={{ padding: 28, maxWidth: 640 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={20} color="var(--accent-purple)" /> Account Details
          </h3>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Full Name</label>
              <input
                className="input-field"
                value={profileForm.name}
                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Email (Read-only)</label>
                <input
                  className="input-field"
                  value={profileForm.email}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Phone Number</label>
                <input
                  className="input-field"
                  placeholder="+1 (555) 000-0000"
                  value={profileForm.phone}
                  onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Timezone</label>
              <select
                className="input-field"
                value={profileForm.timezone}
                onChange={e => setProfileForm({ ...profileForm, timezone: e.target.value })}
              >
                <option value="UTC">UTC (Universal Coordinated Time)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
              </select>
            </div>

            <button type="submit" className="btn-primary" disabled={saving} style={{ alignSelf: 'flex-start', marginTop: 10 }}>
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Health Profile */}
      {activeTab === 'health' && (
        <div className="glass-card" style={{ padding: 28, maxWidth: 640 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#f43f5e' }}>
            <Heart size={20} color="#f43f5e" /> Emergency Health ID
          </h3>

          <form onSubmit={handleSaveHealthProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Blood Group</label>
                <select
                  className="input-field"
                  value={healthForm.bloodGroup}
                  onChange={e => setHealthForm({ ...healthForm, bloodGroup: e.target.value })}
                >
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Gender</label>
                <select
                  className="input-field"
                  value={healthForm.gender}
                  onChange={e => setHealthForm({ ...healthForm, gender: e.target.value })}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Date of Birth</label>
                <input
                  className="input-field"
                  type="date"
                  value={healthForm.dateOfBirth}
                  onChange={e => setHealthForm({ ...healthForm, dateOfBirth: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Height (cm)</label>
                <input
                  className="input-field"
                  type="number"
                  placeholder="175"
                  value={healthForm.height}
                  onChange={e => setHealthForm({ ...healthForm, height: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Weight (kg)</label>
                <input
                  className="input-field"
                  type="number"
                  placeholder="70"
                  value={healthForm.weight}
                  onChange={e => setHealthForm({ ...healthForm, weight: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Allergies (comma separated)</label>
              <input
                className="input-field"
                placeholder="Penicillin, Peanuts..."
                value={healthForm.allergies}
                onChange={e => setHealthForm({ ...healthForm, allergies: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Medical Conditions</label>
              <input
                className="input-field"
                placeholder="Asthma, Hypertension..."
                value={healthForm.conditions}
                onChange={e => setHealthForm({ ...healthForm, conditions: e.target.value })}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={saving} style={{ alignSelf: 'flex-start', marginTop: 10 }}>
              {saving ? 'Saving...' : 'Save Health Profile'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Alert Preferences */}
      {activeTab === 'notifications' && (
        <div className="glass-card" style={{ padding: 28, maxWidth: 640 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-purple)' }}>
            <Bell size={20} color="var(--accent-purple)" /> Alert Preferences
          </h3>

          <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { id: 'notificationsEnabled', title: 'System Notifications', desc: 'Master toggle for dose reminders' },
              { id: 'soundEnabled', title: 'Audio Chime Alarms', desc: 'Play chime tone when dose is due' },
              { id: 'voiceEnabled', title: 'Web Speech Voice Prompts', desc: 'Speak reminder prompts aloud' },
            ].map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs[item.id]}
                  onChange={e => setNotifPrefs({ ...notifPrefs, [item.id]: e.target.checked })}
                  style={{ width: 20, height: 20, cursor: 'pointer', accentColor: 'var(--accent-purple)' }}
                />
              </div>
            ))}
          </form>
        </div>
      )}

      {/* Tab 4: Theme & Appearance */}
      {activeTab === 'appearance' && (
        <div className="glass-card" style={{ padding: 28, maxWidth: 640 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#06b6d4' }}>
            <Palette size={20} color="#06b6d4" /> Theme & UI Customization
          </h3>

          <form onSubmit={handleSaveAppearance} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'block' }}>Accent Color Theme</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { id: 'purple', label: 'Purple Glow', color: '#8b5cf6' },
                  { id: 'cyan',   label: 'Cyber Cyan',  color: '#06b6d4' },
                  { id: 'emerald',label: 'Emerald',     color: '#10b981' },
                  { id: 'rose',   label: 'Crimson Rose',color: '#f43f5e' },
                  { id: 'amber',  label: 'Amber Gold',  color: '#f59e0b' },
                ].map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setAppearanceForm({ ...appearanceForm, themeColor: c.id })}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.03)',
                      border: appearanceForm.themeColor === c.id ? `2px solid ${c.color}` : '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: c.color }} />
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Language</label>
                <select
                  className="input-field"
                  value={appearanceForm.language}
                  onChange={e => setAppearanceForm({ ...appearanceForm, language: e.target.value })}
                >
                  <option value="en">English (US)</option>
                  <option value="es">Español</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Font Size Scale</label>
                <select
                  className="input-field"
                  value={appearanceForm.fontSize}
                  onChange={e => setAppearanceForm({ ...appearanceForm, fontSize: e.target.value })}
                >
                  <option value="normal">Normal (14px)</option>
                  <option value="large">Large (16px)</option>
                  <option value="xlarge">Extra Large (18px)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
              {saving ? 'Saving...' : 'Apply Theme'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 5: Primary Care Doctor */}
      {activeTab === 'doctor' && (
        <div className="glass-card" style={{ padding: 28, maxWidth: 640 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#10b981' }}>
            <Stethoscope size={20} color="#10b981" /> Primary Care Doctor & Hospital Details
          </h3>

          <form onSubmit={handleSaveDoctorInfo} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Doctor's Full Name</label>
              <input
                className="input-field"
                placeholder="Dr. Sarah Jenkins, M.D."
                value={doctorForm.doctorName}
                onChange={e => setDoctorForm({ ...doctorForm, doctorName: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Doctor's Phone</label>
                <input
                  className="input-field"
                  placeholder="+1 (555) 987-6543"
                  value={doctorForm.doctorPhone}
                  onChange={e => setDoctorForm({ ...doctorForm, doctorPhone: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Doctor's Email</label>
                <input
                  className="input-field"
                  placeholder="dr.jenkins@cityclinic.org"
                  value={doctorForm.doctorEmail}
                  onChange={e => setDoctorForm({ ...doctorForm, doctorEmail: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Hospital / Clinic Address</label>
              <input
                className="input-field"
                placeholder="City General Hospital, Suite 402, New York, NY"
                value={doctorForm.hospitalAddress}
                onChange={e => setDoctorForm({ ...doctorForm, hospitalAddress: e.target.value })}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
              {saving ? 'Saving...' : 'Save Doctor Details'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 6: Data Export & Privacy */}
      {activeTab === 'export' && (
        <div className="glass-card" style={{ padding: 28, maxWidth: 640 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b' }}>
            <FileJson size={20} color="#f59e0b" /> Data Export & Privacy Controls
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ padding: 18, borderRadius: 12, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 6 }}>
                Export Complete Medical History
              </h4>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14 }}>
                Download a complete 1-click JSON backup file containing your profile info, active medications, dose history logs, uploaded vault document metadata, and doctor appointments.
              </p>
              <button
                onClick={handleExportData}
                className="btn-primary"
                disabled={exporting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 13 }}
              >
                <Download size={16} /> {exporting ? 'Generating JSON Export...' : 'Download Complete Health Data (.JSON)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Family Access Permissions */}
      {activeTab === 'family' && (
        <div className="glass-card" style={{ padding: 28, maxWidth: 640 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-purple)' }}>
            <Users size={20} color="var(--accent-purple)" /> Family Member Visibility & Permissions
          </h3>

          {familyMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              No family members added yet. Add family members in the <strong>Members</strong> section to configure access permissions.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {familyMembers.map(m => (
                <div key={m._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {m.name} ({m.relationship})
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Full access granted to manage medication schedule and dose alerts
                    </div>
                  </div>
                  <span className="badge badge-purple">Active Profile</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 8: Security & Password */}
      {activeTab === 'security' && (
        <div className="glass-card" style={{ padding: 28, maxWidth: 640 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b' }}>
            <Lock size={20} color="#f59e0b" /> Change Password
          </h3>

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Current Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="Current password"
                value={passwordForm.currentPassword}
                onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>New Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="At least 6 characters"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Confirm New Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={changingPassword} style={{ alignSelf: 'flex-start', marginTop: 10 }}>
              {changingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
