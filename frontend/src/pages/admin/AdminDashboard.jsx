import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import { useDashboardSocket, DASHBOARD_QUERY_KEY } from '../../hooks/useDashboardSocket';
import { useTheme } from '../../context/ThemeContext';
import {
  Users, Stethoscope, Calendar, FileText, CheckCircle2, Pill,
  RefreshCw, AlertCircle, Clock, ArrowRight, ShieldCheck, UserCheck,
  Activity, Sun, Moon, Monitor
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend
} from 'recharts';
import toast from 'react-hot-toast';


// ── Simple Stat Card Component ────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, to, subText }) {
  const CardContent = (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        justify: 'space-between',
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
        <div style={{
          width: 34, height: 34, borderRadius: 6,
          background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={18} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {value}
        </div>
        {subText && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {subText}
          </div>
        )}
      </div>
    </div>
  );


  if (to) {
    return (
      <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}

// ── Helper: Format Status Badge ───────────────────────────────────────────────
function StatusBadge({ status }) {
  const norm = (status || '').toLowerCase();
  let bg = '#334155';
  let color = '#94a3b8';
  let border = '#475569';

  if (['completed', 'active', 'approved', 'taken', 'success', 'processed'].includes(norm)) {
    bg = 'rgba(22, 163, 74, 0.15)';
    color = '#4ade80';
    border = 'rgba(22, 163, 74, 0.3)';
  } else if (['scheduled', 'confirmed', 'verified', 'patient'].includes(norm)) {
    bg = 'rgba(37, 99, 235, 0.15)';
    color = '#60a5fa';
    border = 'rgba(37, 99, 235, 0.3)';
  } else if (['pending', 'rescheduled', 'doctor'].includes(norm)) {
    bg = 'rgba(234, 179, 8, 0.15)';
    color = '#facc15';
    border = 'rgba(234, 179, 8, 0.3)';
  } else if (['cancelled', 'inactive', 'suspended', 'missed', 'denied', 'rejected'].includes(norm)) {
    bg = 'rgba(220, 38, 38, 0.15)';
    color = '#f87171';
    border = 'rgba(220, 38, 38, 0.3)';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 500,
        textTransform: 'capitalize',
        background: bg,
        color: color,
        border: `1px solid ${border}`,
      }}
    >
      {norm}
    </span>
  );
}

