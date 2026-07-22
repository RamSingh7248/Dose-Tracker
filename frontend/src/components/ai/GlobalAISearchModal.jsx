import React, { useState } from 'react';
import { medicationApi, appointmentApi, documentApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Search, X, Pill, Calendar, FileText, ArrowRight, Sparkles } from 'lucide-react';

export default function GlobalAISearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (val) => {
    setQuery(val);
    if (!val.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const q = val.toLowerCase();
      const [medsRes, appRes, docsRes] = await Promise.allSettled([
        medicationApi.getAll({ isActive: true }),
        appointmentApi.getUpcoming(),
        documentApi.getAll(),
      ]);

      const items = [];
      if (medsRes.status === 'fulfilled') {
        (medsRes.value.data.data || []).forEach(m => {
          if (m.name.toLowerCase().includes(q) || m.dosage?.toLowerCase().includes(q)) {
            items.push({ id: m._id, type: 'Medication', title: m.name, subtitle: `${m.dosage} ${m.dosageUnit} - ${m.frequency}`, link: '/medications', icon: Pill });
          }
        });
      }
      if (appRes.status === 'fulfilled') {
        (appRes.value.data.data || []).forEach(a => {
          if (a.doctorName?.toLowerCase().includes(q) || a.specialty?.toLowerCase().includes(q) || a.reason?.toLowerCase().includes(q)) {
            items.push({ id: a._id, type: 'Appointment', title: `Dr. ${a.doctorName}`, subtitle: `${a.date} at ${a.time} (${a.specialty})`, link: '/appointments', icon: Calendar });
          }
        });
      }
      if (docsRes.status === 'fulfilled') {
        (docsRes.value.data.data || []).forEach(d => {
          if (d.title.toLowerCase().includes(q) || d.type?.toLowerCase().includes(q)) {
            items.push({ id: d._id, type: 'Document', title: d.title, subtitle: `${d.type} - ${d.folder || 'Vault'}`, link: '/health-vault', icon: FileText });
          }
        });
      }
      setResults(items);
    } catch {
      console.warn('Search error');
    } finally {
      setSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 100, paddingLeft: 16, paddingRight: 16
    }}>
      <div className="animate-fade-in-up" style={{
        background: 'var(--card-bg, #1a1c23)', border: '1px solid var(--border-color)',
        borderRadius: 16, width: '100%', maxWidth: 580, padding: 20, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Search size={20} color="var(--accent-purple)" />
          <input
            autoFocus
            type="text"
            className="input-field"
            placeholder="Global AI Search across medicines, patients, appointments, reports..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
            style={{ flex: 1, fontSize: 14 }}
          />
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {searching ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Searching across health platform...
          </div>
        ) : results.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
            {results.map((res) => {
              const Icon = res.icon;
              return (
                <div
                  key={res.id}
                  onClick={() => { navigate(res.link); onClose(); }}
                  style={{
                    padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color="var(--accent-purple)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{res.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{res.subtitle}</div>
                    </div>
                  </div>
                  <span className="badge badge-purple" style={{ fontSize: 10 }}>{res.type}</span>
                </div>
              );
            })}
          </div>
        ) : query.trim() ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No records found for "{query}"
          </div>
        ) : (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            💡 Try searching for <strong>"Dolo"</strong>, <strong>"Cardiologist"</strong>, or <strong>"Blood Report"</strong>
          </div>
        )}
      </div>
    </div>
  );
}
