import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { useTranslation } from '../hooks/useTranslation';
import { translateValue } from '../utils/translateValue';

// NEW component. Purely additive — does not touch any existing component.
// Meant to be dropped into the top bar in Layout.js.
const NotificationBell = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Fail silently — notifications are a nice-to-have, never block the UI.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // poll every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* ignore */
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="btn btn-sm btn-agri-outline position-relative"
        onClick={() => setOpen((o) => !o)}
        title={t('notifications')}
      >
        <i className="bi bi-bell"></i>
        {unreadCount > 0 && (
          <span
            className="badge bg-danger rounded-pill position-absolute"
            style={{ top: -6, right: -6, fontSize: 10 }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="notification-dropdown p-2 position-absolute"
          style={{
            top: 'calc(100% + 8px)',
            right: 0,
            width: 360,
            maxWidth: 'calc(100vw - 24px)',
            maxHeight: 420,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'var(--surface-color)',
            borderRadius: 16,
            boxShadow: 'var(--dropdown-shadow)',
            zIndex: 9999,
          }}
        >
          <div className="notification-header d-flex justify-content-between align-items-center px-2 py-1">
            <span className="fw-semibold small">{t('notifications')}</span>
            {unreadCount > 0 && (
              <button className="btn btn-link btn-sm p-0" onClick={markAllRead}>
                {t('markAllRead')}
              </button>
            )}
          </div>
          <div className="notification-list" style={{ overflowY: 'auto', minHeight: 0 }}>
            {loading ? (
              <div className="text-muted small text-center py-3">{t('loading')}</div>
            ) : notifications.length === 0 ? (
              <div className="text-muted small text-center py-3">{t('noNotifications')}</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`px-2 py-2 rounded ${n.read ? '' : 'bg-light'}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => !n.read && markRead(n._id)}
                >
                  <div className="d-flex justify-content-between">
                    <span className="small fw-semibold">{translateValue(t, n.title)}</span>
                    {!n.read && <span className="badge bg-agri" style={{ fontSize: 9 }}>{t('new')}</span>}
                  </div>
                  <div className="small text-muted">{translateValue(t, n.message)}</div>
                  <div className="small text-muted" style={{ fontSize: 11 }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
