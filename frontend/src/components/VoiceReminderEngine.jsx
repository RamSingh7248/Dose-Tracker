import React, { useEffect, useState, useRef } from 'react';
import { notificationApi, medicationApi, reminderApi, doseApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Bell, Pill, AlertTriangle, CheckCircle, Volume2, X, Clock, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VoiceReminderEngine() {
  const { user } = useAuth();
  const [activeAlert, setActiveAlert] = useState(null); // Active live popup banner alert
  const seenIdsRef = useRef(new Set());
  const firedMinutesRef = useRef(new Set());

  useEffect(() => {
    if (!user) return;

    // Request HTML5 Desktop Notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // High-precision polling loop for real-time alerts & exact clock matching (every 5 seconds)
    fetchUnreadAlerts();
    checkExactReminderSchedule();
    const interval = setInterval(() => {
      fetchUnreadAlerts();
      checkExactReminderSchedule();
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  const checkExactReminderSchedule = async () => {
    try {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      const minuteKey = `${now.toDateString()}-${timeStr}`;

      const [medRes, remRes] = await Promise.allSettled([
        medicationApi.getAll({ isActive: true }),
        reminderApi.getAll({ isActive: true }),
      ]);

      const activeMedications = medRes.status === 'fulfilled' ? (medRes.value.data?.data || []) : [];
      const activeReminders = remRes.status === 'fulfilled' ? (remRes.value.data?.data || []) : [];

      // Check active Medications
      for (const med of activeMedications) {
        if (med.times && Array.isArray(med.times) && med.times.includes(timeStr)) {
          const key = `med-${med._id}-${minuteKey}`;
          if (!firedMinutesRef.current.has(key)) {
            firedMinutesRef.current.add(key);
            const medName = med.name;
            const dosage = `${med.dosage || ''} ${med.dosageUnit || ''}`.trim();

            triggerLiveAlert({
              _id: `live-med-${med._id}-${Date.now()}`,
              title: `💊 Reminder: ${medName}`,
              message: `Time to take your scheduled dose of ${medName} (${dosage}) at ${timeStr}.`,
              type: 'medicine',
              referenceId: med._id,
            });
          }
        }
      }

      // Check active Reminders
      for (const r of activeReminders) {
        if (r.time === timeStr || (r.times && r.times.includes(timeStr))) {
          const key = `rem-${r._id}-${minuteKey}`;
          if (!firedMinutesRef.current.has(key)) {
            firedMinutesRef.current.add(key);
            const medName = r.medication?.name || r.label || 'Medication';
            const dosage = `${r.medication?.dosage || ''} ${r.medication?.dosageUnit || ''}`.trim();

            triggerLiveAlert({
              _id: `live-rem-${r._id}-${Date.now()}`,
              title: `⏰ LIVE ALARM: ${medName}`,
              message: `Time to take your scheduled dose of ${medName} (${dosage}) at ${timeStr}.`,
              type: 'medicine',
              referenceId: r.medication?._id || r._id,
            });
          }
        }
      }
    } catch (err) {
      // Quiet fail
    }
  };

  const fetchUnreadAlerts = async () => {
    try {
      const res = await notificationApi.getAll({ unreadOnly: true });
      const unreadList = res.data.data || [];

      // Find first new unread notification that hasn't been alerted yet
      const newNotif = unreadList.find(n => !seenIdsRef.current.has(n._id));

      if (newNotif) {
        seenIdsRef.current.add(newNotif._id);
        triggerLiveAlert(newNotif);
      }
    } catch (err) {
      // Quiet fail on polling
    }
  };

  const triggerLiveAlert = (notif) => {
    setActiveAlert(notif);

    // 1. Play chime sound
    playChime();

    // 2. Speak voice prompt
    const voiceText = notif.title.includes('Missed')
      ? `Attention. You missed a scheduled dose of ${notif.title.replace(/.*:/, '')}.`
      : `Reminder. It is time to take your medication ${notif.title.replace(/.*:/, '')}.`;
    speakVoicePrompt(voiceText);

    // 3. Trigger HTML5 Desktop Notification
    triggerBrowserNotification(notif.title, notif.message);

    // 4. Toast notification
    toast(notif.title, {
      icon: '🔔',
      duration: 6000,
      style: {
        background: '#161926',
        color: '#fff',
        border: '1px solid #8b5cf6',
      },
    });
  };

  const handleDismissAlert = async () => {
    stopAlarmAudio();
    if (activeAlert?._id) {
      try {
        await notificationApi.markRead(activeAlert._id);
      } catch {}
    }
    setActiveAlert(null);
  };

  const handleTakeDoseNow = async () => {
    if (activeAlert?.referenceId) {
      try {
        await doseApi.log({
          medicationId: activeAlert.referenceId,
          status: 'taken',
          scheduledTime: new Date().toISOString(),
        });
        toast.success('✅ Dose marked as taken!');
      } catch {
        toast.error('Failed to log dose');
      }
    }
    handleDismissAlert();
  };

  return (
    <>
      {/* Live Prominent Pop-up Alert Banner */}
      {activeAlert && (
        <div style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999999,
          width: '90%',
          maxWidth: 520,
          background: 'linear-gradient(135deg, #161926 0%, #1a1e30 100%)',
          border: `2px solid ${activeAlert.type === 'emergency' || activeAlert.title.includes('Missed') ? '#f43f5e' : '#8b5cf6'}`,
          borderRadius: 16,
          boxShadow: `0 20px 60px rgba(0,0,0,0.9), 0 0 40px ${activeAlert.type === 'emergency' || activeAlert.title.includes('Missed') ? 'rgba(244,63,94,0.4)' : 'rgba(139,92,246,0.4)'}`,
          padding: '18px 22px',
          color: '#ffffff',
          animation: 'fadeInUp 0.3s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: activeAlert.title.includes('Missed') ? 'rgba(244,63,94,0.2)' : 'rgba(139,92,246,0.2)',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                flexShrink: 0,
                border: `1px solid ${activeAlert.title.includes('Missed') ? '#f43f5e' : '#8b5cf6'}`
              }}>
                {activeAlert.title.includes('Missed') ? (
                  <AlertTriangle size={24} color="#f43f5e" className="animate-pulse" />
                ) : (
                  <Pill size={24} color="#8b5cf6" className="animate-bounce" />
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, fontFamily: 'Outfit', color: '#ffffff' }}>
                    {activeAlert.title}
                  </span>
                  <span className="badge" style={{
                    fontSize: 10,
                    background: activeAlert.title.includes('Missed') ? 'rgba(244,63,94,0.2)' : 'rgba(139,92,246,0.2)',
                    color: activeAlert.title.includes('Missed') ? '#f43f5e' : '#a78bfa',
                    border: `1px solid ${activeAlert.title.includes('Missed') ? 'rgba(244,63,94,0.4)' : 'rgba(139,92,246,0.4)'}`
                  }}>
                    LIVE ALERT
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4, lineHeight: 1.4 }}>
                  {activeAlert.message}
                </div>
              </div>
            </div>

            <button
              onClick={handleDismissAlert}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 4 }}
              title="Dismiss Alert"
            >
              <X size={18} />
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12 }}>
            {activeAlert.type === 'medicine' && (
              <button
                onClick={handleTakeDoseNow}
                className="btn-primary"
                style={{ flex: 1, padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <CheckCircle size={14} /> Take Dose Now
              </button>
            )}
            <button
              onClick={handleDismissAlert}
              className="btn-secondary"
              style={{ flex: 1, padding: '8px 14px', fontSize: 12 }}
            >
              Dismiss Alert
            </button>
          </div>
        </div>
      )}
    </>
  );
}

