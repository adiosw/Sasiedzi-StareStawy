import React, { useState } from 'react';
import {
  X,
  Shield,
  Users,
  Flag,
  AlertTriangle,
  UserX,
  Trash2,
  ShieldCheck,
  Search,
  CheckCircle2,
  Database,
  Cloud,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Mail,
  Copy,
} from 'lucide-react';
import { store } from '../lib/store';
import { UserProfile, ReportItem, Post, AlertItem } from '../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'alerts' | 'posts' | 'database'>('reports');
  const [userSearch, setUserSearch] = useState('');

  // Supabase connection state
  const cloudConfig = store.getCloudStatus();
  const [sbUrl, setSbUrl] = useState(cloudConfig.url || '');
  const [sbKey, setSbKey] = useState(cloudConfig.anonKey || '');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!isOpen || !currentUser?.isAdmin) return null;

  const reports = store.getReports();
  const allUsers = store.getAllUsers();
  const alerts = store.getAlerts(true);
  const posts = store.getPosts();

  const handleToggleVerifyUser = (userId: string) => {
    const user = allUsers.find((u) => u.id === userId);
    if (!user) return;
    store.updateProfile({ isVerified: !user.isVerified });
  };

  const handleBlockUser = (userId: string) => {
    if (confirm('Czy na pewno chcesz zablokować tego użytkownika?')) {
      store.blockUser(userId);
    }
  };

  const handleResolveReport = (reportId: string, action: 'dismiss' | 'hide_content' | 'block_user') => {
    store.resolveReport(reportId, action);
  };

  const handleSaveCloudCredentials = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      await store.setCustomCloudCredentials(sbUrl, sbKey);
      const res = await store.checkCloudHealth();
      setTestResult(res);
      setActionNotice('Zapisano dane połączenia chmurowego!');
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Błąd testu połączenia.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await store.checkCloudHealth();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Błąd testu połączenia.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearForProduction = () => {
    if (
      confirm(
        '⚠️ UWAGA: CZY CHCESZ PRZEJŚĆ W TRYB CZYSTEGO STARTU OSIEDLA?\n\n' +
          'Spowoduje to usunięcie wszystkich testowych ogłoszeń, pożyczek, alertów i wiadomości demonstracyjnych.\n' +
          'Pozostanie wyłącznie oficjalny zweryfikowany profil "Rada Osiedla Stare Stawy" oraz oficjalny post powitalny dla prawdziwych sąsiadów.\n\n' +
          'Czy na pewno chcesz kontynuować?'
      )
    ) {
      store.clearForProduction();
      setActionNotice('Baza została wyczyszczona i jest gotowa na prawdziwych mieszkańców!');
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleResetToDemo = () => {
    if (confirm('Czy przywrócić domyślne wpisy wzorcowe osiedla do celów demonstracyjnych?')) {
      store.resetToDemo();
      setActionNotice('Przywrócono dane demonstracyjne osiedla.');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const handleExportBackup = () => {
    const json = store.exportDatabaseJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stare-stawy-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const ok = store.importDatabaseJson(reader.result as string);
        if (ok) {
          setActionNotice('Pomyślnie zaimportowano bazę danych z pliku JSON!');
          setTimeout(() => setActionNotice(null), 3000);
        } else {
          alert('Plik nie zawiera poprawnego formatu kopii zapasowej.');
        }
      } catch {
        alert('Błąd odczytu pliku JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Panel Moderatora i Administratora</h2>
              <p className="text-xs text-slate-400">Zarządzanie społecznością osiedla Stare Stawy</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {actionNotice && (
          <div className="bg-emerald-600 text-white text-xs px-4 py-2 font-medium flex items-center justify-between animate-in fade-in duration-150 shrink-0">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice(null)} className="text-white hover:opacity-80">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold px-4 pt-2 gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-3 border-b-2 rounded-t-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'reports'
                ? 'border-amber-600 text-amber-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>Zgłoszenia ({reports.filter((r) => r.status === 'pending').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-3 border-b-2 rounded-t-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'users'
                ? 'border-amber-600 text-amber-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Mieszkańcy ({allUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-2 px-3 border-b-2 rounded-t-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'alerts'
                ? 'border-amber-600 text-amber-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Alerty ({alerts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('posts')}
            className={`py-2 px-3 border-b-2 rounded-t-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'posts'
                ? 'border-amber-600 text-amber-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Ogłoszenia ({posts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`py-2 px-3 border-b-2 rounded-t-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'database'
                ? 'border-amber-600 text-amber-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-800 font-bold">Baza & Chmura</span>
          </button>
        </div>

        {/* Tab content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'reports' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Zgłoszenia naruszeń od sąsiadów
              </h3>

              {reports.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-800">Brak oczekujących zgłoszeń</p>
                  <p className="text-xs text-slate-500">Społeczność Starych Stawów zachowuje spokój!</p>
                </div>
              ) : (
                reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 uppercase text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded">
                        Zgłoszenie: {rep.targetType}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(rep.createdAt).toLocaleDateString('pl-PL')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700">
                      <strong>Powód:</strong> {rep.reason}
                    </p>
                    {rep.targetTitle && (
                      <p className="text-xs text-slate-500 italic">Dotyczy: „{rep.targetTitle}”</p>
                    )}

                    {rep.status === 'pending' ? (
                      <div className="flex gap-2 pt-2 border-t border-slate-100 text-xs">
                        <button
                          onClick={() => handleResolveReport(rep.id, 'dismiss')}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-medium text-slate-700"
                        >
                          Odrzuć
                        </button>
                        <button
                          onClick={() => handleResolveReport(rep.id, 'hide_content')}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                        >
                          Ukryj treść
                        </button>
                        <button
                          onClick={() => handleResolveReport(rep.id, 'block_user')}
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
                        >
                          Zablokuj autora
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-emerald-700 font-semibold">Rozpatrzone ({rep.status})</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-[11px] text-blue-900 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 text-blue-950 mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                  <span>Bezpieczeństwo & Identyfikacja mieszkańców</span>
                </p>
                Każdy rejestrujący się mieszkaniec ma zapisany swój adres e-mail i datę rejestracji w Twojej bazie Supabase (<code className="font-mono bg-blue-100 px-1 rounded">auth.users</code> oraz <code className="font-mono bg-blue-100 px-1 rounded">profiles</code>). W razie sporu sąsiedzkiego, nieoddania wypożyczonego sprzętu lub zapytań służb, masz pełny wgląd w dane kontaktowe poniżej.
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Szukaj po nazwisku lub e-mailu..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-2">
                {allUsers
                  .filter(
                    (u) =>
                      u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
                      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()))
                  )
                  .map((u) => (
                    <div
                      key={u.id}
                      className="p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs hover:border-slate-300 transition gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={u.avatarUrl}
                          alt={u.displayName}
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                            <span>{u.displayName}</span>
                            {u.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                            {u.isAdmin && (
                              <span className="text-[9px] bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-bold uppercase shrink-0">
                                Admin
                              </span>
                            )}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                            <span>{u.approxLocation}</span>
                            {u.email && (
                              <>
                                <span>•</span>
                                <span className="text-slate-700 font-mono font-medium flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  {u.email}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {u.email && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(u.email || '');
                              setActionNotice(`Skopiowano e-mail: ${u.email}`);
                              setTimeout(() => setActionNotice(null), 3000);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                            title="Kopiuj adres e-mail"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleVerifyUser(u.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                            u.isVerified
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {u.isVerified ? 'Zweryfikowany' : 'Weryfikuj'}
                        </button>
                        <button
                          onClick={() => handleBlockUser(u.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Zablokuj"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-3">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-900 truncate">{a.title}</p>
                    <p className="text-[11px] text-slate-500">
                      Status: <strong className="uppercase">{a.status}</strong> • {a.approxLocation}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {a.status === 'pending' && (
                      <button
                        onClick={() => store.approveAlert(a.id)}
                        className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold"
                      >
                        Zatwierdź
                      </button>
                    )}
                    <button
                      onClick={() => store.deleteAlert(a.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-3">
              {posts.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-900 truncate">{p.title}</p>
                    <p className="text-[11px] text-slate-400">
                      Autor: {p.author.displayName} ({p.category})
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Usunąć ogłoszenie?')) store.deletePost(p.id);
                    }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Database & Cloud Tab */}
          {activeTab === 'database' && (
            <div className="space-y-5 text-xs sm:text-sm">
              {/* Supabase status block */}
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-emerald-700" />
                    <h4 className="font-bold text-slate-900">Połączenie z bazą Supabase</h4>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                      store.isCloudConnected()
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        store.isCloudConnected() ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    {store.isCloudConnected() ? 'Skonfigurowana' : 'Tryb lokalny'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Supabase Project URL (np. https://xyz.supabase.co)
                    </label>
                    <input
                      type="text"
                      value={sbUrl}
                      onChange={(e) => setSbUrl(e.target.value)}
                      placeholder="https://twoj-projekt.supabase.co"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Supabase Anon Public API Key
                    </label>
                    <input
                      type="password"
                      value={sbKey}
                      onChange={(e) => setSbKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={handleSaveCloudCredentials}
                      disabled={isTesting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>{isTesting ? 'Zapisuję i testuję...' : 'Zapisz i połącz'}</span>
                    </button>

                    <button
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Testuj połączenie</span>
                    </button>

                    {cloudConfig.isCustom && (
                      <button
                        onClick={() => {
                          store.clearCustomCloudCredentials();
                          setSbUrl('');
                          setSbKey('');
                          setActionNotice('Zresetowano do zmiennych środowiskowych.');
                        }}
                        className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-xs"
                      >
                        Wyczyść zapisane klucze
                      </button>
                    )}
                  </div>

                  {testResult && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                        testResult.success
                          ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900'
                          : 'bg-red-50 border-red-200 text-red-800'
                      }`}
                    >
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <span>{testResult.message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Clean for Production Button */}
              <div className="p-4 rounded-2xl border border-amber-300/80 bg-amber-50/60 space-y-2">
                <div className="flex items-center gap-2 text-amber-950 font-bold">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <h4>Czysty Start Osiedla (Przejście na Produkcję)</h4>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Usuwa wszystkie wpisy testowe i demonstracyjne. Pozostawia wyłącznie zweryfikowany profil{' '}
                  <strong>Rada Osiedla Stare Stawy</strong> oraz oficjalny post powitalny. Idealne, gdy
                  uruchamiasz stronę dla prawdziwych mieszkańców osiedla!
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={handleClearForProduction}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Wyczyść bazę do produkcji</span>
                  </button>

                  <button
                    onClick={handleResetToDemo}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Przywróć dane wzorcowe</span>
                  </button>
                </div>
              </div>

              {/* Backup & Restore */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Database className="w-5 h-5 text-slate-700" />
                  <h4>Kopia zapasowa i Przywracanie (JSON)</h4>
                </div>
                <p className="text-xs text-slate-600">
                  Możesz w każdej chwili pobrać całą bazę osiedla do pliku JSON lub przywrócić ją na innym
                  urządzeniu/serwerze.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={handleExportBackup}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Pobierz kopię JSON</span>
                  </button>

                  <label className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer">
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>Wczytaj kopię JSON</span>
                    <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
