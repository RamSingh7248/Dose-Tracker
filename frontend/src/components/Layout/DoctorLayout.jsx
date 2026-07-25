import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, ClipboardList, Pill, BarChart3, Calendar,
  LogOut, Menu, X, Activity, User, Shield, Bot, FileText, MessageSquare,
  AlertTriangle, FolderHeart, Award, ShieldCheck, Bell, Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/doctor/dashboard',     icon: LayoutDashboard, label: 'Overview' },
  { to: '/doctor/patients',      icon: Users,           label: 'My Patients' },
  { to: '/doctor/notes',         icon: ClipboardList,   label: 'Clinical Notes' },
  { to: '/doctor/prescriptions', icon: Pill,            label: 'Prescriptions' },
  { to: '/doctor/analytics',     icon: BarChart3,       label: 'Analytics' },
  { to: '/doctor/followups',     icon: Calendar,        label: 'Follow-ups' },
  { to: '/doctor/appointments',  icon: Calendar,        label: 'Appointments' },
  { to: '/doctor/ai-assistant',  icon: Bot,             label: 'AI Assistant' },
  { to: '/doctor/reports',       icon: FileText,        label: 'Medical Reports' },
  { to: '/doctor/messages',      icon: MessageSquare,   label: 'Messages' },
  { to: '/doctor/emergency',     icon: AlertTriangle,   label: 'Emergency Alerts' },
  { to: '/doctor/medical-records', icon: FolderHeart,   label: 'Medical Records' },
  { to: '/doctor/performance',   icon: Award,           label: 'Performance' },
  { to: '/doctor/security',      icon: ShieldCheck,     label: 'Security & Logs' },
  { to: '/doctor/notifications', icon: Bell,            label: 'Notifications' },
  { to: '/doctor/settings',     icon: Settings,        label: 'Practice Settings' },
];

export default function DoctorLayout({ children }) {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSwitchPortal = async (targetRole) => {
    try {
      if (targetRole === 'patient') {
        if (user?.role === 'ROLE_PATIENT' || user?.role === 'patient') {
          navigate('/dashboard');
        } else {
          await login('patient@dosetracker.com', 'PatientPassword123!');
          toast.success('Switched to Patient Portal 👤');
          navigate('/dashboard');
        }
      }
    } catch {
      toast.error('Portal switch failed');
    }
  };

  return (
    <div className="main-layout">
      {/* Mobile Toggle */}
      <button
        className="fixed top-4 left-4 z-200 p-2 rounded-lg md:hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-90 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Doctor Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`} style={{ borderRightColor: 'rgba(20, 184, 166, 0.2)' }}>
        {/* Header Branding */}
        <div style={{ padding: '24px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Activity size={20} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                DoseTracker
              </div>
              <div style={{ fontSize: 10, color: '#14b8a6', fontWeight: 700, marginTop: 3, letterSpacing: 0.5 }}>DOCTOR PORTAL</div>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border-color)', margin: '0 16px' }} />

        {/* User Card */}
        <div style={{ padding: '14px 20px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(20, 184, 166, 0.2)', color: '#14b8a6', border: '1px solid rgba(20, 184, 166, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, flexShrink: 0
            }}>
              {user?.name?.[0]?.toUpperCase() || 'D'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Dr. {user?.name || 'Doctor'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.specialization || 'Medical Specialist'}</div>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border-color)', margin: '0 16px 8px' }} />

        {/* Navigation Items */}
        <nav style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              style={({ isActive }) => isActive ? {
                background: 'rgba(20, 184, 166, 0.15)',
                color: '#14b8a6',
                border: '1px solid rgba(20, 184, 166, 0.3)'
              } : {}}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout Footer */}
        <div style={{ padding: '12px 8px 20px' }}>
          <div style={{ height: 1, background: 'var(--border-color)', margin: '0 8px 12px' }} />
          <button
            onClick={handleLogout}
            className="sidebar-link"
            style={{ width: '100%', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--accent-rose)' }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Page Content Area */}
      <main className="page-content">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