let alarmAudioInterval = null;

/**
 * Play continuous repeating alarm clock chime tone
 */
export const playChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const playTone = () => {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25); // A5

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    };

    playTone();
    if (alarmAudioInterval) clearInterval(alarmAudioInterval);
    alarmAudioInterval = setInterval(playTone, 800);
  } catch (err) {
    console.warn('Audio chime play blocked or unsupported:', err);
  }
};

/**
 * Stop active alarm audio chime
 */
export const stopAlarmAudio = () => {
  if (alarmAudioInterval) {
    clearInterval(alarmAudioInterval);
    alarmAudioInterval = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Speak voice prompt using Web Speech API
 */
export const speakVoicePrompt = (text) => {
  try {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop any active speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech Synthesis error:', err);
  }
};

/**
 * Trigger HTML5 Browser Desktop Notification
 */
export const triggerBrowserNotification = (title, body, icon = '/logo192.png') => {
  try {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon,
        badge: icon,
        vibrate: [300, 100, 300, 100, 300],
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          new Notification(title, { body, icon });
        }
      });
    }
  } catch (err) {
    console.warn('Browser Notification error:', err);
  }
};

/**
 * Combined Enterprise Notification Dispatcher (Sound + Voice + Browser + Toast)
 */
export const dispatchEnterpriseAlert = ({ title, message, voiceText, sound = true, voice = true, browser = true }) => {
  if (sound) playChime();
  if (voice && voiceText) speakVoicePrompt(voiceText);
  if (browser) triggerBrowserNotification(title, message);
  toast(title, { icon: '🔔', duration: 8000 });
};
