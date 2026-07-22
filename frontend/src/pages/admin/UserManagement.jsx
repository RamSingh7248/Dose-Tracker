import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';
import { Search, Shield, UserX, UserCheck, MoreVertical } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const fetchUsers = async () => {
    try {
      const res = await adminApi.getUsers({ search, role: roleFilter });
      setUsers(res.data.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (user) => {
    try {
      await adminApi.updateStatus(user._id, !user.isActive);
      toast.success(user.isActive ? 'User suspended' : 'User activated');
      fetchUsers();
    } catch { toast.error('Failed to update status'); }
  };

  const updateRole = async (id, newRole) => {
    try {
      await adminApi.updateRole(id, newRole);
      toast.success('Role updated');
      fetchUsers();
    } catch { toast.error('Failed to update role'); }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Manage patients, doctors, and admins</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 20 }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="input-field" 
              style={{ paddingLeft: 38 }} 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input-field" style={{ width: 150 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="patient">Patients</option>
            <option value="doctor">Doctors</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 13 }}>Name</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 13 }}>Role</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 13 }}>Status</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 13, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }}/></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No users found</td></tr>
              ) : users.map(u => (
                <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <select 
                      value={u.role} 
                      onChange={e => updateRole(u._id, e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}
                    >
                      <option value="patient">Patient</option>
                      <option value="doctor">Doctor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span className={`badge ${u.isActive ? 'badge-emerald' : 'badge-rose'}`}>
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button 
                      onClick={() => toggleStatus(u)}
                      style={{ padding: 8, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6, cursor: 'pointer', color: u.isActive ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}
                      title={u.isActive ? 'Suspend User' : 'Activate User'}
                    >
                      {u.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


