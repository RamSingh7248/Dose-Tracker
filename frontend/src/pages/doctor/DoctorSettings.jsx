import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorApi } from '../../services/api';
import { Settings, Stethoscope, Building, Award, DollarSign, Clock, Save, PenTool } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorSettings() {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    specialization: user?.specialization || 'Cardiology & Internal Medicine',
    hospital: user?.hospital || 'City Heart & Vascular Medical Center',
    licenseNumber: user?.licenseNumber || 'MD-89412-NY',
    yearsOfExp: user?.yearsOfExp || 12,
    phone: user?.phone || '+1 (555) 234-5678',
    consultationFee: '$150',
    workingHours: '09:00 AM - 05:00 PM',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await doctorApi.updateProfile(formData);
      if (res.data?.user) {
        toast.success('Doctor practice settings updated!');
      }
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Doctor Practice & Profile Configuration</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Update medical qualifications, practice hospital, consultation fees, digital signature, and working hours
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, pb: 8, borderBottom: '1px solid var(--border-color)' }}>
            👨‍⚕️ Clinical Qualifications & Practice Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="input-label">Medical Specialization</label>
              <input
                className="input-field"
                value={formData.specialization}
                onChange={e => setFormData({ ...formData, specialization: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label">Primary Hospital / Clinic</label>
              <input
                className="input-field"
                value={formData.hospital}
                onChange={e => setFormData({ ...formData, hospital: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="input-label">Medical License Number</label>
              <input
                className="input-field"
                value={formData.licenseNumber}
                onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label">Years of Experience</label>
              <input
                className="input-field"
                type="number"
                value={formData.yearsOfExp}
                onChange={e => setFormData({ ...formData, yearsOfExp: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="input-label">Consultation Fee</label>
              <input
                className="input-field"
                value={formData.consultationFee}
                onChange={e => setFormData({ ...formData, consultationFee: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label">Working Hours & Days</label>
              <input
                className="input-field"
                value={formData.workingHours}
                onChange={e => setFormData({ ...formData, workingHours: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={saving} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
            {saving ? <div className="spinner" /> : <><Save size={16} /> Save Practice Settings</>}
          </button>
        </div>

        {/* Digital Signature Canvas Preview */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <PenTool size={18} color="var(--accent-purple)" /> Digital Signature Stamp
          </h3>
          <div style={{ border: '1px dashed var(--border-color)', borderRadius: 10, padding: 20, textAlign: 'center', background: 'rgba(0,0,0,0.3)', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Dancing Script, cursive', fontSize: 24, color: '#10b981', transform: 'rotate(-4deg)' }}>
              Dr. {user?.name || 'Sarah Jenkins'}, MD
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>Verified e-Signature Hash: 98a4f-dx812</div>
          </div>
          <button type="button" className="btn-secondary" onClick={() => toast.success('Signature canvas redrawn')} style={{ width: '100%', fontSize: 12 }}>
            Redraw Digital Signature
          </button>
        </div>
      </form>
    </div>
  );
}
