import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Shield, Lock, Eye, EyeOff, KeyRound, AlertOctagon, Terminal } from 'lucide-react';

export default function SecretAdminAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, logout, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // If already logged in as Admin, redirect directly to dashboard
  React.useEffect(() => {
    if (user && isAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, isAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);
      const userRole = res.user?.role;
      const isUserAdmin = userRole === 'ROLE_ADMIN' || userRole === 'admin';

      if (!isUserAdmin) {
        logout();
        toast.error('🚫 Access Denied: 403 Forbidden. Account does not have Administrator privileges.', { duration: 5000 });
        setLoading(false);
        return;
      }

      toast.success(`Security Verification Passed! Welcome, Administrator ${res.user?.name}! 🛡️`);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Admin Authentication Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setEmail('admin@dosetracker.com');
    setPassword('AdminPassword123!');
    setLoading(true);
    try {
      const res = await login('admin@dosetracker.com', 'AdminPassword123!');
      toast.success(`Admin Authentication Verified! Welcome, ${res.user?.name}! 🛡️`);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Secret Admin Login Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 30%, #151828 0%, #0a0b10 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      color: '#e2e8f0',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: 16,
        padding: 32,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Top Accent Security Line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)'
        }} />

        {/* Shield Icon Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16
          }}>
            <Shield size={30} color="#f59e0b" />
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
            Secret Admin Portal
          </h1>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
            Restricted System Administration Console • Security Level 4
          </p>
        </div>

        {/* Security Alert Banner */}
        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 24, fontSize: 11, color: '#fca5a5'
        }}>
          <AlertOctagon size={18} color="#ef4444" style={{ flexShrink: 0 }} />
          <span>
            <strong>CONFIDENTIAL ACCESS ONLY:</strong> Unauthorized access attempts are monitored and recorded.
          </span>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
              Administrator Identity Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@dosetracker.com"
                required
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(245, 158, 11, 0.25)',
                  color: '#fff', fontSize: 13, outline: 'none', transition: 'border-color 0.2s'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
              Master Security Key / Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                style={{
                  width: '100%', padding: '12px 42px 12px 14px', borderRadius: 10,
                  background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(245, 158, 11, 0.25)',
                  color: '#fff', fontSize: 13, outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer'
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8, padding: '12px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#000', fontWeight: 800, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)', transition: 'all 0.2s'
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: '#000 #000 transparent transparent' }} />
                Verifying Security Credentials...
              </span>
            ) : (
              <>
                <KeyRound size={16} />
                <span>Authenticate Admin Access</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Sign-In for Admin */}
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            ⚡ 1-Click Pre-Approved Admin Accounts
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              type="button"
              onClick={async () => {
                setEmail('ramub9349@gmail.com');
                setPassword('Ramu@6458');
                setLoading(true);
                try {
                  const res = await login('ramub9349@gmail.com', 'Ramu@6458');
                  toast.success(`Admin Security Verified! Welcome, ${res.user?.name}! 🛡️`);
                  navigate('/admin/dashboard', { replace: true });
                } catch (err) {
                  toast.error(err.response?.data?.message || 'Admin Login Failed');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              style={{
                padding: '10px 8px', borderRadius: 8,
                background: 'rgba(245, 158, 11, 0.12)', border: '1px dashed rgba(245, 158, 11, 0.4)',
                color: '#f59e0b', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
              }}
            >
              <Terminal size={14} />
              <span>Owner Admin</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                setEmail('admin@dosetracker.com');
                setPassword('AdminPassword123!');
                setLoading(true);
                try {
                  const res = await login('admin@dosetracker.com', 'AdminPassword123!');
                  toast.success(`System Admin Verified! Welcome, ${res.user?.name}! 🛡️`);
                  navigate('/admin/dashboard', { replace: true });
                } catch (err) {
                  toast.error(err.response?.data?.message || 'System Admin Login Failed');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              style={{
                padding: '10px 8px', borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.12)', border: '1px dashed rgba(239, 68, 68, 0.4)',
                color: '#ef4444', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
              }}
            >
              <Shield size={14} />
              <span>System Admin</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 10, color: '#64748b' }}>
          🔒 RBAC Enforced • 256-Bit JWT Encryption • IP Audit Log Active
        </div>
      </div>
    </div>
  );
}
