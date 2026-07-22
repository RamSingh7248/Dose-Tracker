import React, { useEffect, useState } from 'react';
import { adherenceApi } from '../services/api';
import {
  TrendingUp, Heart, Target, AlertTriangle, Calendar, Award, Activity, CheckCircle, ShieldAlert
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#10b981', '#f43f5e', '#f59e0b', '#9090b0'];
const PERIOD_TABS = ['weekly', 'monthly', 'yearly'];

export default function Adherence() {
  const [period, setPeriod] = useState('weekly');
  const [data, setData] = useState(null);
  const [healthScore, setHealthScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const fetchers = {
        weekly: adherenceApi.getWeekly,
        monthly: adherenceApi.getMonthly,
        yearly: adherenceApi.getYearly,
      };
      const [periodRes, scoreRes] = await Promise.all([
        fetchers[period](),
        adherenceApi.getHealthScore(),
      ]);
      setData(periodRes.data.data);
      setHealthScore(scoreRes.data.data);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (s) => {
    if (s >= 80) return '#10b981';
    if (s >= 60) return '#f59e0b';
    return '#f43f5e';
  };

  const getScoreLabel = (s) => {
    if (s >= 90) return 'Excellent';
    if (s >= 80) return 'Very Good';
    if (s >= 70) return 'Good';
    if (s >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading analytics...</p>
    </div>
  );

  const summary = data?.summary || {};
  const chartData = period === 'yearly' ? (data?.monthly || []) : (data?.daily || []);

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">📊 Health Analytics & Medicine Trends</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Comprehensive analytics: Health Score, Adherence Rate, Completion Rate & Missed Dose Breakdown
          </p>
        </div>
        <div className="tab-bar" style={{ margin: 0 }}>
          {PERIOD_TABS.map(p => (
            <button
              key={p}
              className={`tab-item ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
              style={{ textTransform: 'capitalize' }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Health Score + Key Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {/* Health Score Gauge */}
        <div className="stat-card" style={{ padding: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Health Score</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative', width: 64, height: 64 }}>
              <svg width="64" height="64" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <circle cx="36" cy="36" r="30" fill="none" stroke={getScoreColor(healthScore?.healthScore || 0)} strokeWidth="6"
                  strokeDasharray={`${(healthScore?.healthScore || 0) * 1.884} 188.4`} strokeLinecap="round"
                  transform="rotate(-90 36 36)" style={{ transition: 'stroke-dasharray 1s ease' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, fontFamily: 'Outfit', color: getScoreColor(healthScore?.healthScore || 0) }}>
                {healthScore?.healthScore || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'Outfit', color: getScoreColor(healthScore?.healthScore || 0) }}>
                {getScoreLabel(healthScore?.healthScore || 0)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Out of 100</div>
            </div>
          </div>
        </div>

        {[
          { label: 'Adherence Rate', value: `${summary.adherenceRate || 0}%`, sub: `${summary.taken || 0} / ${summary.total || 0} doses taken`, icon: Target, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
          { label: 'Completion Rate', value: `${summary.completionRate || 0}%`, sub: 'Taken + Skipped', icon: CheckCircle, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
          { label: 'Missed Medicines', value: summary.missed || 0, sub: 'doses missed', icon: AlertTriangle, color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
          { label: 'Current Streak', value: `${healthScore?.streak || 0}`, sub: 'days perfect streak', icon: Award, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Outfit', color: 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>{sub}</p>
              </div>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Trends Chart */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontFamily: 'Outfit', fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color="var(--accent-purple)" /> Medicine Adherence Trends ({period})
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Real-time dose compliance history over time</p>
          </div>
          <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>{period} View</span>
        </div>

        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="takenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="missedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey={period === 'yearly' ? 'label' : 'label'} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#161926', border: '1px solid var(--border-color)', borderRadius: 10, fontSize: 12 }} />
              <Area type="monotone" dataKey="taken" stroke="#10b981" fill="url(#takenGrad)" strokeWidth={2.5} name="Doses Taken" />
              <Area type="monotone" dataKey="missed" stroke="#f43f5e" fill="url(#missedGrad)" strokeWidth={2.5} name="Doses Missed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }} className="analytics-grid">
        
        {/* Per-Medication Adherence Breakdown */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            💊 Per-Medication Completion Breakdown
          </h3>
          {(!data?.perMedication || data.perMedication.length === 0) ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>No active medications logged in this period.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.perMedication.map(item => (
                <div key={item.medication?._id || item.medication?.name} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{item.medication?.name || 'Medication'}</span>
                    <span style={{ fontWeight: 800, fontSize: 13, color: getScoreColor(item.rate) }}>{item.rate}% Adherence</span>
                  </div>
                  <div className="progress-bar" style={{ height: 6 }}>
                    <div className="progress-fill" style={{ width: `${item.rate}%`, background: getScoreColor(item.rate) }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                    <span>Taken: {item.taken}</span>
                    <span>Missed: {item.missed}</span>
                    <span>Total: {item.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Missed Doses Log Widget */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <ShieldAlert size={18} color="#f43f5e" />
            <h3 style={{ fontFamily: 'Outfit', fontSize: 15, fontWeight: 700, color: '#f43f5e' }}>Recent Missed Doses</h3>
          </div>

          {(!healthScore?.missedDosesList || healthScore.missedDosesList.length === 0) ? (
            <div style={{ padding: '16px 0', textAlign: 'center', color: '#10b981', fontSize: 12 }}>
              <CheckCircle size={20} style={{ marginBottom: 4 }} /><br />
              Zero missed doses in the last 30 days!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {healthScore.missedDosesList.map(m => (
                <div key={m._id} style={{ padding: '10px 12px', background: 'rgba(244,63,94,0.08)', borderRadius: 8, border: '1px solid rgba(244,63,94,0.2)' }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>{m.medName}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    Missed on {new Date(m.scheduledTime).toLocaleDateString()} at {new Date(m.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <style>{`
        @media (max-width: 900px) {
          .analytics-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