// ── Header Theme Control Dropdown Component ──────────────────────────────────
function ThemeControl() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const selectTheme = (mode) => {
    setTheme(mode);
    setOpen(false);
  };

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun size={13} color="#f59e0b" />;
    if (theme === 'dark') return <Moon size={13} color="#2563eb" />;
    return <Monitor size={13} color="var(--text-muted)" />;
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 6,
          color: 'var(--text-primary)',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        {getThemeIcon()}
        <span>Theme</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            padding: 4,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
            minWidth: 130,
            zIndex: 100,
          }}
        >
          <div style={{ padding: '6px 10px 4px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', marginBottom: 4 }}>
            Theme
          </div>

          {[
            { id: 'light', label: 'Light', icon: Sun, iconColor: '#f59e0b' },
            { id: 'dark', label: 'Dark', icon: Moon, iconColor: '#2563eb' },
            { id: 'system', label: 'System', icon: Monitor, iconColor: 'var(--text-muted)' },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = theme === item.id;
            return (
              <button
                key={item.id}
                onClick={() => selectTheme(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 10px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? '#2563eb' : 'var(--text-primary)',
                  background: isSelected ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Icon size={14} color={item.iconColor} />
                <span>{item.label}</span>
                {isSelected && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#2563eb' }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [activeChartTab, setActiveChartTab] = useState('weekly');
  const { isConnected, eventHistory } = useDashboardSocket();


  // ── Main Dashboard Aggregate Query ──────────────────────────────────────────
  const {
    data: statsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: async () => {
      const res = await adminApi.getDashboard();
      return res.data.data;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  // ── Recent Appointments Query ───────────────────────────────────────────────
  const { data: appointmentsData } = useQuery({
    queryKey: ['admin-appointments-recent'],
    queryFn: async () => {
      const res = await adminApi.getAppointments();
      return res.data.data || [];
    },
    staleTime: 30 * 1000,
  });

  // ── Recent Prescriptions Query ──────────────────────────────────────────────
  const { data: prescriptionsData } = useQuery({
    queryKey: ['admin-prescriptions-recent'],
    queryFn: async () => {
      const res = await adminApi.getPrescriptions();
      return res.data.data || [];
    },
    staleTime: 30 * 1000,
  });

  const stats = statsData || {};
  const patients = stats.patients || {};
  const doctors = stats.doctors || {};
  const appointments = stats.appointments || {};
  const medications = stats.medications || {};
  const prescriptions = stats.prescriptions || {};

  const recentApptsList = (appointmentsData || []).slice(0, 5);
  const recentRxList = (prescriptionsData || []).slice(0, 5);
  const recentUsersList = (stats.recentUsers || []).slice(0, 5);

  if (isError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 8, background: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={24} color="#f87171" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>Failed to load dashboard data</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
            {error?.message || 'A server connection error occurred'}
          </div>
          <button
            onClick={() => refetch()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', background: '#2563eb', color: '#ffffff',
              border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} /> Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0 0' }}>
            Overview of your healthcare system
          </p>
        </div>



        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Subtle status dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isConnected ? '#16a34a' : '#eab308',
              display: 'inline-block'
            }} />
            <span>{isConnected ? 'Live updates active' : 'Connecting...'}</span>
          </div>

          <ThemeControl />

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isFetching ? 'Syncing' : 'Sync'}</span>
          </button>
        </div>

      </div>

      {/* ── Statistics Cards Grid ────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16
      }}>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 100, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
          ))
        ) : (
          <>
            <StatCard
              label="Total Patients"
              value={patients.total ?? stats.totalPatients ?? 0}
              icon={Users}
              to="/admin/users"
              subText={`${patients.active ?? stats.activePatients ?? 0} active`}
            />
            <StatCard
              label="Doctors"
              value={doctors.total ?? stats.totalDoctors ?? 0}
              icon={Stethoscope}
              to="/admin/doctors"
              subText={`${doctors.verified ?? stats.verifiedDoctors ?? 0} verified`}
            />
            <StatCard
              label="Today's Appointments"
              value={appointments.today ?? 0}
              icon={Calendar}
              to="/admin/appointments"
              subText={`${appointments.completed ?? stats.completedAppointments ?? 0} completed`}
            />
            <StatCard
              label="Prescriptions"
              value={prescriptions.total ?? stats.totalPrescriptions ?? 0}
              icon={FileText}
              to="/admin/prescriptions"
              subText={`${prescriptions.total ?? stats.totalPrescriptions ?? 0} total`}
            />
            <StatCard
              label="Completed Visits"
              value={appointments.completed ?? stats.completedAppointments ?? 0}
              icon={CheckCircle2}
              to="/admin/appointments"
              subText={`${appointments.scheduled ?? 0} scheduled`}
            />
            <StatCard
              label="Medications"
              value={medications.total ?? stats.totalMeds ?? 0}
              icon={Pill}
              to="/admin/prescriptions"
              subText="Active in system"
            />
          </>
        )}
      </div>

      {/* ── Analytics Chart ───────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        padding: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>System Trend Analytics</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Activity metrics from system logs</p>
          </div>

          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-primary)', padding: 3, borderRadius: 6, border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveChartTab('weekly')}
              style={{
                padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer',
                background: activeChartTab === 'weekly' ? '#2563eb' : 'transparent',
                color: activeChartTab === 'weekly' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              7-Day Activity
            </button>
            <button
              onClick={() => setActiveChartTab('monthly')}
              style={{
                padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer',
                background: activeChartTab === 'monthly' ? '#2563eb' : 'transparent',
                color: activeChartTab === 'monthly' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              Monthly Growth
            </button>
          </div>
        </div>

        <div style={{ height: 260 }}>
          {isLoading ? (
            <div style={{ height: '100%', background: 'var(--bg-primary)', borderRadius: 6 }} />
          ) : activeChartTab === 'weekly' ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.weeklyAnalytics || stats.activity || []} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: 12, color: 'var(--text-primary)' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area type="monotone" dataKey="doses" stroke="#2563eb" strokeWidth={2} fill="rgba(37, 99, 235, 0.15)" name="Total Doses" />
                <Area type="monotone" dataKey="taken" stroke="#16a34a" strokeWidth={2} fill="rgba(22, 163, 74, 0.15)" name="Taken Doses" />
                <Area type="monotone" dataKey="appointments" stroke="#d97706" strokeWidth={2} fill="rgba(217, 119, 6, 0.15)" name="Appointments" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyAnalytics || []} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: 12, color: 'var(--text-primary)' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="patients" fill="#2563eb" name="New Patients" radius={[4, 4, 0, 0]} />
                <Bar dataKey="appointments" fill="#16a34a" name="Appointments" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>


      {/* ── Practical Dashboard Content Tables Grid ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {/* Table 1: Recent Appointments */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Recent Appointments</h3>
            <Link to="/admin/appointments" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600 }}>Patient</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600 }}>Doctor</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentApptsList.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                      No appointments recorded
                    </td>
                  </tr>
                ) : (
                  recentApptsList.map((appt) => (
                    <tr key={appt._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {appt.user?.name || 'Patient'}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                        {appt.doctor?.name ? `Dr. ${appt.doctor.name}` : 'Unassigned'}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <StatusBadge status={appt.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Recent Patients */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Recent Patients</h3>
            <Link to="/admin/users" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600 }}>Patient Name</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600 }}>Registration Date</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentUsersList.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                      No patients registered
                    </td>
                  </tr>
                ) : (
                  recentUsersList.map((u) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <StatusBadge status={u.isActive ? 'active' : 'suspended'} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 3: Recent Prescriptions */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Recent Prescriptions</h3>
            <Link to="/admin/prescriptions" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600 }}>Patient</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600 }}>Doctor</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRxList.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                      No prescriptions created
                    </td>
                  </tr>
                ) : (
                  recentRxList.map((rx) => (
                    <tr key={rx._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {rx.user?.name || 'Patient'}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                        {rx.doctor?.name ? `Dr. ${rx.doctor.name}` : 'N/A'}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {rx.createdAt ? new Date(rx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <StatusBadge status={rx.status || 'active'} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: System Activity & Real-Time Log */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>System Activity</h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Live Log</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
            {(stats.recentActivities || []).length === 0 && eventHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                No recent system activity
              </div>
            ) : (
              <>
                {eventHistory.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      fontSize: 12, padding: '8px 10px', borderRadius: 6,
                      background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Activity size={14} color="#2563eb" />
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {item.event}: {item.payload.name || item.payload.title || 'System action'}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {new Date(item.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}

                {(stats.recentActivities || []).map((act, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontSize: 12, padding: '8px 10px', borderRadius: 6,
                      background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13 }}>{act.icon || '•'}</span>
                      <span style={{ color: 'var(--text-primary)' }}>{act.message}</span>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {act.time ? new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>


      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

