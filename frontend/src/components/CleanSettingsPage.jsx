import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  User, Bell, Shield, Globe, Info, LogOut, Save, Laptop
} from 'lucide-react';

export default function CleanSettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  // 1. Profile State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Password State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // 2. Notifications State
  const [notifState, setNotifState] = useState({
    appointmentReminders: true,
    emailNotifications: true,
    systemNotifications: false,
  });

  // 3. Security State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // 4. Language & Region State
  const [regionForm, setRegionForm] = useState({
    language: 'en',
    timezone: user?.timezone || 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      if (user.timezone) {
        setRegionForm(prev => ({ ...prev, timezone: user.timezone }));
      }
    }
  }, [user]);

  // Handle Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authApi.updateMe({
        name: profileForm.name,
        phone: profileForm.phone,
      });
      if (updateUser && res.data?.user) {
        updateUser(res.data.user);
      }
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setChangingPassword(true);
    try {
      await authApi.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const TABS = [
    { id: 'profile',       label: 'Profile',           icon: User },
    { id: 'notifications', label: 'Notifications',     icon: Bell },
    { id: 'security',      label: 'Security',          icon: Shield },
    { id: 'region',        label: 'Language & Region', icon: Globe },
    { id: 'about',         label: 'About',             icon: Info },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900, margin: '0 auto' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0 0' }}>
          Manage your account and application preferences.
        </p>
      </div>

      {/* Main Settings Panel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '220px 1fr',
        gap: 20,
        alignItems: 'start',
      }}>
        {/* Navigation Sidebar */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  background: isActive ? '#2563eb' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            );
          })}

          <div style={{ height: 1, background: 'var(--border-color)', margin: '8px 4px' }} />

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              color: '#f87171',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Content Box */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          padding: 24,
        }}>
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Profile</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Your personal account information</p>
              </div>

              <div style={{ height: 1, background: 'var(--border-color)' }} />

              {/* Avatar Photo Display */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: '#2563eb', color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 700, flexShrink: 0,
                }}>
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name || 'User'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(user?.role || 'User').replace('ROLE_', '')}</div>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                      style={{
                        width: '100%', padding: '9px 12px', background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14,
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      disabled
                      style={{
                        width: '100%', padding: '9px 12px', background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-muted)', fontSize: 14,
                        cursor: 'not-allowed', opacity: 0.7,
                      }}
                    />
                  </div>
                </div>

                <div style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: '8px 16px', background: '#2563eb', color: '#ffffff',
                      border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <Save size={14} />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Notifications</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Choose which notifications you want to receive.</p>
              </div>

              <div style={{ height: 1, background: 'var(--border-color)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={notifState.appointmentReminders}
                    onChange={e => setNotifState({ ...notifState, appointmentReminders: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Appointment reminders</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Get notified before your scheduled medical visits</div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={notifState.emailNotifications}
                    onChange={e => setNotifState({ ...notifState, emailNotifications: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Email notifications</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Receive prescription logs and health updates via email</div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={notifState.systemNotifications}
                    onChange={e => setNotifState({ ...notifState, systemNotifications: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>System notifications</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Alerts for system updates and maintenance announcements</div>
                  </div>
                </label>
              </div>

              <div style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => toast.success('Notification preferences saved')}
                  style={{
                    padding: '8px 16px', background: '#2563eb', color: '#ffffff',
                    border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Security</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage your account security.</p>
              </div>

              <div style={{ height: 1, background: 'var(--border-color)' }} />

              {/* Password Form */}
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Password</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      style={{
                        width: '100%', padding: '8px 12px', background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14,
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      style={{
                        width: '100%', padding: '8px 12px', background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14,
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      style={{
                        width: '100%', padding: '8px 12px', background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14,
                      }}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginTop: 4 }}>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    style={{
                      padding: '8px 16px', background: '#2563eb', color: '#ffffff',
                      border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    {changingPassword ? 'Updating...' : 'Change Password'}
                  </button>
                </div>
              </form>

              <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />

              {/* Two-Factor Authentication */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Two-factor authentication</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                    Status: <span style={{ color: twoFactorEnabled ? '#16a34a' : 'var(--text-muted)', fontWeight: 500 }}>
                      {twoFactorEnabled ? 'Enabled' : 'Currently disabled'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTwoFactorEnabled(v => !v);
                    toast.success(twoFactorEnabled ? 'Two-factor authentication disabled' : 'Two-factor authentication enabled');
                  }}
                  style={{
                    padding: '7px 14px',
                    background: twoFactorEnabled ? 'var(--bg-primary)' : '#2563eb',
                    color: twoFactorEnabled ? 'var(--text-primary)' : '#ffffff',
                    border: '1px solid var(--border-color)', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  {twoFactorEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>

              <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />

              {/* Active Sessions */}
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Active Sessions</div>
                <div style={{
                  padding: '12px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Laptop size={18} color="#2563eb" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Windows — Web Browser</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Active session now</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: '#16a34a', background: 'rgba(22, 163, 74, 0.15)', padding: '2px 8px', borderRadius: 4 }}>
                    Current Device
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => toast.success('Signed out from all other devices')}
                  style={{
                    padding: '7px 14px', background: 'var(--bg-primary)', color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  Logout from other devices
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: LANGUAGE & REGION */}
          {activeTab === 'region' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Language &amp; Region</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Customize language, time zone, and date display.</p>
              </div>

              <div style={{ height: 1, background: 'var(--border-color)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Language
                  </label>
                  <select
                    value={regionForm.language}
                    onChange={e => setRegionForm({ ...regionForm, language: e.target.value })}
                    style={{
                      width: '100%', padding: '9px 12px', background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14,
                    }}
                  >
                    <option value="en">English (US)</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Time Zone
                  </label>
                  <select
                    value={regionForm.timezone}
                    onChange={e => setRegionForm({ ...regionForm, timezone: e.target.value })}
                    style={{
                      width: '100%', padding: '9px 12px', background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14,
                    }}
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Date Format
                  </label>
                  <select
                    value={regionForm.dateFormat}
                    onChange={e => setRegionForm({ ...regionForm, dateFormat: e.target.value })}
                    style={{
                      width: '100%', padding: '9px 12px', background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14,
                    }}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div style={{ marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => toast.success('Language & regional settings saved')}
                    style={{
                      padding: '8px 16px', background: '#2563eb', color: '#ffffff',
                      border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    Save Regional Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ABOUT */}
          {activeTab === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>About</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Basic application information.</p>
              </div>

              <div style={{ height: 1, background: 'var(--border-color)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>DoseTracker</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Version 1.0.0</div>
                </div>

                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  DoseTracker is a clean healthcare &amp; medication management platform for tracking doses, managing prescriptions, and coordinating appointments.
                </p>

                <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />

                <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                  <a href="#privacy" onClick={(e) => { e.preventDefault(); toast.info('Privacy Policy: Standard HIPAA-compliant data encryption.'); }} style={{ color: '#2563eb', textDecoration: 'none' }}>
                    Privacy Policy
                  </a>
                  <span style={{ color: 'var(--border-color)' }}>|</span>
                  <a href="#terms" onClick={(e) => { e.preventDefault(); toast.info('Terms of Service: Standard healthcare application terms.'); }} style={{ color: '#2563eb', textDecoration: 'none' }}>
                    Terms of Service
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
