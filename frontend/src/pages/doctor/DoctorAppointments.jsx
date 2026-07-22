import React, { useState, useEffect } from 'react';
import { doctorApi } from '../../services/api';
import { Calendar as CalendarIcon, Clock, User, CheckCircle2, XCircle, RefreshCw, Video, Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await doctorApi.getAppointments();
      if (res.data?.data) {
        setAppointments(res.data.data);
      }
    } catch (e) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await doctorApi.updateAppointmentStatus(id, { status: newStatus });
      toast.success(`Appointment ${newStatus}`);
      fetchAppointments();
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const filtered = appointments.filter(a => {
    const matchesFilter = filter === 'all' || a.status === filter;
    const matchesSearch = !search || (a.user?.name || '').toLowerCase().includes(search.toLowerCase()) || (a.title || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">📅 Enterprise Clinical Appointment Schedule</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Manage daily consultations, calendar schedules, telehealth links, and visit statuses
          </p>
        </div>
        <button className="btn-primary" onClick={() => toast.success('New appointment booking modal opened')}>
          <Plus size={16} /> Schedule Consultation
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'upcoming', 'completed', 'cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                textTransform: 'capitalize', border: '1px solid var(--border-color)',
                background: filter === st ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.03)',
                color: filter === st ? 'white' : 'var(--text-muted)', cursor: 'pointer'
              }}
            >
              {st}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', width: 260 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search patient or title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 34, fontSize: 12 }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <CalendarIcon size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
          <p>No appointments found under this filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(apt => (
            <div key={apt._id} className="glass-card" style={{ padding: 18, borderLeft: `4px solid ${apt.status === 'completed' ? '#10b981' : apt.status === 'cancelled' ? '#f43f5e' : '#3b82f6'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>{apt.title || 'General Consultation'}</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <User size={13} /> {apt.user?.name || 'Assigned Patient'}
                  </div>
                </div>
                <span className="badge" style={{
                  background: apt.status === 'completed' ? 'rgba(16,185,129,0.15)' : apt.status === 'cancelled' ? 'rgba(244,63,94,0.15)' : 'rgba(59,130,246,0.15)',
                  color: apt.status === 'completed' ? '#10b981' : apt.status === 'cancelled' ? '#f43f5e' : '#3b82f6',
                  textTransform: 'capitalize'
                }}>
                  {apt.status || 'Upcoming'}
                </span>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} /> {new Date(apt.appointmentDate).toLocaleString()}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', pt: 10, borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => handleStatusChange(apt._id, 'completed')}
                  className="badge" style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <CheckCircle2 size={12} /> Mark Complete
                </button>
                <button
                  onClick={() => handleStatusChange(apt._id, 'cancelled')}
                  className="badge" style={{ background: 'rgba(244,63,94,0.2)', color: '#f43f5e', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <XCircle size={12} /> Cancel
                </button>
                <button
                  onClick={() => toast.success('Telehealth Video Link generated: https://meet.dosetracker.com/room-9482')}
                  className="badge" style={{ background: 'rgba(139,92,246,0.2)', color: '#8b5cf6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Video size={12} /> Join Video
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
