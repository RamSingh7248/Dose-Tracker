import React, { useState, useEffect } from 'react';
import { adminApi, prescriptionApi } from '../../services/api';
import { Plus, Search, FileText, Download, Trash2, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRx, setSelectedRx] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    patientName: '',
    doctorName: '',
    instructions: '',
  });

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPrescriptions();
      setPrescriptions(res.data.data || []);
    } catch {
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', formData.title || 'Digital Prescription');
      fd.append('doctorName', formData.doctorName);
      fd.append('notes', formData.instructions);

      await prescriptionApi.upload(fd);
      toast.success('Prescription recorded successfully');
      setIsModalOpen(false);
      setFormData({ title: '', patientName: '', doctorName: '', instructions: '' });
      fetchPrescriptions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record prescription');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prescription record?')) return;
    try {
      await prescriptionApi.remove(id);
      toast.success('Prescription deleted');
      fetchPrescriptions();
    } catch {
      toast.error('Failed to delete prescription');
    }
  };

  const filtered = prescriptions.filter(p => {
    const matchesSearch =
      (p.title || p.originalName || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.doctor?.name || p.doctorName || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || (p.status || 'processed') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Prescriptions
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0 0' }}>
            System directory of digital medical prescriptions and medication orders
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
          <span>Add Prescription</span>
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
            placeholder="Search by title, patient name, or doctor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 36px', background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13,
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 12px', background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, width: 160,
          }}
        >
          <option value="all">All Statuses</option>
          <option value="processed">Processed</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
        </select>
      </div>

      {/* Prescriptions Table */}
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
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Doctor</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Prescription Title / Medication</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading prescriptions...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No prescriptions recorded.
                  </td>
                </tr>
              ) : (
                filtered.map((rx) => {
                  const status = (rx.status || 'processed').toLowerCase();
                  return (
                    <tr key={rx._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {rx.user?.name || 'Patient'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                        {rx.doctor?.name || rx.doctorName ? `Dr. ${rx.doctor?.name || rx.doctorName}` : 'Clinical Specialist'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {rx.createdAt ? new Date(rx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>
                        {rx.title || rx.originalName || 'Medication Prescription'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                          textTransform: 'capitalize', background: 'rgba(37, 99, 235, 0.15)', color: '#2563eb', border: '1px solid rgba(37, 99, 235, 0.3)',
                        }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setSelectedRx(rx)}
                            style={{ padding: '5px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-primary)' }}
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          {rx.fileUrl && (
                            <a
                              href={rx.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ padding: '5px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 4, color: '#2563eb', display: 'inline-flex', alignItems: 'center' }}
                              title="Download File"
                            >
                              <Download size={14} />
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(rx._id)}
                            style={{ padding: '5px 8px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: 4, cursor: 'pointer', color: '#dc2626' }}
                            title="Delete Record"
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

      {/* Add Prescription Modal */}
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
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Add New Prescription</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePrescription} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Prescription Title / Medication</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14 }}
                  placeholder="Amoxicillin 500mg - 7 Day Course"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Prescribing Doctor</label>
                <input
                  type="text"
                  required
                  value={formData.doctorName}
                  onChange={e => setFormData({ ...formData, doctorName: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14 }}
                  placeholder="Dr. Rajesh Kumar"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Dosage Instructions</label>
                <textarea
                  value={formData.instructions}
                  onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14 }}
                  placeholder="Take 1 capsule twice daily after meals for 7 days..."
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
                  disabled={submitting}
                  style={{ padding: '8px 16px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                >
                  {submitting ? 'Saving...' : 'Save Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Prescription Details Modal */}
      {selectedRx && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8,
            width: '100%', maxWidth: 400, padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Prescription Details</h3>
              <button onClick={() => setSelectedRx(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div><strong style={{ color: 'var(--text-muted)' }}>Title:</strong> <span style={{ color: 'var(--text-primary)' }}>{selectedRx.title || selectedRx.originalName || 'Prescription'}</span></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Patient:</strong> <span style={{ color: 'var(--text-primary)' }}>{selectedRx.user?.name || 'Patient'}</span></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Doctor:</strong> <span style={{ color: 'var(--text-primary)' }}>{selectedRx.doctor?.name || selectedRx.doctorName || 'Clinical Specialist'}</span></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Prescribed Date:</strong> <span style={{ color: 'var(--text-primary)' }}>{selectedRx.createdAt ? new Date(selectedRx.createdAt).toLocaleDateString() : 'N/A'}</span></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Notes:</strong> <span style={{ color: 'var(--text-primary)' }}>{selectedRx.notes || 'No additional instructions'}</span></div>
            </div>

            <button
              onClick={() => setSelectedRx(null)}
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
