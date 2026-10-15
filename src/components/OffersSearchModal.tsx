import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Filter,
  SlidersHorizontal,
  MapPin,
  ShieldCheck,
  MessageSquare,
  Phone,
  Tag,
  Gift,
  Wrench,
  HeartHandshake,
  Users,
  AlertTriangle,
  Sparkles,
  ArrowUpDown,
  CheckCircle,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { store } from '../lib/store';
import { UnifiedOffer, UserProfile, Post } from '../types';
import { NEIGHBORHOOD_SECTORS, formatDistanceSafe } from '../lib/geo';

interface OffersSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onStartChat: (userId: string, initialMessage?: string) => void;
  onOpenPost: (post: Post) => void;
  onOpenCreate: () => void;
  onRequireAuth: () => void;
  initialQuery?: string;
  initialKind?: 'all' | 'sell' | 'free' | 'buy' | 'borrow' | 'help' | 'pro' | 'alert';
}

export const OffersSearchModal: React.FC<OffersSearchModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onStartChat,
  onOpenPost,
  onOpenCreate,
  onRequireAuth,
  initialQuery = '',
  initialKind = 'all',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [kind, setKind] = useState<'all' | 'sell' | 'free' | 'buy' | 'borrow' | 'help' | 'pro' | 'alert'>(initialKind);
  const [priceRange, setPriceRange] = useState<'all' | 'free' | 'paid' | 'under50' | 'under100'>('all');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyWithPhotos, setOnlyWithPhotos] = useState(false);
  const [locationSector, setLocationSector] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'title_asc' | 'price_asc' | 'price_desc' | 'rating_desc'>('newest');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Sync initial props if modal reopens
  useEffect(() => {
    if (isOpen) {
      if (initialQuery) setQuery(initialQuery);
      if (initialKind) setKind(initialKind);
    }
  }, [isOpen, initialQuery, initialKind]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Popular search suggestions
  const quickSearchTags = [
    { label: 'Wiertarka', q: 'wiertarka', kind: 'borrow' as const },
    { label: 'Kosiarka', q: 'kosiarka', kind: 'borrow' as const },
    { label: '🎁 Za darmo (0 zł)', q: '', kind: 'free' as const },
    { label: 'Rower dziecięcy', q: 'rower', kind: 'sell' as const },
    { label: 'Odkurzacz piorący', q: 'odkurzacz', kind: 'borrow' as const },
    { label: 'Drabina', q: 'drabina', kind: 'borrow' as const },
    { label: 'Hydraulik', q: 'hydraulik', kind: 'pro' as const },
    { label: 'Elektryk', q: 'elektryk', kind: 'pro' as const },
    { label: 'Fotelik', q: 'fotelik', kind: 'sell' as const },
    { label: 'Ubranka', q: 'ubranka', kind: 'free' as const },
  ];

  // Perform search
  const offers = useMemo(() => {
    return store.searchOffers({
      query,
      kind,
      priceRange,
      onlyAvailable,
      onlyVerified,
      onlyWithPhotos,
      locationSector,
      sortBy,
    });
  }, [
    query,
    kind,
    priceRange,
    onlyAvailable,
    onlyVerified,
    onlyWithPhotos,
    locationSector,
    sortBy,
  ]);

  if (!isOpen) return null;

  const handleClearFilters = () => {
    setQuery('');
    setKind('all');
    setPriceRange('all');
    setOnlyAvailable(false);
    setOnlyVerified(false);
    setOnlyWithPhotos(false);
    setLocationSector('all');
    setSortBy('newest');
  };

  const hasActiveFilters =
    query.trim() !== '' ||
    kind !== 'all' ||
    priceRange !== 'all' ||
    onlyAvailable ||
    onlyVerified ||
    onlyWithPhotos ||
    locationSector !== 'all' ||
    sortBy !== 'newest';

  const renderBadge = (offer: UnifiedOffer) => {
    if (offer.isFree || offer.price === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <Gift className="w-3 h-3 text-emerald-600" />
          ZA DARMO (0 zł)
        </span>
      );
    }
    if (offer.price !== undefined && offer.price > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <Tag className="w-3 h-3 text-blue-600" />
          {offer.price} zł
        </span>
      );
    }
    if (offer.kind === 'borrow') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
          <Wrench className="w-3 h-3 text-amber-700" />
          Pożyczalnia {offer.deposit ? `• ${offer.deposit}` : ''}
        </span>
      );
    }
    if (offer.kind === 'help') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
          <HeartHandshake className="w-3 h-3 text-teal-700" />
          Pomoc sąsiedzka {offer.urgency === 'urgent' ? '• Pilne' : ''}
        </span>
      );
    }
    if (offer.kind === 'pro') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
          <Users className="w-3 h-3 text-purple-700" />
          Fachowiec {offer.rating ? `• ${offer.rating}★ (${offer.reviewsCount || 0})` : ''}
        </span>
      );
    }
    if (offer.kind === 'alert') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
          <AlertTriangle className="w-3 h-3 text-red-600" />
          Alert sąsiedzki
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
        Ogłoszenie
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 text-slate-900 overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                <Search className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Wyszukiwarka Ofert i Sprzętu</span>
                  <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Stare Stawy
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Szukaj we wszystkich ogłoszeniach, pożyczalni, pomocy i u lokalnych fachowców
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Zamknij (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Search Input */}
          <div className="relative">
            <Search className="w-5 h-5 text-emerald-600 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Wpisz czego szukasz (np. wiertarka, ubranka, kosiarka, rower, hydraulik, drabina)..."
              autoFocus
              className="w-full pl-11 pr-24 py-3 text-sm sm:text-base rounded-2xl border-2 border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:border-emerald-600 transition shadow-inner"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-12 top-3.5 text-slate-400 hover:text-slate-600 p-0.5"
                title="Wyczyść tekst"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`absolute right-2 top-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
                showAdvancedFilters || hasActiveFilters
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-200/70 text-slate-700 hover:bg-slate-300'
              }`}
              title="Zaawansowane filtry"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filtry</span>
            </button>
          </div>

          {/* Quick tags suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Popularne:
            </span>
            {quickSearchTags.map((tag) => (
              <button
                key={tag.label}
                onClick={() => {
                  setQuery(tag.q);
                  setKind(tag.kind);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition active:scale-95 border ${
                  query.toLowerCase() === tag.q.toLowerCase() && kind === tag.kind
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>

          {/* Category Kind Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {[
              { id: 'all', label: '📢 Wszystkie oferty' },
              { id: 'free', label: '🎁 Za darmo (0 zł)' },
              { id: 'sell', label: '🏷️ Sprzedam' },
              { id: 'borrow', label: '🔧 Pożyczalnia' },
              { id: 'help', label: '🤝 Pomoc sąsiedzka' },
              { id: 'pro', label: '👨‍🔧 Fachowcy' },
              { id: 'buy', label: '🛒 Kupię' },
              { id: 'alert', label: '⚠️ Alerty i zguby' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setKind(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  kind === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-700'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Collapsible Advanced Filters */}
          {showAdvancedFilters && (
            <div className="pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs animate-in slide-in-from-top-2 duration-150">
              {/* Cena */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Cena / Odpłatność:
                </label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value as any)}
                  className="w-full py-1.5 px-2.5 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="all">Wszystkie ceny</option>
                  <option value="free">Tylko za darmo (0 zł)</option>
                  <option value="under50">Do 50 zł</option>
                  <option value="under100">Do 100 zł</option>
                  <option value="paid">Tylko płatne</option>
                </select>
              </div>

              {/* Rejon osiedla */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Rejon / Sektor osiedla:
                </label>
                <select
                  value={locationSector}
                  onChange={(e) => setLocationSector(e.target.value)}
                  className="w-full py-1.5 px-2.5 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="all">Całe Stare Stawy</option>
                  {NEIGHBORHOOD_SECTORS.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sortowanie */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Sortuj wyniki:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full py-1.5 px-2.5 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="newest">Najnowsze wpisy</option>
                  <option value="price_asc">Cena: od najniższej (0 zł)</option>
                  <option value="price_desc">Cena: od najwyższej</option>
                  <option value="title_asc">Tytuł alfabetycznie (A-Z)</option>
                  <option value="rating_desc">Najwyższa ocena (Fachowcy)</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="sm:col-span-3 flex flex-wrap items-center gap-3 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                  />
                  <span>Tylko wolne / otwarte teraz</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={onlyVerified}
                    onChange={(e) => setOnlyVerified(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                  />
                  <span>Tylko od zweryfikowanych sąsiadów (Tarcza)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={onlyWithPhotos}
                    onChange={(e) => setOnlyWithPhotos(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                  />
                  <span>Tylko ze zdjęciem</span>
                </label>

                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="ml-auto text-emerald-700 hover:text-emerald-800 font-bold underline"
                  >
                    Wyczyść wszystkie filtry
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Results Bar */}
        <div className="px-5 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              Znaleziono: <strong className="text-emerald-800 font-bold">{offers.length}</strong> {offers.length === 1 ? 'ofertę' : offers.length >= 2 && offers.length <= 4 ? 'oferty' : 'ofert'}
            </span>
            {query.trim() && (
              <span className="text-slate-400">
                dla frazy „<strong className="text-slate-700">{query.trim()}</strong>”
              </span>
            )}
          </div>
          <button
            onClick={() => {
              if (!currentUser) {
                onRequireAuth();
                return;
              }
              onClose();
              onOpenCreate();
            }}
            className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Wystaw ogłoszenie</span>
          </button>
        </div>

        {/* Offers List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5">
          {offers.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <Search className="w-8 h-8 opacity-60" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-800">
                  Brak ofert dla wybranych kryteriów
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Nie znaleźliśmy niczego pasującego do wpisanej frazy lub filtrów. Spróbuj zmienić słowo kluczowe, wyczyścić filtry lub zgłoś swoje zapotrzebowanie sąsiadom!
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Wyczyść filtry
                  </button>
                )}
                <button
                  onClick={() => {
                    if (!currentUser) {
                      onRequireAuth();
                      return;
                    }
                    onClose();
                    onOpenCreate();
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Dodaj zapytanie na tablicę</span>
                </button>
              </div>
            </div>
          ) : (
            offers.map((offer) => {
              const distanceStr = formatDistanceSafe(
                currentUser?.latitude,
                currentUser?.longitude,
                offer.latitude,
                offer.longitude
              );

              return (
                <div
                  key={`${offer.kind}-${offer.id}`}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-4.5 hover:border-emerald-400 hover:shadow-md transition-all duration-200 space-y-3 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Thumbnail photo or Icon placeholder */}
                      {offer.imageUrl ? (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <img
                            src={offer.imageUrl}
                            alt={offer.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                          {offer.kind === 'borrow' ? (
                            <Wrench className="w-6 h-6" />
                          ) : offer.kind === 'help' ? (
                            <HeartHandshake className="w-6 h-6" />
                          ) : offer.kind === 'pro' ? (
                            <Users className="w-6 h-6" />
                          ) : offer.kind === 'alert' ? (
                            <AlertTriangle className="w-6 h-6" />
                          ) : (
                            <Tag className="w-6 h-6" />
                          )}
                        </div>
                      )}

                      {/* Content details */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {renderBadge(offer)}
                          {offer.status && (
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                              {offer.status === 'available'
                                ? '● Dostępny'
                                : offer.status === 'borrowed'
                                ? '○ Wypożyczony'
                                : offer.status === 'resolved'
                                ? '✓ Zrealizowane'
                                : offer.status === 'open'
                                ? '● Otwarte'
                                : ''}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-700 transition leading-snug">
                          {offer.title}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {offer.description}
                        </p>

                        {/* Author info and location */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            {offer.author.displayName}
                            {offer.author.isVerified && (
                              <span title="Zweryfikowany mieszkaniec Starych Stawów">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              </span>
                            )}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-500 truncate max-w-[200px]">
                            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                            {offer.approxLocation}
                          </span>
                          {distanceStr && (
                            <span className="text-emerald-700 font-semibold">
                              ({distanceStr})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Action buttons */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Direct message to author */}
                      <button
                        onClick={() => {
                          if (!currentUser) {
                            onRequireAuth();
                            return;
                          }
                          const promptMsg =
                            offer.kind === 'borrow'
                              ? `Dzień dobry sąsiedzie! Piszę w sprawie pożyczenia: „${offer.title}”. Czy sprzęt jest obecnie dostępny?`
                              : offer.kind === 'pro'
                              ? `Dzień dobry! Piszę w sprawie usługi (${offer.title}). Chciałbym zapytać o wolny termin.`
                              : `Dzień dobry! Piszę w sprawie ogłoszenia: „${offer.title}”.`;
                          onClose();
                          onStartChat(offer.author.id, promptMsg);
                        }}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Napisz wiadomość</span>
                      </button>

                      {/* Phone call for professionals */}
                      {offer.author.phone && (
                        <a
                          href={`tel:${offer.author.phone}`}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                          title="Zadzwoń do fachowca"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Zadzwoń</span>
                        </a>
                      )}

                      {/* View details (if it's a feed post) */}
                      {offer.kind === 'post' && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenPost(offer.rawItem as Post);
                          }}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                          <span>Szczegóły</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Footer Info */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/90 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Wszystkie ogłoszenia pochodzą wyłącznie od mieszkańców i fachowców osiedla Stare Stawy</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-semibold px-3 py-1 rounded-lg hover:bg-slate-200/50 transition"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
