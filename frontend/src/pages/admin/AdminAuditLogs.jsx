import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { ScrollText, Search, ShieldAlert, UserCheck, Key, FileCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAuditLogs();
      setLogs(res.data.data || []);
    } catch {
      toast.error('Failed to load system audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter(l => {
    return (
      (l.user || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.email || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">📜 Security Audit Trail & Activity Logs</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Real-time compliance trail recording user authentication, role updates, and system events
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            placeholder="Search by user, action, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          No audit logs recorded yet.
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 18px' }}>User</th>
                <th style={{ padding: '14px 18px' }}>Action / Event</th>
                <th style={{ padding: '14px 18px' }}>Category</th>
                <th style={{ padding: '14px 18px' }}>IP Address</th>
                <th style={{ padding: '14px 18px' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {log.user} <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{log.email}</div>
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-primary)' }}>{log.action}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span className="badge badge-purple" style={{ fontSize: 10 }}>{log.category}</span>
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{log.ipAddress}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: 12 }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
