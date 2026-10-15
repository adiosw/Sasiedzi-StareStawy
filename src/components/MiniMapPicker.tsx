import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Compass } from 'lucide-react';
import { STARE_STAWY_CENTER, getSafeLocationLabel } from '../lib/geo';

interface MiniMapPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number, label: string) => void;
  accentColor?: 'emerald' | 'rose' | 'indigo' | 'amber';
}

export const MiniMapPicker: React.FC<MiniMapPickerProps> = ({
  latitude,
  longitude,
  onLocationChange,
  accentColor = 'emerald',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const initialLat = latitude || STARE_STAWY_CENTER.lat;
    const initialLng = longitude || STARE_STAWY_CENTER.lng;

    const map = L.map(containerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      minZoom: 13,
      maxZoom: 18,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    const pinIcon = L.divIcon({
      className: 'minimap-pin',
      html: `
        <div class="relative animate-bounce">
          <div class="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-emerald-500">
            <svg class="w-4.5 h-4.5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div class="w-2.5 h-2.5 bg-slate-900 rotate-45 mx-auto -mt-1 rounded-xs"></div>
        </div>
      `,
      iconSize: [32, 38],
      iconAnchor: [16, 36],
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      const label = getSafeLocationLabel(pos.lat, pos.lng);
      onLocationChange(pos.lat, pos.lng, label);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      const label = getSafeLocationLabel(lat, lng);
      onLocationChange(lat, lng, label);
    });

    markerRef.current = marker;
    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update marker position if latitude or longitude prop changes
  useEffect(() => {
    if (markerRef.current && mapRef.current && latitude && longitude) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapRef.current.panTo([latitude, longitude]);
    }
  }, [latitude, longitude]);

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1 font-medium text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>Wskaż na mapie Starych Stawów:</span>
        </span>
        <span>Przeciągnij lub kliknij</span>
      </div>
      <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-xs h-44 w-full">
        <div ref={containerRef} className="w-full h-full z-10" />
      </div>
      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span>Stare Stawy • Oświęcim</span>
        <span>
          Współrzędne: {latitude ? latitude.toFixed(4) : STARE_STAWY_CENTER.lat.toFixed(4)},{' '}
          {longitude ? longitude.toFixed(4) : STARE_STAWY_CENTER.lng.toFixed(4)}
        </span>
      </div>
    </div>
  );
};
