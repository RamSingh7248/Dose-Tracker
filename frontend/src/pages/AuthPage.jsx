import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Shield, Stethoscope, User, Lock, X, Activity } from 'lucide-react';

const GoogleLogoSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const MicrosoftLogoSvg = () => (
  <svg width="18" height="18" viewBox="0 0 23 23" style={{ flexShrink: 0 }}>
    <path fill="#f35325" d="M1 1h10v10H1z"/>
    <path fill="#81bc06" d="M12 1h10v10H1z"/>
    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
    <path fill="#ffba08" d="M12 12h10v10H12z"/>
  </svg>
);

const PORTALS = [
  {
    id: 'patient',
    name: 'Patient Portal',
    badge: 'PATIENT',
    subtitle: 'Personal Health & Meds',
    description: 'Manage medications, reminders & personal health records.',
    icon: User,
    color: '#3b82f6',
    borderActive: 'rgba(59, 130, 246, 0.6)',
    bgActive: 'rgba(59, 130, 246, 0.12)',
    redirect: '/dashboard',
  },
  {
    id: 'doctor',
    name: 'Doctor Portal',
    badge: 'DOCTOR',
    subtitle: 'Clinical Care & Patients',
    description: 'Manage patients, prescriptions & medical records.',
    icon: Stethoscope,
    color: '#10b981',
    borderActive: 'rgba(16, 185, 129, 0.6)',
    bgActive: 'rgba(16, 185, 129, 0.12)',
    redirect: '/doctor/dashboard',
  },
  {
    id: 'admin',
    name: 'Administrator Portal',
    badge: 'ADMIN',
    subtitle: 'System Governance',
    description: 'System administration, analytics & user management.',
    icon: Shield,
    color: '#f43f5e',
    borderActive: 'rgba(244, 63, 94, 0.6)',
    bgActive: 'rgba(244, 63, 94, 0.12)',
    redirect: '/admin/dashboard',
  },
];

