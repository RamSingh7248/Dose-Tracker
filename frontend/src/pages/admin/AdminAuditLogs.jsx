import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');

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
    const matchesSearch =
      (l.user || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.email || '').toLowerCase().includes(search.toLowerCase());

    const matchesModule = moduleFilter === 'all' || (l.category || '').toLowerCase() === moduleFilter.toLowerCase();
    return matchesSearch && matchesModule;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Audit Logs
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0 0' }}>
          Record of system security events, administrative actions, and user activities
        </p>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by user name, action, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 36px', background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13,
            }}
          />
        </div>

        <select
          value={moduleFilter}
          onChange={e => setModuleFilter(e.target.value)}
          style={{
            padding: '8px 12px', background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, width: 160,
          }}
        >
          <option value="all">All Modules</option>
          <option value="auth">Authentication</option>
          <option value="users">Users</option>
          <option value="doctors">Doctors</option>
          <option value="appointments">Appointments</option>
          <option value="prescriptions">Prescriptions</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>User</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Action</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Module</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Date &amp; Time</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading audit logs...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No system audit logs found.
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {l.user || 'System Admin'}
                      {l.email && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{l.email}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{l.action}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                        textTransform: 'uppercase', background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border-color)',
                      }}>
                        {l.category || 'System'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {l.timestamp ? new Date(l.timestamp).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                        background: 'rgba(22, 163, 74, 0.15)', color: '#16a34a', border: '1px solid rgba(22, 163, 74, 0.3)',
                      }}>
                        Success
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
