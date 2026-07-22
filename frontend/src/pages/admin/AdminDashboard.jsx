import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api';
import { Users, Shield, Pill, Clock, Activity, Calendar, FileText, CheckCircle2, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await adminApi.getStats();
      setStats(res.data.data);
    } catch (err) {
      toast.error('Failed to load system stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;
  }

  const statCards = [
    { label: 'Total Patients', value: stats?.totalPatients || 0, icon: Users, color: '#f43f5e', to: '/admin/users' },
    { label: 'Doctors', value: stats?.totalDoctors || 0, icon: Shield, color: '#3b82f6', to: '/admin/doctors' },
    { label: 'Appointments', value: stats?.totalAppointments || 0, icon: Calendar, color: '#10b981', to: '/admin/appointments' },
    { label: 'Completed Visits', value: stats?.completedAppointments || 0, icon: CheckCircle2, color: '#06b6d4', to: '/admin/appointments' },
    { label: 'Total Meds', value: stats?.totalMeds || 0, icon: Pill, color: '#8b5cf6', to: '/admin/prescriptions' },
    { label: 'Uploaded Reports', value: stats?.totalReports || 0, icon: FileText, color: '#f59e0b', to: '/admin/reports' },
    { label: 'Adherence Rate', value: `${stats?.adherenceRate || 0}%`, icon: TrendingUp, color: '#10b981', to: '/admin/reports' },
    { label: 'Logged Doses', value: stats?.totalDoses || 0, icon: Clock, color: '#f43f5e', to: '/admin/audit-logs' },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">🛡️ System Overview & Platform Control</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Real-time analytics and platform performance metrics for DoseTracker
          </p>
        </div>
      </div>

      {/* Admin Platform Control Hub */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 24, border: '1px solid rgba(245,158,11,0.3)', background: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(244,63,94,0.06) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} color="#f59e0b" />
            <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'Outfit' }}>Admin System Control Suite & Portal Navigation</span>
          </div>
          <span className="badge" style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '4px 10px', fontSize: 11 }}>
            🛡️ Admin Portal Active
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {[
            { label: '👥 User Management', desc: 'Patients & roles', to: '/admin/users' },
            { label: '🩺 Doctor Management', desc: 'Verification & credentials', to: '/admin/doctors' },
            { label: '📅 Appointment Audits', desc: 'System visit schedule', to: '/admin/appointments' },
            { label: '📄 Prescription Vault', desc: 'Audited e-prescriptions', to: '/admin/prescriptions' },
            { label: '📊 System Reports', desc: 'Platform usage & charts', to: '/admin/reports' },
            { label: '📜 Audit Logs', desc: 'Security & login trails', to: '/admin/audit-logs' },
            { label: '⚙️ Platform Settings', desc: 'System configuration', to: '/admin/settings' },
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

      {/* Interactive Stat Cards Grid */}
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

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Chart */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Doses Logged & Activity (Last 7 Days)</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.activity || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="doses" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Users */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recent Registrations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(stats?.recentUsers || []).map(u => (
              <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {u.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{u.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
