import React, { useEffect, useState } from 'react';
import { reminderApi, medicationApi, memberApi } from '../services/api';
import toast from 'react-hot-toast';
import {
  Plus, Edit2, Trash2, X, Bell, BellOff, Clock, Volume2,
  Globe, Mail, ShieldAlert, Sparkles, CheckCircle2, RotateCcw
} from 'lucide-react';
import { dispatchEnterpriseAlert } from '../components/VoiceReminderEngine';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

const defaultForm = {
  medication: '',
  member: '',
  time: '08:00',
  days: [...DAYS],
  label: '',
  isActive: true,
  soundEnabled: true,
  voiceEnabled: true,
  browserNotifyEnabled: true,
  emailNotifyEnabled: true,
  pushNotifyEnabled: true,
  recurringType: 'daily',
  intervalDays: 1,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
};

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [medications, setMedications] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [snoozingId, setSnoozingId] = useState(null);

  useEffect(() => {
    fetchAll();
    fetchSupport();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await reminderApi.getAll();
      setReminders(res.data.data || []);
    } catch {
      toast.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupport = async () => {
    try {
      const [medsRes, membersRes] = await Promise.allSettled([
        medicationApi.getAll({ isActive: true }),
        memberApi.getAll(),
      ]);
      if (medsRes.status === 'fulfilled') setMedications(medsRes.value.data.data || []);
      if (membersRes.status === 'fulfilled') setMembers(membersRes.value.data.data || []);
    } catch {}
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (r) => {
    setEditTarget(r._id);
    setForm({
      medication: r.medication?._id || r.medication || '',
      member: r.member?._id || r.member || '',
      time: r.time,
      days: r.days || [...DAYS],
      label: r.label || '',
      isActive: r.isActive,
      soundEnabled: r.soundEnabled ?? true,
      voiceEnabled: r.voiceEnabled ?? true,
      browserNotifyEnabled: r.browserNotifyEnabled ?? true,
      emailNotifyEnabled: r.emailNotifyEnabled ?? true,
      pushNotifyEnabled: r.pushNotifyEnabled ?? true,
      recurringType: r.recurringType || 'daily',
      intervalDays: r.intervalDays || 1,
      timezone: r.timezone || 'UTC',
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({
      ...p,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const toggleDay = (day) => {
    setForm(p => ({
      ...p,
      days: p.days.includes(day) ? p.days.filter(d => d !== day) : [...p.days, day],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.medication) { toast.error('Please select a medication'); return; }
    if (form.recurringType === 'custom_days' && form.days.length === 0) {
      toast.error('Please select at least one day');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, member: form.member || null };
      if (editTarget) {
        await reminderApi.update(editTarget, payload);
        toast.success('Reminder updated! 🔔');
      } else {
        await reminderApi.create(payload);
        toast.success('Reminder created! 🔔');
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSnooze = async (reminder, minutes) => {
    setSnoozingId(reminder._id);
    try {
      await reminderApi.snooze(reminder._id, minutes);
      toast.success(`Snoozed for ${minutes} minutes ⏰`);
      
      // Dispatch browser & speech notification
      const medName = reminder.medication?.name || 'Medication';
      dispatchEnterpriseAlert({
        title: `⏰ Reminder Snoozed`,
        message: `${medName} reminder snoozed for ${minutes} mins`,
        voiceText: `${medName} reminder snoozed for ${minutes} minutes`,
        sound: true,
        voice: reminder.voiceEnabled,
        browser: reminder.browserNotifyEnabled,
      });

      fetchAll();
    } catch (err) {
      toast.error('Failed to snooze reminder');
    } finally {
      setSnoozingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await reminderApi.remove(id);
      toast.success('Reminder removed');
      setDeleteId(null);
      fetchAll();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const toggleActive = async (r) => {
    try {
      await reminderApi.update(r._id, { isActive: !r.isActive });
      setReminders(prev => prev.map(x => x._id === r._id ? { ...x, isActive: !x.isActive } : x));
      toast.success(r.isActive ? 'Reminder paused' : 'Reminder activated');
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Enterprise Reminder Engine</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            {reminders.filter(r => r.isActive).length} active reminder{reminders.filter(r => r.isActive).length !== 1 ? 's' : ''} with Voice Alarm, Browser, Email &amp; Smart Snooze
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={async () => {
              try {
                toast.loading('Triggering Alarm & Dispatching Email/SMS...', { id: 'test-alarm' });
                const res = await reminderApi.testAlert({ medName: 'Dolo', dosage: '650 mg' });
                toast.dismiss('test-alarm');
                toast.success('🔊 Alarm Fired! Check Email & Mobile SMS alert!', { duration: 6000 });
                
                // Sound continuous alarm chime & voice prompt
                dispatchEnterpriseAlert({
                  title: '⏰ LIVE ALARM: Dolo (650 mg)',
                  message: 'Time to take your scheduled dose of Dolo (650 mg) right now!',
                  voiceText: 'Attention! It is time to take your medication: Dolo 650 milligram. Please take your prescribed dose now.',
                  sound: true,
                  voice: true,
                  browser: true,
                });
                
                fetchAll();
              } catch (err) {
                toast.error('Failed to trigger test alarm');
              }
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: 'rgba(245,158,11,0.4)', color: '#f59e0b' }}
          >
            <Volume2 size={16} /> 🔊 Test Alarm &amp; Email/SMS
          </button>

          <button onClick={openAdd} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> Create Reminder
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div className="spinner" />
        </div>
      ) : reminders.length === 0 ? (
        <div className="empty-state glass-card" style={{ padding: 80, textAlign: 'center' }}>
          <div className="empty-state-icon" style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No active reminders</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Set up voice reminders, browser notifications, and smart snooze to stay on track.
          </p>
          <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Create Reminder</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {reminders.map(r => {
            const med = r.medication;
            const isSnoozed = r.snoozedUntil && new Date(r.snoozedUntil) > new Date();

            return (
              <div key={r._id} className="glass-card" style={{
                padding: '20px 24px',
                opacity: r.isActive ? 1 : 0.55,
                transition: 'all 0.3s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  {/* Icon */}
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                    background: med?.color ? med.color + '22' : 'rgba(139,92,246,0.15)',
                    border: `1px solid ${med?.color ? med.color + '44' : 'rgba(139,92,246,0.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                  }}>
                    {med?.icon || '💊'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>
                        {med?.name || 'Unknown medication'}
                      </span>
                      {med?.dosage && (
                        <span className="badge badge-purple" style={{ fontSize: 11 }}>
                          {med.dosage} {med.dosageUnit}
                        </span>
                      )}
                      {r.member && (
                        <span className="badge badge-cyan" style={{ fontSize: 11 }}>
                          👤 {r.member.name}
                        </span>
                      )}
                      {isSnoozed && (
                        <span className="badge badge-amber" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                          ⏰ Snoozed until {new Date(r.snoozedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: 'var(--accent-purple)' }}>
                        <Clock size={14} /> {r.time}
                      </span>
                      <span>•</span>
                      <span>{r.recurringType === 'daily' ? 'Every Day' : r.days.map(d => DAY_LABELS[d]).join(', ')}</span>
                      {r.label && <span>• {r.label}</span>}
                    </div>

                    {/* Channel Badges */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {r.voiceEnabled && (
                        <span className="badge" style={{ fontSize: 10, background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
                          <Volume2 size={10} style={{ marginRight: 3 }} /> Voice Engine
                        </span>
                      )}
                      {r.browserNotifyEnabled && (
                        <span className="badge" style={{ fontSize: 10, background: 'rgba(6,182,212,0.1)', color: '#67e8f9', border: '1px solid rgba(6,182,212,0.2)' }}>
                          <Bell size={10} style={{ marginRight: 3 }} /> Browser Desktop
                        </span>
                      )}
                      {r.emailNotifyEnabled && (
                        <span className="badge" style={{ fontSize: 10, background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <Mail size={10} style={{ marginRight: 3 }} /> Email Alert
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Smart Snooze & Action Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 10, border: '1px solid var(--border-color)' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: 11 }}
                        onClick={() => handleSnooze(r, 15)}
                        title="Snooze 15 minutes"
                      >
                        +15m
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: 11 }}
                        onClick={() => handleSnooze(r, 30)}
                        title="Snooze 30 minutes"
                      >
                        +30m
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: 11 }}
                        onClick={() => handleSnooze(r, 60)}
                        title="Snooze 1 hour"
                      >
                        +1h
                      </button>
                    </div>

                    <button
                      onClick={() => toggleActive(r)}
                      style={{
                        background: r.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
                        color: r.isActive ? '#10b981' : '#f43f5e',
                        border: `1px solid ${r.isActive ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
                        borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      {r.isActive ? <Bell size={14} /> : <BellOff size={14} />}
                      {r.isActive ? 'Active' : 'Paused'}
                    </button>

                    <button className="btn-secondary" onClick={() => openEdit(r)} style={{ padding: 8 }}>
                      <Edit2 size={15} />
                    </button>
                    <button className="btn-secondary" onClick={() => setDeleteId(r._id)} style={{ padding: 8, color: '#f43f5e' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 700 }}>
                {editTarget ? 'Edit Reminder' : 'Create Enterprise Reminder'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Select Medication *</label>
                <select className="input-field" name="medication" value={form.medication} onChange={handleChange} required>
                  <option value="">Select a medication...</option>
                  {medications.map(m => (
                    <option key={m._id} value={m._id}>{m.name} ({m.dosage} {m.dosageUnit})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Time *</label>
                  <input className="input-field" type="time" name="time" value={form.time} onChange={handleChange} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Family Member (Optional)</label>
                  <select className="input-field" name="member" value={form.member} onChange={handleChange}>
                    <option value="">Myself</option>
                    {members.map(mb => (
                      <option key={mb._id} value={mb._id}>{mb.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recurring Mode */}
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Recurring Schedule</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['daily', 'custom_days'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, recurringType: type, days: type === 'daily' ? [...DAYS] : p.days }))}
                      className={form.recurringType === type ? 'btn-primary' : 'btn-secondary'}
                      style={{ flex: 1, padding: '8px 12px', fontSize: 12 }}
                    >
                      {type === 'daily' ? 'Every Day' : 'Specific Days'}
                    </button>
                  ))}
                </div>
              </div>

              {form.recurringType === 'custom_days' && (
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Days of Week</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {DAYS.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        style={{
                          padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          background: form.days.includes(day) ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)',
                          color: form.days.includes(day) ? '#fff' : 'var(--text-muted)',
                          border: '1px solid var(--border-color)', cursor: 'pointer'
                        }}
                      >
                        {DAY_LABELS[day]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notification Delivery Channels */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'block' }}>
                  Notification Channels
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" name="voiceEnabled" checked={form.voiceEnabled} onChange={handleChange} />
                    <span>🔊 Voice Prompt</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" name="browserNotifyEnabled" checked={form.browserNotifyEnabled} onChange={handleChange} />
                    <span>🔔 Browser Desktop</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" name="emailNotifyEnabled" checked={form.emailNotifyEnabled} onChange={handleChange} />
                    <span>✉️ Email Reminder</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" name="soundEnabled" checked={form.soundEnabled} onChange={handleChange} />
                    <span>🎵 Audio Chime</span>
                  </label>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Label / Instructions (Optional)</label>
                <input className="input-field" placeholder="e.g. Take after breakfast with water" name="label" value={form.label} onChange={handleChange} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? 'Saving...' : (editTarget ? 'Update Reminder' : 'Save Reminder')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="modal-backdrop" onClick={() => setDeleteId(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Delete Reminder?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Are you sure you want to remove this reminder schedule?</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, background: '#f43f5e' }} onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
