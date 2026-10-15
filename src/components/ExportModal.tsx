import React, { useState } from 'react';
import {
  X,
  Download,
  Github,
  Database,
  Cloud,
  Copy,
  Check,
  ShieldCheck,
  Terminal,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Share2,
  FileText,
  Image as ImageIcon,
  Rocket,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { store } from '../lib/store';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'launch' | 'deploy' | 'supabase' | 'zip'>('launch');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedFb, setCopiedFb] = useState(false);
  const [copiedWa, setCopiedWa] = useState(false);
  const [copiedPoster, setCopiedPoster] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [loadingSql, setLoadingSql] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Supabase quick connect
  const cloudConfig = store.getCloudStatus();
  const [sbUrl, setSbUrl] = useState(cloudConfig.url || '');
  const [sbKey, setSbKey] = useState(cloudConfig.anonKey || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const isClean = store.isCleanProductionMode();

  const directZipUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/stare-stawy-sasiedzi.zip`
      : '/stare-stawy-sasiedzi.zip';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(directZipUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      const input = document.createElement('input');
      input.value = directZipUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const copyToClipboard = async (text: string, setFn: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setFn(true);
      setTimeout(() => setFn(false), 2500);
    } catch {
      const input = document.createElement('textarea');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setFn(true);
      setTimeout(() => setFn(false), 2500);
    }
  };

  const handleBlobDownload = async () => {
    try {
      setDownloading(true);
      setDownloadError(null);
      const res = await fetch('/stare-stawy-sasiedzi.zip');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'stare-stawy-sasiedzi.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setDownloadError(
        'Przeglądarka zablokowała pobieranie wewnątrz ramki podglądu. Skorzystaj z opcji „Kopiuj link do nowej karty” i wklej go bezpośrednio w pasku przeglądarki!'
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleCopySql = async () => {
    try {
      setLoadingSql(true);
      const res = await fetch('/supabase-schema.sql');
      if (!res.ok) throw new Error('Nie udało się pobrać pliku SQL');
      const sqlText = await res.text();
      await copyToClipboard(sqlText, setCopiedSql);
      setNotice('✅ Skopiowano kompletny kod SQL (tabele, RLS, Storage)! Wklej go w Supabase SQL Editor.');
      setTimeout(() => setNotice(null), 4000);
    } catch {
      setNotice('⚠️ Błąd kopiowania. Możesz pobrać plik SQL bezpośrednio przyciskiem obok.');
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setLoadingSql(false);
    }
  };

  const handleDownloadSql = () => {
    const a = document.createElement('a');
    a.href = '/supabase-schema.sql';
    a.download = 'caly_projekt_supabase_stare_stawy.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSaveAndTestSupabase = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await store.setCustomCloudCredentials(sbUrl, sbKey);
      const res = await store.checkCloudHealth();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Błąd testu połączenia.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSetCleanProduction = () => {
    if (
      confirm(
        '🚀 CZY CHCESZ WŁĄCZYĆ CZYSTY START OSIEDLA?\n\n' +
          'Spowoduje to usunięcie wszystkich testowych ogłoszeń, pożyczek i wiadomości.\n' +
          'Pozostanie oficjalny profil "Rada Osiedla Stare Stawy", oficjalny post powitalny z banerem promocyjnym oraz numery alarmowe.\n\n' +
          'Baza będzie czysta i gotowa na pierwszych prawdziwych mieszkańców!'
      )
    ) {
      store.clearForProduction();
      setNotice('Baza została wyczyszczona i jest gotowa na oficjalny start osiedla!');
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleResetDemo = () => {
    if (confirm('Czy przywrócić przykładowe wpisy demonstracyjne osiedla do prezentacji?')) {
      store.resetToDemo();
      setNotice('Przywrócono przykładowe dane demonstracyjne.');
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const promoFbText = `Cześć Sąsiedzi! 🏡👋
Wystartowała nasza lokalna platforma sąsiedzka dla mieszkańców osiedla Stare Stawy w Oświęcimiu!
👉 Sprawdź tutaj: https://starestawy.pl (lub link wdrożenia Vercel)

Po co powstała nasza tablica?
• Pożyczajmy sprzęt: zamiast kupować wiertarkę, kosiarkę czy drabinę na jeden raz – pożyczajmy bezpiecznie od sąsiadów z sąsiedniej klatki czy ulicy!
• Wymiana i oddawanie: meble, sadzonki, zabawki, książki – za 0 zł lub po sąsiedzku.
• Wzajemna pomoc: wniesienie mebli, drobne naprawy, opieka nad zwierzakami.
• Alerty i fachowcy: szybkie informacje o awariach oraz polecani, sprawdzeni fachowcy z Oświęcimia.

Platforma działa w każdej przeglądarce i można ją zainstalować na telefonie jako aplikację (PWA) w kilka sekund!
Dołączcie i dodajcie swoje pierwsze ogłoszenie:`;

  const promoWaText = `Cześć! Ruszyła platforma dla mieszkańców osiedla Stare Stawy w Oświęcimiu: https://starestawy.pl 🏡 Można tam bezpłatnie pożyczać sprzęty od sąsiadów, oddawać niepotrzebne rzeczy, prosić o pomoc i sprawdzać lokalne sprawy. Działa bezpośrednio na telefonie!`;

  const promoPosterText = `================================================
          STARE STAWY — SĄSIEDZI 🏡
================================================
DRODZY SĄSIEDZI!
Dla mieszkańców naszego osiedla uruchomiliśmy bezpłatną
platformę sąsiedzkiej współpracy:

🌐 Adres strony: https://starestawy.pl

CO ZNAJDZIESZ NA PLATFORMIE:
✓ Sąsiedzka pożyczalnia sprzętu (kosiarki, drabiny, narzędzia)
✓ Oddam za darmo / wymiana rzeczy bez pośredników
✓ Szybka pomoc sąsiedzka i wolontariat
✓ Ważne numery alarmowe oraz sprawdzeni lokalni fachowcy

Aplikacja jest w 100% bezpieczna, bez reklam i chroni
prywatność (nie publikuje dokładnego numeru domu).
Można ją zainstalować na telefonie jednym kliknięciem!

Zapraszamy do wspólnego budowania zgranej społeczności!
— Rada Osiedla i Sąsiedzi Starych Stawów
================================================`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 text-slate-900 overflow-hidden">
        {/* Header */}
        <div className="bg-white px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">Start Osiedla & Wdrożenie</h2>
              <p className="text-xs text-slate-500">Materiały promocyjne, czysta baza i instrukcja Vercel / GitHub</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-2 gap-1 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('launch')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'launch'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pakiet Startowy & Baner OG</span>
          </button>
          <button
            onClick={() => setActiveTab('deploy')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'deploy'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Github className="w-3.5 h-3.5 text-slate-700" />
            <span>Wdrożenie Vercel & GitHub</span>
          </button>
          <button
            onClick={() => setActiveTab('supabase')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'supabase'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Baza Supabase (SQL & Tabele)</span>
          </button>
          <button
            onClick={() => setActiveTab('zip')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'zip'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Pobierz ZIP</span>
          </button>
        </div>

        {notice && (
          <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 flex items-center gap-2 shrink-0 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* TAB 1: LAUNCH & PROMO BANNER */}
          {activeTab === 'launch' && (
            <div className="space-y-4">
              {/* Promotional Banner Preview */}
              <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-md border border-slate-800">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-sm text-white">Oficjalny Baner Promocyjny (ImageOG)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-400/30">
                    1376 × 768 px
                  </span>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-slate-700/80 mb-3 shadow-inner bg-slate-950">
                  <img
                    src="/banner-promocyjny.jpg"
                    alt="Baner promocyjny Stare Stawy Sąsiedzi"
                    className="w-full h-auto object-cover max-h-56 sm:max-h-64"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center justify-between text-[11px] text-slate-300 border border-slate-700/60">
                    <span>Zapisany w <code>/og-image.jpg</code> i <code>/banner-promocyjny.jpg</code></span>
                    <a
                      href="/banner-promocyjny.jpg"
                      download="stare-stawy-baner-promocyjny.jpg"
                      className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Pobierz JPG
                    </a>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Ten baner automatycznie wyświetla się jako karta podglądu (OpenGraph) po wklejeniu linku na Facebooku, Messengerze, WhatsAppie oraz iMessage!
                </p>
              </div>

              {/* Clean Production Database Switcher */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <h3 className="font-bold text-slate-900 text-sm">Stan bazy danych pod oficjalny start osiedla</h3>
                  </div>
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isClean ? 'bg-emerald-200 text-emerald-950' : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {isClean ? '🚀 Czysta Baza (Gotowa na start)' : '📊 Wersja Demonstracyjna'}
                  </span>
                </div>

                <p className="text-xs text-slate-700 mb-3 leading-relaxed">
                  Przed wpuszczeniem pierwszych sąsiadów na osiedle możesz za 1 kliknięciem wyczyścić wszystkie testowe wpisy, pożyczki i wiadomości. Pozostanie wyłącznie oficjalny wpis powitalny z banerem od <strong>Rady Osiedla Stare Stawy</strong> oraz numery alarmowe.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleSetCleanProduction}
                    className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 px-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-xs cursor-pointer"
                  >
                    <Rocket className="w-4 h-4" />
                    <span>Włącz Czysty Start Osiedla</span>
                  </button>
                  <button
                    onClick={handleResetDemo}
                    className="bg-white hover:bg-slate-100 text-slate-700 font-semibold py-2.5 px-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-slate-300 active:scale-95 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Przywróć dane demo</span>
                  </button>
                </div>
              </div>

              {/* Ready-to-use Promotion Copy */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <span>Gotowe teksty do zapraszania mieszkańców</span>
                </div>

                {/* FB Post */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-800 flex items-center gap-1">
                      <Share2 className="w-3.5 h-3.5 text-blue-600" />
                      Post na Grupę Osiedlową Facebook
                    </span>
                    <button
                      onClick={() => copyToClipboard(promoFbText, setCopiedFb)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedFb ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedFb ? 'Skopiowano!' : 'Kopiuj treść'}</span>
                    </button>
                  </div>
                  <pre className="text-[11px] font-sans text-slate-600 whitespace-pre-wrap bg-slate-50 p-2 rounded-lg border border-slate-100 max-h-24 overflow-y-auto">
                    {promoFbText}
                  </pre>
                </div>

                {/* WhatsApp */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-800 flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Wiadomość na WhatsApp / Messenger
                    </span>
                    <button
                      onClick={() => copyToClipboard(promoWaText, setCopiedWa)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedWa ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedWa ? 'Skopiowano!' : 'Kopiuj treść'}</span>
                    </button>
                  </div>
                  <pre className="text-[11px] font-sans text-slate-600 whitespace-pre-wrap bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {promoWaText}
                  </pre>
                </div>

                {/* Printable Staircase Notice */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-800 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      Ogłoszenie na tablicę / klatkę schodową (do druku)
                    </span>
                    <button
                      onClick={() => copyToClipboard(promoPosterText, setCopiedPoster)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedPoster ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPoster ? 'Skopiowano!' : 'Kopiuj tekst'}</span>
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono text-slate-600 whitespace-pre-wrap bg-slate-50 p-2 rounded-lg border border-slate-100 max-h-24 overflow-y-auto">
                    {promoPosterText}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEPLOYMENT (VERCEL & GITHUB) */}
          {activeTab === 'deploy' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white rounded-2xl p-4.5 shadow-md border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Github className="w-5 h-5" />
                  <span>Co jest potrzebne do uruchomienia aplikacji w sieci?</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Aplikacja jest <strong>w 100% gotowa</strong> do działania w modelu produkcyjnym. Aby udostępnić ją sąsiadom pod własnym adresem WWW z certyfikatem SSL, potrzebujesz zaledwie <strong>dwóch bezpłatnych kont</strong>:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2 font-semibold text-xs text-white mb-1">
                      <Github className="w-4 h-4 text-emerald-400" />
                      <span>1. Konto GitHub (Bezpłatne)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Służy jako bezpieczny skarbiec na kod źródłowy aplikacji. Zakłada się je w 30 sekund na <code>github.com</code>.
                    </p>
                  </div>

                  <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2 font-semibold text-xs text-white mb-1">
                      <Cloud className="w-4 h-4 text-teal-400" />
                      <span>2. Konto Vercel (Bezpłatne)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Automatycznie hostuje aplikację z darmowym SSL, globalnym CDN i subdomeną <code>.vercel.app</code>. Logowanie 1 kliknięciem przez GitHub.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step by step guide */}
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-600" />
                  <span>Instrukcja wdrożenia krok po kroku (3 minuty)</span>
                </h3>

                <ol className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-900">Pobierz paczkę ZIP lub wypchnij kod na GitHub</strong>
                      <p className="text-slate-600 mt-0.5">
                        Pobierz gotowe archiwum <code>stare-stawy-sasiedzi.zip</code> (z zakładki „Pobierz ZIP”) i rozpakuj je na komputerze, a następnie wyślij do swojego repozytorium GitHub:
                      </p>
                      <pre className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg font-mono text-[11px] mt-1.5 select-all overflow-x-auto">
{`git init
git add .
git commit -m "Start osiedla Stare Stawy"
git branch -M main
git remote add origin https://github.com/TWOJ_LOGIN/stare-stawy.git
git push -u origin main`}
                      </pre>
                    </div>
                  </li>

                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-900">Połącz repozytorium w Vercel</strong>
                      <p className="text-slate-600 mt-0.5">
                        Wejdź na <code>vercel.com</code>, kliknij <strong>Add New... ➔ Project</strong> i wybierz utworzone repozytorium. Vercel sam wykryje Vite, ustawi build <code>npm run build</code> i folder <code>dist</code>.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </span>
                    <div>
                      <strong className="text-slate-900">Kliknij „Deploy” i ciesz się działającą platformą!</strong>
                      <p className="text-slate-600 mt-0.5">
                        Po około 40 sekundach strona jest online! W zakładce <em>Settings ➔ Domains</em> możesz podpiąć własną domenę (np. <code>starestawy.pl</code>) lub używać bezpłatnej domeny Vercel.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Direct GitHub Push through assistant */}
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>Opcja: Chcesz, żebym bezpośrednio wysłał kod na Twój GitHub?</span>
                </div>
                <p className="leading-relaxed">
                  Jeśli wolisz, żebym to ja za Ciebie automatycznie wypchnął cały projekt do Twojego GitHuba, napisz w czacie:
                </p>
                <ul className="list-disc list-inside space-y-0.5 ml-1 font-medium">
                  <li>Adres pustego repozytorium na Twoim koncie GitHub</li>
                  <li>Twój <strong>GitHub Personal Access Token (classic z uprawnieniem repo)</strong></li>
                </ul>
                <p className="text-[11px] text-amber-800 pt-0.5">
                  Wtedy jednym poleceniem wyślę kod, a Vercel natychmiast go zbuduje!
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SUPABASE & SQL */}
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              {/* Header Box */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                    <Database className="w-4 h-4 text-emerald-700" />
                    <span>Gotowa Baza Supabase (SQL & Tabele w 1 Kliknięcie)</span>
                  </div>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      store.isCloudConnected() ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {store.isCloudConnected() ? 'Połączona z chmurą' : 'Tryb Lokalny'}
                  </span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Cały schemat bazy jest już <strong>w 100% przygotowany</strong>. Zawiera kompletne 11 tabel (ogłoszenia, pożyczalnia, alerty, pomoc sąsiedzka, fachowcy z Oświęcimia, czat 1:1, zgłoszenia), automatyczny trigger rejestracji użytkowników, reguły bezpieczeństwa RLS oraz magazyn plików (Storage Bucket).
                </p>

                {/* SQL One-click Buttons */}
                <div className="flex flex-col sm:flex-row gap-2.5 mt-3 pt-3 border-t border-emerald-200/70">
                  <button
                    onClick={handleCopySql}
                    disabled={loadingSql}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 text-xs cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {copiedSql ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>{copiedSql ? 'Skopiowano kod SQL do schowka!' : 'Kopiuj kompletny kod SQL'}</span>
                  </button>

                  <button
                    onClick={handleDownloadSql}
                    className="bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 text-xs cursor-pointer shadow-xs"
                  >
                    <Download className="w-4 h-4 text-emerald-700" />
                    <span>Pobierz plik .sql</span>
                  </button>
                </div>
              </div>

              {/* 3 Steps Guide */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <Terminal className="w-3.5 h-3.5 text-slate-700" />
                  <span>Jak uruchomić w Supabase w 30 sekund:</span>
                </h4>

                <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    Wejdź na{' '}
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:underline font-semibold inline-flex items-center gap-0.5"
                    >
                      supabase.com <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    i utwórz nowy darmowy projekt (np. nazwa: <em>Stare Stawy</em>).
                  </li>
                  <li>
                    W menu po lewej kliknij <strong>SQL Editor</strong> ➔ <strong>New query</strong> ➔ wklej skopiowany kod SQL ➔ kliknij zielony przycisk <strong>Run</strong> (Ctrl + Enter).
                  </li>
                  <li>
                    Gotowe! Wszystkie tabele, relacje i uprawnienia powstaną w 3 sekundy.
                  </li>
                </ol>
              </div>

              {/* Connection Credentials Form */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-2 font-semibold text-slate-900 text-xs">
                  <Cloud className="w-4 h-4 text-emerald-600" />
                  <span>Podłącz bazę do tej aplikacji (lub wpisz na Vercel):</span>
                </div>

                <div className="space-y-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                      Project URL (z Supabase ➔ Project Settings ➔ API)
                    </label>
                    <input
                      type="text"
                      value={sbUrl}
                      onChange={(e) => setSbUrl(e.target.value)}
                      placeholder="https://twoj-projekt.supabase.co"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                      Anon Public API Key (anon / public)
                    </label>
                    <input
                      type="password"
                      value={sbKey}
                      onChange={(e) => setSbKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <button
                    onClick={handleSaveAndTestSupabase}
                    disabled={testing}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                    <span>{testing ? 'Weryfikacja bazy...' : 'Zapisz i połącz z bazą Supabase'}</span>
                  </button>

                  {testResult && (
                    <div
                      className={`p-2 rounded-xl text-xs flex items-start gap-1.5 border ${
                        testResult.success
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
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

              {/* Chat assistance alternative */}
              <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 text-amber-950 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>Chcesz, żebym to ja wgrał tabele bezpośrednio do Twojej bazy?</span>
                </div>
                <p className="leading-relaxed">
                  Jeśli masz już utworzony projekt w Supabase i nie chcesz sam klikać w SQL Editor, podaj mi w czacie:
                </p>
                <ul className="list-disc list-inside space-y-0.5 ml-1 font-mono text-[11px]">
                  <li>Connection String (URI) z <em>Project Settings ➔ Database</em></li>
                  <li>LUB Project URL + service_role secret key z <em>Project Settings ➔ API</em></li>
                </ul>
                <p className="text-[11px] text-amber-800 pt-0.5">
                  Wtedy uruchomię migrację przez terminal i automatycznie utworzę wszystkie tabele za Ciebie!
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: ZIP ARCHIVE */}
          {activeTab === 'zip' && (
            <div className="space-y-4">
              {/* ZIP Download Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 mb-2 font-semibold text-slate-900">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Kompletne archiwum ZIP ze wszystkimi plikami</span>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  Paczka zawiera cały kod źródłowy, grafiki, baner promocyjny, konfigurację Vite, Tailwind CSS v4, PWA oraz skrypty SQL do bazy danych.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 text-xs cursor-pointer shadow-xs"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Skopiowano adres ZIP!' : 'Kopiuj link do nowej karty'}</span>
                  </button>

                  <button
                    onClick={handleBlobDownload}
                    disabled={downloading}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 text-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{downloading ? 'Pobieranie...' : 'Wymuś pobranie pliku'}</span>
                  </button>
                </div>

                {downloadError && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-2">
                    {downloadError}
                  </p>
                )}

                <div className="text-[11px] text-slate-500 font-mono break-all bg-white p-2.5 rounded-lg border border-slate-200 select-all">
                  {directZipUrl}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            100% zgodne z PWA, RODO i gotowe do wdrożenia
          </span>
          <button
            onClick={onClose}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
