import React, { useEffect, useState } from 'react';
import { memberApi } from '../services/api';
import { useFamily } from '../context/FamilyContext';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, User, Check, Heart, ShieldAlert } from 'lucide-react';

const RELATIONSHIPS = [
  'self', 'father', 'mother', 'spouse', 'child', 'children',
  'grandparent', 'grandparents', 'parent', 'sibling', 'other'
];

const MEMBER_COLORS = ['#8b5cf6','#06b6d4','#10b981','#f59e0b','#f43f5e','#ec4899','#14b8a6','#6366f1'];

const REL_EMOJIS = {
  self: '🧑', father: '👴', mother: '👵', spouse: '💑', parent: '👨‍👩‍👦',
  child: '👶', children: '👶', sibling: '👫', grandparent: '👵', grandparents: '👴', other: '👤'
};

const defaultForm = {
  name: '',
  relationship: 'father',
  gender: 'prefer_not_to_say',
  dateOfBirth: '',
  color: '#8b5cf6',
  allergies: '',
  conditions: '',
  notes: ''
};

export default function Members() {
  const { members, activeMember, selectMember, fetchMembers } = useFamily();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (m) => {
    setEditTarget(m._id);
    setForm({
      ...defaultForm,
      ...m,
      dateOfBirth: m.dateOfBirth ? m.dateOfBirth.split('T')[0] : '',
      allergies: (m.allergies || []).join(', '),
      conditions: (m.conditions || []).join(', ')
    });
    setShowModal(true);
  };

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        allergies: form.allergies.split(',').map(s => s.trim()).filter(Boolean),
        conditions: form.conditions.split(',').map(s => s.trim()).filter(Boolean)
      };
      if (editTarget) {
        await memberApi.update(editTarget, payload);
        toast.success('Family member updated!');
      } else {
        await memberApi.create(payload);
        toast.success('Family member added! 👨‍👩‍👦');
      }
      setShowModal(false);
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await memberApi.remove(id);
      toast.success('Member removed');
      setDeleteId(null);
      fetchMembers();
    } catch {
      toast.error('Failed to delete member');
    }
  };

  const getAge = (dob) => {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">👨‍👩‍👦 Family Care Profiles</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Add and manage health profiles for Father, Mother, Spouse, Children, and Grandparents
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} /> Add Family Member
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : members.length === 0 ? (
        <div className="empty-state glass-card" style={{ padding: 80, textAlign: 'center' }}>
          <div className="empty-state-icon" style={{ fontSize: 48, marginBottom: 12 }}>👨‍👩‍👦</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No family profiles added yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Add your parents, children, or spouse to manage their medications & receive health alerts.
          </p>
          <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Family Member</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {members.map(m => {
            const isCurrentActive = activeMember?._id === m._id;
            return (
              <div key={m._id} className="glass-card" style={{
                padding: 24,
                border: isCurrentActive ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
                boxShadow: isCurrentActive ? '0 0 20px rgba(139,92,246,0.25)' : 'none',
                position: 'relative',
              }}>
                {isCurrentActive && (
                  <span className="badge badge-purple" style={{ position: 'absolute', top: 16, right: 16, fontSize: 11 }}>
                    Active Profile
                  </span>
                )}

                {/* Avatar & Info */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${m.color}, ${m.color}99)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                      boxShadow: `0 4px 16px ${m.color}44`
                    }}>
                      {REL_EMOJIS[m.relationship] || '👤'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: 2 }}>
                        {m.relationship} {getAge(m.dateOfBirth) ? `· Age ${getAge(m.dateOfBirth)}` : ''}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {((m.allergies && m.allergies.length > 0) || (m.conditions && m.conditions.length > 0)) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                    {m.allergies?.length > 0 && (
                      <div style={{ fontSize: 12, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ShieldAlert size={14} /> Allergies: {m.allergies.join(', ')}
                      </div>
                    )}
                    {m.conditions?.length > 0 && (
                      <div style={{ fontSize: 12, color: '#06b6d4', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Heart size={14} /> Conditions: {m.conditions.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {/* Card Actions */}
                <div style={{ borderTop: '1px solid var(--border-color)', pt: 14, paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => selectMember(isCurrentActive ? null : m)}
                    className={isCurrentActive ? 'btn-secondary' : 'btn-primary'}
                    style={{ fontSize: 12, padding: '6px 14px' }}
                  >
                    {isCurrentActive ? 'Switch to Myself' : 'Switch Profile'}
                  </button>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(m)} className="btn-secondary" style={{ padding: 8 }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteId(m._id)} className="btn-secondary" style={{ padding: 8, color: '#f43f5e' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 700 }}>
                {editTarget ? 'Edit Family Profile' : 'Add Family Profile'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Member Name *</label>
                <input className="input-field" placeholder="e.g. John Doe" name="name" value={form.name} onChange={handleChange} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Relationship *</label>
                  <select className="input-field" name="relationship" value={form.relationship} onChange={handleChange} style={{ textTransform: 'capitalize' }}>
                    {RELATIONSHIPS.map(rel => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Gender</label>
                  <select className="input-field" name="gender" value={form.gender} onChange={handleChange}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Date of Birth</label>
                <input className="input-field" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Allergies (comma separated)</label>
                <input className="input-field" placeholder="e.g. Penicillin, Peanuts" name="allergies" value={form.allergies} onChange={handleChange} />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Medical Conditions (comma separated)</label>
                <input className="input-field" placeholder="e.g. Diabetes, Hypertension" name="conditions" value={form.conditions} onChange={handleChange} />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Profile Color Accent</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {MEMBER_COLORS.map(c => (
                    <div
                      key={c}
                      onClick={() => setForm(p => ({ ...p, color: c }))}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                        border: form.color === c ? '2px solid white' : 'none',
                        boxShadow: form.color === c ? `0 0 10px ${c}` : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="modal-backdrop" onClick={() => setDeleteId(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Delete Profile?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Are you sure you want to remove this family member profile?</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, background: '#f43f5e' }} onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
