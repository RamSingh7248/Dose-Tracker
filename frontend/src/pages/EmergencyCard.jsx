import React, { useEffect, useState } from 'react';
import { emergencyApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  QrCode, Save, Heart, Phone, AlertTriangle,
  Pill, User, Edit2, Shield, CheckCircle2, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmergencyCard() {
  const { user } = useAuth();
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  
  const [form, setForm] = useState({
    bloodGroup: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    allergies: [],
    conditions: [],
    emergencyContact: { name: '', phone: '', relationship: '' },
    height: '',
    weight: '',
  });

  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');

  useEffect(() => {
    fetchCard();
  }, []);

  const fetchCard = async () => {
    setLoading(true);
    try {
      const res = await emergencyApi.get();
      const d = res.data.data;
      setCardData(d);

      const formattedDob = d.dateOfBirth ? new Date(d.dateOfBirth).toISOString().split('T')[0] : '';

      setForm({
        bloodGroup: d.bloodGroup || '',
        phone: d.phone || '',
        gender: d.gender || '',
        dateOfBirth: formattedDob,
        allergies: Array.isArray(d.allergies) ? d.allergies : [],
        conditions: Array.isArray(d.conditions) ? d.conditions : [],
        emergencyContact: d.emergencyContact || { name: '', phone: '', relationship: '' },
        height: d.height !== null && d.height !== undefined ? String(d.height) : '',
        weight: d.weight !== null && d.weight !== undefined ? String(d.weight) : '',
      });

      // Auto enable editing if profile is brand new
      if (!d.bloodGroup && !d.phone && !d.emergencyContact?.phone) {
        setEditing(true);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load card data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        height: form.height !== '' ? Number(form.height) : null,
        weight: form.weight !== '' ? Number(form.weight) : null,
        dateOfBirth: form.dateOfBirth || null,
      };

      const res = await emergencyApi.update(payload);
      toast.success('Health profile updated successfully');
      
      const updatedUser = res.data.data;
      setCardData((prev) => ({
        ...prev,
        ...updatedUser,
        medications: prev?.medications || []
      }));
      setEditing(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save health profile');
    } finally {
      setSaving(false);
    }
  };

  const addAllergy = () => {
    if (!allergyInput.trim()) return;
    if (!form.allergies.includes(allergyInput.trim())) {
      setForm({ ...form, allergies: [...form.allergies, allergyInput.trim()] });
    }
    setAllergyInput('');
  };

  const removeAllergy = (index) => {
    setForm({ ...form, allergies: form.allergies.filter((_, idx) => idx !== index) });
  };

  const addCondition = () => {
    if (!conditionInput.trim()) return;
    if (!form.conditions.includes(conditionInput.trim())) {
      setForm({ ...form, conditions: [...form.conditions, conditionInput.trim()] });
    }
    setConditionInput('');
  };

  const removeCondition = (index) => {
    setForm({ ...form, conditions: form.conditions.filter((_, idx) => idx !== index) });
  };

  const enableEditMode = () => {
    if (!editing) setEditing(true);
  };

  const qrUrl = user ? `${window.location.origin}/public/emergency-card/${user.id || user._id}` : '';

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading emergency card...</p>
    </div>
  );

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🆘 Emergency QR Card & Health Profile</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Manage your essential medical info accessible via public QR code for first responders
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {editing ? (
            <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Profile
            </button>
          ) : (
            <button className="btn-secondary" onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Edit2 size={16} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        
        {/* QR Card Preview */}
        <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28 }}>🆘</div>
            <h2 style={{ fontFamily: 'Outfit', fontSize: 22, fontWeight: 800 }}>Emergency Medical Card</h2>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, marginTop: 4 }}>{cardData?.name || user?.name || 'Patient Profile'}</p>
          </div>

          {/* QR Code */}
          <div style={{ background: 'white', borderRadius: 16, padding: 16, display: 'inline-block', marginBottom: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
              alt="Emergency QR Code"
              width={200} height={200}
              style={{ display: 'block', borderRadius: 8 }}
            />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>First responders scan this code to view emergency info</p>

          {/* Quick Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
              <Heart size={16} color="#f43f5e" style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Outfit', color: '#f43f5e' }}>{form.bloodGroup || cardData?.bloodGroup || '—'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Blood Group</div>
            </div>

            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Phone size={16} color="#10b981" style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {form.emergencyContact?.phone || cardData?.emergencyContact?.phone || '—'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Emergency Phone</div>
            </div>

            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <User size={16} color="#8b5cf6" style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#8b5cf6' }}>
                {form.height ? `${form.height} cm` : '—'} / {form.weight ? `${form.weight} kg` : '—'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Height / Weight</div>
            </div>

            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
              <Shield size={16} color="#06b6d4" style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: '#06b6d4', textTransform: 'capitalize' }}>
                {form.gender || '—'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Gender</div>
            </div>
          </div>

          {/* Current Medications */}
          {cardData?.medications?.length > 0 && (
            <div style={{ marginTop: 20, textAlign: 'left' }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Pill size={14} color="var(--accent-purple)" /> Active Medications
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cardData.medications.map((med, i) => (
                  <div key={i} style={{ fontSize: 13, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>💊 {med.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{med.dosage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Allergies & Conditions */}
          {form.allergies?.length > 0 && (
            <div style={{ marginTop: 16, textAlign: 'left' }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={14} /> Allergies
              </h4>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {form.allergies.map(a => (
                  <span key={a} className="badge badge-amber">{a}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edit Form Card */}
        <div className="glass-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Shield size={20} color="var(--accent-purple)" />
              Health Profile Details
            </h3>
            {editing ? (
              <span className="badge badge-cyan" style={{ fontSize: 11 }}>Editing Mode</span>
            ) : (
              <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setEditing(true)}>
                Click to Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Blood Group</label>
                <select
                  className="input-field"
                  value={form.bloodGroup}
                  onChange={e => setForm({ ...form, bloodGroup: e.target.value })}
                  onClick={enableEditMode}
                >
                  <option value="">Select Blood Group</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Patient Phone</label>
                <input
                  className="input-field"
                  placeholder="+1 234 567 8900"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  onClick={enableEditMode}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Gender</label>
                <select
                  className="input-field"
                  value={form.gender}
                  onChange={e => setForm({ ...form, gender: e.target.value })}
                  onClick={enableEditMode}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Date of Birth</label>
                <input
                  className="input-field"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                  onClick={enableEditMode}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Height (cm)</label>
                <input
                  className="input-field"
                  type="number"
                  placeholder="e.g. 170"
                  value={form.height}
                  onChange={e => setForm({ ...form, height: e.target.value })}
                  onClick={enableEditMode}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Weight (kg)</label>
                <input
                  className="input-field"
                  type="number"
                  placeholder="e.g. 70"
                  value={form.weight}
                  onChange={e => setForm({ ...form, weight: e.target.value })}
                  onClick={enableEditMode}
                />
              </div>
            </div>

            <div className="divider" style={{ margin: '8px 0' }} />

            {/* Emergency Contact */}
            <h4 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
              <Phone size={15} color="var(--accent-emerald)" /> Emergency Contact Person
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Contact Name</label>
                <input
                  className="input-field"
                  placeholder="e.g. John Doe"
                  value={form.emergencyContact.name}
                  onChange={e => setForm({ ...form, emergencyContact: { ...form.emergencyContact, name: e.target.value } })}
                  onClick={enableEditMode}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Contact Phone</label>
                <input
                  className="input-field"
                  placeholder="e.g. +1 555 0192"
                  value={form.emergencyContact.phone}
                  onChange={e => setForm({ ...form, emergencyContact: { ...form.emergencyContact, phone: e.target.value } })}
                  onClick={enableEditMode}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Relationship</label>
              <input
                className="input-field"
                placeholder="e.g. Spouse, Parent, Brother"
                value={form.emergencyContact.relationship}
                onChange={e => setForm({ ...form, emergencyContact: { ...form.emergencyContact, relationship: e.target.value } })}
                onClick={enableEditMode}
              />
            </div>

            <div className="divider" style={{ margin: '8px 0' }} />

            {/* Allergies */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <AlertTriangle size={15} /> Allergies
              </h4>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {form.allergies.map((a, i) => (
                  <span
                    key={i}
                    className="badge badge-amber"
                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    onClick={() => removeAllergy(i)}
                    title="Click to remove"
                  >
                    {a} ×
                  </span>
                ))}
                {form.allergies.length === 0 && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No allergies added yet.</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input-field"
                  placeholder="Type allergy (e.g. Penicillin) and click Add"
                  value={allergyInput}
                  onChange={e => setAllergyInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAllergy(); } }}
                  onClick={enableEditMode}
                />
                <button className="btn-secondary" type="button" onClick={addAllergy} style={{ whiteSpace: 'nowrap' }}>
                  + Add
                </button>
              </div>
            </div>

            {/* Medical Conditions */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#06b6d4', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Heart size={15} /> Medical Conditions
              </h4>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {form.conditions.map((c, i) => (
                  <span
                    key={i}
                    className="badge badge-cyan"
                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    onClick={() => removeCondition(i)}
                    title="Click to remove"
                  >
                    {c} ×
                  </span>
                ))}
                {form.conditions.length === 0 && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No chronic conditions added yet.</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input-field"
                  placeholder="Type condition (e.g. Asthma, Diabetes) and click Add"
                  value={conditionInput}
                  onChange={e => setConditionInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCondition(); } }}
                  onClick={enableEditMode}
                />
                <button className="btn-secondary" type="button" onClick={addCondition} style={{ whiteSpace: 'nowrap' }}>
                  + Add
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '12px' }}
                disabled={saving}
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Save Health Profile
              </button>
            </div>
          </form>
        </div>

      </div>

      <style>{`@media (max-width: 900px) { div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
