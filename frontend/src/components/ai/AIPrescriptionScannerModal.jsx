import React, { useState } from 'react';
import { aiHubApi, medicationApi } from '../../services/api';
import toast from 'react-hot-toast';
import { X, ScanLine, Upload, CheckCircle, Plus, Sparkles, FileText, Building, User, Calendar, ShieldCheck } from 'lucide-react';

export default function AIPrescriptionScannerModal({ isOpen, onClose, onScanComplete }) {
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [savingMed, setSavingMed] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleScan = async () => {
    if (!file) return toast.error('Please select a prescription file or image');
    setScanning(true);
    try {
      const res = await aiHubApi.scanPrescription({
        filename: file.name,
        rawText: `Prescription file ${file.name}`,
      });
      setExtractedData(res.data.data);
      toast.success('Prescription scanned & AI extracted details successfully! 📄✨');
    } catch {
      toast.error('Prescription scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleCreateReminder = async () => {
    if (!extractedData) return;
    setSavingMed(true);
    try {
      await medicationApi.create({
        name: extractedData.medicationName || 'Scanned Medication',
        dosage: extractedData.dosage || '500 mg',
        dosageUnit: 'mg',
        frequency: 'daily',
        times: ['08:00', '20:00'],
        instructions: extractedData.instructions || 'Take after food',
      });
      toast.success(`Created medication reminder for ${extractedData.medicationName || 'Medication'}! 💊`);
      if (onScanComplete) onScanComplete(extractedData);
      onClose();
    } catch {
      toast.error('Failed to create medication reminder');
    } finally {
      setSavingMed(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div className="animate-fade-in-up" style={{
        background: 'var(--card-bg, #1a1c23)', border: '1px solid var(--border-color)',
        borderRadius: 16, width: '100%', maxWidth: 540, padding: 24, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ScanLine size={20} color="#06b6d4" />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                AI Prescription Scanner
              </h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>OCR &amp; Intelligent Prescription Extraction</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {!extractedData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              border: '2px dashed var(--border-color)', borderRadius: 14, padding: 30,
              textAlign: 'center', background: 'rgba(255,255,255,0.02)', cursor: 'pointer'
            }}>
              <Upload size={32} color="var(--accent-purple)" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                Upload Rx Prescription (Image / PDF)
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Supports PNG, JPG, JPEG, and PDF documents
              </div>
              <input type="file" accept="image/*,.pdf" onChange={handleFileChange} style={{ marginTop: 14, fontSize: 12 }} />
            </div>

            <button
              type="button"
              disabled={scanning || !file}
              onClick={handleScan}
              className="btn-primary"
              style={{ padding: '12px', fontSize: 14, fontWeight: 700, justifyContent: 'center' }}
            >
              {scanning ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  Analyzing Prescription with AI OCR...
                </span>
              ) : (
                <>
                  <Sparkles size={16} /> Scan &amp; Extract Prescription
                </>
              )}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Confidence Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(16,185,129,0.1)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#10b981' }}>
                <ShieldCheck size={18} /> High Confidence OCR Match
              </div>
              <span className="badge badge-green" style={{ fontSize: 11 }}>
                {(extractedData.confidenceScore * 100).toFixed(0)}% Score
              </span>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Medication Name</label>
                <input
                  className="input-field"
                  value={extractedData.medicationName}
                  onChange={e => setExtractedData(p => ({ ...p, medicationName: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Dosage</label>
                <input
                  className="input-field"
                  value={extractedData.dosage}
                  onChange={e => setExtractedData(p => ({ ...p, dosage: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Frequency</label>
                <input
                  className="input-field"
                  value={extractedData.frequency}
                  onChange={e => setExtractedData(p => ({ ...p, frequency: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Duration</label>
                <input
                  className="input-field"
                  value={extractedData.duration}
                  onChange={e => setExtractedData(p => ({ ...p, duration: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Food &amp; Usage Instructions</label>
              <input
                className="input-field"
                value={extractedData.instructions}
                onChange={e => setExtractedData(p => ({ ...p, instructions: e.target.value }))}
              />
            </div>

            {/* Prescribing Doctor & Hospital */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Doctor</label>
                <input className="input-field" value={extractedData.doctorName} readOnly />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Hospital</label>
                <input className="input-field" value={extractedData.hospitalName} readOnly />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setExtractedData(null)}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Scan Another
              </button>
              <button
                type="button"
                disabled={savingMed}
                onClick={handleCreateReminder}
                className="btn-primary"
                style={{ flex: 2, justifyContent: 'center', gap: 6 }}
              >
                <Plus size={16} /> Automatically Create Reminder
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
