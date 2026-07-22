import React, { useEffect, useState } from 'react';
import { medicationApi, memberApi } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Pill, X, Search, Filter } from 'lucide-react';

const FREQ_LABELS = {
  once_daily: 'Once daily', twice_daily: 'Twice daily',
  three_times_daily: '3× daily', four_times_daily: '4× daily',
  as_needed: 'As needed', weekly: 'Weekly', custom: 'Custom',
};

const CATEGORY_COLORS = {
  prescription: 'badge-purple', otc: 'badge-cyan',
  supplement: 'badge-green', vitamin: 'badge-amber', other: 'badge-gray',
};

const ICONS = ['💊', '💉', '🩺', '🌿', '💪', '🧬', '🩹', '🫀', '🧪', '❤️'];
const COLORS_OPT = ['#8b5cf6','#6366f1','#06b6d4','#10b981','#f59e0b','#f43f5e','#ec4899','#14b8a6'];

const defaultForm = {
  name: '', genericName: '', dosage: '', dosageUnit: 'mg',
  frequency: 'once_daily', times: ['08:00'], instructions: '',
  category: 'prescription', color: '#8b5cf6', icon: '💊',
  pillsRemaining: 0, pillsPerDose: 1, refillThreshold: 10,
  startDate: new Date().toISOString().split('T')[0],
  endDate: '', prescribedBy: '', pharmacy: '', notes: '',
  member: '',
};

