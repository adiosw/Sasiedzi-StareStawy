import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
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
  Plus,
  ExternalLink,
} from 'lucide-react';
import { store } from '../lib/store';
import { UnifiedOffer, UserProfile, Post } from '../types';
import { NEIGHBORHOOD_SECTORS, formatDistanceSafe } from '../lib/geo';

interface SearchTabProps {
  currentUser: UserProfile | null;
  onStartChat: (userId: string, initialMessage?: string) => void;
  onOpenPost: (post: Post) => void;
  onOpenCreate: () => void;
  onRequireAuth: () => void;
}

export const SearchTab: React.FC<SearchTabProps> = ({
  currentUser,
  onStartChat,
  onOpenPost,
  onOpenCreate,
  onRequireAuth,
}) => {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | 'sell' | 'free' | 'buy' | 'borrow' | 'help' | 'pro' | 'alert'>('all');
  const [priceRange, setPriceRange] = useState<'all' | 'free' | 'paid' | 'under50' | 'under100'>('all');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyWithPhotos, setOnlyWithPhotos] = useState(false);
  const [locationSector, setLocationSector] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'title_asc' | 'price_asc' | 'price_desc' | 'rating_desc'>('newest');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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
          Alert
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
    <div className="space-y-4 pb-20">
      {/* Top Search Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 font-bold">
              <Search className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Wyszukiwarka Ofert i Sprzętu</span>
              </h2>
              <p className="text-xs text-slate-500">
                Szukaj w bazarku, pożyczalni, pomocy sąsiedzkiej i usługach fachowców
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!currentUser) {
                onRequireAuth();
                return;
              }
              onOpenCreate();
            }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Wystaw ofertę</span>
          </button>
        </div>

        {/* Search Bar Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Wpisz czego szukasz (np. wiertarka, ubranka, kosiarka, rower, hydraulik, drabina)..."
            className="w-full pl-9.5 pr-20 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-12 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`absolute right-2 top-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
              showAdvancedFilters || hasActiveFilters
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200/70 text-slate-700 hover:bg-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filtry</span>
          </button>
        </div>

        {/* Quick Suggestions Chips */}
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

        {/* Offer Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {[
            { id: 'all', label: '📢 Wszystkie oferty' },
            { id: 'free', label: '🎁 Za darmo (0 zł)' },
            { id: 'sell', label: '🏷️ Sprzedam' },
            { id: 'borrow', label: '🔧 Pożyczalnia' },
            { id: 'help', label: '🤝 Pomoc sąsiedzka' },
            { id: 'pro', label: '👨‍🔧 Fachowcy' },
            { id: 'buy', label: '🛒 Kupię' },
            { id: 'alert', label: '⚠️ Alerty' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setKind(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                kind === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
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
                {NEIGNBORHOOD_SECTORS_MAP}
              </select>
            </div>

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

            <div className="sm:col-span-3 flex flex-wrap items-center gap-3 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                />
                <span>Tylko wolne teraz</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                />
                <span>Tylko zweryfikowani sąsiedzi (Tarcza)</span>
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
                  Wyczyść filtry
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs px-2 text-slate-500">
        <div>
          Znaleziono: <strong className="text-slate-800 font-bold">{offers.length}</strong> {offers.length === 1 ? 'ofertę' : offers.length >= 2 && offers.length <= 4 ? 'oferty' : 'ofert'}
          {query.trim() && (
            <span> dla „<strong className="text-slate-700">{query.trim()}</strong>”</span>
          )}
        </div>
      </div>

      {/* Results List */}
      {offers.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
            🔍
          </div>
          <h4 className="text-sm sm:text-base font-bold text-slate-800">
            Brak ofert dla podanych kryteriów
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Spróbuj zmienić słowo kluczowe, usunąć filtry lub wystawić własne zapytanie na tablicy.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
                onOpenCreate();
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
            >
              + Dodaj ogłoszenie
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => {
            const distanceStr = formatDistanceSafe(
              currentUser?.latitude,
              currentUser?.longitude,
              offer.latitude,
              offer.longitude
            );

            return (
              <article
                key={`${offer.kind}-${offer.id}`}
                className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 hover:border-emerald-300 shadow-xs hover:shadow-md transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Thumbnail Photo or Icon */}
                    {offer.imageUrl ? (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <img
                          src={offer.imageUrl}
                          alt={offer.title}
                          className="w-full h-full object-cover"
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

                    {/* Content */}
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

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {offer.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {offer.description}
                      </p>

                      {/* Author info & Location */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          {offer.author.displayName}
                          {offer.author.isVerified && (
                            <span title="Zweryfikowany mieszkaniec">
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

                  {/* Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <button
                      onClick={() => {
                        if (!currentUser) {
                          onRequireAuth();
                          return;
                        }
                        const promptMsg =
                          offer.kind === 'borrow'
                            ? `Dzień dobry! Piszę w sprawie pożyczenia: „${offer.title}”. Czy sprzęt jest dostępny?`
                            : offer.kind === 'pro'
                            ? `Dzień dobry! Piszę w sprawie usługi (${offer.title}). Chciałbym zapytać o wolny termin.`
                            : `Dzień dobry! Piszę w sprawie ogłoszenia: „${offer.title}”.`;
                        onStartChat(offer.author.id, promptMsg);
                      }}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Napisz wiadomość</span>
                    </button>

                    {offer.author.phone && (
                      <a
                        href={`tel:${offer.author.phone}`}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Zadzwoń</span>
                      </a>
                    )}

                    {offer.kind === 'post' && (
                      <button
                        onClick={() => onOpenPost(offer.rawItem as Post)}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        <span>Szczegóły</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

const NEIGNBORHOOD_SECTORS_MAP = NEIGHBORHOOD_SECTORS.map((sec) => (
  <option key={sec.id} value={sec.name}>
    {sec.name}
  </option>
));
