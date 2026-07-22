import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';
import { Shield, Plus, X, Trash2, Ban, CheckCircle, Stethoscope, Mail, Lock, Building, Award } from 'lucide-react';

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', specialization: '', licenseNumber: '', hospital: '', yearsOfExp: ''
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
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
      toast.success('Doctor account created successfully 🎉');
      setIsModalOpen(false);
      fetchDoctors();
      setFormData({ name: '', email: '', password: '', specialization: '', licenseNumber: '', hospital: '', yearsOfExp: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create doctor account');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await adminApi.updateStatus(id, !currentStatus);
      toast.success(currentStatus ? 'Doctor account suspended' : 'Doctor account activated');
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update doctor status');
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this doctor account?')) return;
    try {
      await adminApi.deleteUser(id);
      toast.success('Doctor account deleted successfully');
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete doctor account');
    }
  };

  const formatDoctorName = (name) => {
    if (!name) return 'Dr. Medical Specialist';
    return name.toLowerCase().startsWith('dr.') ? name : `Dr. ${name}`;
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">🩺 Doctor Management & Approvals</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Manage medical professionals, verify credentials, and provision doctor accounts
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setIsModalOpen(true)}
          style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={18} /> Add Doctor Account
        </button>
      </div>

      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Doctor Name</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Specialization</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Hospital / Clinic</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }}/></td></tr>
              ) : doctors.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No doctor accounts registered yet.</td></tr>
              ) : doctors.map(d => (
                <tr key={d._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Shield size={16} color="#10b981" /> {formatDoctorName(d.name)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{d.email}</div>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-primary)' }}>{d.specialization || 'General Physician'}</td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{d.hospital || 'City Healthcare'}</td>
                  <td style={{ padding: '16px' }}>
                    <span className={`badge ${d.isActive ? 'badge-green' : 'badge-red'}`}>
                      {d.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleToggleStatus(d._id, d.isActive)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        {d.isActive ? <Ban size={13} color="#f43f5e" /> : <CheckCircle size={13} color="#10b981" />}
                        {d.isActive ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteDoctor(d._id)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, borderColor: 'rgba(244,63,94,0.3)', color: '#f43f5e' }}
                      >
                        <Trash2 size={13} color="#f43f5e" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Responsive & Beautiful Create Doctor Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="animate-fade-in-up" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh',
            overflowY: 'auto', padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 14 }}>
              <h2 style={{ fontFamily: 'Outfit', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Stethoscope size={22} color="#f43f5e" /> Create Doctor Account
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Doctor Full Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Dr. Sarah Jenkins"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Email Address *</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="doctor@hospital.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Temporary Password *</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Specialization</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Cardiologist"
                    value={formData.specialization}
                    onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>License Number</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="MED-88942"
                    value={formData.licenseNumber}
                    onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Hospital / Medical Center</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="City General Hospital"
                  value={formData.hospital}
                  onChange={e => setFormData({ ...formData, hospital: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' }}>
                  Create Doctor Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
