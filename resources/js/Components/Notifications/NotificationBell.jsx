import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  CheckCheck,
  ClipboardCheck,
  MessageCircle,
} from 'lucide-react';

function getStorageKey(userId) {
  return `aroidmarket_notification_seen_${userId ?? 'guest'}`;
}

function readSeenIds(userId) {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSeenIds(userId, ids) {
  try {
    localStorage.setItem(
      getStorageKey(userId),
      JSON.stringify(Array.from(new Set(ids)).slice(-200))
    );
  } catch {
    // localStorage boleh gagal di private browsing; notif tetap berfungsi.
  }
}

function formatRelativeTime(value) {
  if (!value) return '';

  const date = new Date(value);
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

function getNotificationLabel(type) {
  return type === 'message' ? 'Pesan' : 'JobDesk';
}

export default function NotificationBell({ user, className = '' }) {
  const userId = user?.id;
  const [notifications, setNotifications] = useState([]);
  const [seenIds, setSeenIds] = useState(() => readSeenIds(userId));
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const wrapperRef = useRef(null);

  const seenSet = useMemo(() => new Set(seenIds), [seenIds]);
  const unreadCount = notifications.filter(
    (item) => !seenSet.has(item.id)
  ).length;

  useEffect(() => {
    setSeenIds(readSeenIds(userId));
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    const load = async (withLoader = false) => {
      try {
        if (withLoader) setLoading(true);

        const response = await fetch('/notifications', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          credentials: 'same-origin',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!cancelled) {
          setNotifications(Array.isArray(result?.data) ? result.data : []);
        }
      } catch (error) {
        console.error('Gagal mengambil notifikasi:', error);
      } finally {
        if (!cancelled && withLoader) {
          setLoading(false);
        }
      }
    };

    load(true);

    const interval = window.setInterval(() => {
      load(false);
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [userId]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
    };
  }, []);

  const markAsSeen = (id) => {
    if (!id || seenSet.has(id)) return;

    const next = [...seenIds, id];
    setSeenIds(next);
    writeSeenIds(userId, next);
  };

  const markAllAsSeen = () => {
    const next = [...seenIds, ...notifications.map((item) => item.id)];
    setSeenIds(next);
    writeSeenIds(userId, next);
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative bg-transparent border-none text-[#8c9087] cursor-pointer hover:text-[#1c2826] p-1"
        aria-label={`Notifikasi${unreadCount > 0 ? `, ${unreadCount} belum dibaca` : ''}`}
        aria-expanded={open}
      >
        <Bell className="w-[18px] h-[18px]" />

        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#d96b27] text-white text-[9px] font-bold flex items-center justify-center border-2 border-white"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+10px)] z-[1000] w-[360px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[16px] border border-[#e9e5d9] bg-white shadow-[0_20px_45px_rgba(28,40,38,0.14)]"
        >
          <div className="px-4 py-3.5 border-b border-[#e9e5d9] flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-bold text-[#1c2826] m-0">
                Notifikasi
              </p>
              <p className="text-[10px] text-[#8c9087] m-0 mt-0.5">
                Pesan Manager & JobDesk
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsSeen}
                className="border-none bg-transparent text-[#2f6850] text-[10px] font-semibold cursor-pointer inline-flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Baca semua
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="px-5 py-10 text-center text-xs text-[#8c9087]">
                Memuat notifikasi...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Bell className="w-7 h-7 text-[#c8c4b9] mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#1c2826] m-0">
                  Belum ada notifikasi
                </p>
                <p className="text-[10px] text-[#8c9087] m-0 mt-1">
                  Pesan dari Manager dan JobDesk baru akan muncul di sini.
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const unread = !seenSet.has(notification.id);
                const isMessage = notification.type === 'message';

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => markAsSeen(notification.id)}
                    className={`w-full text-left border-none border-b border-[#f0ede5] px-4 py-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                      unread
                        ? 'bg-[#2f6850]/[0.045] hover:bg-[#2f6850]/[0.075]'
                        : 'bg-white hover:bg-[#fdfcf7]'
                    }`}
                  >
                    <span
                      className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${
                        isMessage
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {isMessage ? (
                        <MessageCircle className="w-[17px] h-[17px]" />
                      ) : (
                        <ClipboardCheck className="w-[17px] h-[17px]" />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[12px] ${
                            unread
                              ? 'font-bold text-[#1c2826]'
                              : 'font-semibold text-[#1c2826]'
                          }`}
                        >
                          {notification.title}
                        </span>

                        {unread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d96b27] shrink-0" />
                        )}
                      </span>

                      <span className="block text-[9px] font-semibold uppercase tracking-wider text-[#8c9087] mt-0.5">
                        {getNotificationLabel(notification.type)}
                      </span>

                      <span className="block text-[11px] text-[#47504d] leading-relaxed mt-1">
                        {notification.description}
                      </span>

                      {notification.content && (
                        <span className="block text-[11px] text-[#707772] leading-relaxed mt-1.5 line-clamp-2">
                          {notification.content}
                        </span>
                      )}

                      {notification.target_date && (
                        <span className="block text-[10px] text-[#8c9087] mt-1">
                          Target:{' '}
                          {new Date(notification.target_date).toLocaleDateString(
                            'id-ID',
                            {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }
                          )}
                        </span>
                      )}

                      <span className="block text-[10px] text-[#aaa59a] mt-1.5">
                        {formatRelativeTime(notification.created_at)}
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
  );
}
