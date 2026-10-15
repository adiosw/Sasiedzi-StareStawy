import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'banner' | 'compact' }> = ({
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedNotice, setInstalledNotice] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setInstalledNotice(true);
      setTimeout(() => setInstalledNotice(false), 4000);
    }
  };

  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div className="bg-emerald-800 text-white px-4 py-2.5 rounded-xl shadow-md flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-emerald-300 shrink-0" />
            <div>
              <p className="font-semibold text-xs sm:text-sm">Zainstaluj jako aplikację</p>
              <p className="text-[11px] text-emerald-200">Szybki dostęp na telefonie z ekranu głównego</p>
            </div>
          </div>
          <button
            onClick={handleInstall}
            className="bg-white text-emerald-900 font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-50 transition active:scale-95 shadow-sm shrink-0"
          >
            Zainstaluj
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleInstall}
        title="Zainstaluj aplikację na telefonie lub komputerze"
        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-medium transition shadow-sm active:scale-95"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Zainstaluj PWA</span>
        <span className="sm:hidden">Instaluj</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-600/30 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-3 py-1.5 text-xs font-medium transition active:scale-95"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
          <span>Dodaj do ekranu</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">Instalacja na iOS (Safari)</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 my-4">
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 text-[10px]">
                    1
                  </span>
                  <p>Kliknij ikonę <strong>Udostępnij</strong> (kwadrat ze strzałką w górę) na dolnym pasku przeglądarki Safari.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 text-[10px]">
                    2
                  </span>
                  <p>Przewiń menu w dół i wybierz opcję <strong>„Do ekranu początkowego”</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 text-[10px]">
                    3
                  </span>
                  <p>W prawym górnym rogu kliknij <strong>„Dodaj”</strong>. Gotowe!</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                Rozumiem
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-amber-600 px-4 py-1.5 text-xs font-medium text-white shadow-lg animate-pulse">
      <span className="h-2 w-2 rounded-full bg-white" />
      <span>Tryb offline — korzystasz z zapisanych danych</span>
    </div>
  );
};
