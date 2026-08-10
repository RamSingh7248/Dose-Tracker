import React, { useState, useEffect, useCallback } from 'react';
import { adminApi, authApi } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search, UserX, UserCheck, Plus, X, Trash2, Eye, User } from 'lucide-react';

const DASHBOARD_QUERY_KEY = ['admin-dashboard-stats'];

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'patient',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({ search, role: roleFilter === 'all' ? undefined : roleFilter });
      setUsers(res.data.data || []);
    } catch {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const roleCode = formData.role === 'doctor' ? 'ROLE_DOCTOR' : formData.role === 'admin' ? 'ROLE_ADMIN' : 'ROLE_PATIENT';
      await authApi.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: roleCode,
      });
      toast.success('Patient registered successfully');
      setIsAddModalOpen(false);
      setFormData({ name: '', email: '', password: '', phone: '', role: 'patient' });
      fetchUsers();
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register patient');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (u) => {
    try {
      await adminApi.updateStatus(u._id, !u.isActive);
      toast.success(u.isActive ? 'User suspended' : 'User activated');
      fetchUsers();
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    } catch {
      toast.error('Failed to update status');
    }
  };

  const updateRole = async (id, newRole) => {
    try {
      await adminApi.updateRole(id, newRole);
      toast.success('Role updated');
      fetchUsers();
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    } catch {
      toast.error('Failed to update role');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this account?')) return;
    try {
      await adminApi.deleteUser(id);
      toast.success('User deleted successfully');
      fetchUsers();
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (statusFilter === 'active' && !u.isActive) return false;
    if (statusFilter === 'suspended' && u.isActive) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Patients &amp; Users
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0 0' }}>
            Manage registered patients, system users, and access permissions
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', background: '#2563eb', color: '#ffffff',
            border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          <span>Add Patient</span>
        </button>
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
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 36px', background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13,
            }}
          />
        </div>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          style={{
            padding: '8px 12px', background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, width: 140,
          }}
        >
          <option value="all">All Roles</option>
          <option value="patient">Patients</option>
          <option value="doctor">Doctors</option>
          <option value="admin">Admins</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 12px', background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, width: 140,
          }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Main Patients Table */}
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
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Patient</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Email</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Phone</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Registration Date</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading patients...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No patients or users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{u.phone || 'N/A'}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <select
                        value={(() => {
                          const r = (u.role || '').toLowerCase();
                          if (r.includes('patient')) return 'patient';
                          if (r.includes('doctor')) return 'doctor';
                          if (r.includes('admin')) return 'admin';
                          return 'patient';
                        })()}
                        onChange={e => updateRole(u._id, e.target.value)}
                        style={{
                          background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)', padding: '4px 8px', borderRadius: 4, fontSize: 12,
                        }}
                      >
                        <option value="patient">Patient</option>
                        <option value="doctor">Doctor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                        background: u.isActive ? 'rgba(22, 163, 74, 0.15)' : 'rgba(220, 38, 38, 0.15)',
                        color: u.isActive ? '#16a34a' : '#dc2626',
                        border: `1px solid ${u.isActive ? 'rgba(22, 163, 74, 0.3)' : 'rgba(220, 38, 38, 0.3)'}`,
                      }}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setSelectedUser(u)}
                          style={{ padding: '5px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-primary)' }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => toggleStatus(u)}
                          style={{ padding: '5px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 4, cursor: 'pointer', color: u.isActive ? '#d97706' : '#16a34a' }}
                          title={u.isActive ? 'Suspend' : 'Activate'}
                        >
                          {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                        <button
                          onClick={() => deleteUser(u._id)}
                          style={{ padding: '5px 8px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: 4, cursor: 'pointer', color: '#dc2626' }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patient Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8,
            width: '100%', maxWidth: 440, padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Add New Patient / User</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14 }}
                  placeholder="Ram Singh"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14 }}
                  placeholder="patient@example.com"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14 }}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14 }}
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Account Role</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14 }}
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: '8px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 16px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                >
                  {submitting ? 'Creating...' : 'Save Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8,
            width: '100%', maxWidth: 400, padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Patient Information</h3>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div><strong style={{ color: 'var(--text-muted)' }}>Full Name:</strong> <span style={{ color: 'var(--text-primary)' }}>{selectedUser.name}</span></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Email:</strong> <span style={{ color: 'var(--text-primary)' }}>{selectedUser.email}</span></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Phone:</strong> <span style={{ color: 'var(--text-primary)' }}>{selectedUser.phone || 'N/A'}</span></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Role:</strong> <span style={{ color: 'var(--text-primary)' }}>{selectedUser.role}</span></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Status:</strong> <span style={{ color: selectedUser.isActive ? '#16a34a' : '#dc2626' }}>{selectedUser.isActive ? 'Active' : 'Suspended'}</span></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Registered:</strong> <span style={{ color: 'var(--text-primary)' }}>{new Date(selectedUser.createdAt).toLocaleString()}</span></div>
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              style={{ alignSelf: 'flex-end', padding: '7px 14px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
