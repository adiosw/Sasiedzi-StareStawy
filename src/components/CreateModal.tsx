import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  Megaphone,
  HeartHandshake,
  Wrench,
  AlertTriangle,
  Upload,
  Camera,
  CheckCircle2,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { store } from '../lib/store';
import { UserProfile, PostCategory, HelpCategory, HelpUrgency, AlertCategory } from '../types';
import { NEIGHBORHOOD_SECTORS, STARE_STAWY_CENTER } from '../lib/geo';
import { MiniMapPicker } from './MiniMapPicker';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onRequireAuth: () => void;
  onCreated: (type: 'post' | 'help' | 'borrow' | 'alert') => void;
  initialType?: 'post' | 'help' | 'borrow' | 'alert' | null;
  initialLocation?: { lat: number; lng: number; approxLocation?: string } | null;
}

type CreateType = 'post' | 'help' | 'borrow' | 'alert' | null;

export const CreateModal: React.FC<CreateModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onRequireAuth,
  onCreated,
  initialType = null,
  initialLocation = null,
}) => {
  const [selectedType, setSelectedType] = useState<CreateType>(initialType);

  // Post form state
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<PostCategory>('oddam');
  const [postPrice, setPostPrice] = useState<string>('');
  const [postIsFree, setPostIsFree] = useState<boolean>(true);
  const [postCondition, setPostCondition] = useState<'new' | 'used' | 'other'>('used');
  const [postImageUrl, setPostImageUrl] = useState('');

  // Help form state
  const [helpTitle, setHelpTitle] = useState('');
  const [helpDescription, setHelpDescription] = useState('');
  const [helpCategory, setHelpCategory] = useState<HelpCategory>('fizyczna');
  const [helpUrgency, setHelpUrgency] = useState<HelpUrgency>('normal');

  // Borrow form state
  const [borrowName, setBorrowName] = useState('');
  const [borrowDescription, setBorrowDescription] = useState('');
  const [borrowRules, setBorrowRules] = useState('Zwrócić sprawne i czyste, maksymalnie do 3 dni.');
  const [borrowDeposit, setBorrowDeposit] = useState('Brak kaucji');
  const [borrowItemCategory, setBorrowItemCategory] = useState('Elektronarzędzia');
  const [borrowImageUrl, setBorrowImageUrl] = useState('');

  // Alert form state
  const [alertTitle, setAlertTitle] = useState('');
  const [alertDescription, setAlertDescription] = useState('');
  const [alertCategory, setAlertCategory] = useState<AlertCategory>('important');

  // Common location sector & coordinates
  const [sectorName, setSectorName] = useState<string>(
    initialLocation?.approxLocation || currentUser?.approxLocation || NEIGHBORHOOD_SECTORS[0].name
  );
  const [customLat, setCustomLat] = useState<number>(
    initialLocation?.lat || currentUser?.latitude || STARE_STAWY_CENTER.lat
  );
  const [customLng, setCustomLng] = useState<number>(
    initialLocation?.lng || currentUser?.longitude || STARE_STAWY_CENTER.lng
  );
  const [showMiniMap, setShowMiniMap] = useState<boolean>(false);

  // Sync when modal opens or initial props change
  useEffect(() => {
    if (isOpen) {
      if (initialType) {
        setSelectedType(initialType);
      }
      if (initialLocation) {
        setSectorName(initialLocation.approxLocation || currentUser?.approxLocation || NEIGHBORHOOD_SECTORS[0].name);
        setCustomLat(initialLocation.lat);
        setCustomLng(initialLocation.lng);
        setShowMiniMap(true);
      } else {
        const sec = NEIGHBORHOOD_SECTORS.find((s) => s.name === (currentUser?.approxLocation || NEIGHBORHOOD_SECTORS[0].name)) || NEIGHBORHOOD_SECTORS[0];
        setSectorName(sec.name);
        setCustomLat(sec.lat);
        setCustomLng(sec.lng);
      }
    }
  }, [isOpen, initialType, initialLocation, currentUser]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Dołącz do sąsiadów</h3>
          <p className="text-xs text-slate-500 mb-5">
            Aby dodawać ogłoszenia, prośby o pomoc lub alerty, musisz być zalogowany.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Anuluj
            </button>
            <button
              onClick={() => {
                onClose();
                onRequireAuth();
              }}
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
            >
              Zaloguj się
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kompresja obrazu po stronie klienta (max 1200px szerokości/wysokości)
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setter(compressedDataUrl);
        } else {
          setter(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const resetAll = () => {
    setSelectedType(null);
    setPostTitle('');
    setPostContent('');
    setPostImageUrl('');
    setHelpTitle('');
    setHelpDescription('');
    setBorrowName('');
    setBorrowDescription('');
    setBorrowImageUrl('');
    setAlertTitle('');
    setAlertDescription('');
    setError(null);
    setSuccess(false);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      setError('Wypełnij tytuł i treść ogłoszenia.');
      return;
    }
    setLoading(true);
    setError(null);

    const chosenSec = NEIGHBORHOOD_SECTORS.find((s) => s.name === sectorName);

    const priceVal =
      postIsFree || postCategory === 'oddam'
        ? 0
        : postPrice.trim()
        ? parseFloat(postPrice.trim())
        : undefined;

    store.createPost({
      title: postTitle.trim(),
      content: postContent.trim(),
      category: postCategory,
      price: priceVal,
      isFree: postIsFree || postCategory === 'oddam',
      condition: postCondition,
      imageUrl: postImageUrl || undefined,
      approxLocation: sectorName,
      latitude: customLat ?? chosenSec?.lat,
      longitude: customLng ?? chosenSec?.lng,
    });

    setLoading(false);
    setSuccess(true);
    onCreated('post');
    setTimeout(() => {
      resetAll();
      onClose();
    }, 900);
  };

  const handleCreateHelp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!helpTitle.trim() || !helpDescription.trim()) {
      setError('Wypełnij tytuł i opis prośby.');
      return;
    }
    setLoading(true);
    setError(null);

    const chosenSec = NEIGHBORHOOD_SECTORS.find((s) => s.name === sectorName);

    store.createHelpRequest({
      title: helpTitle.trim(),
      description: helpDescription.trim(),
      category: helpCategory,
      urgency: helpUrgency,
      approxLocation: sectorName,
      latitude: customLat ?? chosenSec?.lat,
      longitude: customLng ?? chosenSec?.lng,
    });

    setLoading(false);
    setSuccess(true);
    onCreated('help');
    setTimeout(() => {
      resetAll();
      onClose();
    }, 900);
  };

  const handleCreateBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowName.trim() || !borrowDescription.trim()) {
      setError('Wypełnij nazwę i opis przedmiotu.');
      return;
    }
    setLoading(true);
    setError(null);

    const chosenSec = NEIGHBORHOOD_SECTORS.find((s) => s.name === sectorName);

    store.createBorrowItem({
      name: borrowName.trim(),
      description: borrowDescription.trim(),
      rules: borrowRules.trim(),
      deposit: borrowDeposit.trim() || undefined,
      itemCategory: borrowItemCategory,
      imageUrl: borrowImageUrl || undefined,
      approxLocation: sectorName,
      latitude: customLat ?? chosenSec?.lat,
      longitude: customLng ?? chosenSec?.lng,
    });

    setLoading(false);
    setSuccess(true);
    onCreated('borrow');
    setTimeout(() => {
      resetAll();
      onClose();
    }, 900);
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim() || !alertDescription.trim()) {
      setError('Wypełnij nagłówek i opis alertu.');
      return;
    }
    setLoading(true);
    setError(null);

    const chosenSec = NEIGHBORHOOD_SECTORS.find((s) => s.name === sectorName);

    store.createAlert({
      title: alertTitle.trim(),
      description: alertDescription.trim(),
      category: alertCategory,
      approxLocation: sectorName,
      latitude: customLat ?? chosenSec?.lat,
      longitude: customLng ?? chosenSec?.lng,
    });

    setLoading(false);
    setSuccess(true);
    onCreated('alert');
    setTimeout(() => {
      resetAll();
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <PlusCircle className="w-4 h-4" />
            </span>
            <h2 className="text-sm sm:text-base font-bold">
              {!selectedType
                ? 'Co chcesz dodać na osiedlu?'
                : selectedType === 'post'
                ? '📢 Nowe ogłoszenie na tablicę'
                : selectedType === 'help'
                ? '🤝 Prośba o pomoc sąsiedzką'
                : selectedType === 'borrow'
                ? '🔧 Wystaw rzecz do pożyczenia'
                : '🚨 Zgłoś alert osiedlowy'}
            </h2>
          </div>
          <button
            onClick={() => {
              resetAll();
              onClose();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          {success ? (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
              <p className="font-bold text-slate-900 text-base">Opublikowano pomyślnie!</p>
              <p className="text-xs text-slate-500">Twoi sąsiedzi ze Starych Stawów mogą już to zobaczyć.</p>
            </div>
          ) : !selectedType ? (
            /* STEP 1: Quick Action Chooser */
            <div className="space-y-2.5">
              <button
                onClick={() => setSelectedType('post')}
                className="w-full p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-xs sm:text-sm text-slate-900">📢 Ogłoszenie na tablicę</p>
                  <p className="text-[11px] text-slate-500">Oddam, sprzedam, kupię, szukam, informacja</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedType('help')}
                className="w-full p-3.5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-left transition flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-xs sm:text-sm text-slate-900">🤝 Potrzebuję pomocy</p>
                  <p className="text-[11px] text-slate-500">Wniesienie mebli, drobna naprawa, transport</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedType('borrow')}
                className="w-full p-3.5 rounded-2xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 text-left transition flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Wrench className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-xs sm:text-sm text-slate-900">🔧 Rzecz do pożyczenia</p>
                  <p className="text-[11px] text-slate-500">Wiertarka, drabina, myjka, narzędzia ogrodowe</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedType('alert')}
                className="w-full p-3.5 rounded-2xl border border-red-200 hover:border-red-500 hover:bg-red-50/40 text-left transition flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-xs sm:text-sm text-slate-900">🚨 Alert osiedlowy</p>
                  <p className="text-[11px] text-slate-500">Droga, awaria prądu, zaginione zwierzę, zguba</p>
                </div>
              </button>
            </div>
          ) : selectedType === 'post' ? (
            /* POST FORM */
            <form onSubmit={handleCreatePost} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tytuł ogłoszenia *
                </label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="np. Oddam ubranka dziewczęce 92-98"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategoria</label>
                  <select
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value as PostCategory)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="oddam">🎁 Oddam</option>
                    <option value="sprzedam">🏷️ Sprzedam</option>
                    <option value="kupie">🛒 Kupię</option>
                    <option value="pozycze">🔧 Pożyczę</option>
                    <option value="szukam">🔍 Szukam</option>
                    <option value="pomoc">🤝 Potrzebuję pomocy</option>
                    <option value="zguba">🔑 Zgubiłem / Znaleziono</option>
                    <option value="pytanie">❓ Pytanie</option>
                    <option value="informacja">📢 Informacja</option>
                    <option value="inne">✨ Inne</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Rejon</label>
                    <button
                      type="button"
                      onClick={() => setShowMiniMap(!showMiniMap)}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 transition"
                    >
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      <span>{showMiniMap ? 'Ukryj mapę' : 'Wskaż na mapie'}</span>
                    </button>
                  </div>
                  <select
                    value={sectorName}
                    onChange={(e) => {
                      setSectorName(e.target.value);
                      const chosen = NEIGHBORHOOD_SECTORS.find((s) => s.name === e.target.value);
                      if (chosen) {
                        setCustomLat(chosen.lat);
                        setCustomLng(chosen.lng);
                      }
                    }}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {NEIGHBORHOOD_SECTORS.map((sec) => (
                      <option key={sec.id} value={sec.name}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {showMiniMap && (
                <MiniMapPicker
                  latitude={customLat}
                  longitude={customLng}
                  accentColor="emerald"
                  onLocationChange={(lat, lng, label) => {
                    setCustomLat(lat);
                    setCustomLng(lng);
                    setSectorName(label);
                  }}
                />
              )}

              {/* Sekcja ceny i stanu dla ofert bazarowych (sprzedam / kupie / oddam) */}
              {(postCategory === 'sprzedam' || postCategory === 'kupie' || postCategory === 'oddam') && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      {postCategory === 'sprzedam' ? 'Cena sprzedaży' : postCategory === 'kupie' ? 'Budżet kupna' : 'Cena (Oddam za darmo)'}
                    </span>
                    {postCategory === 'oddam' && (
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        0 zł (Bezpłatnie)
                      </span>
                    )}
                  </div>

                  {postCategory === 'sprzedam' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cena (w zł) *</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={postPrice}
                            onChange={(e) => {
                              setPostPrice(e.target.value);
                              setPostIsFree(false);
                            }}
                            placeholder="np. 50"
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                          />
                          <span className="absolute right-3 top-1.5 text-xs text-slate-400">zł</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Stan przedmiotu</label>
                        <select
                          value={postCondition}
                          onChange={(e) => setPostCondition(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        >
                          <option value="used">Używany (dobry)</option>
                          <option value="new">Nowy / nieużywany</option>
                          <option value="other">Do odświeżenia</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {postCategory === 'kupie' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Maksymalna kwota (opcjonalnie w zł)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={postPrice}
                        onChange={(e) => setPostPrice(e.target.value)}
                        placeholder="np. 80 zł (lub zostaw puste: do uzgodnienia)"
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Opis *</label>
                <textarea
                  rows={3}
                  required
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Napisz kilka szczegółów dla sąsiadów..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Zdjęcie (opcjonalne)
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700">
                    <Camera className="w-3.5 h-3.5 text-slate-500" />
                    <span>Wybierz z telefonu</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFileChange(e, setPostImageUrl)}
                    />
                  </label>
                  {postImageUrl && (
                    <span className="text-[11px] text-emerald-700 font-medium">✓ Załączono</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedType(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Wróć
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm active:scale-98"
                >
                  {loading ? 'Publikowanie...' : 'Opublikuj na tablicy'}
                </button>
              </div>
            </form>
          ) : selectedType === 'help' ? (
            /* HELP FORM */
            <form onSubmit={handleCreateHelp} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  O jaką pomoc chodzi? *
                </label>
                <input
                  type="text"
                  required
                  value={helpTitle}
                  onChange={(e) => setHelpTitle(e.target.value)}
                  placeholder="np. Wniesienie pralki na 2. piętro"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategoria</label>
                  <select
                    value={helpCategory}
                    onChange={(e) => setHelpCategory(e.target.value as HelpCategory)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="fizyczna">💪 Pomoc fizyczna</option>
                    <option value="transport">🚗 Podwiezienie / transport</option>
                    <option value="zakupy">🛒 Zakupy / apteka</option>
                    <option value="naprawa">🔧 Drobna naprawa</option>
                    <option value="opieka">🐾 Opieka nad zwierzęciem</option>
                    <option value="inna">✨ Inna pomoc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pilność</label>
                  <select
                    value={helpUrgency}
                    onChange={(e) => setHelpUrgency(e.target.value as HelpUrgency)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="normal">Standardowa</option>
                    <option value="urgent">Pilna (dzisiaj/jutro)</option>
                    <option value="critical">Bardzo pilna (teraz)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Szczegóły prośby *
                </label>
                <textarea
                  rows={3}
                  required
                  value={helpDescription}
                  onChange={(e) => setHelpDescription(e.target.value)}
                  placeholder="Kiedy dokładnie, ile osób jest potrzebnych..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedType(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Wróć
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm active:scale-98"
                >
                  {loading ? 'Publikowanie...' : 'Poproś sąsiadów o pomoc'}
                </button>
              </div>
            </form>
          ) : selectedType === 'borrow' ? (
            /* BORROW FORM */
            <form onSubmit={handleCreateBorrow} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nazwa przedmiotu *
                </label>
                <input
                  type="text"
                  required
                  value={borrowName}
                  onChange={(e) => setBorrowName(e.target.value)}
                  placeholder="np. Wiertarka udarowa Bosch, Drabina aluminiowa"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Opis i stan sprzętu *
                </label>
                <textarea
                  rows={2}
                  required
                  value={borrowDescription}
                  onChange={(e) => setBorrowDescription(e.target.value)}
                  placeholder="Wiertła w komplecie, moc 750W..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategoria sprzętu
                  </label>
                  <select
                    value={borrowItemCategory}
                    onChange={(e) => setBorrowItemCategory(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="Elektronarzędzia">⚡ Elektronarzędzia</option>
                    <option value="Ogród">🌱 Ogród</option>
                    <option value="Dom & Sprzątanie">🧹 Dom & Sprzątanie</option>
                    <option value="Remont & Dom">🔨 Remont & Drabiny</option>
                    <option value="Sport & Hobby">🚲 Sport & Dzieci</option>
                    <option value="Inne">✨ Inne</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kaucja
                  </label>
                  <input
                    type="text"
                    value={borrowDeposit}
                    onChange={(e) => setBorrowDeposit(e.target.value)}
                    placeholder="np. Brak kaucji lub 50 zł"
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Zasady pożyczenia
                </label>
                <input
                  type="text"
                  value={borrowRules}
                  onChange={(e) => setBorrowRules(e.target.value)}
                  placeholder="np. Oddać czyste, max na 2 dni"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Zdjęcie (opcjonalne)
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700">
                    <Camera className="w-3.5 h-3.5 text-slate-500" />
                    <span>Wybierz zdjęcie</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFileChange(e, setBorrowImageUrl)}
                    />
                  </label>
                  {borrowImageUrl && (
                    <span className="text-[11px] text-emerald-700 font-medium">✓ Załączono</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedType(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Wróć
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm active:scale-98"
                >
                  {loading ? 'Zapisywanie...' : 'Wystaw do pożyczalni'}
                </button>
              </div>
            </form>
          ) : (
            /* ALERT FORM */
            <form onSubmit={handleCreateAlert} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Co się dzieje? (Nagłówek alertu) *
                </label>
                <input
                  type="text"
                  required
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  placeholder="np. Zamknięty przejazd na Zagrodowej / Zaginął pies"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategoria</label>
                  <select
                    value={alertCategory}
                    onChange={(e) => setAlertCategory(e.target.value as AlertCategory)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="road">🚧 Droga / utrudnienia</option>
                    <option value="outage">⚡ Awaria (prąd/woda/gaz)</option>
                    <option value="pet">🐕 Zwierzę (zaginione/znalezione)</option>
                    <option value="lost">🔑 Zguba / znaleziono</option>
                    <option value="important">⚠️ Ważna informacja</option>
                    <option value="other">🌳 Inne</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Rejon zdarzenia</label>
                    <button
                      type="button"
                      onClick={() => setShowMiniMap(!showMiniMap)}
                      className="text-[11px] text-rose-700 hover:text-rose-800 font-semibold flex items-center gap-1 transition"
                    >
                      <MapPin className="w-3 h-3 text-rose-600" />
                      <span>{showMiniMap ? 'Ukryj mapę' : 'Wskaż na mapie'}</span>
                    </button>
                  </div>
                  <select
                    value={sectorName}
                    onChange={(e) => {
                      setSectorName(e.target.value);
                      const chosen = NEIGHBORHOOD_SECTORS.find((s) => s.name === e.target.value);
                      if (chosen) {
                        setCustomLat(chosen.lat);
                        setCustomLng(chosen.lng);
                      }
                    }}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    {NEIGHBORHOOD_SECTORS.map((sec) => (
                      <option key={sec.id} value={sec.name}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {showMiniMap && (
                <MiniMapPicker
                  latitude={customLat}
                  longitude={customLng}
                  accentColor="rose"
                  onLocationChange={(lat, lng, label) => {
                    setCustomLat(lat);
                    setCustomLng(lng);
                    setSectorName(label);
                  }}
                />
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Szczegóły alertu *
                </label>
                <textarea
                  rows={3}
                  required
                  value={alertDescription}
                  onChange={(e) => setAlertDescription(e.target.value)}
                  placeholder="Dokładniejszy opis, sugerowany objazd lub kontakt..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedType(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Wróć
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm active:scale-98"
                >
                  {loading ? 'Wysyłanie alertu...' : 'Zgłoś alert osiedlowy'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
