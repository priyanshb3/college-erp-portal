import React, { useState, useEffect } from 'react';
import { NotificationItem } from '../types';
import { api } from '../services/api';
import {
  Bell,
  X,
  CheckCheck,
  CalendarCheck2,
  AlertTriangle,
  FileCheck,
  Award,
  MessageSquare,
  Info,
  ExternalLink,
  Clock
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const NotificationCenterModal: React.FC<Props> = ({ isOpen, onClose, onNavigateTab }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications(30);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClickItem = (item: NotificationItem) => {
    if (!item.is_read) {
      handleMarkRead(item.id);
    }
    if (item.link_tab) {
      onNavigateTab(item.link_tab);
      onClose();
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'APPOINTMENT':
        return <CalendarCheck2 className="w-4 h-4 text-emerald-600" />;
      case 'ATTENDANCE_WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'ASSIGNMENT':
        return <FileCheck className="w-4 h-4 text-blue-600" />;
      case 'GRADE':
        return <Award className="w-4 h-4 text-purple-600" />;
      case 'COMMUNICATION':
        return <MessageSquare className="w-4 h-4 text-sky-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 sm:pt-16">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#1B2A4A] text-white px-5 py-4 flex items-center justify-between border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-400/20 rounded border border-amber-400/30 text-amber-300">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Central Academic Notification Center</h3>
              <p className="text-[11px] text-slate-300">
                {unreadCount > 0 ? `${unreadCount} unread notices & alerts` : 'All alerts up to date'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-amber-300 hover:text-white flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[65vh] overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-[#1B2A4A] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
              <p className="text-xs font-semibold">No notifications right now</p>
              <p className="text-[11px] text-slate-400">Academic updates and appointment alerts will appear here</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleClickItem(item)}
                className={`p-4 transition cursor-pointer hover:bg-slate-50 flex items-start gap-3.5 ${
                  !item.is_read ? 'bg-amber-50/40 border-l-4 border-[#C59B27]' : ''
                }`}
              >
                <div className="p-2 rounded-full bg-slate-100 shrink-0 mt-0.5">
                  {getCategoryIcon(item.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 line-clamp-1">{item.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                  <div className="flex items-center justify-between mt-2 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {item.category.replace('_', ' ')}
                    </span>
                    {item.link_tab && (
                      <span className="text-[11px] font-semibold text-[#1B2A4A] hover:text-[#6B1D2F] flex items-center gap-1">
                        <span>Open module</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
                {!item.is_read && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-2"></span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 text-center text-[11px] text-slate-500 flex items-center justify-between">
          <span className="font-mono text-[10px]">Institutional ERP Notification Stream</span>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
