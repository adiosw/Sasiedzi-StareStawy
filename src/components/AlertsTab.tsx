import React, { useState } from 'react';
import {
  AlertTriangle,
  Plus,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Trash2,
  Share2,
  Mail,
  Info,
} from 'lucide-react';
import { AlertItem, UserProfile, AlertCategory } from '../types';
import { formatDistanceSafe } from '../lib/geo';
import { store } from '../lib/store';

interface AlertsTabProps {
  alerts: AlertItem[];
  currentUser: UserProfile | null;
  onOpenCreate: () => void;
  onStartChat: (userId: string) => void;
  onRequireAuth: () => void;
}

export const AlertsTab: React.FC<AlertsTabProps> = ({
  alerts,
  currentUser,
  onOpenCreate,
  onStartChat,
  onRequireAuth,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Wszystkie alerty' },
    { id: 'road', label: '🚧 Utrudnienia drogowe' },
    { id: 'outage', label: '⚡ Awarie (prąd/woda)' },
    { id: 'pet', label: '🐕 Zwierzęta' },
    { id: 'lost', label: '🔑 Zguby' },
    { id: 'important', label: '⚠️ Ważne' },
  ];

  const filteredAlerts = alerts.filter((a) => {
    if (filterCategory !== 'all' && a.category !== filterCategory) return false;
    return true;
  });

  const handleDelete = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć ten alert?')) {
      store.deleteAlert(id);
    }
  };

  const handleApprove = (id: string) => {
    store.approveAlert(id);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header card */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-800 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Alerty i Ważne Sprawy
              </h2>
              <p className="text-xs text-slate-500">
                Awarie, utrudnienia w ruchu, zaginione zwierzęta na Starych Stawach
              </p>
            </div>
          </div>
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Zgłoś alert</span>
          </button>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {categories.map((cat) => {
            const isSelected = filterCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                  isSelected
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Notice on safety and anti-panic */}
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            Dbamy o spokój osiedla. Zgłoszenia służą wyłącznie faktycznym sprawom sąsiedzkim.
          </span>
        </div>
      </div>

      {/* Alerts List or Empty */}
      {filteredAlerts.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
            ✨
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-800">
              Brak aktywnych alertów na osiedlu
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              Wszystkie drogi są przejezdne, brak awarii. Spokojnego dnia!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const isOwner = currentUser?.id === alert.userId;
            const distanceStr = formatDistanceSafe(
              currentUser?.latitude,
              currentUser?.longitude,
              alert.latitude,
              alert.longitude
            );

            return (
              <div
                key={alert.id}
                className="bg-white rounded-3xl p-4 sm:p-5 border border-red-200/80 shadow-xs hover:shadow-md transition space-y-3"
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-slate-900">
                          {alert.author.displayName}
                        </span>
                        {alert.author.isVerified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        {alert.status === 'pending' && (
                          <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                            Oczekuje na akceptację
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{alert.approxLocation}</span>
                        {distanceStr && (
                          <span>
                            • <strong className="text-red-700 font-semibold">{distanceStr}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800">
                    {alert.category}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {alert.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 mt-1 whitespace-pre-line leading-relaxed">
                    {alert.description}
                  </p>
                </div>

                {/* Bottom row */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[11px] text-slate-400">
                    Zgłoszono: {new Date(alert.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <div className="flex items-center gap-2">
                    {currentUser?.isAdmin && alert.status === 'pending' && (
                      <button
                        onClick={() => handleApprove(alert.id)}
                        className="flex items-center gap-1 bg-emerald-600 text-white px-2 py-1 rounded-lg text-xs font-semibold"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Zatwierdź alert</span>
                      </button>
                    )}

                    {!isOwner && (
                      <button
                        onClick={() => {
                          if (!currentUser) {
                            onRequireAuth();
                            return;
                          }
                          onStartChat(alert.userId);
                        }}
                        className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Napisz do zgłaszającego</span>
                      </button>
                    )}

                    {(isOwner || currentUser?.isAdmin) && (
                      <button
                        onClick={() => handleDelete(alert.id)}
                        title="Usuń alert"
                        className="p-1 rounded text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
