import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
import { Activity, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
      toast.success('Reset link sent if account exists');
    } catch (err) {
      // Show generic message for privacy
      setSubmitted(true);
      toast.success('If an account exists for this email, password reset instructions have been sent.');
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

        {submitted ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#16a34a' }}>
              <CheckCircle size={22} />
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Check Your Email
              </h2>
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              If an account exists for <strong>{email}</strong>, password reset instructions have been sent to your inbox.
            </p>

            <Link
              to="/login"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 16px', background: '#2563eb', color: '#ffffff',
                borderRadius: 6, fontSize: 14, fontWeight: 500, textDecoration: 'none', marginTop: 8,
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Forgot your password?
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '6px 0 0 0', lineHeight: 1.5 }}>
                Enter your registered email address and we'll help you reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{
                      width: '100%', padding: '9px 12px 9px 36px', background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14,
                    }}
                  />
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
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
                {loading ? 'Sending Link...' : 'Send Reset Link'}
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
