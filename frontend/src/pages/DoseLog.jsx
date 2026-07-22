import React, { useEffect, useState } from 'react';
import { medicationApi, doseApi } from '../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, SkipForward, Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_MAP = {
  taken:   { label: 'Taken',   color: 'var(--accent-emerald)', bg: 'rgba(16,185,129,0.12)',  icon: CheckCircle, badgeCls: 'badge-green' },
  missed:  { label: 'Missed',  color: 'var(--accent-rose)',    bg: 'rgba(244,63,94,0.12)',   icon: XCircle,     badgeCls: 'badge-red' },
  skipped: { label: 'Skipped', color: 'var(--text-muted)',     bg: 'rgba(90,90,122,0.12)',   icon: SkipForward, badgeCls: 'badge-gray' },
  pending: { label: 'Pending', color: 'var(--accent-amber)',   bg: 'rgba(245,158,11,0.12)',  icon: Clock,       badgeCls: 'badge-amber' },
};

function buildSchedule(medications, date) {
  const rows = [];
  medications.forEach(med => {
    (med.times || []).forEach(time => {
      rows.push({
        id: `${med._id}-${time}-${date}`,
        medication: med,
        time,
        status: 'pending',
        scheduledTime: `${date}T${time}:00`,
      });
    });
  });
  return rows.sort((a, b) => a.time.localeCompare(b.time));
}

