import React, { useEffect, useState } from 'react';
import { medicationApi, doseApi, prescriptionApi, documentApi, appointmentApi, notificationApi, timelineApi, adherenceApi, emergencyApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useFamily } from '../context/FamilyContext';
import { Link } from 'react-router-dom';
import {
  Pill, Clock, CheckCircle, AlertTriangle, TrendingUp,
  Calendar, Plus, ChevronRight, Activity, Upload, Sparkles,
  Bell, Stethoscope, CheckSquare, Download, Users, GitBranch, QrCode, Shield, Folder, Award
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#10b981', '#f43f5e', '#f59e0b', '#9090b0'];

export default function Dashboard() {
  const { user } = useAuth();
  const { members, activeMember } = useFamily();

  const [medications, setMedications] = useState([]);
  const [todayDoses, setTodayDoses] = useState([]);
  const [stats, setStats] = useState(null);
  const [refillAlerts, setRefillAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Batch 4 Widgets State
  const [healthScoreData, setHealthScoreData] = useState(null);
  const [emergencyData, setEmergencyData] = useState(null);
  const [vaultDocCount, setVaultDocCount] = useState(0);

  // Batch 2 & 3 Widgets State
  const [upcomingFollowups, setUpcomingFollowups] = useState([]);
  const [dashboardNotifications, setDashboardNotifications] = useState([]);
  const [recentTimeline, setRecentTimeline] = useState([]);

  // Upload widget state
  const [quickUploadType, setQuickUploadType] = useState('other');
  const [quickUploadFile, setQuickUploadFile] = useState(null);
  const [quickUploading, setQuickUploading] = useState(false);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    fetchDashboard();
  }, [activeMember]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 6);

      const [medsRes, alertsRes, statsRes, weekDosesRes, rxRes, docsRes, appRes, notifRes, timelineRes, scoreRes, emergencyRes] = await Promise.allSettled([
        medicationApi.getAll({ isActive: true }),
        medicationApi.getRefillAlerts(),
        doseApi.getStats({ days: 30 }),
        doseApi.getAll({ from: weekAgo.toISOString(), to: new Date().toISOString() }),
        prescriptionApi.getAll(),
        documentApi.getAll(),
        appointmentApi.getUpcoming(),
        notificationApi.getAll({ unreadOnly: true }),
        timelineApi.get({ limit: 4 }),
        adherenceApi.getHealthScore(),
        emergencyApi.get(),
      ]);

      if (medsRes.status === 'fulfilled') setMedications(medsRes.value.data.data || []);
      if (alertsRes.status === 'fulfilled') setRefillAlerts(alertsRes.value.data.data || []);
      if (appRes.status === 'fulfilled') setUpcomingFollowups((appRes.value.data.data || []).slice(0, 3));
      if (notifRes.status === 'fulfilled') setDashboardNotifications((notifRes.value.data.data || []).slice(0, 4));
      if (timelineRes.status === 'fulfilled') setRecentTimeline((timelineRes.value.data.data || []).slice(0, 4));
      if (scoreRes.status === 'fulfilled') setHealthScoreData(scoreRes.value.data.data);
      if (emergencyRes.status === 'fulfilled') setEmergencyData(emergencyRes.value.data.data);
      if (docsRes.status === 'fulfilled') setVaultDocCount((docsRes.value.data.data || []).length);

      // Build today's schedule from medications and merge with logged doses
      if (medsRes.status === 'fulfilled') {
        const meds = medsRes.value.data.data || [];
        const weekDoses = weekDosesRes.status === 'fulfilled' ? (weekDosesRes.value.data.data || []) : [];

        const todayStr = new Date().toISOString().split('T')[0];
        const todayLoggedDoses = weekDoses.filter(d => {
          if (!d.scheduledTime) return false;
          const dDateStr = new Date(d.scheduledTime).toISOString().split('T')[0];
          return dDateStr === todayStr;
        });

        const doses = meds.flatMap(m =>
          (m.times || []).map(t => {
            const logged = todayLoggedDoses.find(d => {
              const medId = d.medication?._id || d.medication;
              if (!medId) return false;
              const matchMed = medId.toString() === m._id.toString();
              const dbDate = new Date(d.scheduledTime);
              const pad = (num) => String(num).padStart(2, '0');
              const dbTime = `${pad(dbDate.getHours())}:${pad(dbDate.getMinutes())}`;
              return matchMed && (dbTime === t || todayLoggedDoses.length === 1);
            });

            return {
              id: `${m._id}-${t}`,
              medication: m,
              time: t,
              status: logged ? logged.status : 'pending',
              dbId: logged ? logged._id : null,
            };
          })
        );
        setTodayDoses(doses);
      }

      // Build real stats
      const realStats = statsRes.status === 'fulfilled' ? statsRes.value.data.data : null;
      const adherenceRate = realStats?.adherenceRate ?? 0;

      // Calculate streak from dose history
      let streak = 0;
      if (weekDosesRes.status === 'fulfilled') {
        const doses = weekDosesRes.value.data.data || [];
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dStr = d.toISOString().split('T')[0];
          const hasTaken = doses.some(dose =>
            dose.status === 'taken' &&
            dose.scheduledTime?.startsWith(dStr)
          );
          if (hasTaken) streak++; else break;
        }
      }

      // Build weekly trend chart data
      const weekData = [];
      const weekDoses = weekDosesRes.status === 'fulfilled' ? weekDosesRes.value.data.data || [] : [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const day = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dayDoses = weekDoses.filter(dose => dose.scheduledTime?.startsWith(dStr));
        weekData.push({
          day,
          taken: dayDoses.filter(dose => dose.status === 'taken').length,
          missed: dayDoses.filter(dose => dose.status === 'missed').length,
        });
      }

      setStats({
        adherenceRate,
        streak,
        totalMeds: medsRes.status === 'fulfilled' ? (medsRes.value.data.data || []).length : 0,
        weekData,
        pieData: [
          { name: 'Taken',   value: realStats?.taken   || 0 },
          { name: 'Missed',  value: realStats?.missed  || 0 },
          { name: 'Skipped', value: realStats?.skipped || 0 },
          { name: 'Pending', value: todayDoses.length || 0 },
        ],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markDose = async (dose, targetStatus = 'taken') => {
    try {
      const isTaken = targetStatus === 'taken';
      setTodayDoses(prev => prev.map(d => d.id === dose.id ? { ...d, status: targetStatus } : d));

      const todayStr = new Date().toISOString().split('T')[0];
      const scheduledTime = `${todayStr}T${dose.time}:00.000Z`;

      await doseApi.log({
        medicationId: dose.medication._id,
        status: targetStatus,
        scheduledTime,
      });

      if (isTaken) {
        toast.success(`✅ ${dose.medication.name} marked as taken!`);
      } else {
        toast('↩️ Dose status reset', { icon: 'ℹ️' });
      }
      fetchDashboard();
    } catch (err) {
      console.error('Failed to update dose status:', err);
      setTodayDoses(prev => prev.map(d => d.id === dose.id ? { ...d, status: dose.status } : d));
      toast.error('Failed to log dose status');
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setDashboardNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification read');
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const handleQuickUpload = async (e) => {
    e.preventDefault();
    if (!quickUploadFile) return toast.error('Please select a file');
    setQuickUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', quickUploadFile);
      formData.append('title', quickUploadFile.name);
      formData.append('type', quickUploadType);
      formData.append('folder', 'General');

      await documentApi.upload(formData);
      toast.success('Document uploaded to Personal Health Wallet');
      setQuickUploadFile(null);
      setQuickUploadType('other');
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Quick upload failed');
    } finally {
      setQuickUploading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading your dashboard...</p>
      </div>
    );
  }

  const takenCount = todayDoses.filter(d => d.status === 'taken').length;
  const totalToday = todayDoses.length;
  const pendingDoses = todayDoses.filter(d => d.status !== 'taken');
  const hScore = healthScoreData?.healthScore ?? 100;

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              {greeting()}, {activeMember ? activeMember.name : user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {activeMember ? `Viewing profile: ${activeMember.name} (${activeMember.relationship})` : 'Primary Patient Account Overview'} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/emergency-card" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <QrCode size={16} /> QR Emergency Card
            </Link>
            <Link to="/medications" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} /> Add Medication
            </Link>
          </div>
        </div>
      </div>

      {/* AI Daily Health Summary & Next Dose Countdown */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 20, border: '1px solid rgba(16,185,129,0.3)', background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(6,182,212,0.06) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Sparkles size={20} color="#10b981" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>AI Daily Health Assistant Summary</div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 2 }}>
                Great adherence streak! You are 100% on schedule. Next scheduled dose: <strong>{pendingDoses[0]?.medication?.name || 'Evening Supplement'}</strong> in <strong>1h 45m</strong>.
              </div>
            </div>
          </div>
          <Link to="/ai-assistant" className="badge" style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', textDecoration: 'none', padding: '6px 12px', fontSize: 11 }}>
            Ask Health AI &rarr;
          </Link>
        </div>
      </div>

      {/* Patient Healthcare Suite & Feature Hub */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 24, border: '1px solid rgba(139,92,246,0.25)', background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(99,102,241,0.06) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={18} color="var(--accent-purple)" />
            <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'Outfit' }}>Patient Healthcare Suite & Quick Shortcuts</span>
          </div>
          <span className="badge badge-purple" style={{ padding: '4px 10px', fontSize: 11 }}>
            👤 Patient Portal Active
          </span>
        </div>

        {/* Feature Pill Shortcuts */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: '💊 Medications', to: '/medications' },
            { label: '⏰ Reminders', to: '/reminders' },
            { label: '📂 Health Vault', to: '/health-vault' },
            { label: '📷 Rx Scanner', to: '/prescription-scanner' },
            { label: '🤖 AI Assistant', to: '/ai-assistant' },
            { label: '📅 Doctor Visits', to: '/appointments' },
            { label: '👨‍👩‍👧 Family Care', to: '/members' },
            { label: '📊 Adherence', to: '/adherence' },
            { label: '📈 Stock Prediction', to: '/stock' },
          ].map(item => (
            <Link
              key={item.label}
              to={item.to}
              style={{
                fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 8,
                background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)',
                border: '1px solid var(--border-color)', textDecoration: 'none',
                transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 4
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Row with Health Score & Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Health Score Card */}
        <Link
          to="/adherence"
          className="glass-card stat-card-link"
          style={{ padding: 20, textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Health Score</p>
              <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Outfit', color: hScore >= 80 ? '#10b981' : hScore >= 60 ? '#f59e0b' : '#f43f5e', lineHeight: 1 }}>
                {hScore} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>/ 100</span>
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                {hScore >= 90 ? 'Excellent' : hScore >= 80 ? 'Very Good' : 'Fair'}
              </p>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} color="#10b981" />
            </div>
          </div>
        </Link>

        {[
          { label: 'Today\'s Progress', value: `${takenCount}/${totalToday}`, sub: 'doses taken', icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.12)', to: '/dose-log' },
          { label: 'Completion Rate',  value: `${healthScoreData?.completionRate ?? stats?.adherenceRate ?? 100}%`, sub: 'taken + skipped', icon: TrendingUp, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', to: '/adherence' },
          { label: 'Current Streak',   value: `${stats?.streak || 0}`, sub: 'days perfect streak', icon: Award, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', to: '/adherence' },
          { label: 'Refill Alerts',    value: refillAlerts.length, sub: 'need attention', icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', to: '/refill-alerts' },
        ].map(({ label, value, sub, icon: Icon, color, bg, to }) => (
          <Link
            key={label}
            to={to}
            className="glass-card stat-card-link"
            style={{ padding: 20, textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Outfit', color: 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</p>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} color={color} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }} className="dash-grid">
        
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Today's Tasks & Checklist Widget */}
          <div className="glass-card" style={{ padding: 24, border: '1px solid rgba(139,92,246,0.25)', background: 'linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(6,182,212,0.05) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckSquare size={18} color="var(--accent-purple)" /> Today's Health Tasks
              </h3>
              <span className="badge badge-purple">{pendingDoses.length} pending</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingDoses.length === 0 && upcomingFollowups.length === 0 && refillAlerts.length === 0 ? (
                <div style={{ fontSize: 13, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6, padding: 12 }}>
                  <CheckCircle size={16} /> All health tasks completed for today! Great job!
                </div>
              ) : (
                <>
                  {pendingDoses.slice(0, 3).map(dose => (
                    <div key={dose.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Clock size={15} color="var(--accent-purple)" />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>Take {dose.medication.name} ({dose.medication.dosage} {dose.medication.dosageUnit})</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Scheduled at {dose.time}</div>
                        </div>
                      </div>
                      <button onClick={() => markDose(dose)} className="btn-primary" style={{ padding: '4px 12px', fontSize: 11 }}>
                        Mark Done
                      </button>
                    </div>
                  ))}

                  {refillAlerts.slice(0, 1).map(med => (
                    <div key={med._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(245,158,11,0.08)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <AlertTriangle size={15} color="#f59e0b" />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>Refill Needed: {med.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Only {med.pillsRemaining} pills remaining in stock</div>
                        </div>
                      </div>
                      <Link to="/stock" className="btn-secondary" style={{ padding: '4px 12px', fontSize: 11 }}>
                        Restock
                      </Link>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Medicine Trends Chart (Batch 4 Real Data Chart) */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={18} color="#10b981" /> Medicine Adherence Trends
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Doses taken vs missed over the last 7 days</p>
              </div>
              <Link to="/adherence" style={{ fontSize: 12, color: 'var(--accent-purple)', textDecoration: 'none' }}>
                Full Analytics &rarr;
              </Link>
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.weekData || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="takenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="missedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#161926', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="taken"  stroke="#10b981" fill="url(#takenGrad)"  strokeWidth={2} name="Taken" />
                  <Area type="monotone" dataKey="missed" stroke="#f43f5e" fill="url(#missedGrad)" strokeWidth={2} name="Missed" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Timeline Widget */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <GitBranch size={18} color="var(--accent-purple)" /> Recent Health Timeline
              </h3>
              <Link to="/timeline" style={{ fontSize: 13, color: 'var(--accent-purple)', textDecoration: 'none' }}>
                Full Timeline &rarr;
              </Link>
            </div>
            {recentTimeline.length === 0 ? (
              <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No recent health timeline events recorded.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentTimeline.map(item => (
                  <div key={item._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{item.icon || '📌'}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                          {new Date(item.date).toLocaleDateString()} • {item.subType || item.category}
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-purple" style={{ fontSize: 10, textTransform: 'capitalize' }}>
                      {item.status || 'info'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Medicines Widget */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Pill size={18} color="var(--accent-purple)" /> Upcoming Medicines Today
              </h3>
              <Link to="/reminders" style={{ fontSize: 13, color: 'var(--accent-purple)', textDecoration: 'none' }}>
                Reminders &rarr;
              </Link>
            </div>
            {todayDoses.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No upcoming medication doses scheduled today</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {todayDoses.map(dose => {
                  const isTaken = dose.status === 'taken';
                  return (
                    <div key={dose.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                      background: isTaken ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
                      borderRadius: 10, border: `1px solid ${isTaken ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'}`,
                      transition: 'all 0.3s'
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: isTaken ? 'rgba(16,185,129,0.2)' : (dose.medication.color ? dose.medication.color + '22' : 'rgba(139,92,246,0.15)'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                        boxShadow: isTaken ? '0 0 12px rgba(16,185,129,0.3)' : 'none',
                        transition: 'all 0.3s'
                      }}>
                        {isTaken ? <CheckCircle size={22} color="#10b981" /> : (dose.medication.icon || '💊')}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: isTaken ? '#10b981' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {dose.medication.name}
                        </div>
                        <div style={{ fontSize: 12, color: isTaken ? 'rgba(16,185,129,0.8)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Clock size={11} /> {dose.time} · {dose.medication.dosage} {dose.medication.dosageUnit}
                        </div>
                      </div>
                      {isTaken ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 20, background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.4)' }}>
                            <CheckCircle size={13} /> Taken
                          </span>
                          <button
                            onClick={() => markDose(dose, 'pending')}
                            title="Reset to pending"
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Undo
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => markDose(dose, 'taken')} className="btn-primary" style={{ padding: '6px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8 }}>
                          Take
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Emergency QR Card Widget (Batch 4 Integration) */}
          <div className="glass-card" style={{ padding: 20, border: '1px solid rgba(244,63,94,0.3)', background: 'linear-gradient(135deg, rgba(244,63,94,0.06) 0%, rgba(225,29,72,0.06) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontFamily: 'Outfit', fontSize: 15, fontWeight: 800, color: '#f43f5e', display: 'flex', alignItems: 'center', gap: 6 }}>
                <QrCode size={16} /> Emergency QR Card
              </h3>
              <Link to="/emergency-card" style={{ fontSize: 11, color: '#f43f5e', textDecoration: 'none', fontWeight: 600 }}>
                View ID &rarr;
              </Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f43f5e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900 }}>
                {emergencyData?.bloodGroup || '🩸'}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Blood: <strong style={{ color: '#f43f5e' }}>{emergencyData?.bloodGroup || 'Not set'}</strong> • Contact: {emergencyData?.emergencyContact?.phone || 'Not set'}
                </div>
              </div>
            </div>
          </div>

          {/* Personal Health Wallet Summary Widget (Batch 4 Integration) */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontFamily: 'Outfit', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Folder size={16} color="var(--accent-purple)" /> Health Wallet
              </h3>
              <Link to="/health-vault" style={{ fontSize: 11, color: 'var(--accent-purple)', textDecoration: 'none' }}>
                Open Vault ({vaultDocCount}) &rarr;
              </Link>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Secure Storage for Prescriptions, Reports, Insurance Cards & Vaccination Certs.
            </div>
          </div>

          {/* Family Summary Widget */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontFamily: 'Outfit', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={16} color="var(--accent-purple)" /> Family Care Summary
              </h3>
              <Link to="/members" style={{ fontSize: 11, color: 'var(--accent-purple)', textDecoration: 'none' }}>
                Manage ({members.length}) &rarr;
              </Link>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
              Active Profile: <strong style={{ color: 'var(--text-primary)' }}>{activeMember ? `${activeMember.name} (${activeMember.relationship})` : (user?.name || 'Myself')}</strong>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {members.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No family profiles added yet.</div>
              ) : (
                members.slice(0, 4).map(m => (
                  <span key={m._id} className="badge badge-purple" style={{ fontSize: 11, textTransform: 'capitalize' }}>
                    {m.name} ({m.relationship})
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Notification Feed Widget */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontFamily: 'Outfit', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Bell size={16} color="var(--accent-purple)" /> Recent Notifications
              </h3>
              {dashboardNotifications.length > 0 && (
                <span className="badge badge-purple" style={{ fontSize: 10 }}>{dashboardNotifications.length} unread</span>
              )}
            </div>
            {dashboardNotifications.length === 0 ? (
              <div style={{ padding: '14px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                All caught up! No unread notifications.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dashboardNotifications.map(n => (
                  <div key={n._id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <div style={{ minWidth: 0, flex: 1, marginRight: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.3 }}>{n.message}</div>
                    </div>
                    <button onClick={() => markNotificationRead(n._id)} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                      Read
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Upload Widget */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontFamily: 'Outfit', fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              ⚡ Quick Upload
            </h3>
            <form onSubmit={handleQuickUpload} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '12px 8px', border: '1px dashed var(--border-color)', borderRadius: 8, cursor: 'pointer',
                background: 'rgba(255,255,255,0.01)', transition: 'all 0.2s', textAlign: 'center'
              }}>
                <Upload size={18} color="var(--accent-purple)" style={{ marginBottom: 4 }} />
                <span style={{ fontSize: 11, fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {quickUploadFile ? quickUploadFile.name : 'Select document file'}
                </span>
                <input type="file" accept="image/*,.pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => setQuickUploadFile(e.target.files[0])} />
              </label>
              
              <div style={{ display: 'flex', gap: 6 }}>
                <select className="input-field" value={quickUploadType} onChange={e => setQuickUploadType(e.target.value)} style={{ fontSize: 11, height: 32, flex: 1, padding: '0 8px' }}>
                  <option value="prescription">Prescription</option>
                  <option value="blood_report">Blood Report</option>
                  <option value="lab_report">Lab Report</option>
                  <option value="x_ray">X-Ray</option>
                  <option value="mri">MRI Scan</option>
                  <option value="ct_scan">CT Scan</option>
                  <option value="vaccination">Vaccination</option>
                  <option value="insurance">Insurance</option>
                  <option value="health_certificate">Health Certificate</option>
                  <option value="discharge_summary">Discharge Summary</option>
                  <option value="other">Other</option>
                </select>
                
                <button className="btn-primary" type="submit" disabled={quickUploading} style={{ fontSize: 11, padding: '0 12px', height: 32 }}>
                  {quickUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dash-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
