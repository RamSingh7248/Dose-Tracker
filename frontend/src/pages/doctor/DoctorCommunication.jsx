import React, { useState } from 'react';
import { MessageSquare, Send, Paperclip, Search, User, ShieldCheck, Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorCommunication() {
  const [messages, setMessages] = useState([
    { id: '1', sender: 'John Doe', text: 'Hello Dr. Jenkins, I took my morning blood pressure dose at 8 AM as scheduled.', time: '10:15 AM', isDoctor: false },
    { id: '2', sender: 'Dr. Sarah Jenkins', text: 'Excellent! Keep tracking your BP readings daily in the Health Log.', time: '10:20 AM', isDoctor: true },
  ]);
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), sender: 'Dr. Sarah Jenkins', text, time: 'Just now', isDoctor: true }]);
    setText('');
    toast.success('Message delivered to patient');
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">💬 Doctor ↔ Patient Secure Communication Center</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            HIPAA-compliant direct messaging, prescription file sharing, and broadcast announcements
          </p>
        </div>
        <button className="btn-secondary" onClick={() => toast.success('Broadcast announcement modal opened')}>
          <Megaphone size={16} /> Broadcast Announcement
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, height: '680px' }}>
        {/* Patient Contacts Sidebar */}
        <div className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
            <input className="input-field" placeholder="Search patient conversations..." style={{ paddingLeft: 30, fontSize: 12 }} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { name: 'John Doe', lastMsg: 'I took my morning blood pressure dose...', time: '10:20 AM', unread: 0 },
              { name: 'Jane Smith', lastMsg: 'Can we reschedule tomorrow consultation?', time: 'Yesterday', unread: 2 },
              { name: 'Robert Johnson', lastMsg: 'Report uploaded: ECG results', time: 'Jul 18', unread: 0 },
            ].map((p, idx) => (
              <div
                key={p.name}
                style={{
                  padding: 10, borderRadius: 8, cursor: 'pointer',
                  background: idx === 0 ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${idx === 0 ? 'var(--accent-purple)' : 'var(--border-color)'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
                  <span>{p.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.time}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                  {p.lastMsg}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Chat Windows */}
        <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
          <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <User size={18} color="var(--accent-purple)" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>John Doe</div>
                <div style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={12} /> Secure Telehealth Channel
                </div>
              </div>
            </div>
          </div>

          {/* Messages Stream */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map(m => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.isDoctor ? 'flex-end' : 'flex-start',
                  maxWidth: '70%',
                  padding: '10px 14px', borderRadius: 12,
                  background: m.isDoctor ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.06)',
                  color: m.isDoctor ? 'white' : 'var(--text-primary)',
                  fontSize: 13
                }}
              >
                <div>{m.text}</div>
                <div style={{ fontSize: 9, opacity: 0.7, textAlign: 'right', marginTop: 4 }}>{m.time}</div>
              </div>
            ))}
          </div>

          {/* Input Footer */}
          <div style={{ display: 'flex', gap: 8, pt: 12, borderTop: '1px solid var(--border-color)' }}>
            <button className="btn-secondary" onClick={() => toast.success('Prescription attachment selected')} style={{ padding: '8px 12px' }}>
              <Paperclip size={16} />
            </button>
            <input
              className="input-field"
              placeholder="Type secure clinical advice or prescription guidance..."
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{ flex: 1 }}
            />
            <button className="btn-primary" onClick={handleSend} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Send size={14} /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
