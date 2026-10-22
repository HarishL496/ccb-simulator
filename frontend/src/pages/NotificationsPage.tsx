import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, CheckCircle2, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import { NotificationItem } from '../types';
import { useNavigate } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      await api.markNotificationRead(notif.id).catch(() => {});
    }
    if (notif.related_cr_id) {
      navigate('/approvals');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Notification Centre</h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time change requests notifications, approval outcomes, and SLA turnaround alerts.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center shadow-sm"
          >
            <CheckCheck className="w-4 h-4 mr-1.5 text-indigo-600" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden text-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="font-semibold text-slate-700">No Notifications</div>
            <p className="text-slate-400">You're completely up to date with CCB activities.</p>
          </div>
        ) : (
          notifications.map((n) => {
            let Icon = Bell;
            let iconColor = 'text-indigo-600 bg-indigo-50';

            if (n.type === 'cr_approved') {
              Icon = CheckCircle2;
              iconColor = 'text-emerald-600 bg-emerald-50';
            } else if (n.type === 'cr_rejected') {
              Icon = XCircle;
              iconColor = 'text-rose-600 bg-rose-50';
            } else if (n.type === 'overdue_alert') {
              Icon = AlertTriangle;
              iconColor = 'text-amber-600 bg-amber-50';
            }

            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 flex items-start space-x-3 transition-colors cursor-pointer ${
                  !n.is_read ? 'bg-indigo-50/30 hover:bg-indigo-50/50' : 'hover:bg-slate-50/70'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{n.title}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                </div>

                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0 mt-2" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
