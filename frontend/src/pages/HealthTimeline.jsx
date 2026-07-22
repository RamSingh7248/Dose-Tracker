import React, { useEffect, useState } from 'react';
import { timelineApi, healthEventApi } from '../services/api';
import { Plus, X, Search, Filter, Calendar, Pill, FileText, Stethoscope, FlaskConical, Shield, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const EVENT_ICONS = {
  appointment: '📅', medication: '💊', medication_start: '💊', medication_end: '✅',
  vaccination: '💉', lab_test: '🧪', doctor_visit: '👨‍⚕️', surgery: '🏥',
  hospital_visit: '🏥', diagnosis: '📋', allergy: '⚠️', report: '📄', health_event: '📌', other: '📌',
};

const EVENT_COLORS = {
  appointment: '#6366f1', medication: '#8b5cf6', report: '#06b6d4',
  vaccination: '#10b981', lab_test: '#f59e0b', doctor_visit: '#8b5cf6',
  surgery: '#f43f5e', hospital_visit: '#f43f5e', diagnosis: '#f97316',
};

export default function HealthTimeline() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '', type: 'other', eventDate: '', description: '', severity: 'low',
  });

  useEffect(() => {
    fetchTimeline();
  }, [activeCategory, search]);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const res = await timelineApi.get({
        category: activeCategory,
        search: search.trim() || undefined,
        limit: 100
      });
      setItems(res.data.data || []);
    } catch {
      toast.error('Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      await healthEventApi.create(form);
      toast.success('Health event added to timeline');
      setShowModal(false);
      setForm({ title: '', type: 'other', eventDate: '', description: '', severity: 'low' });
      fetchTimeline();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add event');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Remove this event?')) return;
    try {
      await healthEventApi.remove(id);
      toast.success('Event removed');
      fetchTimeline();
    } catch {
      toast.error('Failed to remove event');
    }
  };

  // Group items by month
  const grouped = {};
  items.forEach(item => {
    const d = new Date(item.date);
    const key = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  const CATEGORY_TABS = [
    { id: 'all', label: 'All Events' },
    { id: 'appointment', label: 'Appointments' },
    { id: 'medication', label: 'Medicines' },
    { id: 'report', label: 'Reports & Scans' },
    { id: 'doctor_visit', label: 'Doctor Visits' },
    { id: 'lab_test', label: 'Lab Tests' },
    { id: 'vaccination', label: 'Vaccinations' },
    { id: 'hospital_visit', label: 'Hospital Visits' },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">🕐 Searchable Health Timeline</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Chronological log of appointments, medicines, lab reports, doctor visits, vaccinations & hospital visits
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Health Event
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', maxWidth: 500 }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="input-field"
            placeholder="Search timeline (e.g. Blood Test, Paracetamol, Dr. Smith, Vaccination)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 42, background: 'rgba(255,255,255,0.03)' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={activeCategory === tab.id ? 'btn-primary' : 'btn-secondary'}
              style={{
                fontSize: 12,
                padding: '6px 14px',
                whiteSpace: 'nowrap',
                borderRadius: 20,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div className="spinner" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="empty-state glass-card" style={{ padding: 60, textAlign: 'center' }}>
          <div className="empty-state-icon" style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No matching health events</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
            {search ? `No results found for "${search}"` : 'Your health timeline is empty.'}
          </p>
          <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={14} /> Add Health Event</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {Object.entries(grouped).map(([month, monthItems]) => (
            <div key={month}>
              {/* Month Header */}
              <div style={{
                fontSize: 14, fontWeight: 800, color: 'var(--accent-purple)',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <span>📅 {month}</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
              </div>

              {/* Event Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingLeft: 16, borderLeft: '2px solid rgba(139,92,246,0.3)' }}>
                {monthItems.map(item => {
                  const icon = item.icon || EVENT_ICONS[item.subType] || EVENT_ICONS[item.category] || '📌';
                  const color = item.color || EVENT_COLORS[item.category] || '#8b5cf6';

                  return (
                    <div
                      key={item._id}
                      className="glass-card"
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justify: 'space-between',
                        gap: 16,
                        position: 'relative',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: `${color}18`,
                          border: `1px solid ${color}44`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0
                        }}>
                          {icon}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{item.title}</span>
                            <span className="badge" style={{ fontSize: 10, background: `${color}15`, color, border: `1px solid ${color}33`, textTransform: 'capitalize' }}>
                              {item.subType ? item.subType.replace('_', ' ') : item.category}
                            </span>
                          </div>

                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                            {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            {item.details?.time ? ` at ${item.details.time}` : ''}
                          </div>

                          {/* Extra Details */}
                          {item.details && (
                            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                              {item.details.doctor && <div>👨‍⚕️ Doctor: <strong>{item.details.doctor}</strong></div>}
                              {item.details.location && <div>📍 Location: {item.details.location}</div>}
                              {item.details.dosage && <div>💊 Dosage: {item.details.dosage}</div>}
                              {item.details.description && <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>"{item.details.description}"</div>}
                              {item.details.notes && <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>"{item.details.notes}"</div>}
                            </div>
                          )}
                        </div>
                      </div>

                      {item.category === 'event' && (
                        <button
                          onClick={() => handleDeleteEvent(item._id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                          title="Remove event"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Health Event Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 700 }}>
                ➕ Add Health Event to Timeline
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Event Title *</label>
                <input
                  className="input-field"
                  placeholder="e.g. Annual Blood Checkup, COVID Booster"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Category Type</label>
                  <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="doctor_visit">Doctor Visit</option>
                    <option value="lab_test">Lab Test</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="hospital_visit">Hospital Visit / Surgery</option>
                    <option value="diagnosis">Diagnosis / Symptom</option>
                    <option value="allergy">Allergy Reaction</option>
                    <option value="other">Other Health Event</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Event Date *</label>
                  <input
                    className="input-field"
                    type="date"
                    value={form.eventDate}
                    onChange={e => setForm({ ...form, eventDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Description & Notes</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Add details, findings, doctor notes..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
