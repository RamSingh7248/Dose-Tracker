import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
import { Activity, Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();

  // Support both URL param /reset-password/:token and query param /reset-password?token=...
  const token = params.token || searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token) {
      const msg = 'Invalid or missing password reset token. Please request a new link.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters long.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err) {
      const errorText = err.response?.data?.message || 'Failed to reset password. The link may have expired.';
      setErrorMessage(errorText);
      toast.error(errorText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      padding: '24px 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        padding: 32,
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {/* Branding Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={20} color="white" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            DoseTracker
          </span>
        </div>

        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#16a34a' }}>
              <CheckCircle size={24} />
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Password Reset Successfully
              </h2>
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Your password has been updated. You can now log in with your new credentials.
            </p>

            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%', padding: '10px 16px', background: '#2563eb', color: '#ffffff',
                border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
              }}
            >
              <span>Go to Login</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Reset Password
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
                Enter a new password for your DoseTracker account.
              </p>
            </div>

            {errorMessage && (
              <div style={{
                padding: '10px 12px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: 6, color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <AlertCircle size={16} flexShrink={0} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%', padding: '9px 12px 9px 36px', background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14,
                    }}
                  />
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%', padding: '9px 12px 9px 36px', background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14,
                    }}
                  />
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              {/* Password Requirements */}
              <div style={{
                padding: 12, background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                borderRadius: 6, fontSize: 12, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Password Requirements:</div>
                <div style={{ color: password.length >= 6 ? '#16a34a' : 'var(--text-muted)' }}>
                  • Minimum 6 characters long
                </div>
                <div style={{ color: password && password === confirmPassword ? '#16a34a' : 'var(--text-muted)' }}>
                  • Passwords must match
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '10px 16px', background: '#2563eb', color: '#ffffff',
                  border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <Link
                to="/login"
                style={{
                  fontSize: 13, color: '#2563eb', textDecoration: 'none', fontWeight: 500,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
              >
                <ArrowLeft size={14} />
                <span>Back to Login</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
