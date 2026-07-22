import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { FileText, Search, Pill, User, Download, Eye, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const filtered = prescriptions.filter(p => {
    return (
      (p.title || p.originalName || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.doctor?.name || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">💊 Central Prescription Vault</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            System directory of AI-scanned and doctor-generated digital prescriptions
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            placeholder="Search by title, patient name, or doctor..."
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
          No prescriptions found matching your query.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(rx => (
            <div key={rx._id} className="glass-card" style={{ padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pill size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {rx.title || rx.originalName || 'Digital Prescription'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Patient: <strong>{rx.user?.name || 'Patient'}</strong> • Doctor: <strong>{rx.doctor?.name || 'AI Scanner'}</strong> • {new Date(rx.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
                  {rx.status || 'Processed'}
                </span>
                {rx.fileUrl && (
                  <a
                    href={rx.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Download size={13} /> View File
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
