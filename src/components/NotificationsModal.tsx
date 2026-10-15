import React from 'react';
import { X, Bell, CheckCircle2, MessageSquare, AlertTriangle, ArrowRight } from 'lucide-react';
import { store } from '../lib/store';
import { NotificationItem } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onNavigate: (link: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onNavigate,
}) => {
  if (!isOpen) return null;

  const handleItemClick = (notif: NotificationItem) => {
    store.markNotificationAsRead(notif.id);
    if (notif.link) {
      onNavigate(notif.link);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[85vh] flex flex-col">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm sm:text-base">Powiadomienia sąsiedzkie</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => store.markAllNotificationsRead()}
              className="text-[11px] text-emerald-300 hover:text-white underline"
            >
              Odczytaj wszystkie
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-slate-400 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto opacity-70" />
              <p className="text-xs">Brak nowych powiadomień</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif)}
                className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                  !notif.isRead
                    ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50'
                    : 'border-slate-100 bg-white hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    notif.type === 'alert'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {notif.type === 'alert' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs truncate ${!notif.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(notif.createdAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{notif.body}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
