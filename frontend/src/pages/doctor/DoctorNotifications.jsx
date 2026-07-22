import React, { useState } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Calendar, FileText, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorNotifications() {
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'New Lab Report Uploaded', desc: 'John Doe uploaded Complete Blood Count report', time: '10 mins ago', type: 'report', unread: true },
    { id: '2', title: 'Appointment Rescheduled', desc: 'Jane Smith requested to move consultation to 3:00 PM', time: '1 hour ago', type: 'appointment', unread: true },
    { id: '3', title: 'Missed Dose Alert', desc: 'Robert Johnson missed 2 consecutive doses of Metformin', time: '3 hours ago', type: 'alert', unread: false },
  ]);

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
    toast.success('All notifications marked as read');
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">🔔 Clinical Notification Center</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Live alert feed for new patient appointments, report uploads, emergency warnings, and missed doses
          </p>
        </div>
        <button className="btn-secondary" onClick={handleMarkAllRead}>
          <CheckCircle2 size={16} /> Mark All Read
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {notifications.map(n => (
          <div
            key={n.id}
            className="glass-card"
            style={{
              padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderLeft: `4px solid ${n.type === 'alert' ? '#f43f5e' : n.type === 'report' ? '#8b5cf6' : '#10b981'}`,
              background: n.unread ? 'rgba(139,92,246,0.05)' : undefined
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: n.type === 'alert' ? 'rgba(244,63,94,0.15)' : n.type === 'report' ? 'rgba(139,92,246,0.15)' : 'rgba(16,185,129,0.15)',
                color: n.type === 'alert' ? '#f43f5e' : n.type === 'report' ? '#8b5cf6' : '#10b981',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {n.type === 'alert' ? <AlertTriangle size={18} /> : n.type === 'report' ? <FileText size={18} /> : <Calendar size={18} />}
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>{n.title}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{n.desc}</div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.time}</span>
              {n.unread && <span className="badge badge-purple" style={{ display: 'block', mt: 4, fontSize: 9 }}>NEW</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
