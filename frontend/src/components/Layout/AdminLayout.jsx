import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, Shield, BarChart3, LogOut, Menu, X,
  Activity, User, Stethoscope, Calendar, FileText, ScrollText, Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/admin/dashboard',    icon: LayoutDashboard, label: 'System Overview' },
  { to: '/admin/users',        icon: Users,           label: 'User Management' },
  { to: '/admin/doctors',      icon: Shield,          label: 'Doctors Management' },
  { to: '/admin/appointments', icon: Calendar,        label: 'Appointments' },
  { to: '/admin/prescriptions',icon: FileText,        label: 'Prescriptions Vault' },
  { to: '/admin/reports',      icon: BarChart3,       label: 'System Reports' },
  { to: '/admin/audit-logs',   icon: ScrollText,      label: 'Audit Logs' },
  { to: '/admin/settings',     icon: Settings,        label: 'System Settings' },
];

export default function AdminLayout({ children }) {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSwitchPortal = async (targetRole) => {
    try {
      if (targetRole === 'patient' && user?.role !== 'patient') {
        await login('ramub9349@gmail.com', 'Ramu@6458');
        toast.success('Switched to Patient Portal 👤');
        navigate('/dashboard');
      } else if (targetRole === 'doctor' && user?.role !== 'doctor') {
        await login('doctor@dosetracker.com', 'DoctorPassword123!');
        toast.success('Switched to Doctor Portal 🩺');
        navigate('/doctor/dashboard');
      } else {
        if (targetRole === 'patient') navigate('/dashboard');
        else if (targetRole === 'doctor') navigate('/doctor/dashboard');
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

      {/* Admin Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`} style={{ borderRightColor: 'rgba(244, 63, 94, 0.2)' }}>
        {/* Header Branding */}
        <div style={{ padding: '24px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Activity size={20} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                DoseTracker
              </div>
              <div style={{ fontSize: 10, color: '#f43f5e', fontWeight: 700, marginTop: 3, letterSpacing: 0.5 }}>ADMIN PORTAL</div>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border-color)', margin: '0 16px' }} />

        {/* User Card */}
        <div style={{ padding: '14px 20px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, flexShrink: 0
            }}>
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'System Admin'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Administrator</div>
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
                background: 'rgba(244, 63, 94, 0.15)',
                color: '#f43f5e',
                border: '1px solid rgba(244, 63, 94, 0.3)'
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
