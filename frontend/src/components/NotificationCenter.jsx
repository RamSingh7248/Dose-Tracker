import React, { useEffect, useState, useRef } from 'react';
import { notificationApi } from '../services/api';
import {
  Bell, Check, Trash2, CheckCheck, Pill, Calendar,
  AlertTriangle, FileText, ShieldAlert, Sparkles, X, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    // Poll every 15s for new notifications
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getAll({ type: activeTab });
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      // Quiet fail on polling
    }
  };

  const handleMarkRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await notificationApi.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(res.data.unreadCount ?? Math.max(0, unreadCount - 1));
    } catch (err) {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await notificationApi.remove(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      setUnreadCount(res.data.unreadCount ?? unreadCount);
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationApi.clearAll();
      setNotifications([]);
      setUnreadCount(0);
      toast.success('Cleared all notifications');
    } catch (err) {
      toast.error('Failed to clear notifications');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'medicine': return <Pill size={16} color="#8b5cf6" />;
      case 'followup': return <Calendar size={16} color="#10b981" />;
      case 'prescription_ready': return <FileText size={16} color="#06b6d4" />;
      case 'refill': return <AlertTriangle size={16} color="#f59e0b" />;
      case 'emergency': return <ShieldAlert size={16} color="#f43f5e" />;
      default: return <Bell size={16} color="#8b5cf6" />;
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        style={{
          position: 'relative',
          background: isOpen ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)',
          border: '1px solid var(--border-color)',
          borderRadius: 12,
          padding: 10,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-primary)',
          transition: 'all 0.2s ease',
          minWidth: 40,
          minHeight: 40,
        }}
      >
        <Bell size={18} color={unreadCount > 0 ? '#a78bfa' : 'currentColor'} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: '#f43f5e',
              color: '#ffffff',
              fontSize: 10,
              fontWeight: 800,
              height: 18,
              minWidth: 18,
              borderRadius: 9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #0d0e15',
              boxShadow: '0 0 8px rgba(244, 63, 94, 0.6)',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          aria-modal="true"
          className="notif-dropdown"
          style={{
            background: '#161926',
            border: '1px solid rgba(139,92,246,0.3)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 30px rgba(139,92,246,0.2)',
            animation: 'fadeInUp 0.2s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={18} color="var(--accent-purple)" />
              <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, margin: 0 }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="badge badge-purple" style={{ fontSize: 11 }}>
                  {unreadCount} new
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {unreadCount > 0 && (
                <button
                  className="btn-secondary"
                  onClick={handleMarkAllRead}
                  style={{ padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                  title="Mark all as read"
                >
                  <CheckCheck size={13} /> Read all
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              padding: '8px 12px',
              background: 'rgba(0,0,0,0.2)',
              borderBottom: '1px solid var(--border-color)',
              overflowX: 'auto',
            }}
          >
            {[
              { id: 'all', label: 'All' },
              { id: 'medicine', label: 'Medicine' },
              { id: 'followup', label: 'Follow-up' },
              { id: 'refill', label: 'Refill' },
              { id: 'emergency', label: 'Alerts' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  border: 'none',
                  background: activeTab === tab.id ? 'var(--accent-purple)' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification List Feed */}
          <div style={{ maxHeight: 360, overflowY: 'auto', padding: 8 }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
                <Sparkles size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
                <p style={{ margin: 0 }}>No notifications at the moment</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && handleMarkRead(n._id)}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    marginBottom: 6,
                    background: n.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(139,92,246,0.08)',
                    border: '1px solid ' + (n.isRead ? 'var(--border-color)' : 'rgba(139,92,246,0.25)'),
                    display: 'flex',
                    gap: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getTypeIcon(n.type)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: n.isRead ? 600 : 700,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {n.title}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                      {n.message}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
                    {!n.isRead && (
                      <button
                        onClick={(e) => handleMarkRead(n._id, e)}
                        style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: 2 }}
                        title="Mark read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(n._id, e)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                      title="Delete notification"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: '8px 16px',
                borderTop: '1px solid var(--border-color)',
                textAlign: 'center',
                background: 'rgba(0,0,0,0.15)',
              }}
            >
              <button
                onClick={handleClearAll}
                style={{ background: 'none', border: 'none', color: '#f43f5e', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
              >
                Clear All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
