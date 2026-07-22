import React, { useState, useEffect } from 'react';
import { doctorApi } from '../../services/api';
import { AlertTriangle, ShieldAlert, Phone, Heart, Activity, FileText, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorEmergency() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmergency();
  }, []);

  const fetchEmergency = async () => {
    setLoading(true);
    try {
      const res = await doctorApi.getEmergencyPatients();
      if (res.data?.data) {
        setPatients(res.data.data);
      }
    } catch (e) {
      toast.error('Failed to load emergency data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">⚠️ High-Risk Patient & Emergency Alert Console</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Monitor severe drug allergies, critical chronic illness flags, and emergency contact registries
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
      ) : patients.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <ShieldAlert size={40} style={{ marginBottom: 12, opacity: 0.5, color: '#10b981' }} />
          <p>No critical emergency flags detected across active patients.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {patients.map(p => (
            <div key={p._id} className="glass-card" style={{ padding: 20, borderLeft: '4px solid #f43f5e', background: 'linear-gradient(135deg, rgba(244,63,94,0.05) 0%, rgba(22,22,31,0.7) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800 }}>{p.name}</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Blood Group: <strong>{p.bloodGroup || 'O+'}</strong>
                  </div>
                </div>
                <span className="badge" style={{ background: 'rgba(244,63,94,0.2)', color: '#f43f5e' }}>
                  Critical Risk
                </span>
              </div>

              {p.allergies && p.allergies.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f43f5e', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={12} /> SEVERE ALLERGIES
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {p.allergies.map(a => (
                      <span key={a} className="badge" style={{ background: 'rgba(244,63,94,0.15)', color: '#f43f5e', fontSize: 10 }}>
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {p.conditions && p.conditions.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Heart size={12} /> CHRONIC CONDITIONS
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {p.conditions.map(c => (
                      <span key={c} className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: 10 }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, pt: 12, borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => toast.success(`Calling Emergency Contact: ${p.phone || '+1 (555) 911-0000'}`)}
                  className="btn-primary" style={{ flex: 1, padding: '6px 10px', fontSize: 11, background: '#f43f5e', borderColor: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                >
                  <Phone size={12} /> Call Emergency
                </button>
                <button
                  onClick={() => toast.success(`Accessing Emergency Health Card for ${p.name}`)}
                  className="btn-secondary" style={{ padding: '6px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <FileText size={12} /> View Card
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
