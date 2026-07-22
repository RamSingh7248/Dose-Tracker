import React, { useState } from 'react';
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

  const handleLogout = () => { logout(); navigate('/'); };

  const handleSwitchPortal = async (targetRole) => {
    try {
      if (targetRole === 'doctor') {
        if (user?.role === 'ROLE_DOCTOR' || user?.role === 'doctor') {
          navigate('/doctor/dashboard');
        } else {
          await login('doctor@dosetracker.com', 'DoctorPassword123!');
          toast.success('Switched to Doctor Portal 🩺');
          navigate('/doctor/dashboard');
        }
      }
    } catch {
      toast.error('Portal switch failed');
    }
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="fixed top-4 left-4 z-200 p-2 rounded-lg md:hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-90 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Activity size={20} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                DoseTracker
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Patient Portal</div>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border-color)', margin: '0 16px' }} />

        {/* User Profile Summary */}
        <div style={{ padding: '16px 20px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Patient Account
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border-color)', margin: '0 16px 8px' }} />

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
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
    </>
  );
}
