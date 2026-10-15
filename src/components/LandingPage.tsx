import React from 'react';
import {
  Wrench,
  HeartHandshake,
  Gift,
  AlertTriangle,
  MessageCircle,
  Users,
  MapPin,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Eye,
  Download,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface LandingPageProps {
  onJoin: () => void;
  onExploreAsGuest: () => void;
  onOpenLegal: (type: 'privacy' | 'terms' | 'contact') => void;
  onOpenExport?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onJoin,
  onExploreAsGuest,
  onOpenLegal,
  onOpenExport,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between">
      {/* Top mini bar */}
      <header className="px-4 py-3 max-w-4xl mx-auto w-full flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </div>
          <span className="font-bold text-sm sm:text-base tracking-tight">Stare Stawy — Sąsiedzi</span>
        </div>
        <div className="flex items-center gap-2">
          <PWAInstallButton variant="compact" />
          <button
            onClick={onJoin}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-emerald-200"
          >
            Zaloguj
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col items-center text-center justify-center">
        {/* Neighborhood Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider mb-5">
          <MapPin className="w-3.5 h-3.5" />
          Osiedle Stare Stawy • Oświęcim
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
          STARE STAWY
          <span className="block text-emerald-400 mt-1">SĄSIEDZI</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 font-medium mb-2">
          Twoje osiedle. Twoi sąsiedzi. Jedno miejsce.
        </p>

        <p className="text-xs sm:text-sm text-slate-400 max-w-md italic mb-7">
          „Pożycz. Pomóż. Zapytaj. Oddaj. Dowiedz się, co dzieje się obok Ciebie.”
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mb-4">
          <button
            onClick={onJoin}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
          >
            <span>Dołącz do Starych Stawów</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onExploreAsGuest}
            className="flex-1 bg-white/10 hover:bg-white/15 text-white font-medium px-5 py-3 rounded-xl transition border border-white/10 active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>Przeglądaj tablicę</span>
          </button>
        </div>

        {/* Vercel Zip / Deployment Button */}
        <div className="mb-8">
          <button
            onClick={onOpenExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition active:scale-95 shadow-sm cursor-pointer"
            title="Pobierz gotowy projekt lub połącz z GitHub / Vercel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pobierz paczkę ZIP / Wdrożenie (Vercel)</span>
          </button>
        </div>

        {/* App Preview Showcase */}
        <div className="w-full max-w-lg mb-8 rounded-2xl overflow-hidden border border-white/15 shadow-2xl shadow-emerald-950/50 group relative">
          <img
            src="/preview.jpg"
            alt="Podgląd aplikacji Stare Stawy — Sąsiedzi"
            className="w-full h-auto object-cover transform group-hover:scale-102 transition duration-500"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none flex items-end p-4">
            <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-1 rounded-full backdrop-blur-xs">
              Platforma PWA • Gotowa do instalacji na telefonie i komputerze
            </span>
          </div>
        </div>

        {/* Key Features Grid */}
        <div className="w-full text-left bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 mb-8 backdrop-blur-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-4 text-center">
            CO MOŻESZ TU ZROBIĆ?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/5">
              <Wrench className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Pożyczyć coś od sąsiada</p>
                <p className="text-slate-400 text-xs">Wiertarka, drabina, myjka ciśnieniowa, przyczepka</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/5">
              <HeartHandshake className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Poprosić o pomoc</p>
                <p className="text-slate-400 text-xs">Wniesienie mebli, drobna naprawa, odebranie paczki</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/5">
              <Gift className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Oddać lub znaleźć rzecz</p>
                <p className="text-slate-400 text-xs">Ubranka dziecięce, książki, zgubione klucze</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Poinformować o ważnej sprawie</p>
                <p className="text-slate-400 text-xs">Utrudnienia drogowe, awaria prądu, zaginiony zwierzak</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/5">
              <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Porozmawiać 1:1</p>
                <p className="text-slate-400 text-xs">Bezpośredni, bezpieczny kontakt bez ujawniania numeru</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/5">
              <Users className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Znaleźć lokalnego fachowca</p>
                <p className="text-slate-400 text-xs">Sprawdzeni hydraulicy, elektrycy, mechanicy z okolicy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Why quotation */}
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/40 text-center max-w-md">
          <p className="text-xs uppercase font-bold tracking-wider text-emerald-400 mb-1">Dlaczego?</p>
          <p className="text-sm font-medium text-slate-200">
            „Bo czasami najlepsza pomoc jest 200 metrów od Ciebie.”
          </p>
        </div>

        <button
          onClick={onJoin}
          className="mt-6 text-emerald-400 hover:text-emerald-300 font-semibold text-xs underline underline-offset-4"
        >
          Dołącz bezpłatnie do mieszkańców
        </button>
      </main>

      {/* Footer legal and privacy */}
      <footer className="px-4 py-4 border-t border-white/10 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center gap-4 mb-2">
          <button onClick={() => onOpenLegal('privacy')} className="hover:text-slate-300 cursor-pointer">
            Polityka prywatności
          </button>
          <span>•</span>
          <button onClick={() => onOpenLegal('terms')} className="hover:text-slate-300 cursor-pointer">
            Regulamin
          </button>
          <span>•</span>
          <button onClick={() => onOpenLegal('contact')} className="hover:text-slate-300 cursor-pointer">
            Kontakt
          </button>
          {onOpenExport && (
            <>
              <span>•</span>
              <button onClick={onOpenExport} className="hover:text-emerald-400 text-slate-400 font-medium cursor-pointer">
                Pobierz ZIP / Vercel
              </button>
            </>
          )}
        </div>
        <p className="text-[11px] text-slate-500">
          Stare Stawy — Sąsiedzi. Chronimy Twoją prywatność: nigdy nie publikujemy dokładnego adresu ani współrzędnych.
        </p>
      </footer>
    </div>
  );
};
