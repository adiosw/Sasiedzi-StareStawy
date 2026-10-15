import React, { useState, useEffect } from 'react';
import {
  Bell,
  MapPin,
  Map,
  ShieldCheck,
  UserCheck,
  User,
  LogOut,
  ChevronDown,
  RefreshCw,
  Sparkles,
  Shield,
  Layers,
  Info,
  Download,
  Search,
} from 'lucide-react';
import { store } from '../lib/store';
import { UserProfile, NotificationItem } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { NEIGHBORHOOD_SECTORS } from '../lib/geo';

interface HeaderProps {
  currentUser: UserProfile | null;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  onOpenNotifications: () => void;
  onOpenLocationPicker: () => void;
  onOpenLegal: (type: 'privacy' | 'terms' | 'contact') => void;
  onOpenExport?: () => void;
  onOpenSearch: () => void;
  onOpenMap?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenProfile,
  onOpenAdmin,
  onOpenNotifications,
  onOpenLocationPicker,
  onOpenLegal,
  onOpenExport,
  onOpenSearch,
  onOpenMap,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const allUsers = store.getAllUsers();

  useEffect(() => {
    const updateNotifs = () => setNotifications(store.getNotifications());
    updateNotifs();
    return store.subscribe(updateNotifs);
  }, []);

  // Shortcut Ctrl+K / Cmd+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 h-15 flex items-center justify-between gap-2">
        {/* Brand & Neighborhood identification */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm shrink-0 ring-2 ring-emerald-600/10">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </div>
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate tracking-tight">
                Stare Stawy
              </h1>
              <span className="hidden xs:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                Sąsiedzi
              </span>
            </div>
            {/* Safe approximate location badge */}
            <button
              onClick={onOpenLocationPicker}
              className="group flex items-center gap-1 text-[11px] text-slate-500 hover:text-emerald-700 transition truncate text-left"
              title="Zmień rejon osiedla lub włącz geolokalizację"
            >
              <MapPin className="w-3 h-3 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="truncate max-w-[140px] sm:max-w-[220px]">
                {currentUser?.approxLocation || 'Stare Stawy, Oświęcim'}
              </span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200/90 hover:border-emerald-300 transition active:scale-95 shadow-2xs group"
            title="Szukaj ofert, sprzętu i fachowców (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">Szukaj</span>
            <kbd className="hidden lg:inline-block px-1 py-0.2 rounded bg-white text-[9px] text-slate-400 border border-slate-200">
              Ctrl+K
            </kbd>
          </button>

          {/* Quick Map Button */}
          {onOpenMap && (
            <button
              onClick={onOpenMap}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200/90 hover:border-emerald-300 transition active:scale-95 shadow-2xs group"
              title="Otwórz mapę osiedla Stare Stawy"
            >
              <Map className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold hidden sm:inline">Mapa</span>
            </button>
          )}

          {/* PWA Install Button */}
          <PWAInstallButton variant="compact" />

          {/* Admin badge if currentUser is admin */}
          {currentUser?.isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
              title="Panel moderatora / administratora osiedla"
            >
              <Shield className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Panel Admina</span>
            </button>
          )}

          {/* Notifications bell */}
          {currentUser && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition active:scale-95"
              aria-label="Powiadomienia"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* User Profile / Demo Switcher */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-emerald-500/30 transition"
                aria-label="Menu profilu"
              >
                <img
                  src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                  alt={currentUser.displayName}
                  className="w-8 h-8 rounded-full object-cover border-2 border-emerald-600/40"
                />
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 py-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-xs text-slate-900 truncate">
                          {currentUser.displayName}
                        </p>
                        {currentUser.isVerified && (
                          <span className="flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                            <ShieldCheck className="w-3 h-3" />
                            Zweryfikowany
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenProfile();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-slate-500" />
                        Twój profil sąsiedzki
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenLocationPicker();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4 text-slate-500" />
                        Ustawienia lokalizacji (Stare Stawy)
                      </button>
                      {currentUser.isAdmin && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenAdmin();
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-amber-800 hover:bg-amber-50 font-medium flex items-center gap-2"
                        >
                          <Shield className="w-4 h-4 text-amber-600" />
                          Panel Administratora
                        </button>
                      )}
                    </div>

                    {/* Fast Resident Profile Switcher (allows testing both sides of 1:1 chat & moderation) */}
                    <div className="border-t border-slate-100 px-4 py-2 bg-slate-50/70">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        Przełącz profil mieszkańca
                      </p>
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {allUsers.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              store.switchDemoUser(u.id);
                              setShowUserMenu(false);
                            }}
                            className={`w-full text-left px-2 py-1 rounded text-[11px] flex items-center justify-between transition ${
                              u.id === currentUser.id
                                ? 'bg-emerald-100/70 font-semibold text-emerald-900'
                                : 'hover:bg-slate-200/60 text-slate-700'
                            }`}
                          >
                            <span className="truncate">{u.displayName}</span>
                            {u.isAdmin && (
                              <span className="text-[9px] bg-amber-200 text-amber-900 px-1 rounded">
                                Admin
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          if (onOpenExport) onOpenExport();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-emerald-600" />
                        Pobierz ZIP / Wdrożenie (Vercel)
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          if (confirm('Czy chcesz wyczyścić bazę i przejść w tryb produkcyjny (zostanie tylko oficjalny profil Rady Osiedla i powitalny wpis)?\n\nKliknij OK, aby przygotować czystą bazę dla prawdziwych mieszkańców.\nKliknij Anuluj, aby zachować obecne dane.')) {
                            store.clearForProduction();
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Przygotuj czystą bazę pod start osiedla
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Czy przywrócić domyślne wpisy wzorcowe osiedla?')) {
                            store.resetToDemo();
                            setShowUserMenu(false);
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-500 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4 text-slate-400" />
                        Przywróć wpisy demonstracyjne
                      </button>
                      <button
                        onClick={() => {
                          store.logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        Wyloguj się
                      </button>
                    </div>

                    <div className="border-t border-slate-100 px-4 py-2 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50/50">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${store.isCloudConnected() ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        {store.isCloudConnected() ? 'Chmura Supabase aktywna' : 'Tryb lokalny / Podgląd'}
                      </span>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          if (onOpenExport) onOpenExport();
                        }}
                        className="text-emerald-700 hover:underline font-medium text-[10px]"
                      >
                        Ustawienia chmury
                      </button>
                    </div>

                    <div className="border-t border-slate-100 px-4 py-1.5 flex items-center justify-between text-[10px] text-slate-400">
                      <button onClick={() => onOpenLegal('privacy')} className="hover:underline">
                        Prywatność
                      </button>
                      <span>•</span>
                      <button onClick={() => onOpenLegal('terms')} className="hover:underline">
                        Regulamin
                      </button>
                      <span>•</span>
                      <button onClick={() => onOpenLegal('contact')} className="hover:underline">
                        Kontakt
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenProfile}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs"
            >
              Zaloguj się
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
