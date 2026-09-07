import { useEffect, useRef, useState } from 'react';
import { Menu, Bell, CheckCheck, MessageCircle, ClipboardCheck } from 'lucide-react';
import { modules } from './constants';
import HeaderUserProfile from '@/Components/Shared/HeaderUserProfile';

const SEEN_STORAGE_KEY = 'aroidmarket_manager_notification_seen';

function getSeenIds() {
  try {
    const stored = localStorage.getItem(SEEN_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSeenIds(ids) {
  try {
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(ids.slice(-200)));
  } catch {
    // Abaikan jika localStorage tidak tersedia.
  }
}

function formatNotificationTime(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function Header({ active, setOpen, user }) {
  const current = modules.find((item) => item.id === active);

  const [notifications, setNotifications] = useState([]);
  const [seenIds, setSeenIds] = useState(() => getSeenIds());
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef(null);

  const seenIdSet = new Set(seenIds);
  const unreadCount = notifications.filter(
    (notification) => !seenIdSet.has(notification.id)
  ).length;

  useEffect(() => {
    let cancelled = false;

    const fetchNotifications = async (showLoading = false) => {
      try {
        if (showLoading) setLoadingNotifications(true);

        const response = await fetch('/notifications', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          credentials: 'same-origin',
        });

        if (!response.ok) {
          throw new Error(`Notification request failed: ${response.status}`);
        }

        const result = await response.json();

        if (!cancelled) {
          setNotifications(Array.isArray(result?.data) ? result.data : []);
        }
      } catch (error) {
        console.error('Gagal mengambil notifikasi:', error);
      } finally {
        if (!cancelled && showLoading) setLoadingNotifications(false);
      }
    };

    fetchNotifications(true);

    const interval = window.setInterval(() => {
      fetchNotifications(false);
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsSeen = (notificationId) => {
    if (!notificationId || seenIdSet.has(notificationId)) return;

    const nextSeenIds = [...seenIds, notificationId];
    setSeenIds(nextSeenIds);
    saveSeenIds(nextSeenIds);
  };

  const markAllAsSeen = () => {
    const currentIds = notifications.map((notification) => notification.id);
    const nextSeenIds = Array.from(new Set([...seenIds, ...currentIds]));

    setSeenIds(nextSeenIds);
    saveSeenIds(nextSeenIds);
  };

  return (
    <header className="topbar">
      <div className="topbar-title">
        <button
          className="mobile-menu icon-button"
          onClick={() => setOpen(true)}
          aria-label="Buka menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <p className="eyebrow">
            WORKSPACE / {current?.label?.toUpperCase() || 'PENGATURAN'}
          </p>
          <h1>{current?.label || 'Pengaturan'}</h1>
        </div>
      </div>

      <div className="topbar-actions">
        <div ref={notificationRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="icon-button notification"
            aria-label={`Notifikasi${unreadCount > 0 ? `, ${unreadCount} belum dibaca` : ''}`}
            aria-expanded={notificationOpen}
            onClick={() => setNotificationOpen((previous) => !previous)}
          >
            <Bell size={19} />

            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                  borderRadius: 999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 700,
                  lineHeight: 1,
                  border: '2px solid var(--surface, #fff)',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div
              role="dialog"
              aria-label="Daftar notifikasi"
              style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: 0,
                width: 'min(390px, calc(100vw - 32px))',
                maxHeight: 540,
                overflow: 'hidden',
                zIndex: 1000,
                border: '1px solid rgba(148, 163, 184, 0.22)',
                borderRadius: 18,
                background: 'var(--surface, #ffffff)',
                boxShadow: '0 20px 50px rgba(15, 23, 42, 0.16)',
                color: 'var(--text, #0f172a)',
              }}
            >
              <div
                style={{
                  padding: '16px 18px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  borderBottom: '1px solid rgba(148, 163, 184, 0.16)',
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Notifikasi</div>
                  <div style={{ marginTop: 3, fontSize: 12, color: '#64748b' }}>
                    {notifications.length === 0
                      ? 'Belum ada aktivitas baru.'
                      : unreadCount > 0
                        ? `${unreadCount} notifikasi belum dibaca`
                        : 'Semua notifikasi sudah dibaca'}
                  </div>
                </div>

                {notifications.length > 0 && unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsSeen}
                    title="Tandai semua sudah dibaca"
                    style={{
                      border: 0,
                      background: 'transparent',
                      color: '#2563eb',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 4,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <CheckCheck size={15} />
                    Baca semua
                  </button>
                )}
              </div>

              <div style={{ maxHeight: 450, overflowY: 'auto' }}>
                {loadingNotifications && notifications.length === 0 ? (
                  <div style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                    Memuat notifikasi...
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '42px 20px', textAlign: 'center', color: '#64748b' }}>
                    <Bell size={28} strokeWidth={1.6} style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Tidak ada notifikasi</div>
                    <div style={{ marginTop: 4, fontSize: 12 }}>
                      Pesan dan JobDesk baru akan muncul di sini.
                    </div>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const isUnread = !seenIdSet.has(notification.id);
                    const isMessage = notification.type === 'message';

                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => markAsSeen(notification.id)}
                        style={{
                          width: '100%',
                          border: 0,
                          borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
                          background: isUnread ? 'rgba(37, 99, 235, 0.055)' : 'transparent',
                          textAlign: 'left',
                          padding: '14px 18px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                        }}
                      >
                        <span
                          style={{
                            width: 34,
                            height: 34,
                            minWidth: 34,
                            borderRadius: 10,
                            display: 'grid',
                            placeItems: 'center',
                            background: isMessage
                              ? 'rgba(59, 130, 246, 0.10)'
                              : 'rgba(16, 185, 129, 0.10)',
                            color: isMessage ? '#2563eb' : '#059669',
                          }}
                        >
                          {isMessage ? <MessageCircle size={17} /> : <ClipboardCheck size={17} />}
                        </span>

                        <span style={{ minWidth: 0, flex: 1 }}>
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: isUnread ? 700 : 600, color: '#0f172a' }}>
                              {notification.title}
                            </span>
                            {isUnread && (
                              <span style={{ width: 7, height: 7, minWidth: 7, borderRadius: 999, background: '#2563eb' }} />
                            )}
                          </span>

                          <span style={{ display: 'block', marginTop: 4, fontSize: 12, lineHeight: 1.45, color: '#475569' }}>
                            {notification.description}
                          </span>

                          {notification.content && (
                            <span style={{ display: 'block', marginTop: 5, fontSize: 12, lineHeight: 1.45, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {notification.content}
                            </span>
                          )}

                          <span style={{ display: 'block', marginTop: 7, fontSize: 11, color: '#94a3b8' }}>
                            {formatNotificationTime(notification.created_at)}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <HeaderUserProfile fallbackUser={user} />
      </div>
    </header>
  );
}
