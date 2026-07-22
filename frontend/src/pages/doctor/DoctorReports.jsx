import React, { useState } from 'react';
import { FileText, Download, Eye, Upload, Filter, Search, CheckCircle2, Columns } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorReports() {
  const [filter, setFilter] = useState('all');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedReports, setSelectedReports] = useState([]);

  const reports = [
    { id: '1', patientName: 'John Doe', category: 'Blood Report', title: 'Complete Blood Count (CBC) & Lipid Profile', date: '2026-07-18', status: 'Normal', fileType: 'PDF' },
    { id: '2', patientName: 'Jane Smith', category: 'MRI', title: 'Brain MRI Scan (T1/T2 Contrast)', date: '2026-07-15', status: 'Attention Needed', fileType: 'DICOM' },
    { id: '3', patientName: 'Robert Johnson', category: 'ECG', title: '12-Lead Electrocardiogram', date: '2026-07-10', status: 'Normal', fileType: 'PDF' },
    { id: '4', patientName: 'Emily Davis', category: 'X-Ray', title: 'Chest Radiograph (PA View)', date: '2026-07-08', status: 'Normal', fileType: 'IMG' },
  ];

  const handleToggleSelect = (id) => {
    if (selectedReports.includes(id)) {
      setSelectedReports(selectedReports.filter(r => r !== id));
    } else {
      if (selectedReports.length >= 2) return toast.error('Can compare maximum 2 reports at a time');
      setSelectedReports([...selectedReports, id]);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">📄 Enterprise Medical & Diagnostic Reports Vault</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Review, download, compare lab reports, X-Rays, MRIs, and blood analysis documents
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={() => setCompareMode(!compareMode)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: compareMode ? 'rgba(139,92,246,0.2)' : undefined, color: compareMode ? 'var(--accent-purple)' : undefined }}
          >
            <Columns size={16} /> {compareMode ? 'Exit Compare Mode' : 'Compare Reports'}
          </button>
          <button className="btn-primary" onClick={() => toast.success('Report upload modal opened')}>
            <Upload size={16} /> Upload Diagnostic Report
          </button>
        </div>
      </div>

      {compareMode && (
        <div className="glass-card" style={{ padding: 16, marginBottom: 20, border: '1px dashed var(--accent-purple)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-purple)', marginBottom: 8 }}>
            📊 REPORT COMPARISON SELECTION ({selectedReports.length}/2 selected)
          </div>
          {selectedReports.length === 2 ? (
            <button className="btn-primary" onClick={() => toast.success('Comparing reports side-by-side!')} style={{ fontSize: 12 }}>
              Compare Selected Reports Side-by-Side
            </button>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Select any 2 reports below to generate side-by-side comparison.</span>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {reports.map(rep => (
          <div key={rep.id} className="glass-card" style={{ padding: 18, border: selectedReports.includes(rep.id) ? '1px solid var(--accent-purple)' : undefined }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <span className="badge badge-purple" style={{ fontSize: 10, mb: 4 }}>{rep.category}</span>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{rep.title}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Patient: <strong>{rep.patientName}</strong></div>
              </div>
              <span className="badge" style={{
                background: rep.status === 'Normal' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                color: rep.status === 'Normal' ? '#10b981' : '#f59e0b', fontSize: 10
              }}>
                {rep.status}
              </span>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Uploaded on {rep.date} • Format: {rep.fileType}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', pt: 10, borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-secondary" onClick={() => toast.success(`Opening preview for ${rep.title}`)} style={{ padding: '4px 10px', fontSize: 11 }}>
                  <Eye size={12} /> Preview
                </button>
                <button className="btn-secondary" onClick={() => toast.success(`Downloading ${rep.title}`)} style={{ padding: '4px 10px', fontSize: 11 }}>
                  <Download size={12} /> Download
                </button>
              </div>

              {compareMode && (
                <button
                  onClick={() => handleToggleSelect(rep.id)}
                  className="badge"
                  style={{
                    background: selectedReports.includes(rep.id) ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)',
                    color: selectedReports.includes(rep.id) ? 'white' : 'var(--text-muted)',
                    cursor: 'pointer', border: 'none'
                  }}
                >
                  {selectedReports.includes(rep.id) ? 'Selected ✓' : '+ Select'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