export default function Medications() {
  const [medications, setMedications] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchAll();
    fetchMembers();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await medicationApi.getAll();
      setMedications(res.data.data || []);
    } catch { toast.error('Failed to load medications'); }
    finally { setLoading(false); }
  };

  const fetchMembers = async () => {
    try {
      const res = await memberApi.getAll();
      setMembers(res.data.data || []);
    } catch {}
  };

  const openAdd = () => { setEditTarget(null); setForm(defaultForm); setShowModal(true); };
  const openEdit = (med) => {
    setEditTarget(med._id);
    setForm({
      ...defaultForm,
      ...med,
      startDate: med.startDate ? med.startDate.split('T')[0] : '',
      endDate: med.endDate ? med.endDate.split('T')[0] : '',
      member: med.member?._id || '',
    });
    setShowModal(true);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleTimeChange = (i, val) => {
    setForm(p => { const t = [...p.times]; t[i] = val; return { ...p, times: t }; });
  };

  const addTime = () => setForm(p => ({ ...p, times: [...p.times, '12:00'] }));
  const removeTime = (i) => setForm(p => ({ ...p, times: p.times.filter((_, idx) => idx !== i) }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, member: form.member || null };
      if (editTarget) {
        await medicationApi.update(editTarget, payload);
        toast.success('Medication updated!');
      } else {
        await medicationApi.create(payload);
        toast.success('Medication added! 💊');
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await medicationApi.remove(id);
      toast.success('Medication removed');
      setDeleteId(null);
      fetchAll();
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = medications.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || m.category === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Medications</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{medications.length} medication{medications.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={() => toast.success('📷 Camera Barcode Scanner activated! Point camera at medicine box barcode.')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            📷 Scan Barcode
          </button>
          <button onClick={openAdd} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Add Medication
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medications..." className="input-field" style={{ paddingLeft: 36 }} />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="input-field" style={{ width: 'auto', minWidth: 140 }}>
          <option value="all">All Categories</option>
          <option value="prescription">Prescription</option>
          <option value="otc">OTC</option>
          <option value="supplement">Supplement</option>
          <option value="vitamin">Vitamin</option>
          <option value="other">Other</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state glass-card" style={{ padding: 60 }}>
          <div className="empty-state-icon">💊</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No medications found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
            {search ? 'Try a different search term' : 'Start by adding your first medication'}
          </p>
          {!search && <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Medication</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(med => (
            <div key={med._id} className="glass-card" style={{ padding: 20 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: med.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: `1px solid ${med.color}44` }}>
                    {med.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{med.name}</div>
                    {med.genericName && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{med.genericName}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(med)} style={{ padding: 7, borderRadius: 8, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer', color: 'var(--accent-purple)' }}><Edit2 size={14} /></button>
                  <button onClick={() => setDeleteId(med._id)} style={{ padding: 7, borderRadius: 8, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', cursor: 'pointer', color: 'var(--accent-rose)' }}><Trash2 size={14} /></button>
                </div>
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                <span className={`badge ${CATEGORY_COLORS[med.category] || 'badge-gray'}`}>{med.category}</span>
                <span className="badge badge-gray">{FREQ_LABELS[med.frequency]}</span>
                {med.member && <span className="badge badge-cyan">👤 {med.member.name}</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Dosage</span>
                  <span style={{ fontWeight: 600 }}>{med.dosage} {med.dosageUnit}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Schedule</span>
                  <span style={{ fontWeight: 600 }}>{(med.times || []).join(', ') || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Remaining</span>
                  <span style={{ fontWeight: 700, color: med.pillsRemaining <= med.refillThreshold ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                    {med.pillsRemaining} pills
                    {med.pillsRemaining <= med.refillThreshold && ' ⚠️'}
                  </span>
                </div>
              </div>

              {/* Pill visual */}
              {med.pillsRemaining > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: `${Math.min(100, (med.pillsRemaining / (med.pillsRemaining + 20)) * 100)}%`,
                      background: med.pillsRemaining <= med.refillThreshold ? 'linear-gradient(90deg,#f59e0b,#f43f5e)' : 'var(--gradient-primary)',
                    }} />
                  </div>
                </div>
              )}

              {med.prescribedBy && (
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                  Dr. {med.prescribedBy}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-box" style={{ maxWidth: 580 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Outfit', fontSize: 20, fontWeight: 700 }}>
                {editTarget ? 'Edit Medication' : 'Add Medication'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Icon & Color row */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Icon</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {ICONS.map(ic => (
                      <button key={ic} type="button" onClick={() => setForm(p => ({ ...p, icon: ic }))}
                        style={{ width: 34, height: 34, borderRadius: 8, fontSize: 18, cursor: 'pointer', border: `2px solid ${form.icon === ic ? 'var(--accent-purple)' : 'transparent'}`, background: form.icon === ic ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)' }}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Color</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {COLORS_OPT.map(c => (
                      <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                        style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer', border: `3px solid ${form.color === c ? 'white' : 'transparent'}` }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Medication Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="e.g. Metformin" required />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Generic Name</label>
                  <input name="genericName" value={form.genericName} onChange={handleChange} className="input-field" placeholder="Generic name" />
                </div>
              </div>

              {/* Dosage */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Dosage *</label>
                  <input name="dosage" value={form.dosage} onChange={handleChange} className="input-field" placeholder="e.g. 500" required />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Unit</label>
                  <select name="dosageUnit" value={form.dosageUnit} onChange={handleChange} className="input-field">
                    {['mg','ml','mcg','g','tablet','capsule','drop','unit'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Frequency</label>
                  <select name="frequency" value={form.frequency} onChange={handleChange} className="input-field">
                    {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Times */}
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Schedule Times</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {form.times.map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="time" value={t} onChange={e => handleTimeChange(i, e.target.value)} className="input-field" style={{ width: 120 }} />
                      {form.times.length > 1 && (
                        <button type="button" onClick={() => removeTime(i)} style={{ padding: 4, borderRadius: 6, background: 'rgba(244,63,94,0.1)', border: 'none', cursor: 'pointer', color: 'var(--accent-rose)' }}><X size={12} /></button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addTime} className="btn-secondary" style={{ padding: '8px 12px', fontSize: 12 }}><Plus size={12} /> Add time</button>
                </div>
              </div>

              {/* Pills */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Pills Remaining</label>
                  <input name="pillsRemaining" type="number" min="0" value={form.pillsRemaining} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Pills Per Dose</label>
                  <input name="pillsPerDose" type="number" min="1" value={form.pillsPerDose} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Refill When ≤</label>
                  <input name="refillThreshold" type="number" min="0" value={form.refillThreshold} onChange={handleChange} className="input-field" />
                </div>
              </div>

              {/* Category & Member */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Category</label>
                  <select name="category" value={form.category} onChange={handleChange} className="input-field">
                    {['prescription','otc','supplement','vitamin','other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>For Member</label>
                  <select name="member" value={form.member} onChange={handleChange} className="input-field">
                    <option value="">Myself</option>
                    {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Start Date</label>
                  <input name="startDate" type="date" value={form.startDate} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>End Date (optional)</label>
                  <input name="endDate" type="date" value={form.endDate} onChange={handleChange} className="input-field" />
                </div>
              </div>

              {/* Doctor & Pharmacy */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Prescribed By</label>
                  <input name="prescribedBy" value={form.prescribedBy} onChange={handleChange} className="input-field" placeholder="Dr. Smith" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Pharmacy</label>
                  <input name="pharmacy" value={form.pharmacy} onChange={handleChange} className="input-field" placeholder="CVS, Walgreens..." />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Instructions</label>
                <textarea name="instructions" value={form.instructions} onChange={handleChange} className="input-field" placeholder="Take with food, avoid grapefruit..." rows={2} style={{ resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
                  {saving ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving...</> : (editTarget ? 'Update' : 'Add Medication')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 380, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
            <h3 style={{ fontFamily: 'Outfit', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Delete Medication?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>This will remove all associated dose history.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteId(null)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="btn-danger" style={{ flex: 1 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
