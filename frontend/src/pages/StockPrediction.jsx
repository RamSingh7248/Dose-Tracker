import React, { useEffect, useState } from 'react';
import { stockApi } from '../services/api';
import { Package, AlertTriangle, RefreshCw, Plus, TrendingDown, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_BADGE = { good: 'badge-green', warning: 'badge-amber', low: 'badge-red', empty: 'badge-gray' };
const STATUS_LABEL = { good: 'In Stock', warning: 'Running Low', low: 'Low Stock', empty: 'Out of Stock' };

export default function StockPrediction() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restockId, setRestockId] = useState(null);
  const [restockQty, setRestockQty] = useState('');

  useEffect(() => { fetchPredictions(); }, []);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const res = await stockApi.getPredictions();
      setPredictions(res.data.data || []);
    } catch { toast.error('Failed to load predictions'); }
    finally { setLoading(false); }
  };

  const handleRestock = async (id) => {
    if (!restockQty || Number(restockQty) <= 0) return toast.error('Enter a valid quantity');
    try {
      await stockApi.restock(id, Number(restockQty));
      toast.success('Stock updated');
      setRestockId(null);
      setRestockQty('');
      fetchPredictions();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to restock'); }
  };

  const needsAttention = predictions.filter(p => p.stockStatus !== 'good');
  const goodStock = predictions.filter(p => p.stockStatus === 'good');

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Calculating stock predictions...</p>
    </div>
  );

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 Stock Predictions</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Track your medicine stock & predicted refill dates</p>
        </div>
        <button className="btn-secondary" onClick={fetchPredictions}><RefreshCw size={16} /> Refresh</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Medications', value: predictions.length, icon: Package, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
          { label: 'Needs Refill', value: needsAttention.length, icon: AlertTriangle, color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
          { label: 'Good Stock', value: goodStock.length, icon: TrendingDown, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Outfit', lineHeight: 1 }}>{value}</p>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Needs Attention */}
      {needsAttention.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} color="#f59e0b" /> Needs Attention
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {needsAttention.map(med => (
              <div key={med._id} className="glass-card" style={{ padding: 20, border: `1px solid ${med.stockStatus === 'empty' ? 'rgba(144,144,176,0.3)' : 'rgba(244,63,94,0.25)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>{med.icon || '💊'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Outfit' }}>{med.name}</h4>
                      <span className={`badge ${STATUS_BADGE[med.stockStatus]}`}>{STATUS_LABEL[med.stockStatus]}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: 13, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      <span>💊 {med.pillsRemaining} pills remaining</span>
                      <span>📊 {med.dailyConsumption}/day avg</span>
                      {med.daysUntilEmpty !== null && <span>⏰ {med.daysUntilEmpty} days left</span>}
                      {med.refillDate && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={13} /> Refill by {new Date(med.refillDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                    </div>
                    <div className="progress-bar" style={{ marginTop: 10 }}>
                      <div className="progress-fill" style={{
                        width: `${Math.min(100, (med.pillsRemaining / Math.max(1, med.refillThreshold * 3)) * 100)}%`,
                        background: med.stockStatus === 'empty' ? '#9090b0' : 'linear-gradient(90deg, #f43f5e, #f59e0b)',
                      }} />
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {restockId === med._id ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input className="input-field" type="number" placeholder="Qty" value={restockQty} onChange={e => setRestockQty(e.target.value)}
                          style={{ width: 80, fontSize: 13 }} onKeyDown={e => e.key === 'Enter' && handleRestock(med._id)} />
                        <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleRestock(med._id)}>
                          <Plus size={12} />
                        </button>
                      </div>
                    ) : (
                      <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setRestockId(med._id)}>
                        <Plus size={12} /> Restock
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Good Stock */}
      {goodStock.length > 0 && (
        <div>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            ✅ Adequately Stocked
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {goodStock.map(med => (
              <div key={med._id} className="glass-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{med.icon || '💊'}</span>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600 }}>{med.name}</h4>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      <span>{med.pillsRemaining} pills</span>
                      <span>{med.dailyConsumption}/day</span>
                      {med.daysUntilEmpty !== null && <span>{med.daysUntilEmpty}d left</span>}
                    </div>
                  </div>
                  <span className="badge badge-green">Good</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {predictions.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No active medications to track stock for</p>
        </div>
      )}
    </div>
  );
}
