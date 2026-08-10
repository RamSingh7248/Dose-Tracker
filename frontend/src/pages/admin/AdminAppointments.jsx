import React, { useState, useEffect } from 'react';
import { adminApi, appointmentApi } from '../../services/api';
import { Plus, Search, Calendar, CheckCircle2, XCircle, Trash2, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    patientName: '',
    doctorName: '',
    appointmentDate: '',
    reason: '',
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAppointments();
      setAppointments(res.data.data || []);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await appointmentApi.create({
        title: formData.title || 'General Consultation',
        doctorName: formData.doctorName,
        appointmentDate: formData.appointmentDate,
        notes: formData.reason,
      });
      toast.success('Appointment scheduled successfully');
      setIsModalOpen(false);
      setFormData({ title: '', patientName: '', doctorName: '', appointmentDate: '', reason: '' });
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await appointmentApi.update(id, { status: newStatus });
      toast.success(`Appointment marked as ${newStatus}`);
      fetchAppointments();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel and remove this appointment record?')) return;
    try {
      await appointmentApi.remove(id);
      toast.success('Appointment deleted');
      fetchAppointments();
    } catch {
      toast.error('Failed to delete appointment');
    }
  };

  const filtered = appointments.filter(a => {
    const matchesSearch =
      (a.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.doctorName || a.doctor?.name || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Appointments
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0 0' }}>
            System-wide overview of patient consultations and doctor visit schedules
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', background: '#2563eb', color: '#ffffff',
            border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          <span>New Appointment</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by patient, doctor, or consultation reason..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 36px', background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13,
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 12px', background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, width: 160,
          }}
        >
          <option value="all">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Appointments Table */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Patient</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Doctor</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Date &amp; Time</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Reason / Title</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading appointments...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No appointments scheduled.
                  </td>
                </tr>
              ) : (
                filtered.map((appt) => {
                  const status = (appt.status || 'scheduled').toLowerCase();
                  let badgeBg = 'rgba(37, 99, 235, 0.15)';
                  let badgeColor = '#2563eb';

                  if (status === 'completed') {
                    badgeBg = 'rgba(22, 163, 74, 0.15)';
                    badgeColor = '#16a34a';
                  } else if (status === 'cancelled') {
                    badgeBg = 'rgba(220, 38, 38, 0.15)';
                    badgeColor = '#dc2626';
                  } else if (status === 'pending') {
                    badgeBg = 'rgba(234, 179, 8, 0.15)';
                    badgeColor = '#d97706';
                  }

                  return (
                    <tr key={appt._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {appt.user?.name || 'Patient'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                        {appt.doctorName || appt.doctor?.name ? `Dr. ${appt.doctorName || appt.doctor.name}` : 'Unassigned'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>
                        {appt.title || appt.notes || 'General Checkup'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                          textTransform: 'capitalize', background: badgeBg, color: badgeColor, border: `1px solid ${badgeColor}33`,
                        }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setSelectedAppt(appt)}
                            style={{ padding: '5px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-primary)' }}
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          {status !== 'completed' && (
                            <button
                              onClick={() => handleStatusChange(appt._id, 'completed')}
                              style={{ padding: '5px 8px', background: 'rgba(22, 163, 74, 0.1)', border: '1px solid rgba(22, 163, 74, 0.3)', borderRadius: 4, cursor: 'pointer', color: '#16a34a' }}
                              title="Mark Completed"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          )}
                          {status !== 'cancelled' && (
                            <button
                              onClick={() => handleStatusChange(appt._id, 'cancelled')}
                              style={{ padding: '5px 8px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: 4, cursor: 'pointer', color: '#dc2626' }}
                              title="Cancel"
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(appt._id)}
                            style={{ padding: '5px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-muted)' }}
                            title="Delete Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Appointment Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8,
            width: '100%', maxWidth: 440, padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Schedule New Appointment</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Consultation Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14 }}
                  placeholder="Routine Blood Checkup"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Assigned Doctor</label>
                <input
                  type="text"
                  required
                  value={formData.doctorName}
                  onChange={e => setFormData({ ...formData, doctorName: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14 }}
                  placeholder="Dr. Rajesh Kumar"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Date &amp; Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.appointmentDate}
                  onChange={e => setFormData({ ...formData, appointmentDate: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Clinical Reason / Notes</label>
                <textarea
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14 }}
                  placeholder="Patient reports mild fever and headache..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 16px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                >
                  {submitting ? 'Scheduling...' : 'Save Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Appointment Details Modal */}
      {selectedAppt && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8,
            width: '100%', maxWidth: 400, padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Appointment Details</h3>
              <button onClick={() => setSelectedAppt(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div><strong style={{ color: 'var(--text-muted)' }}>Title:</strong> <span style={{ color: 'var(--text-primary)' }}>{selectedAppt.title}</span></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Patient:</strong> <span style={{ color: 'var(--text-primary)' }}>{selectedAppt.user?.name || 'Patient'}</span></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Doctor:</strong> <span style={{ color: 'var(--text-primary)' }}>{selectedAppt.doctorName || selectedAppt.doctor?.name || 'Assigned Specialist'}</span></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Date &amp; Time:</strong> <span style={{ color: 'var(--text-primary)' }}>{selectedAppt.appointmentDate ? new Date(selectedAppt.appointmentDate).toLocaleString() : 'N/A'}</span></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Status:</strong> <span style={{ color: '#2563eb', textTransform: 'capitalize' }}>{selectedAppt.status}</span></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Notes:</strong> <span style={{ color: 'var(--text-primary)' }}>{selectedAppt.notes || 'No extra notes provided'}</span></div>
            </div>

            <button
              onClick={() => setSelectedAppt(null)}
              style={{ alignSelf: 'flex-end', padding: '7px 14px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
