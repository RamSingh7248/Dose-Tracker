import React, { useEffect, useState } from 'react';
import { doctorApi } from '../../services/api';
import { Activity, AlertTriangle, Users, TrendingUp, Search, RefreshCw, User, Pill, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const RADIAN = Math.PI / 180;
const COLORS = ['#10b981', '#f43f5e'];

export default function AdherenceAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await doctorApi.getAnalytics();
      setData(res.data.data);
    } catch {
      toast.error('Failed to load adherence analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: 40, height: 40, borderColor: '#14b8a6', borderTopColor: 'transparent' }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Aggregating adherence statistics...</p>
    </div>
  );

  const summary = data?.summary || { totalPatients: 0, lowAdherenceCount: 0, averageAdherence: 100 };
  const patientStats = data?.patientStats || [];
  const recentMissed = data?.recentMissed || [];

  const filteredPatients = patientStats.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const riskData = [
    { name: 'On Track (>=80%)', value: summary.totalPatients - summary.lowAdherenceCount },
    { name: 'At Risk (<80%)', value: summary.lowAdherenceCount }
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#14b8a6' }}>📊 Adherence Analytics</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Monitor treatment compliance and identify at-risk patients</p>
        </div>
        <button className="btn-secondary" onClick={fetchAnalytics} style={{ borderColor: 'rgba(20,184,166,0.3)', color: '#14b8a6' }}>
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      {/* Aggregate Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Assigned Patients', value: summary.totalPatients, icon: Users, color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
          { label: 'Average Patient Compliance', value: `${summary.averageAdherence}%`, icon: TrendingUp, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'At-Risk Patients (<80%)', value: summary.lowAdherenceCount, icon: AlertTriangle, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Outfit', lineHeight: 1 }}>{value}</p>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: 20, marginBottom: 28 }}>
        {/* Compliance Histogram */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Patient Adherence Rates</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patientStats.slice(0, 10)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} domain={[0, 100]} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="adherenceRate" fill="#14b8a6" radius={[4, 4, 0, 0]}>
                  {patientStats.slice(0, 10).map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.adherenceRate >= 80 ? '#10b981' : entry.adherenceRate >= 50 ? '#f59e0b' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981', display: 'inline-block' }} /> On Track (&ge; 80%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b', display: 'inline-block' }} /> Moderate Risk (50-79%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f43f5e', display: 'inline-block' }} /> High Risk (&lt; 50%)
            </span>
          </div>
        </div>

        {/* Risk Breakdown Pie Chart */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Patient Risk Status</h3>
          <div style={{ display: 'flex', justifyContent: 'center', height: 180 }}>
            {summary.totalPatients > 0 ? (
              <PieChart width={180} height={180}>
                <Pie
                  data={riskData}
                  cx={85} cy={85}
                  innerRadius={50} outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>No patients assigned</div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} /> On Track
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f43f5e' }} /> At Risk
            </span>
          </div>
        </div>
      </div>

      {/* Patient Specific Adherence table & Recent Missed Doses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        {/* Adherence List */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700 }}>Patient Adherence Breakdown</h3>
            <div style={{ position: 'relative', width: 220 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="input-field" 
                style={{ padding: '6px 12px 6px 30px', fontSize: 12 }} 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: 10, textAlign: 'left', fontWeight: 600 }}>Patient</th>
                  <th style={{ padding: 10, textAlign: 'center', fontWeight: 600 }}>Meds</th>
                  <th style={{ padding: 10, textAlign: 'center', fontWeight: 600 }}>Taken / Total</th>
                  <th style={{ padding: 10, textAlign: 'right', fontWeight: 600 }}>Adherence</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>No patients found</td></tr>
                ) : filteredPatients.map(p => (
                  <tr key={p.patientId} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }} onClick={() => navigate(`/doctor/patients/${p.patientId}`)}>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.email}</div>
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}><Pill size={14} style={{ display: 'inline', marginRight: 4 }} />{p.activeMeds}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>{p.takenDoses} / {p.totalDoses}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 700, color: p.adherenceRate >= 80 ? '#10b981' : p.adherenceRate >= 50 ? '#f59e0b' : '#f43f5e' }}>
                      {p.adherenceRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Missed Doses Log */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, color: 'var(--accent-rose)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={18} /> Recent Missed Doses (30 Days)
          </h3>
          {recentMissed.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No recent missed doses recorded.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentMissed.map(m => (
                <div key={m._id} style={{ padding: 12, borderRadius: 10, background: 'rgba(244,63,94,0.04)', border: '1px solid rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(244,63,94,0.1)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.patientName}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(m.missedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Missed: {m.medName} {m.dosage && `(${m.dosage})`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@media (max-width: 900px) { div[style*="grid-template-columns: 1.6fr 1fr"] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
