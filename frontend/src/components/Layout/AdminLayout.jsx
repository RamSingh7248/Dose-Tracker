import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, Stethoscope, Calendar, FileText,
  BarChart3, ScrollText, Settings, LogOut, Menu, X, Activity
} from 'lucide-react';
import PWAInstallPrompt from '../PWAInstallPrompt';

const navItems = [
  { to: '/admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users',        icon: Users,           label: 'Users' },
  { to: '/admin/doctors',      icon: Stethoscope,     label: 'Doctors' },
  { to: '/admin/appointments', icon: Calendar,        label: 'Appointments' },
  { to: '/admin/prescriptions',icon: FileText,        label: 'Prescriptions' },
  { to: '/admin/reports',      icon: BarChart3,       label: 'Reports' },
  { to: '/admin/audit-logs',   icon: ScrollText,      label: 'Audit Logs' },
  { to: '/admin/settings',     icon: Settings,        label: 'Settings' },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <div className="main-layout" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <PWAInstallPrompt />

      {/* Mobile Drawer Toggle */}
      <button
        aria-label={mobileOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
        aria-expanded={mobileOpen}
        aria-controls="admin-sidebar"
        className="fixed top-4 left-4 z-[210] p-2.5 rounded-lg lg:hidden flex items-center justify-center transition-colors"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          minWidth: 40,
          minHeight: 40,
        }}
        onClick={() => setMobileOpen(v => !v)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop lg:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Admin Sidebar */}
      <aside
        id="admin-sidebar"
        role="navigation"
        aria-label="Admin navigation"
        className={`sidebar ${mobileOpen ? 'open' : ''}`}
        style={{
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          width: 240,
        }}
      >
        {/* Header Branding */}
        <div style={{ padding: '20px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 6,
              background: '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Activity size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                DoseTracker
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>
                Admin Panel
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border-color)', margin: '0 16px' }} />

        {/* User Card */}
        <div style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--bg-card)', color: '#2563eb', border: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600, flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'System Admin'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Administrator</div>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border-color)', margin: '0 16px 8px' }} />

        {/* Navigation Items */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                background: isActive ? '#2563eb' : 'transparent',
                textDecoration: 'none',
                marginBottom: 2,
                transition: 'background 0.15s ease, color 0.15s ease',
              })}
              onClick={handleClose}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout Footer */}
        <div style={{ padding: '12px 16px 16px' }}>
          <div style={{ height: 1, background: 'var(--border-color)', marginBottom: 12 }} />

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              color: '#f87171',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Page Content Area */}
      <main className="page-content" style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '24px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}


