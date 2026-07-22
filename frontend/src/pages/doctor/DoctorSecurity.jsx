import React, { useState } from 'react';
import { ShieldCheck, Lock, Smartphone, Key, Activity, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorSecurity() {
  const [twoFactor, setTwoFactor] = useState(true);

  const logs = [
    { id: '1', action: 'Doctor Portal Login', device: 'Chrome / Windows 11 (This Device)', ip: '192.168.1.45', time: 'Today, 10:14 AM', status: 'Success' },
    { id: '2', action: 'Prescription PDF Generated', device: 'Chrome / Windows 11', ip: '192.168.1.45', time: 'Today, 09:30 AM', status: 'Success' },
    { id: '3', action: 'Password Verification', device: 'Chrome / MacOS', ip: '198.51.100.12', time: 'Yesterday, 04:20 PM', status: 'Success' },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">🛡️ Security, 2FA & Audit Logs Console</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Manage two-factor authentication, active login sessions, device history, and HIPAA activity logs
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        {/* Security Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={18} color="#10b981" /> 2-Factor Authentication
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Two-Factor (2FA) Status</span>
              <button
                className="badge"
                onClick={() => { setTwoFactor(!twoFactor); toast.success(`2FA ${!twoFactor ? 'Enabled' : 'Disabled'}`); }}
                style={{ background: twoFactor ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)', color: twoFactor ? '#10b981' : '#f43f5e', cursor: 'pointer', border: 'none' }}
              >
                {twoFactor ? 'Enabled ✓' : 'Disabled ✗'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Requires an authenticator code or SMS OTP when accessing patient records from new devices.
            </p>
          </div>

          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Key size={18} color="var(--accent-purple)" /> Password Management
            </h3>
            <button className="btn-secondary" onClick={() => toast.success('Password update link sent to doctor email')} style={{ width: '100%', fontSize: 12 }}>
              Change Doctor Password
            </button>
          </div>
        </div>

        {/* Login History */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={18} color="var(--accent-cyan)" /> Clinical Security & Activity Trail
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {logs.map(log => (
              <div key={log.id} style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{log.action}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{log.device} • IP: {log.ip}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: 10 }}>{log.status}</span>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{log.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
