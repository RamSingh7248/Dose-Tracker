import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { BarChart3, Users, Pill, FileText, CheckCircle, RefreshCw, AlertTriangle, HelpCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default function SystemReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getReports();
      setReport(res.data.data);
    } catch {
      toast.error('Failed to load system reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Compiling global system reports...</p>
    </div>
  );

  const users = report?.users || { patients: 0, doctors: 0, admins: 0, active: 0, suspended: 0 };
  const medications = report?.medications || { total: 0, topMeds: [] };
  const prescriptions = report?.prescriptions || { total: 0, processed: 0, pending: 0 };
  const doses = report?.doses || { total: 0, taken: 0, missed: 0, skipped: 0 };

  const totalDoses = doses.total || 0;
  const globalAdherence = totalDoses > 0 ? Math.round((doses.taken / totalDoses) * 100) : 100;

  // Chart data formatting
  const doseDistribution = [
    { name: 'Taken', count: doses.taken, color: '#10b981' },
    { name: 'Missed', count: doses.missed, color: '#f43f5e' },
    { name: 'Skipped', count: doses.skipped, color: '#f59e0b' }
  ];

  const userDistribution = [
    { name: 'Patients', count: users.patients },
    { name: 'Doctors', count: users.doctors },
    { name: 'Admins', count: users.admins }
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 System Reports</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Detailed platform-wide analytics and distribution reports</p>
        </div>
        <button className="btn-secondary" onClick={fetchReports}><RefreshCw size={16} /> Refresh Reports</button>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Global Adherence Rate', value: `${globalAdherence}%`, icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Platform Users Active', value: users.active, icon: Users, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Total Scanned Prescriptions', value: prescriptions.total, icon: FileText, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
          { label: 'Total Medications Registered', value: medications.total, icon: Pill, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Outfit', lineHeight: 1 }}>{value}</p>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Dose status breakdown */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Dose Status Distribution</h3>
          <div style={{ height: 260 }}>
            {totalDoses > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={doseDistribution} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {doseDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>No doses logged on the platform yet.</div>
            )}
          </div>
        </div>

        {/* User Distribution */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>User Role Distribution</h3>
          <div style={{ display: 'flex', justifyContent: 'center', height: 180 }}>
            {users.patients + users.doctors + users.admins > 0 ? (
              <PieChart width={180} height={180}>
                <Pie
                  data={userDistribution}
                  cx={85} cy={85}
                  innerRadius={50} outerRadius={70}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {userDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>No registered users.</div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 11, color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[0] }} /> Patients
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[1] }} /> Doctors
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[2] }} /> Admins
            </span>
          </div>
        </div>
      </div>

      {/* Medication & Prescription Reports */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Top prescribed medications */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Top Prescribed Medications</h3>
          {medications.topMeds.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No medication data available.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {medications.topMeds.map((med, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                      #{i + 1}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{med.name}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{med.count} active prescriptions</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prescription Scanning Metrics */}
        <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>AI Prescription Digitization</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
              Digitization activity summary for OCR scanning and auto-medication conversion on the platform.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Processed Prescriptions</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{prescriptions.processed}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${prescriptions.total > 0 ? (prescriptions.processed / prescriptions.total) * 100 : 100}%`, background: '#10b981' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Pending Process</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>{prescriptions.pending}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${prescriptions.total > 0 ? (prescriptions.pending / prescriptions.total) * 100 : 0}%`, background: '#f59e0b' }} />
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, marginTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
            <span>Success Rate</span>
            <span style={{ fontWeight: 700, color: '#14b8a6' }}>
              {prescriptions.total > 0 ? `${Math.round((prescriptions.processed / prescriptions.total) * 100)}%` : '100%'}
            </span>
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 900px) { div[style*="grid-template-columns: 1.2fr 1fr"] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
