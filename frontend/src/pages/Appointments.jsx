import React, { useEffect, useState } from 'react';
import { appointmentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import {
  Calendar, Plus, Clock, MapPin, Video, Phone, Home,
  FlaskConical, Edit2, Trash2, X, RefreshCw, CheckCircle,
  Download, ExternalLink, Stethoscope, ArrowRight, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const DASHBOARD_QUERY_KEY = ['admin-dashboard-stats'];

const TYPE_ICONS = { clinic: MapPin, online: Video, phone: Phone, home_visit: Home, lab: FlaskConical, other: Calendar };
const STATUS_BADGE = { scheduled: 'badge-purple', completed: 'badge-green', cancelled: 'badge-red', rescheduled: 'badge-amber', no_show: 'badge-gray' };

export default function Appointments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [appointments, setAppointments] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState('all');
  
  const [form, setForm] = useState({
    title: '',
    doctorName: '',
    appointmentDate: '',
    appointmentTime: '',
    location: '',
    type: 'clinic',
    notes: '',
    isFollowUp: false,
    followUpReason: '',
  });

  const [rescheduleForm, setRescheduleForm] = useState({
    appointmentDate: '',
    appointmentTime: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allRes, upRes] = await Promise.all([
        appointmentApi.getAll(),
        appointmentApi.getUpcoming(),
      ]);
      setAppointments(allRes.data.data || []);
      setUpcoming(upRes.data.data || []);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.isFollowUp) {
        await appointmentApi.scheduleFollowUp(form);
        toast.success('Doctor follow-up scheduled! 🩺');
      } else if (editId) {
        await appointmentApi.update(editId, form);
        toast.success('Appointment updated');
      } else {
        await appointmentApi.create(form);
        toast.success('Appointment created');
      }
      setShowModal(false);
      resetForm();
      fetchData();
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    try {
      await appointmentApi.reschedule(rescheduleTarget._id, rescheduleForm);
      toast.success('Appointment rescheduled successfully! 🔄');
      setShowRescheduleModal(false);
      setRescheduleTarget(null);
      fetchData();
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    } catch (err) {
      toast.error('Failed to reschedule appointment');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this appointment?')) return;
    try {
      await appointmentApi.remove(id);
      toast.success('Appointment deleted');
      fetchData();
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await appointmentApi.update(id, { status });
      toast.success(`Marked as ${status}`);
      fetchData();
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    } catch {
      toast.error('Failed to update status');
    }
  };

  const openRescheduleModal = (apt) => {
    setRescheduleTarget(apt);
    setRescheduleForm({
      appointmentDate: apt.appointmentDate?.split('T')[0] || '',
      appointmentTime: apt.appointmentTime || '',
      notes: apt.notes || '',
    });
    setShowRescheduleModal(true);
  };

  const openEdit = (apt) => {
    setEditId(apt._id);
    setForm({
      title: apt.title,
      doctorName: apt.doctorName || '',
      appointmentDate: apt.appointmentDate?.split('T')[0] || '',
      appointmentTime: apt.appointmentTime || '',
      location: apt.location || '',
      type: apt.type || 'clinic',
      notes: apt.notes || '',
      isFollowUp: apt.isFollowUp || false,
      followUpReason: apt.followUpReason || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditId(null);
    setForm({
      title: '',
      doctorName: '',
      appointmentDate: '',
      appointmentTime: '',
      location: '',
      type: 'clinic',
      notes: '',
      isFollowUp: false,
      followUpReason: '',
    });
  };

  const openGoogleCalendar = (apt) => {
    const title = encodeURIComponent(`${apt.title} - ${apt.doctorName || 'Doctor Visit'}`);
    const details = encodeURIComponent(apt.notes || 'DoseTracker appointment');
    const location = encodeURIComponent(apt.location || 'Clinic / Virtual');
    const dateStr = apt.appointmentDate?.split('T')[0].replace(/-/g, '');
    const timeStr = (apt.appointmentTime || '09:00').replace(':', '') + '00';
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dateStr}T${timeStr}/${dateStr}T${timeStr}`;
    window.open(url, '_blank');
  };

  const filtered = filter === 'all'
    ? appointments
    : filter === 'followup'
    ? appointments.filter(a => a.isFollowUp)
    : appointments.filter(a => a.status === filter);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading appointments & follow-ups...</p>
    </div>
  );

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">📅 Appointments & Follow-up System</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Doctor follow-ups, automatic reminders, calendar export (.ics), and rescheduling support
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => { resetForm(); setForm(p => ({ ...p, isFollowUp: true, title: 'Doctor Follow-Up Consultation' })); setShowModal(true); }}>
            <Stethoscope size={16} /> Schedule Doctor Follow-up
          </button>
          <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus size={16} /> New Appointment
          </button>
        </div>
      </div>

      {/* Upcoming Banner */}
      {upcoming.length > 0 && (
        <div className="glass-card" style={{ padding: 20, marginBottom: 24, border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.06)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-indigo)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} /> Upcoming Appointments & Follow-ups
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcoming.map(apt => {
              const TypeIcon = TYPE_ICONS[apt.type] || Calendar;
              return (
                <div key={apt._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <TypeIcon size={18} color="var(--accent-indigo)" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {apt.title}
                        {apt.isFollowUp && <span className="badge badge-cyan" style={{ fontSize: 10 }}>Follow-up</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {apt.doctorName || 'Doctor'} • {new Date(apt.appointmentDate).toLocaleDateString()} at {apt.appointmentTime || '09:00'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => openGoogleCalendar(apt)}>
                      <ExternalLink size={12} /> Google Calendar
                    </button>
                    <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => appointmentApi.downloadIcs(apt._id)}>
                      <Download size={12} /> .ICS Export
                    </button>
                    <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => openRescheduleModal(apt)}>
                      <RefreshCw size={12} /> Reschedule
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'followup', 'scheduled', 'completed', 'rescheduled', 'cancelled'].map(st => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={filter === st ? 'btn-primary' : 'btn-secondary'}
            style={{ textTransform: 'capitalize', fontSize: 13, padding: '6px 14px' }}
          >
            {st === 'followup' ? '🩺 Follow-ups Only' : st}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <h3>No appointments found</h3>
          <p style={{ fontSize: 13, marginTop: 4 }}>Click "New Appointment" or "Schedule Doctor Follow-up" to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map(apt => {
            const TypeIcon = TYPE_ICONS[apt.type] || Calendar;
            return (
              <div key={apt._id} className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TypeIcon size={18} color="var(--accent-purple)" />
                      </div>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{apt.title}</h4>
                        {apt.doctorName && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{apt.doctorName}</div>}
                      </div>
                    </div>
                    <span className={`badge ${STATUS_BADGE[apt.status] || 'badge-gray'}`} style={{ textTransform: 'capitalize', fontSize: 11 }}>
                      {apt.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Calendar size={14} color="var(--text-muted)" />
                      <span>{new Date(apt.appointmentDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      {apt.appointmentTime && <span style={{ fontWeight: 600 }}>at {apt.appointmentTime}</span>}
                    </div>

                    {apt.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MapPin size={14} color="var(--text-muted)" />
                        <span>{apt.location}</span>
                      </div>
                    )}

                    {apt.isFollowUp && (
                      <div style={{ marginTop: 4, padding: '6px 10px', borderRadius: 8, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', fontSize: 12, color: '#06b6d4' }}>
                        🩺 Doctor Follow-Up: {apt.followUpReason || 'Routine Checkup'}
                      </div>
                    )}

                    {apt.notes && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0 0', background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6 }}>
                        "{apt.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ borderTop: '1px solid var(--border-color)', pt: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-secondary" style={{ padding: '6px 8px' }} onClick={() => openGoogleCalendar(apt)} title="Add to Google Calendar">
                      <ExternalLink size={14} />
                    </button>
                    <button className="btn-secondary" style={{ padding: '6px 8px' }} onClick={() => appointmentApi.downloadIcs(apt._id)} title="Download .ics Calendar File">
                      <Download size={14} />
                    </button>
                    <button className="btn-secondary" style={{ padding: '6px 8px' }} onClick={() => openRescheduleModal(apt)} title="Reschedule">
                      <RefreshCw size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {apt.status === 'scheduled' && (
                      <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12, color: '#10b981' }} onClick={() => handleStatusChange(apt._id, 'completed')}>
                        <CheckCircle size={14} /> Complete
                      </button>
                    )}
                    <button className="btn-secondary" style={{ padding: '6px 8px' }} onClick={() => openEdit(apt)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn-secondary" style={{ padding: '6px 8px', color: '#f43f5e' }} onClick={() => handleDelete(apt._id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Appointment Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 700 }}>
                {form.isFollowUp ? '🩺 Schedule Doctor Follow-Up' : (editId ? 'Edit Appointment' : 'New Appointment')}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Title *</label>
                <input className="input-field" placeholder="e.g. Cardiology Checkup" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Doctor Name</label>
                  <input className="input-field" placeholder="Dr. Smith" value={form.doctorName} onChange={e => setForm({ ...form, doctorName: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Type</label>
                  <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="clinic">Clinic Visit</option>
                    <option value="online">Online / Video</option>
                    <option value="phone">Phone Consultation</option>
                    <option value="lab">Lab / Scan</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Date *</label>
                  <input className="input-field" type="date" value={form.appointmentDate} onChange={e => setForm({ ...form, appointmentDate: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Time</label>
                  <input className="input-field" type="time" value={form.appointmentTime} onChange={e => setForm({ ...form, appointmentTime: e.target.value })} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Location / Meeting Link</label>
                <input className="input-field" placeholder="e.g. Room 302, City Hospital" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>

              {form.isFollowUp && (
                <div>
                  <label style={{ fontSize: 12, color: '#06b6d4', marginBottom: 4, display: 'block', fontWeight: 600 }}>Follow-Up Reason</label>
                  <input className="input-field" placeholder="e.g. Medication review, lab test check" value={form.followUpReason} onChange={e => setForm({ ...form, followUpReason: e.target.value })} />
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Notes</label>
                <textarea className="input-field" rows={3} placeholder="Preparation notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && rescheduleTarget && (
        <div className="modal-backdrop" onClick={() => setShowRescheduleModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 700 }}>
                🔄 Reschedule Appointment
              </h3>
              <button onClick={() => setShowRescheduleModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Rescheduling: <strong>{rescheduleTarget.title}</strong>
            </p>

            <form onSubmit={handleRescheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>New Date *</label>
                <input className="input-field" type="date" value={rescheduleForm.appointmentDate} onChange={e => setRescheduleForm({ ...rescheduleForm, appointmentDate: e.target.value })} required />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>New Time</label>
                <input className="input-field" type="time" value={rescheduleForm.appointmentTime} onChange={e => setRescheduleForm({ ...rescheduleForm, appointmentTime: e.target.value })} />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Reschedule Reason / Notes</label>
                <textarea className="input-field" rows={2} placeholder="Reason for rescheduling..." value={rescheduleForm.notes} onChange={e => setRescheduleForm({ ...rescheduleForm, notes: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowRescheduleModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Confirm Reschedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
