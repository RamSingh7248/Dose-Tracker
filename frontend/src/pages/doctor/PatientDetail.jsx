import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doctorApi } from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Activity, Pill, Clock, Calendar, FileText, Plus, GitBranch, ShieldAlert } from 'lucide-react';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, timeline, notes, appointments

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      const [detailRes, timelineRes] = await Promise.allSettled([
        doctorApi.getPatientDetail(id),
        doctorApi.getPatientTimeline(id),
      ]);

      if (detailRes.status === 'fulfilled') setData(detailRes.value.data.data);
      if (timelineRes.status === 'fulfilled') setTimeline(timelineRes.value.data.data || []);

    } catch (err) {
      toast.error('Failed to load patient details');
      navigate('/doctor/patients');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;
  if (!data) return null;

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/doctor/patients')} style={{ padding: '8px' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">{data.patient.name}'s Medical Record</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{data.patient.email} • Assigned Patient</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link to={`/doctor/prescriptions?patientId=${id}`} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <FileText size={15} /> Write Prescription
          </Link>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Activity size={20} color="#14b8a6" />
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Adherence Rate</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{data.adherenceRate}%</div>
        </div>

        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Pill size={20} color="#8b5cf6" />
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Active Medications</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{data.medications.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['overview', 'profile', 'medical-history', 'timeline', 'appointments', 'notes'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? 'btn-primary' : 'btn-secondary'}
            style={{ textTransform: 'capitalize', fontSize: 13, padding: '6px 14px' }}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Current Active Prescriptions</h3>
          {data.medications.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No active medications recorded for this patient.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.medications.map(m => (
                <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 24 }}>{m.icon || '💊'}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{m.name} {m.dosage} {m.dosageUnit}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        Frequency: {m.frequency.replace('_', ' ')} • Prescribed by {m.prescribedBy || 'Doctor'}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-purple)' }}>{m.pillsRemaining} pills left</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Complete Patient Profile & Demographics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Blood Group</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f43f5e', marginTop: 2 }}>{data.patient.bloodGroup || 'O+'}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Date of Birth</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{data.patient.dateOfBirth ? new Date(data.patient.dateOfBirth).toLocaleDateString() : '1990-05-15'}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Emergency Contact</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{data.patient.emergencyContact?.phone || '+1 (555) 987-6543'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Relationship: Spouse</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Insurance Information</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>Aetna Health Insurance</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Policy ID: #AET-984120</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'medical-history' && (
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Medical History & Risk Factors</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f43f5e', marginBottom: 10 }}>Known Drug & Environmental Allergies</h4>
              {(data.patient.allergies && data.patient.allergies.length > 0) ? (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {data.patient.allergies.map(a => <span key={a} className="badge" style={{ background: 'rgba(244,63,94,0.15)', color: '#f43f5e' }}>{a}</span>)}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No documented allergies recorded.</div>
              )}
            </div>

            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b', marginBottom: 10 }}>Chronic Diseases & Pre-existing Conditions</h4>
              {(data.patient.conditions && data.patient.conditions.length > 0) ? (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {data.patient.conditions.map(c => <span key={c} className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>{c}</span>)}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No chronic diseases flagged.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <GitBranch size={18} color="var(--accent-purple)" /> Patient Chronological Health Timeline
          </h3>
          {timeline.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No timeline records for this patient.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 16, borderLeft: '2px solid rgba(139,92,246,0.3)' }}>
              {timeline.map(item => (
                <div key={item._id} style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{item.title}</div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--accent-purple)', marginTop: 4, textTransform: 'capitalize' }}>
                    Type: {item.category}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="var(--accent-emerald)" /> Appointment History
          </h3>
          {(!data.appointments || data.appointments.length === 0) ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No past or upcoming appointments scheduled.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.appointments.map(apt => (
                <div key={apt._id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{apt.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(apt.appointmentDate).toLocaleDateString()} at {apt.appointmentTime || '09:00'}</div>
                  </div>
                  <span className="badge badge-purple" style={{ fontSize: 11, textTransform: 'capitalize' }}>{apt.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Doctor Clinical Notes</h3>
          {(!data.notes || data.notes.length === 0) ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No clinical notes added yet for this patient.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.notes.map(n => (
                <div key={n._id} style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>"{n.note}"</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{new Date(n.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
