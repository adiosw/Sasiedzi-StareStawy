import React, { useState } from 'react';
import {
  HeartHandshake,
  Plus,
  CheckCircle,
  MapPin,
  Clock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { HelpRequest, UserProfile, HelpCategory } from '../types';
import { formatDistanceSafe } from '../lib/geo';
import { store } from '../lib/store';

interface HelpTabProps {
  requests: HelpRequest[];
  currentUser: UserProfile | null;
  onOpenCreate: () => void;
  onStartChat: (userId: string) => void;
  onRequireAuth: () => void;
}

export const HelpTab: React.FC<HelpTabProps> = ({
  requests,
  currentUser,
  onOpenCreate,
  onStartChat,
  onRequireAuth,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [onlyOpen, setOnlyOpen] = useState(true);

  const categories = [
    { id: 'all', label: 'Wszystkie prośby' },
    { id: 'fizyczna', label: '💪 Pomoc fizyczna' },
    { id: 'transport', label: '🚗 Transport / podwózka' },
    { id: 'zakupy', label: '🛒 Zakupy / apteka' },
    { id: 'naprawa', label: '🔧 Drobna naprawa' },
    { id: 'opieka', label: '🐾 Zwierzęta' },
    { id: 'inna', label: '✨ Inne' },
  ];

  const filteredRequests = requests.filter((req) => {
    if (onlyOpen && req.status !== 'open') return false;
    if (categoryFilter !== 'all' && req.category !== categoryFilter) return false;
    return true;
  });

  const handleResolve = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    store.resolveHelpRequest(id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Czy na pewno chcesz usunąć tę prośbę?')) {
      store.deleteHelpRequest(id);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Pomoc Sąsiedzka
              </h2>
              <p className="text-xs text-slate-500">
                Wspieraj sąsiadów lub poproś o wsparcie na Starych Stawach
              </p>
            </div>
          </div>
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Poproś o pomoc</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {categories.map((cat) => {
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                  isSelected
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Status switch */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
            <input
              type="checkbox"
              checked={onlyOpen}
              onChange={(e) => setOnlyOpen(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>Pokaż tylko aktualne (otwarte)</span>
          </label>
          <span className="text-[11px] text-slate-400">
            Wyników: {filteredRequests.length}
          </span>
        </div>
      </div>

      {/* Requests list or empty state */}
      {filteredRequests.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-2xl">
            🤝
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-800">
              W tej chwili nikt nie prosi o pomoc
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              Potrzebujesz wnieść meble, pożyczyć drabinę lub podwieźć paczkę? Poproś sąsiadów!
            </p>
          </div>
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Zgłoś nową prośbę</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const isOwner = currentUser?.id === req.userId;
            const distanceStr = formatDistanceSafe(
              currentUser?.latitude,
              currentUser?.longitude,
              req.latitude,
              req.longitude
            );

            return (
              <div
                key={req.id}
                className={`bg-white rounded-3xl p-4 sm:p-5 border shadow-xs transition space-y-3 ${
                  req.status === 'resolved'
                    ? 'border-slate-200/60 opacity-75 bg-slate-50/50'
                    : req.urgency === 'critical'
                    ? 'border-red-300 ring-2 ring-red-500/10'
                    : req.urgency === 'urgent'
                    ? 'border-amber-300'
                    : 'border-slate-200/80 hover:border-blue-300'
                }`}
              >
                {/* Top row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={req.author.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                      alt={req.author.displayName}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-xs text-slate-900">
                          {req.author.displayName}
                        </span>
                        {req.author.isVerified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{req.approxLocation}</span>
                        {distanceStr && (
                          <span>
                            • <strong className="text-blue-700 font-semibold">{distanceStr}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Urgency Badge */}
                  <div className="flex items-center gap-1.5">
                    {req.status === 'resolved' ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Rozwiązane
                      </span>
                    ) : req.urgency === 'critical' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 animate-pulse">
                        🔴 Bardzo pilne
                      </span>
                    ) : req.urgency === 'urgent' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        🟠 Pilne
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                        🟢 Standardowe
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {req.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                    {req.description}
                  </p>
                </div>

                {/* Actions bottom bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[11px] text-slate-400">
                    Dodano: {new Date(req.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                  </span>

                  <div className="flex items-center gap-2">
                    {isOwner || currentUser?.isAdmin ? (
                      <>
                        {req.status === 'open' && (
                          <button
                            onClick={(e) => handleResolve(req.id, e)}
                            className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Oznacz jako rozwiązane</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(req.id, e)}
                          title="Usuń"
                          className="p-1 rounded text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          if (!currentUser) {
                            onRequireAuth();
                            return;
                          }
                          onStartChat(req.userId);
                        }}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 shadow-xs"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Pomóż sąsiadowi (Napisz)</span>
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
