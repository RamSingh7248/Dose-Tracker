import React, { useState, useEffect } from 'react';
import { doctorApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Users, Pill, Activity, AlertTriangle, Calendar, FileText, Stethoscope, Clock, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, analyticsRes, followupsRes] = await Promise.allSettled([
        doctorApi.getStats(),
        doctorApi.getAnalytics(),
        doctorApi.getFollowups(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data);
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data.data);
      if (followupsRes.status === 'fulfilled') setFollowups(followupsRes.value.data.data || []);

    } catch (err) {
      toast.error('Failed to load doctor dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;
  }

  const statCards = [
    { label: 'My Patients', value: stats?.totalPatients || 0, icon: Users, color: '#14b8a6', to: '/doctor/patients' },
    { label: 'Total Medications', value: stats?.totalMeds || 0, icon: Pill, color: '#8b5cf6', to: '/doctor/prescriptions' },
    { label: 'Avg Patient Adherence', value: `${analytics?.summary?.averageAdherence ?? (stats?.adherenceRate || 100)}%`, icon: Activity, color: '#3b82f6', to: '/doctor/analytics' },
    { label: 'Low Adherence Alerts', value: analytics?.summary?.lowAdherenceCount || 0, icon: AlertTriangle, color: '#f43f5e', to: '/doctor/analytics' },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">👨‍⚕️ Doctor Portal Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Monitor patient adherence, missed dose analytics, prescription generator & follow-ups
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/doctor/prescriptions" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} /> Generate Prescription
          </Link>
        </div>
      </div>

      {/* Doctor License Verification Status Banner */}
      {user?.isVerifiedDoctor === 'pending' && (
        <div className="glass-card" style={{ padding: '14px 18px', marginBottom: 20, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ShieldAlert size={20} color="#f59e0b" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>Medical Credential Verification Pending Review</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Your medical registration number <strong>{user?.licenseNumber || 'REG-MED-2026'}</strong> is under admin compliance review. Your clinical features are operating under verified preview.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Portal Feature Control Hub */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 24, border: '1px solid rgba(20,184,166,0.3)', background: 'linear-gradient(135deg, rgba(20,184,166,0.06) 0%, rgba(59,130,246,0.06) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Stethoscope size={18} color="#14b8a6" />
            <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'Outfit' }}>Doctor Clinical Suite & Portal Navigation</span>
          </div>
          <span className="badge" style={{ background: 'rgba(20,184,166,0.2)', color: '#14b8a6', padding: '4px 10px', fontSize: 11 }}>
            🩺 Doctor Portal Active
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {[
            { label: '👥 My Patients List', desc: 'Patient records & history', to: '/doctor/patients', color: '#14b8a6' },
            { label: '📋 Clinical Notes', desc: 'EHR diagnoses & notes', to: '/doctor/notes', color: '#3b82f6' },
            { label: '📝 Rx Generator', desc: 'Digital e-prescriptions', to: '/doctor/prescriptions', color: '#8b5cf6' },
            { label: '📊 Adherence Analytics', desc: 'Missed dose reporting', to: '/doctor/analytics', color: '#f43f5e' },
            { label: '📅 Follow-up Schedule', desc: 'Consultations & visits', to: '/doctor/followups', color: '#10b981' },
          ].map(item => (
            <Link
              key={item.label}
              to={item.to}
              style={{
                padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)', textDecoration: 'none', transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', gap: 2
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{item.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {statCards.map((s, i) => (
          <Link
            key={i}
            to={s.to}
            className="glass-card stat-card-link"
            style={{
              padding: 20, textDecoration: 'none', color: 'inherit',
              display: 'block', transition: 'transform 0.2s, border-color 0.2s',
              cursor: 'pointer', border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${s.color}22`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={22} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
              </div>
              <span style={{ fontSize: 11, color: s.color, fontWeight: 700 }}>Open &rarr;</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Outfit', color: 'var(--text-primary)' }}>{s.value}</div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        
        {/* Missed Dose Analytics Widget */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#f43f5e' }}>
              <ShieldAlert size={18} /> Recent Missed Dose Analytics
            </h3>
            <Link to="/doctor/analytics" style={{ fontSize: 12, color: 'var(--accent-purple)', textDecoration: 'none' }}>
              Analytics &rarr;
            </Link>
          </div>

          {(!analytics?.recentMissed || analytics.recentMissed.length === 0) ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No missed doses recorded for assigned patients in the last 30 days. Excellent compliance!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {analytics.recentMissed.map(m => (
                <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(244,63,94,0.06)', borderRadius: 10, border: '1px solid rgba(244,63,94,0.2)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{m.patientName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Missed: {m.medName} ({m.dosage})
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: '#f43f5e', fontWeight: 600 }}>
                    {new Date(m.missedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Appointment & Follow-Up History */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} color="var(--accent-emerald)" /> Doctor Appointment Schedule
            </h3>
            <Link to="/doctor/followups" style={{ fontSize: 12, color: 'var(--accent-emerald)', textDecoration: 'none' }}>
              View All &rarr;
            </Link>
          </div>

          {followups.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No appointments scheduled.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {followups.slice(0, 5).map(apt => (
                <div key={apt._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{apt.user?.name || 'Patient'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {apt.title} ({apt.type})
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-secondary)' }}>
                    <div>{new Date(apt.appointmentDate).toLocaleDateString()}</div>
                    <div style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>{apt.appointmentTime || '09:00'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
