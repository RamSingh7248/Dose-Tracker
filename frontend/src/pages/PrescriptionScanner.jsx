import React, { useEffect, useState } from 'react';
import { prescriptionApi } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, Trash2, X, Plus, Pill, CheckCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const DASHBOARD_QUERY_KEY = ['admin-dashboard-stats'];

export default function PrescriptionScanner() {
  const queryClient = useQueryClient();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ doctorName: '', hospitalName: '', notes: '' });
  const [selectedRx, setSelectedRx] = useState(null);
  const [extractForm, setExtractForm] = useState({
    medicines: [{
      name: '',
      dosage: '',
      frequency: 'once_daily',
      morning: false,
      afternoon: false,
      night: false,
      duration: '',
      instructions: '',
      foodInstructions: 'no_preference'
    }]
  });
  const [creating, setCreating] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => { fetchPrescriptions(); }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await prescriptionApi.getAll();
      setPrescriptions(res.data.data || []);
    } catch { toast.error('Failed to load prescriptions'); }
    finally { setLoading(false); }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return toast.error('Please select a file');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('doctorName', uploadForm.doctorName);
      formData.append('hospitalName', uploadForm.hospitalName);
      formData.append('notes', uploadForm.notes);

      const res = await prescriptionApi.upload(formData);
      toast.success('Prescription uploaded! Scanning with AI...');
      setShowUpload(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadForm({ doctorName: '', hospitalName: '', notes: '' });
      fetchPrescriptions();
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
      
      // Auto trigger AI scan after successful upload
      handleAIScan(res.data.data._id);
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setLoading(false); setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this prescription?')) return;
    try {
      await prescriptionApi.remove(id);
      toast.success('Prescription deleted');
      if (selectedRx?._id === id) setSelectedRx(null);
      fetchPrescriptions();
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    } catch { toast.error('Failed to delete'); }
  };

  const handleAIScan = async (id) => {
    setScanning(true);
    try {
      const res = await prescriptionApi.extractAI(id);
      const extractedMeds = res.data.data.extractedData?.medicines || [];
      if (extractedMeds.length > 0) {
        setExtractForm({ medicines: extractedMeds });
        setSelectedRx(res.data.data);
        toast.success('AI successfully extracted medicine details!');
      } else {
        toast.error('AI could not extract medicines. Opening manual editor.');
        const found = prescriptions.find(r => r._id === id) || res.data.data;
        setSelectedRx(found);
      }
      fetchPrescriptions();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'AI scan failed. Opening manual editor.');
      const found = prescriptions.find(r => r._id === id);
      if (found) setSelectedRx(found);
    } finally {
      setScanning(false);
    }
  };

  const addMedicineRow = () => {
    setExtractForm({
      ...extractForm,
      medicines: [...extractForm.medicines, {
        name: '',
        dosage: '',
        frequency: 'once_daily',
        morning: false,
        afternoon: false,
        night: false,
        duration: '',
        instructions: '',
        foodInstructions: 'no_preference'
      }]
    });
  };

  const updateMedicine = (i, field, value) => {
    const meds = [...extractForm.medicines];
    meds[i][field] = value;
    setExtractForm({ ...extractForm, medicines: meds });
  };

  const removeMedicine = (i) => {
    setExtractForm({ ...extractForm, medicines: extractForm.medicines.filter((_, idx) => idx !== i) });
  };

  const handleSaveAndCreate = async () => {
    const valid = extractForm.medicines.filter(m => m.name.trim());
    if (valid.length === 0) return toast.error('Add at least one medicine name');
    setCreating(true);
    try {
      // Save extracted data
      await prescriptionApi.saveExtracted(selectedRx._id, { medicines: valid, confidence: 100 });
      // Create medications + reminders
      const res = await prescriptionApi.createMedications(selectedRx._id, { medicines: valid });
      toast.success(res.data.message || 'Medications created with reminders!');
      setSelectedRx(null);
      setExtractForm({
        medicines: [{
          name: '',
          dosage: '',
          frequency: 'once_daily',
          morning: false,
          afternoon: false,
          night: false,
          duration: '',
          instructions: '',
          foodInstructions: 'no_preference'
        }]
      });
      fetchPrescriptions();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create medications'); }
    finally { setCreating(false); }
  };

  if (loading && !scanning) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading prescriptions...</p>
    </div>
  );

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 AI Prescription Scanner</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Scan prescriptions with AI, verify extraction & automatically schedule reminders</p>
        </div>
        <button className="btn-primary" onClick={() => setShowUpload(true)}>
          <Upload size={16} /> Upload Prescription
        </button>
      </div>

      {/* AI Scanning Loader */}
      {scanning && (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center', marginBottom: 24, border: '1px solid rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.06)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', marginBottom: 16 }}>
            <Sparkles size={32} color="var(--accent-purple)" className="animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 700 }}>AI is Scanning Your Prescription...</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6, maxWidth: 400, margin: '6px auto 0' }}>Extracting medicine names, dosages, schedules, frequencies, durations, and food instructions. This takes just a few seconds.</p>
        </div>
      )}

      {/* Active Extraction Panel */}
      {selectedRx && !scanning && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 24, border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Pill size={20} color="var(--accent-purple)" /> Verify Extracted Medicines
            </h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => handleAIScan(selectedRx._id)}>
                <Sparkles size={13} color="var(--accent-purple)" /> Re-scan with AI
              </button>
              <button onClick={() => setSelectedRx(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: selectedRx.fileType === 'image' ? '320px 1fr' : '1fr', gap: 20 }}>
            {/* Preview */}
            {selectedRx.fileType === 'image' && (
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
                <img src={selectedRx.fileUrl} alt="Prescription" style={{ width: '100%', display: 'block' }} />
              </div>
            )}

            {/* Medicine Entry */}
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Verify the AI extracted details. Edit anything if needed before confirming to schedule reminders.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {extractForm.medicines.map((med, i) => (
                  <div key={i} style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-purple)' }}>Medicine {i + 1}</span>
                      {extractForm.medicines.length > 1 && (
                        <button onClick={() => removeMedicine(i)} style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: 12 }}>Remove</button>
                      )}
                    </div>

                    {/* Row 1: Name, Dosage, Frequency */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Medicine Name</label>
                        <input className="input-field" placeholder="Name (e.g. Paracetamol) *" value={med.name} onChange={e => updateMedicine(i, 'name', e.target.value)} style={{ fontSize: 13 }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Dosage</label>
                        <input className="input-field" placeholder="Dosage (e.g. 500mg)" value={med.dosage} onChange={e => updateMedicine(i, 'dosage', e.target.value)} style={{ fontSize: 13 }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Frequency</label>
                        <select className="input-field" value={med.frequency} onChange={e => updateMedicine(i, 'frequency', e.target.value)} style={{ fontSize: 13 }}>
                          <option value="once_daily">Once daily</option>
                          <option value="twice_daily">Twice daily</option>
                          <option value="three_times_daily">Three times daily</option>
                          <option value="four_times_daily">Four times daily</option>
                          <option value="as_needed">As needed</option>
                          <option value="weekly">Weekly</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 2: Timing Schedule */}
                    <div style={{ display: 'flex', gap: 16, margin: '10px 0', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Schedule:</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <input type="checkbox" checked={!!med.morning} onChange={e => updateMedicine(i, 'morning', e.target.checked)} />
                        Morning (8:00 AM)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <input type="checkbox" checked={!!med.afternoon} onChange={e => updateMedicine(i, 'afternoon', e.target.checked)} />
                        Afternoon (2:00 PM)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <input type="checkbox" checked={!!med.night} onChange={e => updateMedicine(i, 'night', e.target.checked)} />
                        Night (8:00 PM)
                      </label>
                    </div>

                    {/* Row 3: Duration, Food, Instructions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Duration</label>
                        <input className="input-field" placeholder="Duration (e.g. 5 days)" value={med.duration} onChange={e => updateMedicine(i, 'duration', e.target.value)} style={{ fontSize: 13 }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Food instructions</label>
                        <select className="input-field" value={med.foodInstructions} onChange={e => updateMedicine(i, 'foodInstructions', e.target.value)} style={{ fontSize: 13 }}>
                          <option value="no_preference">No preference</option>
                          <option value="before_food">Before food</option>
                          <option value="after_food">After food</option>
                          <option value="with_food">With food</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Additional instructions</label>
                        <input className="input-field" placeholder="Instructions (e.g. Take with water)" value={med.instructions} onChange={e => updateMedicine(i, 'instructions', e.target.value)} style={{ fontSize: 13 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn-secondary" onClick={addMedicineRow}><Plus size={14} /> Add Medicine</button>
                <button className="btn-primary" onClick={handleSaveAndCreate} disabled={creating} style={{ flex: 1 }}>
                  <CheckCircle size={16} /> {creating ? 'Saving...' : 'Confirm & Create Reminders'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prescriptions List */}
      {prescriptions.length === 0 && !selectedRx && !scanning ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>No prescriptions scanned yet</p>
          <button className="btn-primary" onClick={() => setShowUpload(true)}><Upload size={14} /> Upload & AI Scan</button>
        </div>
      ) : !scanning && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {prescriptions.map(rx => (
            <div key={rx._id} className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: rx.fileType === 'image' ? 'rgba(6,182,212,0.12)' : 'rgba(244,63,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {rx.fileType === 'image' ? '🖼️' : '📄'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rx.originalName || 'Prescription'}</h4>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span className={`badge ${rx.status === 'processed' ? 'badge-green' : rx.status === 'failed' ? 'badge-red' : 'badge-amber'}`}>{rx.status}</span>
                    {rx.doctorName && <span>👨‍⚕️ Dr. {rx.doctorName}</span>}
                    <span>{new Date(rx.createdAt).toLocaleDateString()}</span>
                  </div>
                  {rx.extractedData?.medicines?.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--accent-emerald)' }}>✅ {rx.extractedData.medicines.length} medicine(s) extracted</span>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 14, justifyContent: 'flex-end' }}>
                {rx.status !== 'processed' && (
                  <>
                    <button className="btn-primary" style={{ padding: '5px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => handleAIScan(rx._id)}>
                      <Sparkles size={12} /> Scan with AI
                    </button>
                    <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => setSelectedRx(rx)}>
                      Manual
                    </button>
                  </>
                )}
                {rx.status === 'processed' && (
                  <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => {
                    setExtractForm({ medicines: rx.extractedData.medicines });
                    setSelectedRx(rx);
                  }}>
                    View/Edit
                  </button>
                )}
                <a href={rx.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }}>View File</a>
                <button className="btn-danger" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => handleDelete(rx._id)}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Outfit', fontSize: 20, fontWeight: 700 }}>Upload Prescription</h2>
              <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: previewUrl ? 8 : 32, border: '2px dashed var(--border-color)', borderRadius: 12, cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s', overflow: 'hidden',
              }}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" style={{ maxHeight: 200, borderRadius: 8 }} />
                ) : (
                  <>
                    <Upload size={32} color="var(--accent-purple)" style={{ marginBottom: 8 }} />
                    <p style={{ fontSize: 14, fontWeight: 500 }}>{selectedFile ? selectedFile.name : 'Click to select prescription'}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Image or PDF (max 10MB)</p>
                  </>
                )}
                <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFileSelect} />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Doctor Name</label>
                  <input className="input-field" placeholder="Dr. Name" value={uploadForm.doctorName} onChange={e => setUploadForm({ ...uploadForm, doctorName: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Hospital / Clinic</label>
                  <input className="input-field" placeholder="Hospital name" value={uploadForm.hospitalName} onChange={e => setUploadForm({ ...uploadForm, hospitalName: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Notes</label>
                <textarea className="input-field" rows={2} placeholder="Optional notes" value={uploadForm.notes} onChange={e => setUploadForm({ ...uploadForm, notes: e.target.value })} />
              </div>
              <button className="btn-primary" type="submit" style={{ width: '100%' }} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload & AI Scan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
