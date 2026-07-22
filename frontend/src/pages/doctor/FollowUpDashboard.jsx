import React, { useEffect, useState } from 'react';
import { doctorApi, appointmentApi } from '../../services/api';
import { Calendar, Clock, MapPin, Video, Phone, Home, RefreshCw, CheckCircle, XCircle, ArrowRight, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const TYPE_ICONS = { clinic: MapPin, online: Video, phone: Phone, home_visit: Home, other: Calendar };
const STATUS_BADGE = { scheduled: 'badge-purple', completed: 'badge-green', cancelled: 'badge-red', rescheduled: 'badge-amber' };

export default function FollowUpDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await doctorApi.getFollowups();
      setAppointments(res.data.data || []);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await appointmentApi.update(id, { status });
      toast.success(`Appointment marked as ${status}`);
      fetchAppointments();
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: 40, height: 40, borderColor: '#14b8a6', borderTopColor: 'transparent' }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading clinical appointments...</p>
    </div>
  );

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const todayAppointments = appointments.filter(a => a.appointmentDate?.split('T')[0] === todayStr);
  const upcomingAppointments = appointments.filter(a => a.appointmentDate?.split('T')[0] > todayStr && a.status === 'scheduled');
  const pastAppointments = appointments.filter(a => a.appointmentDate?.split('T')[0] < todayStr || a.status !== 'scheduled');

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#14b8a6' }}>📅 Follow-up Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Manage and track patient appointments and clinical follow-ups</p>
        </div>
        <button className="btn-secondary" onClick={fetchAppointments} style={{ borderColor: 'rgba(20,184,166,0.3)', color: '#14b8a6' }}>
          <RefreshCw size={16} /> Refresh Calendar
        </button>
      </div>

      {/* Today's Appointments */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#14b8a6' }} />
          Today's Appointments
        </h3>
        {todayAppointments.length === 0 ? (
          <div className="glass-card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
            No appointments scheduled for today.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {todayAppointments.map(apt => {
              const TypeIcon = TYPE_ICONS[apt.type] || Calendar;
              return (
                <div key={apt._id} className="glass-card" style={{ padding: 18, borderLeft: '4px solid #14b8a6' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(20,184,166,0.1)', color: '#14b8a6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User size={18} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 700 }}>{apt.title}</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                          <span>Patient: <strong>{apt.user?.name || 'Unknown'}</strong></span>
                          <span>Time: <strong>{apt.appointmentTime || 'TBD'}</strong></span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><TypeIcon size={12} /> {apt.type}</span>
                          {apt.location && <span>Location: {apt.location}</span>}
                        </div>
                        {apt.notes && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Note: {apt.notes}</p>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {apt.status === 'scheduled' ? (
                        <>
                          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12, color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }} onClick={() => handleStatusChange(apt._id, 'completed')}>
                            <CheckCircle size={14} /> Complete
                          </button>
                          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12, color: 'var(--accent-rose)', borderColor: 'rgba(244,63,94,0.3)' }} onClick={() => handleStatusChange(apt._id, 'cancelled')}>
                            <XCircle size={14} /> Cancel
                          </button>
                        </>
                      ) : (
                        <span className={`badge ${STATUS_BADGE[apt.status]}`}>{apt.status}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming / History Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        {/* Upcoming appointments */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Upcoming Appointments</h3>
          {upcomingAppointments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>No upcoming appointments scheduled.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcomingAppointments.map(apt => {
                const TypeIcon = TYPE_ICONS[apt.type] || Calendar;
                return (
                  <div key={apt._id} style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{apt.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                          Patient: {apt.user?.name}
                        </div>
                        <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          <span>{new Date(apt.appointmentDate).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{apt.appointmentTime || 'No Time'}</span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><TypeIcon size={10} /> {apt.type}</span>
                        </div>
                      </div>
                      <span className={`badge ${STATUS_BADGE[apt.status]}`}>{apt.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* History */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Appointment History</h3>
          {pastAppointments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>No past appointments recorded.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pastAppointments.slice(0, 8).map(apt => (
                <div key={apt._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{apt.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {apt.user?.name} • {new Date(apt.appointmentDate).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`badge ${STATUS_BADGE[apt.status]}`}>{apt.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@media (max-width: 900px) { div[style*="grid-template-columns: 1.2fr 1fr"] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
