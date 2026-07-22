import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { emergencyApi } from '../services/api';
import { Heart, Phone, AlertTriangle, Pill, Shield, Activity, User, Stethoscope, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PublicEmergencyCard() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchPublicCard();
    }
  }, [userId]);

  const fetchPublicCard = async () => {
    setLoading(true);
    try {
      const res = await emergencyApi.getPublic(userId);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load emergency medical information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, background: 'var(--bg-primary)' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading emergency medical profile...</p>
    </div>
  );

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, background: 'var(--bg-primary)', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 48 }}>⚠️</div>
      <h2 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800 }}>Profile Not Found</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: 400 }}>The requested emergency medical card could not be retrieved. Please check the URL or try scanning the QR code again.</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '24px 16px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Urgent Header */}
        <div style={{
          background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
          borderRadius: 16,
          padding: '24px 20px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(244, 63, 94, 0.4)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(10px)' }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', marginBottom: 12 }}>
            <Activity size={32} color="#ffffff" className="animate-pulse" />
          </div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 900, letterSpacing: '0.5px', textTransform: 'uppercase', margin: 0 }}>Emergency Medical ID</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>First Responder Information & Quick Contact Details</p>
        </div>

        {/* Patient Core details */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} color="var(--accent-purple)" />
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>PATIENT NAME</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit' }}>{data.name}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Heart size={20} color="#f43f5e" style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 20, fontWeight: 900, color: '#f43f5e', fontFamily: 'Outfit' }}>{data.bloodGroup || '—'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Blood Group</div>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Phone size={20} color="var(--accent-purple)" style={{ marginBottom: 4 }} />
              <a href={`tel:${data.phone}`} style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none', marginTop: 4 }}>{data.phone || '—'}</a>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Patient Phone</div>
            </div>
          </div>
        </div>

        {/* Doctor & Hospital Details */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 800, color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Stethoscope size={18} color="var(--accent-purple)" /> Primary Doctor & Hospital
          </h3>
          {data.doctor ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Dr. {data.doctor.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Specialization: {data.doctor.specialization}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Building2 size={13} /> Hospital: <strong>{data.hospital || data.doctor.hospital}</strong>
              </div>
              {data.doctor.phone && (
                <a href={`tel:${data.doctor.phone}`} style={{ fontSize: 12, color: 'var(--accent-purple)', textDecoration: 'none', marginTop: 4 }}>
                  📞 {data.doctor.phone}
                </a>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Building2 size={15} color="var(--accent-purple)" /> Hospital: <strong>{data.hospital || 'City General Hospital'}</strong>
            </div>
          )}
        </div>

        {/* Emergency Contact */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Phone size={18} color="var(--accent-emerald)" /> Emergency Contact
          </h3>
          {data.emergencyContact?.name ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>CONTACT PERSON</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{data.emergencyContact.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{data.emergencyContact.relationship || 'Relationship not specified'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <a href={`tel:${data.emergencyContact.phone}`} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 10, background: 'var(--accent-emerald)',
                    color: '#ffffff', textDecoration: 'none', fontWeight: 600, fontSize: 13,
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                  }}>
                    <Phone size={14} /> Call Now
                  </a>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid var(--border-color)', wordBreak: 'break-all' }}>
                📞 {data.emergencyContact.phone}
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No emergency contact set.</div>
          )}
        </div>

        {/* Allergies */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <AlertTriangle size={18} color="#f59e0b" /> Allergies
          </h3>
          {data.allergies?.length > 0 ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {data.allergies.map((allergy, i) => (
                <span key={i} className="badge badge-amber" style={{ fontSize: 13, padding: '6px 12px' }}>{allergy}</span>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No known allergies listed.</div>
          )}
        </div>

        {/* Chronic Conditions */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 800, color: '#06b6d4', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Shield size={18} color="#06b6d4" /> Medical Conditions
          </h3>
          {data.conditions?.length > 0 ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {data.conditions.map((condition, i) => (
                <span key={i} className="badge badge-cyan" style={{ fontSize: 13, padding: '6px 12px' }}>{condition}</span>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No chronic medical conditions listed.</div>
          )}
        </div>

        {/* Current Medications */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Pill size={18} color="var(--accent-purple)" /> Current Medications
          </h3>
          {data.medications?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.medications.map((med, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💊</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{med.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{med.dosage}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No active medications listed.</div>
          )}
        </div>

        {/* Footer info */}
        <div style={{ textAlign: 'center', padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <span>🔒</span> Secured Emergency Medical Record
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            DoseTracker Smart Medication Manager
          </div>
        </div>

      </div>
    </div>
  );
}
