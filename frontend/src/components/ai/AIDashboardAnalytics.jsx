import React, { useEffect, useState } from 'react';
import { aiHubApi } from '../../services/api';
import { Cpu, Zap, DollarSign, Activity, Sparkles, BarChart2 } from 'lucide-react';

export default function AIDashboardAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await aiHubApi.getAnalytics();
      setStats(res.data.data);
    } catch {
      console.warn('Failed to load AI Analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="glass-card" style={{ padding: 20, marginBottom: 20, border: '1px solid rgba(139,92,246,0.2)', background: 'linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(6,182,212,0.05) 100%)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={18} color="var(--accent-purple)" /> Enterprise AI Hub Usage &amp; Analytics
        </h3>
        <span className="badge badge-purple" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Sparkles size={10} /> Multi-Provider Active
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {/* Total Chats */}
        <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total AI Chats</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
            {stats?.totalChats || 0}
          </div>
        </div>

        {/* Most Used AI */}
        <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Primary Provider</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#4285F4', marginTop: 2 }}>
            {stats?.mostUsedAI || 'GEMINI 2.0'}
          </div>
        </div>

        {/* Tokens Used */}
        <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tokens Consumed</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981', marginTop: 2 }}>
            {(stats?.totalTokens || 0).toLocaleString()}
          </div>
        </div>

        {/* Estimated Cost */}
        <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Est. API Cost</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>
            ${(stats?.estimatedCostUsd || 0.00).toFixed(4)}
          </div>
        </div>
      </div>
    </div>
  );
}
