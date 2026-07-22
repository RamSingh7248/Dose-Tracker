import React, { useEffect, useState } from 'react';
import { medicationApi } from '../services/api';
import toast from 'react-hot-toast';
import { AlertTriangle, ShoppingCart, Phone, RefreshCw } from 'lucide-react';

export default function RefillAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [all, setAll]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [alertRes, allRes] = await Promise.all([
        medicationApi.getRefillAlerts(),
        medicationApi.getAll({ isActive: true }),
      ]);
      setAlerts(alertRes.data.data || []);
      setAll(allRes.data.data || []);
    } catch { toast.error('Failed to load alerts'); }
    finally { setLoading(false); }
  };

  const handleRefill = async (med) => {
    try {
      const refilled = med.pillsRemaining + 30;
      await medicationApi.update(med._id, { pillsRemaining: refilled });
      toast.success(`✅ ${med.name} refilled to ${refilled} pills`);
      fetchAll();
    } catch { toast.error('Failed to update'); }
  };

  const urgencyColor = (med) => {
    if (med.pillsRemaining === 0) return { color: 'var(--accent-rose)',  bg: 'rgba(244,63,94,0.12)',  label: 'OUT OF STOCK', cls: 'badge-red' };
    if (med.pillsRemaining <= 5)  return { color: 'var(--accent-rose)',  bg: 'rgba(244,63,94,0.08)',  label: 'CRITICAL',     cls: 'badge-red' };
    return                               { color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.08)', label: 'LOW STOCK',    cls: 'badge-amber' };
  };

  const daysLeft = (med) => {
    const dosesPerDay = (med.times || []).length || 1;
    const pillsPerDay = dosesPerDay * (med.pillsPerDose || 1);
    return pillsPerDay > 0 ? Math.floor(med.pillsRemaining / pillsPerDay) : '—';
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Refill Alerts</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            {alerts.length} medication{alerts.length !== 1 ? 's' : ''} need{alerts.length === 1 ? 's' : ''} attention
          </p>
        </div>
        <button onClick={fetchAll} className="btn-secondary"><RefreshCw size={15} /> Refresh</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>
      ) : alerts.length === 0 ? (
        <div className="empty-state glass-card" style={{ padding: 80 }}>
          <div className="empty-state-icon">✅</div>
          <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>All stocked up!</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>All your medications have sufficient supply.</p>
        </div>
      ) : (
        <>
          {/* Alert banner */}
          <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <AlertTriangle size={18} color="var(--accent-amber)" />
            <span style={{ fontSize: 14, color: 'var(--accent-amber)', fontWeight: 600 }}>
              {alerts.length} medication{alerts.length !== 1 ? 's' : ''} running low — contact your pharmacy soon
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {alerts.map(med => {
              const { color, bg, label, cls } = urgencyColor(med);
              const days = daysLeft(med);
              const pct = Math.min(100, (med.pillsRemaining / (med.refillThreshold * 3)) * 100);

              return (
                <div key={med._id} className="glass-card" style={{ padding: 20, borderColor: color + '33', background: bg }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* Icon */}
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: med.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, border: `1px solid ${med.color}44` }}>
                      {med.icon || '💊'}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{med.name}</span>
                        <span className={`badge ${cls}`}>{label}</span>
                        {med.member && <span className="badge badge-cyan">👤 {med.member.name}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                        {med.dosage} {med.dosageUnit} · {(med.times || []).length}× daily
                        {typeof days === 'number' && ` · ~${days} day${days !== 1 ? 's' : ''} remaining`}
                      </div>

                      {/* Progress */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color, flexShrink: 0 }}>
                          {med.pillsRemaining} / {med.refillThreshold * 3} pills
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => handleRefill(med)} className="btn-primary" style={{ padding: '8px 14px', fontSize: 13 }}>
                        <ShoppingCart size={14} /> Refill (+30)
                      </button>
                      {med.pharmacy && (
                        <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: 12 }}>
                          <Phone size={13} /> {med.pharmacy}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* All meds stock overview */}
      <div className="glass-card" style={{ padding: 24, marginTop: 24 }}>
        <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>All Medications — Stock Overview</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {all.map(med => {
            const pct = Math.min(100, (med.pillsRemaining / Math.max(med.refillThreshold * 3, 1)) * 100);
            const isLow = med.pillsRemaining <= med.refillThreshold;
            return (
              <div key={med._id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 18, width: 28, flexShrink: 0 }}>{med.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{med.name}</span>
                    <span style={{ fontSize: 12, color: isLow ? 'var(--accent-amber)' : 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>{med.pillsRemaining} pills</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: isLow ? 'linear-gradient(90deg,#f59e0b,#f43f5e)' : 'var(--gradient-primary)' }} />
                  </div>
                </div>
              </div>
            );
          })}
          {all.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No medications added yet.</p>}
        </div>
      </div>
    </div>
  );
}
