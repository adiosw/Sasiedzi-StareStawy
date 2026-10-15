import React, { useState } from 'react';
import { X, MapPin, Navigation, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { NEIGHBORHOOD_SECTORS, maskCoordinatesSafely, getSafeLocationLabel } from '../lib/geo';
import { store } from '../lib/store';
import { UserProfile } from '../types';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [selectedSectorId, setSelectedSectorId] = useState<string>(
    NEIGHBORHOOD_SECTORS.find((s) => s.name === currentUser?.approxLocation)?.id ||
      NEIGHBORHOOD_SECTORS[0].id
  );
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUseBrowserGPS = () => {
    if (!navigator.geolocation) {
      setGeoMessage('Twoja przeglądarka nie obsługuje geolokalizacji.');
      return;
    }

    setGeoLoading(true);
    setGeoMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const rawLat = pos.coords.latitude;
        const rawLng = pos.coords.longitude;
        // Bezpieczne maskowanie współrzędnych - zacieramy dokładny adres
        const masked = maskCoordinatesSafely(rawLat, rawLng);
        const safeName = getSafeLocationLabel(masked.lat, masked.lng);

        if (currentUser) {
          store.updateProfile({
            approxLocation: safeName,
            latitude: masked.lat,
            longitude: masked.lng,
          });
        }

        setGeoLoading(false);
        setGeoMessage(`Lokalizacja zaktualizowana bezpiecznie: ${safeName}`);
        setTimeout(() => onClose(), 1200);
      },
      (err) => {
        setGeoLoading(false);
        setGeoMessage('Nie udało się pobrać lokalizacji. Możesz wybrać swój rejon ręcznie poniżej.');
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  const handleSelectSector = (sector: typeof NEIGHBORHOOD_SECTORS[0]) => {
    setSelectedSectorId(sector.id);
    if (currentUser) {
      store.updateProfile({
        approxLocation: sector.name,
        latitude: sector.lat,
        longitude: sector.lng,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">Lokalizacja na Starych Stawach</h2>
              <p className="text-[11px] text-slate-300">Bezpieczna i przybliżona dla sąsiadów</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Privacy explanation */}
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-xs text-emerald-950 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <p>
              <strong>Ochrona prywatności:</strong> Nigdy nie publikujemy Twojego dokładnego adresu ani współrzędnych. Pokazujemy jedynie przybliżony sektor (np. „okolice Stawu”) lub bezpieczny dystans (np. „~300 m od Ciebie”).
            </p>
          </div>

          {/* Browser Geolocation Button */}
          <button
            onClick={handleUseBrowserGPS}
            disabled={geoLoading}
            className="w-full p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition flex items-center gap-3 group active:scale-98"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center text-slate-700 transition">
              <Navigation className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-xs text-slate-900">Użyj geolokalizacji z telefonu</p>
              <p className="text-[11px] text-slate-500">
                {geoLoading ? 'Pobieranie sygnału GPS...' : 'Automatycznie dopasuj rejon osiedla'}
              </p>
            </div>
          </button>

          {geoMessage && (
            <div className="p-2.5 rounded-xl bg-slate-100 text-xs text-slate-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{geoMessage}</span>
            </div>
          )}

          {/* Manual sector selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Lub wskaż swój rejon ręcznie:
            </label>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {NEIGHBORHOOD_SECTORS.map((sector) => {
                const isSelected =
                  sector.id === selectedSectorId ||
                  sector.name === currentUser?.approxLocation;
                return (
                  <button
                    key={sector.id}
                    onClick={() => handleSelectSector(sector)}
                    className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="text-xs">{sector.name}</p>
                      <p className="text-[10px] text-slate-400 font-normal">{sector.description}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 rounded-xl text-xs transition"
          >
            Gotowe
          </button>
        </div>
      </div>
    </div>
  );
};
