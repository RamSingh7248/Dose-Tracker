import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Pill, Clock, Users, FileText,
  AlertTriangle, LogOut, Menu, X, Activity, Bell,
  Calendar, BarChart3, GitBranch, FolderHeart, QrCode,
  ScanLine, Bot, Package, Settings, Stethoscope, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/medications',  icon: Pill,             label: 'Medications' },
  { to: '/dose-log',     icon: Clock,            label: 'Dose Log' },
  { to: '/reminders',   icon: Bell,             label: 'Reminders' },
  { to: '/members',      icon: Users,            label: 'Members' },
  { to: '/health-log',   icon: FileText,         label: 'Health Log' },
  { to: '/refill-alerts',icon: AlertTriangle,    label: 'Refill Alerts' },
  // ── Extended Features ──
  { to: '/appointments',          icon: Calendar,     label: 'Appointments' },
  { to: '/adherence',             icon: BarChart3,    label: 'Adherence' },
  { to: '/health-timeline',       icon: GitBranch,    label: 'Timeline' },
  { to: '/prescription-scanner',  icon: ScanLine,     label: 'Rx Scanner' },
  { to: '/health-vault',          icon: FolderHeart,  label: 'Health Vault' },
  { to: '/stock',                 icon: Package,      label: 'Stock' },
  { to: '/ai-assistant',          icon: Bot,          label: 'AI Assistant' },
  { to: '/emergency-card',        icon: QrCode,       label: 'Emergency Card' },
  { to: '/wellness',              icon: Activity,     label: 'Wellness' },
  { to: '/security',              icon: Shield,       label: 'Security & 2FA' },
  { to: '/settings',              icon: Settings,     label: 'Settings' },
];

export default function Sidebar() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll when drawer is open on mobile
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
    <>
      {/* Mobile & Tablet Drawer Toggle */}
      <button
        aria-label={mobileOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
        aria-expanded={mobileOpen}
        aria-controls="main-sidebar"
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
          ? <X size={20} color="var(--accent-purple)" />
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

      {/* Sidebar */}
      <aside
        id="main-sidebar"
        role="navigation"
        aria-label="Main navigation"
        className={`sidebar ${mobileOpen ? 'open' : ''}`}
      >
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Activity size={18} color="white" />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                DoseTracker
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Patient Portal</div>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border-color)', margin: '0 14px' }} />

        {/* User Profile Summary */}
        <div style={{ padding: '14px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Patient Account
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border-color)', margin: '0 14px 6px' }} />

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 8 }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={handleClose}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
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
    </>
  );
}
