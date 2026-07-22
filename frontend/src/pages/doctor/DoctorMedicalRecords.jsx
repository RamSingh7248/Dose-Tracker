import React, { useState } from 'react';
import { FolderHeart, Search, Filter, FileText, Pill, Calendar, Award } from 'lucide-react';

export default function DoctorMedicalRecords() {
  const [search, setSearch] = useState('');

  const records = [
    { id: '1', patient: 'John Doe', type: 'Prescription', title: 'Hypertension Management Rx', date: '2026-07-18', doctor: 'Dr. Sarah Jenkins' },
    { id: '2', patient: 'Jane Smith', type: 'Lab Report', title: 'Lipid Profile & HbA1c Test', date: '2026-07-15', doctor: 'Dr. Sarah Jenkins' },
    { id: '3', patient: 'Robert Johnson', type: 'Clinical Note', title: 'SOAP Assessment — Post Operative Check', date: '2026-07-10', doctor: 'Dr. Sarah Jenkins' },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">📂 Centralized Medical Records & EHR Audit Vault</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Unified record repository covering prescriptions, consultations, surgeries, vaccinations, and lab reports
          </p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            placeholder="Search medical records by patient name or document title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 34, fontSize: 12 }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {records.map(rec => (
          <div key={rec.id} className="glass-card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(139,92,246,0.15)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {rec.type === 'Prescription' ? <Pill size={20} /> : <FileText size={20} />}
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>{rec.title}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Patient: <strong>{rec.patient}</strong> • Type: <span className="badge badge-purple" style={{ fontSize: 10 }}>{rec.type}</span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{rec.date}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{rec.doctor}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