export default function AuthPage() {
  const [activePortal, setActivePortal] = useState('patient');
  const [tab, setTab] = useState('login');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleForm, setGoogleForm] = useState({
    email: '',
    name: '',
    role: 'patient',
    picture: '',
  });

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient',
    specialization: '',
    hospital: '',
    licenseNumber: '',
  });

  const { login, register, googleLogin } = useAuth();
  const navigate = useNavigate();

  // Keep form.role synced with activePortal
  const handleSelectPortal = (portalId) => {
    setActivePortal(portalId);
    setForm(p => ({ ...p, role: portalId }));
    if (portalId === 'admin') {
      setTab('login'); // Admin portal only allows Sign In
    }
  };

  // Initialize Google Identity Services SDK if Client ID is configured
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (googleClientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (response.credential) {
              setLoading(true);
              try {
                const res = await googleLogin({ credential: response.credential, role: activePortal });
                toast.success(`Google Auth Verified! Welcome, ${res.user?.name}! 🎉`);
                const role = res.user?.role;
                if (role === 'admin') navigate('/admin/dashboard');
                else if (role === 'doctor') navigate('/doctor/dashboard');
                else navigate('/dashboard');
              } catch (err) {
                toast.error(err.response?.data?.message || 'Google Auth Verification failed');
              } finally {
                setLoading(false);
              }
            }
          },
        });
      } catch (err) {
        console.warn('Google Identity initialization error:', err);
      }
    }
  }, [googleLogin, navigate, activePortal]);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'login') {
        const res = await login(form.email, form.password, activePortal);
        const userRole = res.user?.role;
        toast.success(`Welcome back, ${res.user?.name}! 🎉`);

        if (activePortal === 'admin' || userRole === 'admin' || userRole === 'ROLE_ADMIN') {
          navigate('/admin/dashboard');
        } else if (activePortal === 'doctor' || userRole === 'doctor' || userRole === 'ROLE_DOCTOR') {
          navigate('/doctor/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        if (!form.name.trim()) { toast.error('Name is required'); setLoading(false); return; }
        const targetRole = activePortal === 'doctor' ? 'doctor' : 'patient';
        await register(
          form.name,
          form.email,
          form.password,
          targetRole,
          { specialization: form.specialization, hospital: form.hospital, licenseNumber: form.licenseNumber }
        );
        toast.success(`Account created as ${targetRole.toUpperCase()}! Welcome, ${form.name}! 🎉`);
        if (targetRole === 'doctor') navigate('/doctor/dashboard');
        else navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email || !form.email.trim()) {
      toast.error('Please enter your email address in the field above');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(form.email.trim());
      toast.success(res.data?.message || 'Password reset link sent to your registered email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async (customPayload) => {
    setLoading(true);
    const payload = customPayload || { ...googleForm, role: activePortal };
    try {
      const res = await googleLogin(payload);
      toast.success(`Signed in with Google! Welcome, ${res.user?.name || 'User'}! 🎉`);
      setShowGoogleModal(false);
      const role = res.user?.role;
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'doctor') navigate('/doctor/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const currentPortalConfig = PORTALS.find(p => p.id === activePortal) || PORTALS[0];

  return (
    <div className="auth-bg">
      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: 500 }}>

        {/* Enterprise Auth Container Card */}
        <div
          className="auth-card"
          style={{
            borderTop: `4px solid ${currentPortalConfig.color}`,
            transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
          }}
        >
          {/* 1. BRAND HEADER */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
                }}
              >
                <Activity size={24} color="#ffffff" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  DoseTracker
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#3b82f6', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  ENTERPRISE HEALTHCARE PLATFORM
                </div>
              </div>
            </div>
          </div>

          {/* 2. DYNAMIC PORTAL HEADING & SUBTITLE */}
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
              {tab === 'login' ? `${currentPortalConfig.name} Login` : `Create ${currentPortalConfig.name} Account`}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
              {tab === 'login'
                ? `Welcome back — sign in to access your ${activePortal} portal`
                : `Create an account to access the ${currentPortalConfig.name.toLowerCase()}`}
            </p>
          </div>

          {/* 3. SIGN IN / CREATE ACCOUNT TABS */}
          {activePortal !== 'admin' ? (
            <div className="tab-bar" style={{ marginBottom: 22 }} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'login'}
                className={`tab-item ${tab === 'login' ? 'active' : ''}`}
                onClick={() => setTab('login')}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'register'}
                className={`tab-item ${tab === 'register' ? 'active' : ''}`}
                onClick={() => setTab('register')}
              >
                Create Account
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 20,
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
              }}
            >
              <Shield size={16} color="#f43f5e" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#f43f5e' }}>
                Administrator Access Only &bull; System Governance
              </span>
            </div>
          )}

          {/* 4. FORM CONTROLS */}
          <form onSubmit={handleSubmit} id="auth-form-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {tab === 'register' && activePortal !== 'admin' && (
              <>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    Full Name
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={activePortal === 'doctor' ? 'Dr. Sarah Jenkins' : 'Jane Doe'}
                    className="input-field"
                    required
                  />
                </div>

                {activePortal === 'doctor' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                        Specialization
                      </label>
                      <input
                        name="specialization"
                        value={form.specialization}
                        onChange={handleChange}
                        placeholder="Cardiology"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                        Hospital / Clinic
                      </label>
                      <input
                        name="hospital"
                        value={form.hospital}
                        onChange={handleChange}
                        placeholder="St. Mary Hospital"
                        className="input-field"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Email Address */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="input-field"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Password
                </label>
                {tab === 'login' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3b82f6',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••••••••••"
                  className="input-field"
                  required
                  minLength={6}
                  style={{ paddingRight: 44 }}
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 4,
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {tab === 'register' && form.password.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span>Password Security Level</span>
                    <span style={{ fontWeight: 700, color: form.password.length >= 10 ? '#10b981' : form.password.length >= 6 ? '#f59e0b' : '#f43f5e' }}>
                      {form.password.length >= 10 ? 'Strong (HIPAA Compliant)' : form.password.length >= 6 ? 'Fair' : 'Weak'}
                    </span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: form.password.length >= 10 ? '100%' : form.password.length >= 6 ? '60%' : '30%',
                        background: form.password.length >= 10 ? '#10b981' : form.password.length >= 6 ? '#f59e0b' : '#f43f5e',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Remember Me Checkbox */}
            {tab === 'login' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  defaultChecked
                  style={{ accentColor: '#2563eb', cursor: 'pointer', width: 16, height: 16, borderRadius: 4 }}
                />
                <label htmlFor="rememberMe" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                  Remember this device for 30 days
                </label>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                <input
                  type="checkbox"
                  id="terms"
                  required
                  defaultChecked
                  style={{ accentColor: '#2563eb', cursor: 'pointer', width: 16, height: 16 }}
                />
                <label htmlFor="terms" style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}>
                  I agree to the <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Terms of Service</span> &amp; <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Privacy Policy</span>
                </label>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{
                marginTop: 6,
                padding: '13px',
                fontSize: 14,
                fontWeight: 700,
                width: '100%',
                justifyContent: 'center',
                minHeight: 46,
                borderRadius: 10,
                background:
                  activePortal === 'doctor'
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : activePortal === 'admin'
                    ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)'
                    : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: `0 4px 18px ${currentPortalConfig.bgActive}`,
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Authenticating...
                </span>
              ) : tab === 'login' ? (
                `Sign In to ${currentPortalConfig.name}`
              ) : (
                `Create ${currentPortalConfig.badge} Account`
              )}
            </button>
          </form>

          {/* 5. SSO OPTIONS DIVIDER & BUTTONS */}
          {activePortal !== 'admin' && (
            <>
              <div className="auth-divider">
                <span>OR CONTINUE WITH</span>
              </div>

              <div className="sso-grid">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(true)}
                  className="sso-btn"
                  aria-label="Sign in with Google SSO"
                >
                  <GoogleLogoSvg />
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => toast.success('Redirecting to Microsoft Azure AD SSO...')}
                  className="sso-btn"
                  aria-label="Sign in with Microsoft SSO"
                >
                  <MicrosoftLogoSvg />
                  <span>Microsoft SSO</span>
                </button>
              </div>
            </>
          )}

          {/* 6. CHOOSE YOUR PORTAL SWITCHER */}
          <div style={{ marginTop: 28, paddingTop: 22, borderTop: '1px solid var(--border-color)' }}>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                CHOOSE YOUR PORTAL
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Select a portal below to switch authentication view
              </div>
            </div>

            {/* Portal Cards Grid */}
            <div className="portal-cards-grid" role="tablist">
              {PORTALS.map(p => {
                const Icon = p.icon;
                const isActive = activePortal === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleSelectPortal(p.id)}
                    className={`portal-card-btn ${isActive ? 'active' : ''}`}
                    style={{
                      borderColor: isActive ? p.color : 'var(--border-color)',
                      background: isActive ? p.bgActive : 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, width: '100%' }}>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: isActive ? p.color : 'rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Icon size={16} color={isActive ? '#ffffff' : 'var(--text-muted)'} />
                      </div>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: isActive ? p.color : 'rgba(255, 255, 255, 0.06)',
                          color: isActive ? '#ffffff' : 'var(--text-muted)',
                        }}
                      >
                        {p.badge}
                      </span>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', marginBottom: 2 }}>
                        {p.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. FOOTER & SECURITY BADGES */}
          <div style={{ marginTop: 26, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.03)', padding: '4px 12px', borderRadius: 20, border: '1px solid var(--border-color)' }}>
              <Lock size={12} color="#10b981" />
              <span>Secure &amp; encrypted authentication</span>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <a href="#" onClick={e => { e.preventDefault(); toast('Privacy Policy: Enterprise HIPAA Compliant Data Privacy Architecture'); }} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                Privacy Policy
              </a>
              <span style={{ margin: '0 8px', opacity: 0.4 }}>|</span>
              <a href="#" onClick={e => { e.preventDefault(); toast('Terms of Service: Standard Enterprise SaaS Service Terms'); }} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                Terms of Service
              </a>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.7 }}>
              &copy; DoseTracker
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
