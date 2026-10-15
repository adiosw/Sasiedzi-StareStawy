import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  MapPin,
  Sparkles,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import { store } from '../lib/store';
import { NEIGHBORHOOD_SECTORS } from '../lib/geo';
import { DEMO_USERS } from '../lib/demoData';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { LegalModal } from './LegalModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [sectorId, setSectorId] = useState(NEIGHBORHOOD_SECTORS[0].id);
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const chosenSector = NEIGHBORHOOD_SECTORS.find((s) => s.id === sectorId);

      if (mode === 'register') {
        if (!displayName.trim()) {
          setError('Podaj imię lub pseudonim (np. Jan K., Anna).');
          setLoading(false);
          return;
        }
        if (!email.trim() || !email.includes('@')) {
          setError('Wprowadź prawidłowy adres e-mail.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Hasło musi mieć minimum 6 znaków.');
          setLoading(false);
          return;
        }
        if (!termsAccepted) {
          setError('Musisz zaakceptować Regulamin Osiedla oraz Politykę Prywatności i RODO.');
          setLoading(false);
          return;
        }

        // Jeśli Supabase jest podpięty, zarejestruj w Supabase Auth
        const client = getSupabase();
        let assignedId: string | undefined = undefined;

        if (client) {
          const { data: sbData, error: sbError } = await client.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
              data: {
                display_name: displayName.trim(),
                approx_location: chosenSector?.name || 'Stare Stawy',
                bio: bio.trim(),
              },
            },
          });

          if (sbError) {
            setError(`Błąd rejestracji w Supabase: ${sbError.message}`);
            setLoading(false);
            return;
          }

          if (sbData.user) {
            assignedId = sbData.user.id;
          }

          if (sbData.user && !sbData.session) {
            setSuccessMsg('Konto utworzone w bazie chmurowej! Jeśli włączono potwierdzenie e-mail, sprawdź swoją skrzynkę pocztową.');
          }
        }

        store.registerUser({
          id: assignedId,
          displayName: displayName.trim(),
          email: email.trim(),
          approxLocation: chosenSector?.name || 'Stare Stawy',
          latitude: chosenSector?.lat,
          longitude: chosenSector?.lng,
          bio: bio.trim(),
        });
      } else {
        // Log in
        if (!email.trim()) {
          setError('Wprowadź adres e-mail.');
          setLoading(false);
          return;
        }
        if (!password.trim()) {
          setError('Wprowadź hasło.');
          setLoading(false);
          return;
        }

        // Jeśli Supabase jest podpięty, zaloguj w Supabase Auth
        const client = getSupabase();
        if (client) {
          const { error: sbError } = await client.auth.signInWithPassword({
            email: email.trim(),
            password: password,
          });

          if (sbError) {
            setError(`Błąd logowania w bazie chmurowej: ${sbError.message}`);
            setLoading(false);
            return;
          }
        }

        // Dopasuj użytkownika w pamięci/lokalnej bazie
        const allUsers = store.getAllUsers();
        const found = allUsers.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase().trim()
        );
        if (found) {
          store.switchDemoUser(found.id);
        } else {
          store.registerUser({
            displayName: email.split('@')[0],
            email: email.trim(),
            approxLocation: chosenSector?.name || 'Stare Stawy',
          });
        }
      }

      setLoading(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Wystąpił błąd podczas logowania.');
      setLoading(false);
    }
  };

  const handleSelectDemoUser = (userId: string) => {
    store.switchDemoUser(userId);
    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {mode === 'login' ? 'Witaj sąsiedzie!' : 'Dołącz do Starych Stawów'}
            </h2>
            <p className="text-xs text-emerald-200">
              {isSupabaseConfigured()
                ? 'Lokalna platforma mieszkańców Oświęcimia • Baza aktywna'
                : 'Lokalna platforma mieszkańców Oświęcimia'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 text-xs font-semibold">
          <button
            onClick={() => {
              setMode('login');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              mode === 'login'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Logowanie
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              mode === 'register'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Nowe konto mieszkańca
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Twoje imię lub pseudonim sąsiedzki *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="np. Marek, Agnieszka S., Tomasz"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Adres e-mail *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="twoj.email@poczta.pl"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Hasło *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 znaków"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
                    <span>Rejon / ulica na Starych Stawach</span>
                    <span className="text-[10px] text-emerald-700 font-normal">
                      Bezpieczna prywatność
                    </span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <select
                      value={sectorId}
                      onChange={(e) => setSectorId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                    >
                      {NEIGHBORHOOD_SECTORS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Nigdy nie podajemy dokładnego numeru domu ani klatki.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Krótko o sobie (opcjonalnie)
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="np. Mieszkam przy Zagrodowej od 4 lat, chętnie pożyczę narzędzia ogrodowe..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-start gap-2 pt-1 pb-1">
                  <input
                    type="checkbox"
                    id="termsCheckbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="termsCheckbox" className="text-[11px] text-slate-600 leading-tight cursor-pointer">
                    Akceptuję{' '}
                    <button
                      type="button"
                      onClick={() => setShowLegal('terms')}
                      className="text-emerald-700 underline font-medium hover:text-emerald-800"
                    >
                      Regulamin Osiedla
                    </button>{' '}
                    oraz{' '}
                    <button
                      type="button"
                      onClick={() => setShowLegal('privacy')}
                      className="text-emerald-700 underline font-medium hover:text-emerald-800"
                    >
                      Politykę Prywatności i RODO
                    </button>
                    . Wyrażam zgodę na przetwarzanie danych w celach bezpieczeństwa społeczności i kontaktu sąsiedzkiego.
                  </label>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-sm active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Przetwarzanie...' : mode === 'login' ? 'Zaloguj się' : 'Utwórz konto mieszkańca'}
            </button>
          </form>

          {/* Test Profiles Collapsible (useful during review / demo testing) */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowTestAccounts(!showTestAccounts)}
              className="w-full text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-between py-1 transition"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Konta podglądowe do szybkiego sprawdzenia</span>
              </span>
              {showTestAccounts ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {showTestAccounts && (
              <div className="grid grid-cols-2 gap-2 text-xs mt-2 animate-in fade-in duration-150">
                {DEMO_USERS.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectDemoUser(u.id)}
                    className="p-2 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-left transition flex items-center gap-2 group cursor-pointer"
                  >
                    <img
                      src={u.avatarUrl}
                      alt={u.displayName}
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-[11px] truncate group-hover:text-emerald-900">
                        {u.displayName}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {u.isAdmin ? 'Administrator' : u.id === 'user-marek-pro' ? 'Fachowiec' : 'Mieszkaniec'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <LegalModal
        isOpen={Boolean(showLegal)}
        type={showLegal}
        onClose={() => setShowLegal(null)}
      />
    </div>
  );
};