export default function DoseLog() {
  const [medications, setMedications] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchMedsAndDoses();
  }, [selectedDate]);

  const fetchMedsAndDoses = async () => {
    setLoading(true);
    try {
      const medsRes = await medicationApi.getAll({ isActive: true });
      const meds = medsRes.data.data || [];
      setMedications(meds);

      // Timezone-safe UTC boundary conversion based on client local start/end of date
      const localFrom = new Date(`${selectedDate}T00:00:00`);
      const localTo = new Date(`${selectedDate}T23:59:59`);
      const dosesRes = await doseApi.getAll({
        from: localFrom.toISOString(),
        to: localTo.toISOString()
      });
      const loggedDoses = dosesRes.data.data || [];

      const baseSchedule = buildSchedule(meds, selectedDate);
      const mergedSchedule = baseSchedule.map(row => {
        const logged = loggedDoses.find(d => {
          const medId = d.medication?._id || d.medication;
          if (!medId) return false;
          const matchMed = medId.toString() === row.medication._id.toString();

          const dbDate = new Date(d.scheduledTime);
          const pad = (num) => String(num).padStart(2, '0');
          const dbTime = `${pad(dbDate.getHours())}:${pad(dbDate.getMinutes())}`;
          return matchMed && dbTime === row.time;
        });

        if (logged) {
          return {
            ...row,
            dbId: logged._id,
            status: logged.status,
          };
        }
        return row;
      });

      setSchedule(mergedSchedule);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (delta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const markDose = async (id, status) => {
    const dose = schedule.find(d => d.id === id);
    if (!dose) return;
    const prevStatus = dose.status;
    const prevDbId = dose.dbId;

    // Optimistic update
    setSchedule(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    const labels = { taken: '✅ Dose logged!', skipped: '⏭️ Dose skipped', missed: '❌ Dose missed', pending: '↩️ Undone' };
    try {
      if (status !== 'pending') {
        const res = await doseApi.log({
          medicationId: dose.medication._id,
          status,
          scheduledTime: dose.scheduledTime,
        });
        setSchedule(prev => prev.map(d => d.id === id ? { ...d, dbId: res.data.data._id } : d));
      } else {
        if (dose.dbId) {
          await doseApi.remove(dose.dbId);
        }
        setSchedule(prev => prev.map(d => d.id === id ? { ...d, dbId: null } : d));
      }
      toast.success(labels[status] || 'Updated');
    } catch (err) {
      console.error(err);
      setSchedule(prev => prev.map(d => d.id === id ? { ...d, status: prevStatus, dbId: prevDbId } : d));
      toast.error('Failed to log dose');
    }
  };

  const filtered = schedule.filter(d => filterStatus === 'all' || d.status === filterStatus);
  const stats = {
    taken:   schedule.filter(d => d.status === 'taken').length,
    missed:  schedule.filter(d => d.status === 'missed').length,
    skipped: schedule.filter(d => d.status === 'skipped').length,
    pending: schedule.filter(d => d.status === 'pending').length,
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Dose Log</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Track your daily medication intake</p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => {
            const csv = 'Date,Medication,Time,Status\n' + schedule.map(s => `${selectedDate},"${s.medication.name}",${s.time},${s.status}`).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DoseLog-${selectedDate}.csv`;
            a.click();
            toast.success('Dose Log exported to CSV!');
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          📥 Export Log (CSV)
        </button>
      </div>

      {/* Date navigator */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => changeDate(-1)} className="btn-secondary" style={{ padding: '8px 12px' }}><ChevronLeft size={16} /></button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 700 }}>
            {isToday ? 'Today' : new Date(selectedDate + 'T12:00').toLocaleDateString('en-US', { weekday: 'long' })}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {new Date(selectedDate + 'T12:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <button onClick={() => changeDate(1)} className="btn-secondary" style={{ padding: '8px 12px' }} disabled={isToday}><ChevronRight size={16} /></button>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="input-field" style={{ width: 150 }} max={new Date().toISOString().split('T')[0]} />
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {Object.entries(stats).map(([status, count]) => {
          const s = STATUS_MAP[status];
          const Icon = s.icon;
          return (
            <div key={status} onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
              style={{ padding: '14px 16px', borderRadius: 12, background: filterStatus === status ? s.bg : 'var(--bg-card)', border: `1px solid ${filterStatus === status ? s.color + '44' : 'var(--border-color)'}`, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}>
              <Icon size={20} color={s.color} style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Outfit', color: s.color }}>{count}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Schedule */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state glass-card" style={{ padding: 60 }}>
          <div className="empty-state-icon">📅</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No doses scheduled</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {filterStatus !== 'all' ? `No ${filterStatus} doses for this date` : 'Add medications to see your schedule'}
          </p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.map((dose, i) => {
            const s = STATUS_MAP[dose.status];
            const Icon = s.icon;
            const isPast = isToday && dose.time < new Date().toTimeString().slice(0, 5);

            return (
              <div key={dose.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border-color)' : 'none',
                background: dose.status !== 'pending' ? s.bg : 'transparent',
                transition: 'all 0.2s',
              }}>
                {/* Time */}
                <div style={{ width: 56, textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{dose.time}</div>
                  {isPast && dose.status === 'pending' && <div style={{ fontSize: 10, color: 'var(--accent-amber)', marginTop: 2 }}>overdue</div>}
                </div>

                {/* Med icon */}
                <div style={{ width: 40, height: 40, borderRadius: 10, background: dose.medication.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {dose.medication.icon || '💊'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {dose.medication.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {dose.medication.dosage} {dose.medication.dosageUnit}
                    {dose.medication.instructions && ` · ${dose.medication.instructions}`}
                  </div>
                </div>

                {/* Status badge */}
                <span className={`badge ${s.badgeCls}`} style={{ flexShrink: 0 }}>
                  <Icon size={11} /> {s.label}
                </span>

                {/* Actions */}
                {dose.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => markDose(dose.id, 'taken')} className="btn-primary" style={{ padding: '7px 14px', fontSize: 12 }}>
                      <CheckCircle size={13} /> Take
                    </button>
                    <button onClick={() => markDose(dose.id, 'skipped')} className="btn-secondary" style={{ padding: '7px 10px', fontSize: 12 }}>
                      Skip
                    </button>
                  </div>
                )}
                {dose.status !== 'pending' && (
                  <button onClick={() => markDose(dose.id, 'pending')} style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, background: 'none', border: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}>
                    Undo
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
