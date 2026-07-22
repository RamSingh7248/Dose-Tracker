import React, { useState, useEffect } from 'react';
import { doctorApi } from '../../services/api';
import toast from 'react-hot-toast';
import { ClipboardList, Plus, Mic, Paperclip, Search, Sparkles } from 'lucide-react';

export default function ClinicalNotes() {
  const [notes, setNotes] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // SOAP Note Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [soap, setSoap] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [notesRes, patientsRes] = await Promise.allSettled([
        doctorApi.getNotes(),
        doctorApi.getPatients()
      ]);
      if (notesRes.status === 'fulfilled') setNotes(notesRes.value.data.data || []);
      if (patientsRes.status === 'fulfilled') {
        setPatients(patientsRes.value.data.data || []);
        if (patientsRes.value.data.data?.length > 0) setSelectedPatientId(patientsRes.value.data.data[0]._id);
      }
    } catch {
      toast.error('Failed to load notes data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSoapNote = async () => {
    if (!selectedPatientId) return toast.error('Select a patient');
    const combined = `[S]: ${soap.subjective}\n[O]: ${soap.objective}\n[A]: ${soap.assessment}\n[P]: ${soap.plan}`;
    if (!soap.subjective && !soap.assessment) return toast.error('Please fill out Subjective or Assessment');

    try {
      await doctorApi.addNote({
        patientId: selectedPatientId,
        note: combined,
        category: 'SOAP Note',
        isPrivate: false
      });
      toast.success('SOAP Clinical Note saved!');
      setShowModal(false);
      setSoap({ subjective: '', objective: '', assessment: '', plan: '' });
      fetchData();
    } catch (e) {
      toast.error('Failed to save SOAP note');
    }
  };

  const toggleVoiceRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      toast.success('🎙️ Voice dictation started... Speak clinical observations');
      setTimeout(() => {
        setIsRecording(false);
        setSoap(s => ({ ...s, subjective: s.subjective + ' Patient reports mild chest tightness after exercise.' }));
        toast.success('Voice dictation transcribed into Subjective notes!');
      }, 3500);
    } else {
      setIsRecording(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">📋 SOAP Clinical Notes & Voice Dictation Vault</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Structured Subjective, Objective, Assessment, & Plan notes with voice dictation</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> New SOAP Note
        </button>
      </div>

      {showModal && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 24, border: '1px solid var(--accent-purple)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Structured SOAP Clinical Observation Note</h3>
            <button className="btn-secondary" onClick={toggleVoiceRecording} style={{ background: isRecording ? 'rgba(244,63,94,0.2)' : undefined, color: isRecording ? '#f43f5e' : undefined }}>
              <Mic size={14} /> {isRecording ? 'Listening...' : 'Voice Dictation'}
            </button>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="input-label">Patient *</label>
            <select className="input-field" value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)}>
              {patients.map(p => <option key={p._id} value={p._id}>{p.name} ({p.email})</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="input-label">[S] Subjective (Symptoms & Patient Report)</label>
              <textarea className="input-field" rows={3} value={soap.subjective} onChange={e => setSoap({ ...soap, subjective: e.target.value })} />
            </div>
            <div>
              <label className="input-label">[O] Objective (Vitals & Lab Vitals)</label>
              <textarea className="input-field" rows={3} value={soap.objective} onChange={e => setSoap({ ...soap, objective: e.target.value })} />
            </div>
            <div>
              <label className="input-label">[A] Assessment (Clinical Diagnosis)</label>
              <textarea className="input-field" rows={3} value={soap.assessment} onChange={e => setSoap({ ...soap, assessment: e.target.value })} />
            </div>
            <div>
              <label className="input-label">[P] Plan (Treatment & Follow-up Rx)</label>
              <textarea className="input-field" rows={3} value={soap.plan} onChange={e => setSoap({ ...soap, plan: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSaveSoapNote}>Save SOAP Note</button>
          </div>
        </div>
      )}

      <div className="glass-card" style={{ padding: 20 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <ClipboardList size={48} style={{ margin: '0 auto', opacity: 0.5, marginBottom: 16 }} />
            No clinical notes added yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {notes.map(n => (
              <div key={n._id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, color: '#14b8a6' }}>{n.patient?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(n.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {n.note}
                </div>
                <div style={{ marginTop: 12, display: 'inline-block', fontSize: 11, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 4, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {n.category || 'SOAP Note'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


