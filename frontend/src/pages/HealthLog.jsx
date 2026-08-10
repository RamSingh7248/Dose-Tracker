import React, { useEffect, useState } from 'react';
import { medicationApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Download, Calendar, TrendingUp, Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts';

// Simulate 30-day history
const generateHistory = (medications) => {
  const history = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const total = medications.reduce((acc, m) => acc + (m.times?.length || 1), 0);
    const taken = Math.round(total * (0.7 + Math.random() * 0.3));
    const missed = total - taken;
    history.push({ date: label, taken, missed, total, rate: Math.round((taken / Math.max(total,1)) * 100) });
  }
  return history;
};

export default function HealthLog() {
  const { user } = useAuth();
  const [medications, setMedications] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(7);

  useEffect(() => {
    medicationApi.getAll({ isActive: true }).then(r => {
      const meds = r.data.data || [];
      setMedications(meds);
      setHistory(generateHistory(meds));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const rangeData = history.slice(-range);
  const avgAdherence = rangeData.length ? Math.round(rangeData.reduce((a, d) => a + d.rate, 0) / rangeData.length) : 0;
  const totalTaken  = rangeData.reduce((a, d) => a + d.taken, 0);
  const totalMissed = rangeData.reduce((a, d) => a + d.missed, 0);

  const exportCSV = () => {
    const header = 'Date,Total Scheduled,Taken,Missed,Adherence %\n';
    const rows = history.map(r => `${r.date},${r.total},${r.taken},${r.missed},${r.rate}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `health-log-${user?.name || 'report'}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Health Log</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Your complete medication history and adherence report</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary"><Download size={15} /> Export CSV</button>
      </div>

      {/* Range selector */}
      <div className="tab-bar" style={{ width: 'fit-content', marginBottom: 24 }}>
        {[7, 14, 30].map(r => (
          <button key={r} onClick={() => setRange(r)} className={`tab-item ${range === r ? 'active' : ''}`}>
            {r} Days
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Avg Adherence', value: `${avgAdherence}%`, color: '#8b5cf6', icon: TrendingUp },
          { label: 'Doses Taken',   value: totalTaken,          color: '#10b981', icon: Activity },
          { label: 'Doses Missed',  value: totalMissed,         color: '#f43f5e', icon: Calendar },
          { label: 'Medications',   value: medications.length,  color: '#06b6d4', icon: Activity },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="stat-card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Outfit', color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Bar chart */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Daily Dose Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rangeData} margin={{ left: -20, right: 5 }} barCategoryGap="30%">
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval={range > 14 ? 3 : 1} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="taken"  fill="#10b981" radius={[4,4,0,0]} name="Taken" />
              <Bar dataKey="missed" fill="#f43f5e" radius={[4,4,0,0]} name="Missed" />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Adherence line */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Adherence Rate Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={rangeData} margin={{ left: -20, right: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval={range > 14 ? 3 : 1} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0,100]} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} formatter={v => `${v}%`} />
              <Line type="monotone" dataKey="rate" stroke="#8b5cf6" strokeWidth={2.5} dot={false} name="Adherence %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* History table */}
      <div className="glass-card responsive-table-cards" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 15, fontWeight: 700 }}>Detailed History</h3>
        </div>
        <div className="table-responsive" style={{ border: 'none', margin: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['Date','Scheduled','Taken','Missed','Adherence','Status'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rangeData.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td data-label="Date" style={{ padding: '12px 20px', fontWeight: 600 }}>{row.date}</td>
                  <td data-label="Scheduled" style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>{row.total}</td>
                  <td data-label="Taken" style={{ padding: '12px 20px', color: 'var(--accent-emerald)', fontWeight: 600 }}>{row.taken}</td>
                  <td data-label="Missed" style={{ padding: '12px 20px', color: 'var(--accent-rose)', fontWeight: 600 }}>{row.missed}</td>
                  <td data-label="Adherence" style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar" style={{ width: 80 }}>
                        <div className="progress-fill" style={{ width: `${row.rate}%`, background: row.rate >= 80 ? 'var(--gradient-primary)' : row.rate >= 60 ? 'linear-gradient(90deg,#f59e0b,#f97316)' : 'linear-gradient(90deg,#f43f5e,#f97316)' }} />
                      </div>
                      <span style={{ fontWeight: 700, color: row.rate >= 80 ? 'var(--accent-purple)' : row.rate >= 60 ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>{row.rate}%</span>
                    </div>
                  </td>
                  <td data-label="Status" style={{ padding: '12px 20px' }}>
                    <span className={`badge ${row.rate >= 80 ? 'badge-green' : row.rate >= 60 ? 'badge-amber' : 'badge-red'}`}>
                      {row.rate >= 80 ? '✅ Good' : row.rate >= 60 ? '⚠️ Fair' : '❌ Poor'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`@media (max-width: 768px) { .health-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
