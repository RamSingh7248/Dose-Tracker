import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, ClipboardList, Pill, BarChart3, Calendar,
  LogOut, Menu, X, Activity, User, Shield, Bot, FileText, MessageSquare,
  AlertTriangle, FolderHeart, Award, ShieldCheck, Bell, Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import PWAInstallPrompt from '../PWAInstallPrompt';

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

  // Body scroll lock when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
    return () => document.body.classList.remove('sidebar-open');
  }, [mobileOpen]);

  const handleClose = () => setMobileOpen(false);
  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="main-layout">
      <PWAInstallPrompt />

      {/* Mobile & Tablet Drawer Toggle */}
      <button
        aria-label={mobileOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
        aria-expanded={mobileOpen}
        aria-controls="doctor-sidebar"
        className="fixed top-4 left-4 z-[210] p-3 rounded-xl lg:hidden shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          minWidth: 44,
          minHeight: 44,
        }}
        onClick={() => setMobileOpen(v => !v)}
      >
        {mobileOpen
          ? <X size={20} color="#14b8a6" />
          : <Menu size={20} color="var(--text-primary)" />
        }
      </button>

      {/* Overlay Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop lg:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Doctor Sidebar */}
      <aside
        id="doctor-sidebar"
        role="navigation"
        aria-label="Doctor navigation"
        className={`sidebar ${mobileOpen ? 'open' : ''}`}
        style={{ borderRightColor: 'rgba(20, 184, 166, 0.2)' }}
      >
        {/* Header Branding */}
        <div style={{ padding: '20px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Activity size={18} color="white" />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                DoseTracker
              </div>
              <div style={{ fontSize: 10, color: '#14b8a6', fontWeight: 700, marginTop: 3, letterSpacing: 0.5 }}>DOCTOR PORTAL</div>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border-color)', margin: '0 14px' }} />

        {/* User Card */}
        <div style={{ padding: '14px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(20, 184, 166, 0.2)', color: '#14b8a6', border: '1px solid rgba(20, 184, 166, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase() || 'D'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Dr. {user?.name || 'Doctor'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.specialization || 'Medical Specialist'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border-color)', margin: '0 14px 6px' }} />

        {/* Navigation Items */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 8 }}>
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
              onClick={handleClose}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout Footer */}
        <div style={{ padding: '10px 8px 18px' }}>
          <div style={{ height: 1, background: 'var(--border-color)', margin: '0 6px 10px' }} />
          <button
            onClick={handleLogout}
            className="sidebar-link"
            style={{ width: '100%', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--accent-rose)' }}
          >
            <LogOut size={17} style={{ flexShrink: 0 }} />
            <span>Sign Out</span>
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
