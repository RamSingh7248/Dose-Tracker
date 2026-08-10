import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, X, Trash2, CheckCircle, Search, Eye } from 'lucide-react';

const DASHBOARD_QUERY_KEY = ['admin-dashboard-stats'];

export default function DoctorManagement() {
  const queryClient = useQueryClient();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', specialization: '', licenseNumber: '', hospital: '', phone: ''
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({ role: 'doctor' });
      setDoctors(res.data.data || []);
    } catch {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createDoctor(formData);
      toast.success('Doctor account created successfully');
      setIsModalOpen(false);
      fetchDoctors();
      setFormData({ name: '', email: '', password: '', specialization: '', licenseNumber: '', hospital: '', phone: '' });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create doctor account');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await adminApi.updateStatus(id, !currentStatus);
      toast.success(currentStatus ? 'Doctor suspended' : 'Doctor activated');
      fetchDoctors();
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    } catch {
      toast.error('Failed to update doctor status');
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this doctor record?')) return;
    try {
      await adminApi.deleteUser(id);
      toast.success('Doctor deleted successfully');
      fetchDoctors();
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    } catch {
      toast.error('Failed to delete doctor');
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      (doc.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (doc.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (doc.specialization || '').toLowerCase().includes(search.toLowerCase());

    const isVerified = doc.isVerified || doc.verified || false;
    if (verificationFilter === 'verified' && !isVerified) return false;
    if (verificationFilter === 'pending' && isVerified) return false;

    return matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Doctors
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0 0' }}>
            Manage medical specialists, verify licenses, and provision doctor accounts
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', background: '#2563eb', color: '#ffffff',
            border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          <span>Add Doctor</span>
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
            placeholder="Search by doctor name, email, or specialization..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 36px', background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13,
            }}
          />
        </div>

        <select
          value={verificationFilter}
          onChange={e => setVerificationFilter(e.target.value)}
          style={{
            padding: '8px 12px', background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, width: 160,
          }}
        >
          <option value="all">All Verifications</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Doctors Table */}
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
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Doctor Name</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Specialization</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Email</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Phone</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Verification</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading doctors...
                  </td>
                </tr>
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No doctor records found.
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doc) => {
                  const isVerified = doc.isVerified || doc.verified || false;
                  return (
                    <tr key={doc._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {doc.name.toLowerCase().startsWith('dr.') ? doc.name : `Dr. ${doc.name}`}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                        {doc.specialization || 'General Practitioner'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{doc.email}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{doc.phone || 'N/A'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                          background: isVerified ? 'rgba(22, 163, 74, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                          color: isVerified ? '#16a34a' : '#d97706',
                          border: `1px solid ${isVerified ? 'rgba(22, 163, 74, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
                        }}>
                          {isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                          background: doc.isActive ? 'rgba(37, 99, 235, 0.15)' : 'rgba(220, 38, 38, 0.15)',
                          color: doc.isActive ? '#2563eb' : '#dc2626',
                          border: `1px solid ${doc.isActive ? 'rgba(37, 99, 235, 0.3)' : 'rgba(220, 38, 38, 0.3)'}`,
                        }}>
                          {doc.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setSelectedDoctor(doc)}
                            style={{ padding: '5px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-primary)' }}
                            title="View Credentials"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(doc._id, doc.isActive)}
                            style={{ padding: '5px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 4, cursor: 'pointer', color: doc.isActive ? '#d97706' : '#16a34a' }}
                            title={doc.isActive ? 'Suspend Doctor' : 'Activate Doctor'}
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteDoctor(doc._id)}
                            style={{ padding: '5px 8px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: 4, cursor: 'pointer', color: '#dc2626' }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Doctor Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8,
            width: '100%', maxWidth: 440, padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Add Doctor Account</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14 }}
                  placeholder="Dr. Rajesh Kumar"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Specialization</label>
                <input
                  type="text"
                  required
                  value={formData.specialization}
                  onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14 }}
                  placeholder="Cardiology / Internal Medicine"
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
                  placeholder="doctor@hospital.com"
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
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Medical License Number</label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14 }}
                  placeholder="MCI-2024-8890"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                >
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Doctor Details Modal */}
      {selectedDoctor && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8,
            width: '100%', maxWidth: 400, padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Doctor Credentials</h3>
              <button onClick={() => setSelectedDoctor(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div><strong style={{ color: 'var(--text-muted)' }}>Doctor Name:</strong> <span style={{ color: 'var(--text-primary)' }}>{selectedDoctor.name}</span></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Specialization:</strong> <span style={{ color: 'var(--text-primary)' }}>{selectedDoctor.specialization || 'General Medicine'}</span></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Email:</strong> <span style={{ color: 'var(--text-primary)' }}>{selectedDoctor.email}</span></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>License No:</strong> <span style={{ color: 'var(--text-primary)' }}>{selectedDoctor.licenseNumber || selectedDoctor.license || 'Verified License'}</span></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Verification:</strong> <span style={{ color: selectedDoctor.isVerified ? '#16a34a' : '#d97706' }}>{selectedDoctor.isVerified ? 'Verified' : 'Pending Verification'}</span></div>
            </div>

            <button
              onClick={() => setSelectedDoctor(null)}
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
