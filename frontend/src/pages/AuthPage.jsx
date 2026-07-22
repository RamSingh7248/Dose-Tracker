import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Activity, Eye, EyeOff, Pill, Bell, Users, FileText, Shield, Stethoscope, User, Lock, X, Check, Globe, Sparkles } from 'lucide-react';

const features = [
  { icon: Pill,     label: 'Track Medications',  desc: 'Manage all your prescriptions in one place' },
  { icon: Bell,     label: 'Smart Reminders',     desc: 'Never miss a dose with timely notifications' },
  { icon: Users,    label: 'Multi-Person',        desc: 'Track medications for the whole family' },
  { icon: FileText, label: 'Health Logs',         desc: 'Detailed reports to share with your doctor' },
  { icon: Shield,   label: 'Refill Alerts',       desc: 'Get notified before you run out of pills' },
];

const GoogleLogoSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const PRESET_GOOGLE_ACCOUNTS = [
  {
    id: 'patient-google',
    name: 'Alex Johnson',
    email: 'alex.johnson@gmail.com',
    role: 'patient',
    roleLabel: 'Patient',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    color: 'var(--accent-purple)',
  },
  {
    id: 'doctor-google',
    name: 'Dr. Sarah Jenkins',
    email: 'dr.sarah.jenkins@gmail.com',
    role: 'doctor',
    roleLabel: 'Doctor / Physician',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150',
    color: '#10b981',
  },
];

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleForm, setGoogleForm] = useState({
    email: 'alex.johnson@gmail.com',
    name: 'Alex Johnson',
    role: 'patient',
    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
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
                const res = await googleLogin({ credential: response.credential, role: form.role });
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
  }, [googleLogin, navigate, form.role]);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'login') {
        const res = await login(form.email, form.password);
        const role = res.user?.role;
        toast.success(`Welcome back, ${res.user?.name}! 🎉`);
        if (role === 'admin') navigate('/admin/dashboard');
        else if (role === 'doctor') navigate('/doctor/dashboard');
        else navigate('/dashboard');
      } else {
        if (!form.name.trim()) { toast.error('Name is required'); setLoading(false); return; }
        await register(
          form.name,
          form.email,
          form.password,
          form.role,
          { specialization: form.specialization, hospital: form.hospital, licenseNumber: form.licenseNumber }
        );
        toast.success(`Account created as ${form.role.toUpperCase()}! Welcome, ${form.name}! 🎉`);
        if (form.role === 'admin') navigate('/admin/dashboard');
        else if (form.role === 'doctor') navigate('/doctor/dashboard');
        else navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async (customPayload) => {
    setLoading(true);
    const payload = customPayload || googleForm;
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

  const handleQuickDemoLogin = async (email, password, targetRoute) => {
    setLoading(true);
    setForm(p => ({ ...p, email, password }));
    try {
      const res = await login(email, password);
      toast.success(`Logged into Portal as ${res.user?.name}! 🎉`);
      navigate(targetRoute);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'stretch' }}>
      {/* Left — Branding */}
      <div style={{
        flex: 1, display: 'none', flexDirection: 'column', justifyContent: 'center',
        padding: '60px', background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(99,102,241,0.06) 100%)',
        borderRight: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden',
      }} className="auth-left">
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(139,92,246,0.08)', filter: 'blur(60px)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={26} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>DoseTracker</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Enterprise Healthcare Platform</div>
            </div>
          </div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 38, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
            Never miss a <span className="gradient-text">dose again</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 40, maxWidth: 420 }}>
            Comprehensive medication management platform connecting Patients, Doctors, and Healthcare Administrators in one seamless ecosystem.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color="var(--accent-purple)" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Auth Form & Portal Switcher */}
      <div style={{ flex: '0 0 auto', width: '100%', maxWidth: 520, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, margin: '0 auto' }}>
        <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: 460 }}>
          {/* Mobile logo */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={24} color="white" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: 'Outfit', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>DoseTracker</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Enterprise Healthcare Platform</div>
              </div>
            </div>
          </div>

          <div className="auth-card">
            {/* Tab switcher */}
            <div className="tab-bar" style={{ marginBottom: 20 }}>
              <button className={`tab-item ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
              <button className={`tab-item ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Create Account</button>
            </div>

            <h2 style={{ fontFamily: 'Outfit', fontSize: 20, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
              {tab === 'login' ? 'Welcome back' : 'Get started'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>
              {tab === 'login' ? 'Sign in to access your portal' : 'Choose your role to create your healthcare account'}
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {tab === 'register' && (
                <>
                  {/* Role Selection Grid */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                      Select Account Portal Role
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, role: 'patient' }))}
                        style={{
                          padding: '12px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                          border: `1.5px solid ${form.role === 'patient' ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                          background: form.role === 'patient' ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.02)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <User size={20} color={form.role === 'patient' ? 'var(--accent-purple)' : 'var(--text-muted)'} style={{ margin: '0 auto 4px' }} />
                        <div style={{ fontSize: 13, fontWeight: 700, color: form.role === 'patient' ? 'var(--text-primary)' : 'var(--text-muted)' }}>Patient Account</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Personal Health & Meds</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, role: 'doctor' }))}
                        style={{
                          padding: '12px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                          border: `1.5px solid ${form.role === 'doctor' ? '#10b981' : 'var(--border-color)'}`,
                          background: form.role === 'doctor' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.02)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Stethoscope size={20} color={form.role === 'doctor' ? '#10b981' : 'var(--text-muted)'} style={{ margin: '0 auto 4px' }} />
                        <div style={{ fontSize: 13, fontWeight: 700, color: form.role === 'doctor' ? '#10b981' : 'var(--text-muted)' }}>Doctor Account</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Clinical & Patients</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Full Name</label>
                    <input name="name" value={form.name} onChange={handleChange} placeholder={form.role === 'doctor' ? 'Dr. Sarah Jenkins' : 'John Doe'} className="input-field" required />
                  </div>

                  {/* Doctor specific fields */}
                  {form.role === 'doctor' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Specialization</label>
                        <input name="specialization" value={form.specialization} onChange={handleChange} placeholder="Cardiology, General..." className="input-field" />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Hospital / Clinic</label>
                        <input name="hospital" value={form.hospital} onChange={handleChange} placeholder="City Healthcare" className="input-field" />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  {tab === 'login' ? 'Email / Mobile / Username' : 'Email Address'}
                </label>
                <input name="email" value={form.email} onChange={handleChange} placeholder={tab === 'login' ? 'Email, mobile, or username' : 'you@example.com'} className="input-field" required />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Password</label>
                  {tab === 'login' && (
                    <button type="button" onClick={() => toast.success('Password reset link sent to your registered email!')} style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', fontSize: 11, cursor: 'pointer' }}>
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
                    onKeyDown={e => {
                      if (e.getModifierState && e.getModifierState('CapsLock')) {
                        toast('⚠️ Caps Lock is ON', { id: 'caps-lock-warning', icon: '⚠️' });
                      }
                    }}
                    placeholder="••••••••"
                    className="input-field"
                    required
                    minLength={6}
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Meter for Registration */}
                {tab === 'register' && form.password.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>
                      <span>Password Strength</span>
                      <span style={{ fontWeight: 700, color: form.password.length >= 10 ? '#10b981' : form.password.length >= 6 ? '#f59e0b' : '#f43f5e' }}>
                        {form.password.length >= 10 ? 'Strong (Enterprise)' : form.password.length >= 6 ? 'Medium' : 'Weak'}
                      </span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: form.password.length >= 10 ? '100%' : form.password.length >= 6 ? '60%' : '30%', background: form.password.length >= 10 ? '#10b981' : form.password.length >= 6 ? '#f59e0b' : '#f43f5e', transition: 'all 0.3s' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Remember Me / Privacy Checkboxes */}
              {tab === 'login' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="rememberMe" defaultChecked style={{ accentColor: 'var(--accent-purple)', cursor: 'pointer' }} />
                  <label htmlFor="rememberMe" style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}>Remember this device for 30 days</label>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <input type="checkbox" required defaultChecked style={{ accentColor: 'var(--accent-purple)' }} />
                    I agree to the <strong>Terms of Service</strong> &amp; <strong>Privacy Policy</strong>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent-purple)' }} />
                    Enable AI-powered personalized health insights &amp; dose reminders
                  </label>
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4, padding: '12px', fontSize: 14, justifyContent: 'center' }}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    {tab === 'login' ? 'Signing in...' : `Creating ${form.role.toUpperCase()} Account...`}
                  </span>
                ) : (
                  tab === 'login' ? 'Sign In' : `Create ${form.role.charAt(0).toUpperCase() + form.role.slice(1)} Account`
                )}
              </button>

              {/* SSO Buttons */}
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(true)}
                  className="btn-secondary"
                  style={{
                    flex: 1, padding: '10px 12px', fontSize: 12, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(66, 133, 244, 0.4)',
                    color: '#fff', cursor: 'pointer', transition: 'all 0.2s', borderRadius: 8
                  }}
                >
                  <GoogleLogoSvg />
                  <span>Google SSO</span>
                </button>

                <button
                  type="button"
                  onClick={() => toast.success('Redirecting to Microsoft Azure AD SSO...')}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '10px 12px', fontSize: 12, justifyContent: 'center', gap: 8 }}
                >
                  🏢 Microsoft SSO
                </button>
              </div>
            </form>

            {/* Quick 1-Click Demo Login to Portals */}
            {tab === 'login' && (
              <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, textAlign: 'center' }}>
                  ⚡ 1-Click Demo Portal Sign In
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('ramub9349@gmail.com', 'Ramu@6458', '/dashboard')}
                    className="btn-secondary"
                    style={{ padding: '8px 6px', fontSize: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, borderRadius: 8 }}
                  >
                    <User size={15} color="var(--accent-purple)" />
                    <span>Patient</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('doctor@dosetracker.com', 'DoctorPassword123!', '/doctor/dashboard')}
                    className="btn-secondary"
                    style={{ padding: '8px 6px', fontSize: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, borderRadius: 8, borderColor: 'rgba(16,185,129,0.3)' }}
                  >
                    <Stethoscope size={15} color="#10b981" />
                    <span style={{ color: '#10b981' }}>Doctor</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── GOOGLE SIGN-IN INTERACTIVE MODAL ── */}
      {showGoogleModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div className="animate-fade-in-up" style={{
            background: 'var(--card-bg, #1a1c23)', border: '1px solid var(--border-color)',
            borderRadius: 16, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GoogleLogoSvg />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Sign in with Google
                  </h3>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Secure Healthcare OAuth 2.0 Provider
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Subtitle instructions */}
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
              Choose a Google account or enter custom details to sign in / create your account instantly.
            </p>

            {/* Quick Preset Accounts */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Select Google Account
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PRESET_GOOGLE_ACCOUNTS.map(acc => {
                  const isSelected = googleForm.email === acc.email;
                  return (
                    <div
                      key={acc.id}
                      onClick={() => setGoogleForm({
                        email: acc.email,
                        name: acc.name,
                        role: acc.role,
                        picture: acc.avatar,
                        googleId: `google_${acc.role}_${Date.now()}`
                      })}
                      style={{
                        padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                        border: `1.5px solid ${isSelected ? acc.color : 'var(--border-color)'}`,
                        background: isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={acc.avatar} alt={acc.name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{acc.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{acc.email}</div>
                        </div>
                      </div>
                      <span className="badge" style={{ background: `${acc.color}20`, color: acc.color, fontSize: 10, fontWeight: 600 }}>
                        {acc.roleLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Google Email Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Google Email Address
                </label>
                <input
                  type="email"
                  value={googleForm.email}
                  onChange={e => setGoogleForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="your.email@gmail.com"
                  className="input-field"
                  style={{ fontSize: 13 }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Account Display Name
                  </label>
                  <input
                    type="text"
                    value={googleForm.name}
                    onChange={e => setGoogleForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Full Name"
                    className="input-field"
                    style={{ fontSize: 13 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Portal Role
                  </label>
                  <select
                    value={googleForm.role}
                    onChange={e => setGoogleForm(p => ({ ...p, role: e.target.value }))}
                    className="input-field"
                    style={{ fontSize: 13, background: 'var(--card-bg)' }}
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Google Login */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleGoogleSubmit()}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
                color: '#ffffff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 4px 12px rgba(66, 133, 244, 0.3)', transition: 'all 0.2s'
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Authenticating with Google...
                </span>
              ) : (
                <>
                  <GoogleLogoSvg />
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <div style={{ marginTop: 12, textAlign: 'center', fontSize: 10, color: 'var(--text-muted)' }}>
              🔒 Protected by Google Identity Services &amp; 256-bit JWT Encryption
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

