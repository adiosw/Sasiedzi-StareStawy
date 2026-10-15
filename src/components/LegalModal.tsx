import React from 'react';
import { X, ShieldCheck, FileText, Mail, MapPin } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  type: 'privacy' | 'terms' | 'contact' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  type,
  onClose,
}) => {
  if (!isOpen || !type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {type === 'privacy' ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            ) : type === 'terms' ? (
              <FileText className="w-5 h-5 text-emerald-400" />
            ) : (
              <Mail className="w-5 h-5 text-emerald-400" />
            )}
            <h3 className="font-bold text-base">
              {type === 'privacy'
                ? 'Polityka Prywatności i Ochrona Danych'
                : type === 'terms'
                ? 'Regulamin Społeczności Sąsiedzkiej'
                : 'Kontakt i Rada Osiedla'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs text-slate-700 space-y-4 leading-relaxed">
          {type === 'privacy' && (
            <>
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">
                  1. Zasada prywatności na Starych Stawach
                </h4>
                <p>
                  Aplikacja „Stare Stawy — Sąsiedzi” została zaprojektowana z myślą o maksymalnej ochronie prywatności mieszkańców Oświęcimia. Nigdy nie publikujemy Twojego dokładnego adresu zamieszkania, numeru domu ani numeru klatki.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">
                  2. Przybliżona geolokalizacja (Siatka bezpieczeństwa)
                </h4>
                <p>
                  Współrzędne geograficzne używane w aplikacji są automatycznie maskowane i zaokrąglane do obszaru o promieniu ok. 350–500 metrów lub przypisywane do ogólnego sektora osiedla (np. „okolice Stawu”, „rejon ul. Zagrodowej”). Inni użytkownicy widzą jedynie przybliżony dystans (np. „~300 m od Ciebie”).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">
                  3. Brak śledzenia i reklam zewnętrznych
                </h4>
                <p>
                  Platforma nie zawiera skryptów śledzących korporacji reklamowych, pikseli śledzących ani natrętnych reklam. Dane nie są odsprzedawane podmiotom trzecim.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">
                  4. Prawo do usunięcia konta (RODO)
                </h4>
                <p>
                  W każdej chwili w zakładce Profil możesz bezpowrotnie usunąć swoje konto wraz ze wszystkimi utworzonymi wpisami, wiadomościami i komentarzami.
                </p>
              </div>
            </>
          )}

          {type === 'terms' && (
            <>
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">
                  1. Cel platformy
                </h4>
                <p>
                  Aplikacja służy integracji i wzajemnej pomocy mieszkańców osiedla Stare Stawy w Oświęcimiu. Promujemy bezinteresowną pomoc sąsiedzką, pożyczanie narzędzi, informowanie o ważnych sprawach lokalnych oraz wspieranie rzetelnych lokalnych rzemieślników.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">
                  2. Kultura wypowiedzi i szacunek
                </h4>
                <p>
                  Wszystkich użytkowników obowiązuje zasada życzliwości i wzajemnego szacunku. Wszelkie przejawy hejtu, wulgaryzmów, nękania, ksenofobii lub publikowania fałszywych alarmów (fake news) skutkują natychmiastową blokadą konta.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">
                  3. Zasady pożyczalni sąsiedzkiej
                </h4>
                <p>
                  Sprzęt pożyczany od sąsiadów należy zwracać w stanie czystym, sprawnym i w ustalonym wspólnie terminie. W razie uszkodzenia pożyczający zobowiązany jest do porozumienia się z właścicielem w sprawie naprawy lub odkupienia sprzętu.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">
                  4. Moderacja
                </h4>
                <p>
                  Nad porządkiem na tablicy czuwają moderatorzy osiedla. Każdy mieszkaniec ma prawo zgłosić nieodpowiedni wpis.
                </p>
              </div>
            </>
          )}

          {type === 'contact' && (
            <div className="space-y-4">
              <p>
                Platforma społecznościowa mieszkańców osiedla Stare Stawy w Oświęcimiu. Masz pomysł na ulepszenie aplikacji lub chcesz pomóc w moderacji osiedla?
              </p>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-800">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="font-semibold">Osiedle Stare Stawy, 32-600 Oświęcim</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800">
                  <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>kontakt@starestawy-sasiedzi.pl</span>
                </div>
              </div>
              <p className="text-slate-500 text-[11px]">
                Projekt prowadzony pro publico bono dla mieszkańców osiedla Stare Stawy.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
          <button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 rounded-xl text-xs transition"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
