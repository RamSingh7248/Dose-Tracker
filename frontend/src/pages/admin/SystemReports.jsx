import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { Users, Pill, FileText, CheckCircle, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

export default function SystemReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getReports();
      setReport(res.data.data);
    } catch {
      toast.error('Failed to load system reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)', fontSize: 14 }}>
        Loading platform reports...
      </div>
    );
  }

  const users = report?.users || { patients: 0, doctors: 0, admins: 0, active: 0, suspended: 0 };
  const medications = report?.medications || { total: 0 };
  const prescriptions = report?.prescriptions || { total: 0 };
  const doses = report?.doses || { total: 0, taken: 0, missed: 0, skipped: 0 };

  const totalDoses = doses.total || 0;
  const globalAdherence = totalDoses > 0 ? Math.round((doses.taken / totalDoses) * 100) : 100;

  const doseDistribution = [
    { name: 'Taken Doses', count: doses.taken },
    { name: 'Missed Doses', count: doses.missed },
    { name: 'Skipped Doses', count: doses.skipped }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Reports
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0 0' }}>
            System-wide statistics on patient adherence, consultations, and prescriptions
          </p>
        </div>

        <button
          onClick={fetchReports}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { label: 'Adherence Rate', value: `${globalAdherence}%`, icon: CheckCircle, color: '#16a34a' },
          { label: 'Active Users', value: users.active, icon: Users, color: '#2563eb' },
          { label: 'Total Prescriptions', value: prescriptions.total, icon: FileText, color: '#8b5cf6' },
          { label: 'Active Medications', value: medications.total, icon: Pill, color: '#d97706' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{value}</div>
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: 6, background: 'var(--bg-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)',
            }}>
              <Icon size={18} color={color} />
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Chart Box */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Dose Compliance Distribution</h3>
        <div style={{ height: 240 }}>
          {totalDoses > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={doseDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: 12, color: 'var(--text-primary)' }} />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 13 }}>
              No medication dose data available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
