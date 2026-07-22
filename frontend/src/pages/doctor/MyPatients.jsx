import React, { useState, useEffect } from 'react';
import { doctorApi } from '../../services/api';
import toast from 'react-hot-toast';
import { Search, Users, Activity, ChevronRight, Pill } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MyPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const fetchPatients = async () => {
    try {
      const res = await doctorApi.getPatients({ search });
      setPatients(res.data.data);
    } catch {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Patients</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Patients assigned to your care</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 20 }}>
        {/* Filters */}
        <div style={{ position: 'relative', maxWidth: 400, marginBottom: 20 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search patients by name or email..." 
            className="input-field" 
            style={{ paddingLeft: 38 }} 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 13 }}>Patient</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 13 }}>Adherence Rate</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 13 }}>Active Meds</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 13, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }}/></td></tr>
              ) : patients.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No patients found</td></tr>
              ) : patients.map(p => (
                <tr key={p._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} onClick={() => navigate(`/doctor/patients/${p._id}`)}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(20, 184, 166, 0.1)', color: '#14b8a6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p.name.charAt(0)}
                      </div>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 40 }}>{p.email}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Activity size={16} color={p._stats.adherenceRate >= 80 ? '#10b981' : p._stats.adherenceRate >= 50 ? '#f59e0b' : '#f43f5e'} />
                      <span style={{ fontWeight: 600 }}>{p._stats.adherenceRate}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                      <Pill size={16} /> {p._stats.meds}
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <ChevronRight size={18} color="var(--text-muted)" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


