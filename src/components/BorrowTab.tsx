import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  CheckCircle,
  Clock,
  MapPin,
  Mail,
  ShieldCheck,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { BorrowItem, UserProfile } from '../types';
import { formatDistanceSafe } from '../lib/geo';
import { store } from '../lib/store';

interface BorrowTabProps {
  items: BorrowItem[];
  currentUser: UserProfile | null;
  onOpenCreate: () => void;
  onStartChat: (userId: string, initialMessage?: string) => void;
  onRequireAuth: () => void;
}

export const BorrowTab: React.FC<BorrowTabProps> = ({
  items,
  currentUser,
  onOpenCreate,
  onStartChat,
  onRequireAuth,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'borrowed'>('all');

  const filteredItems = items.filter((item) => {
    if (availabilityFilter !== 'all' && item.availability !== availabilityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  const handleToggleAvailability = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    store.toggleBorrowItemAvailability(id);
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Czy na pewno chcesz usunąć ten przedmiot z pożyczalni?')) {
      store.deleteBorrowItem(id);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header card */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Sąsiedzka Pożyczalnia
              </h2>
              <p className="text-xs text-slate-500">
                Po co kupować sprzęt na 2 godziny? Pożycz od sąsiada ze Starych Stawów
              </p>
            </div>
          </div>
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Wystaw sprzęt</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj wiertarki, drabiny, myjki, odkurzacza..."
            className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setAvailabilityFilter('all')}
            className={`px-3 py-1 rounded-full font-medium transition ${
              availabilityFilter === 'all'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Wszystkie ({items.length})
          </button>
          <button
            onClick={() => setAvailabilityFilter('available')}
            className={`px-3 py-1 rounded-full font-medium transition ${
              availabilityFilter === 'available'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tylko dostępne ({items.filter((i) => i.availability === 'available').length})
          </button>
        </div>
      </div>

      {/* Items Grid or Empty */}
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl">
            🔨
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-800">
              Brak przedmiotów w pożyczalni
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              Masz w garażu wiertarkę, nożyce do żywopłotu lub kosiarkę? Dodaj i pomóż sąsiadowi!
            </p>
          </div>
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Dodaj pierwszy sprzęt</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredItems.map((item) => {
            const isOwner = currentUser?.id === item.userId;
            const distanceStr = formatDistanceSafe(
              currentUser?.latitude,
              currentUser?.longitude,
              item.latitude,
              item.longitude
            );

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200/80 hover:border-amber-300 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Photo or placeholder */}
                  {item.imageUrl ? (
                    <div className="h-44 w-full bg-slate-100 overflow-hidden relative">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <span
                        className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm ${
                          item.availability === 'available'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-700 text-white'
                        }`}
                      >
                        {item.availability === 'available' ? '● Dostępne' : '○ Wypożyczone'}
                      </span>
                    </div>
                  ) : (
                    <div className="h-28 bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-between px-4 border-b border-amber-100">
                      <div className="w-12 h-12 rounded-2xl bg-amber-200/60 text-amber-800 flex items-center justify-center">
                        <Wrench className="w-6 h-6" />
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.availability === 'available'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-700 text-white'
                        }`}
                      >
                        {item.availability === 'available' ? '● Dostępne' : '○ Wypożyczone'}
                      </span>
                    </div>
                  )}

                  <div className="p-4 space-y-2">
                    {/* Item title */}
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">
                      {item.name}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Rules */}
                    {item.rules && (
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-700">Zasady:</span> {item.rules}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom author and action row */}
                <div className="p-4 pt-0">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 border-t border-slate-100 pt-2.5">
                    <div className="flex items-center gap-1 truncate">
                      <span className="font-semibold text-slate-700 truncate">{item.owner.displayName}</span>
                      {item.owner.isVerified && <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />}
                    </div>
                    {distanceStr && (
                      <span className="text-amber-800 font-semibold shrink-0">{distanceStr}</span>
                    )}
                  </div>

                  {isOwner || currentUser?.isAdmin ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleToggleAvailability(item.id, e)}
                        className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        {item.availability === 'available' ? 'Oznacz jako pożyczone' : 'Oznacz jako dostępne'}
                      </button>
                      <button
                        onClick={(e) => handleDeleteItem(item.id, e)}
                        title="Usuń przedmiot"
                        className="p-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (!currentUser) {
                          onRequireAuth();
                          return;
                        }
                        onStartChat(
                          item.userId,
                          `Dzień dobry! Chciał(a)bym zapytać o pożyczenie: "${item.name}". Czy jest to aktualne?`
                        );
                      }}
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition active:scale-95 flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Zapytaj o pożyczenie</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
