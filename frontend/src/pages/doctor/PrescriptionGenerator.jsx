import React, { useEffect, useState } from 'react';
import { doctorApi } from '../../services/api';
import { FileText, Plus, Trash2, Send, CheckCircle, Search, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PrescriptionGenerator() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: 'Once daily', duration: '', instructions: '' }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await doctorApi.getPatients();
      setPatients(res.data.data || []);
      if (res.data.data?.length > 0) {
        setSelectedPatientId(res.data.data[0]._id);
      }
    } catch {
      toast.error('Failed to load patients list');
    } finally {
      setLoading(false);
    }
  };

  const addMedicineRow = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: 'Once daily', duration: '', instructions: '' }]);
  };

  const updateMedicine = (i, field, value) => {
    const meds = [...medicines];
    meds[i][field] = value;
    setMedicines(meds);
  };

  const removeMedicine = (i) => {
    setMedicines(medicines.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) return toast.error('Please select a patient');
    const validMeds = medicines.filter(m => m.name.trim());
    if (validMeds.length === 0) return toast.error('Please enter at least one medication name');

    setSaving(true);
    try {
      await doctorApi.generatePrescription({
        patientId: selectedPatientId,
        medicines: validMeds,
        notes,
        hospitalName,
      });
      toast.success('Prescription generated successfully! Reminders created for the patient.');
      // Reset form
      setNotes('');
      setMedicines([{ name: '', dosage: '', frequency: 'Once daily', duration: '', instructions: '' }]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate prescription');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: 40, height: 40, borderColor: '#14b8a6', borderTopColor: 'transparent' }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading patients list...</p>
    </div>
  );

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#14b8a6' }}>📝 Prescription Generator</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Generate digital prescriptions and auto-configure reminders for patients</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        {/* Prescription Details Form */}
        <form onSubmit={handleSubmit} className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>New Prescription</h3>
          
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Select Patient *</label>
            <div style={{ position: 'relative' }}>
              <select 
                className="input-field" 
                value={selectedPatientId} 
                onChange={e => setSelectedPatientId(e.target.value)}
                required
              >
                {patients.map(p => (
                  <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Hospital / Clinic Name</label>
              <input 
                className="input-field" 
                placeholder="e.g. City General Hospital" 
                value={hospitalName} 
                onChange={e => setHospitalName(e.target.value)} 
              />
            </div>
          </div>

          <div className="divider" style={{ margin: '8px 0' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Medications List</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={async () => {
                    if (!selectedPatientId) return toast.error('Select a patient first');
                    const validMeds = medicines.filter(m => m.name.trim());
                    if (validMeds.length === 0) return toast.error('Add at least 1 medicine name');
                    try {
                      const res = await doctorApi.checkInteractions({ patientId: selectedPatientId, medicines: validMeds });
                      if (res.data.warnings?.length > 0) {
                        toast.error(`Warning: ${res.data.warnings[0].message}`);
                      } else {
                        toast.success('✓ Prescription Safety Verified! Zero drug-drug or allergy conflicts detected.');
                      }
                    } catch (e) { toast.error('Safety check failed'); }
                  }}
                  style={{ padding: '4px 10px', fontSize: 12, color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}
                >
                  🛡️ AI Interaction Check
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={addMedicineRow}
                  style={{ padding: '4px 10px', fontSize: 12, color: '#14b8a6', borderColor: 'rgba(20,184,166,0.3)' }}
                >
                  <Plus size={14} /> Add Medicine
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {medicines.map((med, i) => (
                <div key={i} style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#14b8a6' }}>Medicine #{i + 1}</span>
                    {medicines.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeMedicine(i)} 
                        style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: 12 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
                    <input 
                      className="input-field" 
                      placeholder="Medicine name *" 
                      value={med.name} 
                      onChange={e => updateMedicine(i, 'name', e.target.value)} 
                      required 
                    />
                    <input 
                      className="input-field" 
                      placeholder="Dosage (e.g. 500mg)" 
                      value={med.dosage} 
                      onChange={e => updateMedicine(i, 'dosage', e.target.value)} 
                    />
                    <select 
                      className="input-field" 
                      value={med.frequency} 
                      onChange={e => updateMedicine(i, 'frequency', e.target.value)}
                    >
                      <option value="Once daily">Once daily</option>
                      <option value="Twice daily">Twice daily</option>
                      <option value="Three times daily">Three times daily</option>
                      <option value="Four times daily">Four times daily</option>
                      <option value="As needed">As needed</option>
                      <option value="Weekly">Weekly</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
                    <input 
                      className="input-field" 
                      placeholder="Duration (e.g. 7 days)" 
                      value={med.duration} 
                      onChange={e => updateMedicine(i, 'duration', e.target.value)} 
                    />
                    <input 
                      className="input-field" 
                      placeholder="Special instructions (e.g. Take after breakfast)" 
                      value={med.instructions} 
                      onChange={e => updateMedicine(i, 'instructions', e.target.value)} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="divider" style={{ margin: '8px 0' }} />

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Clinical Notes / Instructions</label>
            <textarea 
              className="input-field" 
              rows={3} 
              placeholder="Additional clinical notes, dietary advice, or follow-up schedule..." 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', border: 'none' }}
            disabled={saving}
          >
            <Send size={16} /> {saving ? 'Generating...' : 'Generate & Send Prescription'}
          </button>
        </form>

        {/* Clinical Reference / Preview Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-card" style={{ padding: 24, border: '1px solid rgba(20,184,166,0.2)' }}>
            <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#14b8a6', marginBottom: 12 }}>
              <FileText size={18} /> Digital Signature Auto-Sign
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Prescriptions generated here are stored in the patient's Digital Vault under <strong>Prescriptions</strong>. The system will parse them and create reminders inside the patient's schedule automatically.
            </p>
            <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: 'rgba(20,184,166,0.05)', border: '1px solid rgba(20,184,166,0.1)' }}>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                💡 <strong>Reminder Synchronization:</strong> Daily schedules for patients are calculated immediately. They will receive native alerts if notifications are enabled.
              </p>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Patient Health Information</h3>
            {selectedPatientId ? (
              (() => {
                const pat = patients.find(p => p._id === selectedPatientId);
                return pat ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(20, 184, 166, 0.1)', color: '#14b8a6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>
                        {pat.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{pat.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pat.email}</div>
                      </div>
                    </div>
                    <div className="divider" style={{ margin: '4px 0' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <div>Blood Group: <strong>{pat.bloodGroup || '—'}</strong></div>
                      <div>Gender: <span style={{ textTransform: 'capitalize' }}><strong>{pat.gender || '—'}</strong></span></div>
                      <div style={{ gridColumn: 'span 2' }}>Allergies: <span style={{ color: pat.allergies?.length > 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }}><strong>{pat.allergies?.join(', ') || 'None recorded'}</strong></span></div>
                    </div>
                  </div>
                ) : null;
              })()
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Select a patient to view their profile summary.</p>
            )}
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 900px) { div[style*="grid-template-columns: 1.5fr 1fr"] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
