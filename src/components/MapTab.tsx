import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  AlertTriangle,
  HeartHandshake,
  Wrench,
  Megaphone,
  Plus,
  Navigation,
  Compass,
  Layers,
  Filter,
  Search,
  ExternalLink,
  MessageCircle,
  Eye,
  CheckCircle2,
  X,
  Maximize2,
  Minimize2,
  LocateFixed,
  Info,
  Calendar,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import {
  Post,
  AlertItem,
  HelpRequest,
  BorrowItem,
  UserProfile,
} from '../types';
import {
  STARE_STAWY_CENTER,
  NEIGHBORHOOD_SECTORS,
  getSafeLocationLabel,
  formatDistanceSafe,
  calculateDistanceMeters,
} from '../lib/geo';

export interface MapTabProps {
  posts: Post[];
  alerts: AlertItem[];
  helpRequests: HelpRequest[];
  borrowItems: BorrowItem[];
  currentUser: UserProfile | null;
  onOpenPost: (post: Post) => void;
  onOpenCreate: (
    type?: 'post' | 'help' | 'borrow' | 'alert',
    location?: { lat: number; lng: number; approxLocation?: string }
  ) => void;
  onStartChat: (targetUserId: string, initialMessage?: string) => void;
  onRequireAuth: () => void;
}

export type MapFilterType = 'all' | 'post' | 'alert' | 'help' | 'borrow';

interface UnifiedMapPin {
  id: string;
  type: 'post' | 'alert' | 'help' | 'borrow';
  title: string;
  description: string;
  categoryName: string;
  authorName: string;
  authorId: string;
  authorAvatar?: string;
  authorVerified: boolean;
  approxLocation: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  price?: number;
  isFree?: boolean;
  urgency?: string;
  status?: string;
  createdAt: string;
  rawItem: Post | AlertItem | HelpRequest | BorrowItem;
}

export const MapTab: React.FC<MapTabProps> = ({
  posts,
  alerts,
  helpRequests,
  borrowItems,
  currentUser,
  onOpenPost,
  onOpenCreate,
  onStartChat,
  onRequireAuth,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const newPinMarkerRef = useRef<L.Marker | null>(null);

  // Filters & Search
  const [filterType, setFilterType] = useState<MapFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapStyle, setMapStyle] = useState<'streets' | 'light' | 'satellite'>('streets');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Selected item on map (for bottom drawer preview)
  const [selectedPin, setSelectedPin] = useState<UnifiedMapPin | null>(null);

  // Newly placed pin by user for adding new announcement/alert
  const [newPin, setNewPin] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);

  // User GPS state
  const [userGps, setUserGps] = useState<{ lat: number; lng: number } | null>(
    currentUser && currentUser.latitude && currentUser.longitude
      ? { lat: currentUser.latitude, lng: currentUser.longitude }
      : null
  );
  const [isLocating, setIsLocating] = useState(false);
  const [isPinModeActive, setIsPinModeActive] = useState(false);

  // Compile all pins into a unified format
  const allPins = useMemo<UnifiedMapPin[]>(() => {
    const list: UnifiedMapPin[] = [];

    // 1. Posty (ogłoszenia)
    posts.forEach((p) => {
      if (p.status !== 'hidden' && p.latitude && p.longitude) {
        list.push({
          id: p.id,
          type: 'post',
          title: p.title,
          description: p.content,
          categoryName: p.category,
          authorName: p.author.displayName,
          authorId: p.userId,
          authorAvatar: p.author.avatarUrl,
          authorVerified: p.author.isVerified,
          approxLocation: p.approxLocation || 'Stare Stawy',
          latitude: p.latitude,
          longitude: p.longitude,
          imageUrl: p.imageUrl,
          price: p.price,
          isFree: p.isFree,
          status: p.status,
          createdAt: p.createdAt,
          rawItem: p,
        });
      }
    });

    // 2. Alerty
    alerts.forEach((a) => {
      if (a.latitude && a.longitude) {
        list.push({
          id: a.id,
          type: 'alert',
          title: a.title,
          description: a.description,
          categoryName: a.category,
          authorName: a.author.displayName,
          authorId: a.userId,
          authorAvatar: a.author.avatarUrl,
          authorVerified: a.author.isVerified,
          approxLocation: a.approxLocation || 'Stare Stawy',
          latitude: a.latitude,
          longitude: a.longitude,
          status: a.status,
          createdAt: a.createdAt,
          rawItem: a,
        });
      }
    });

    // 3. Pomoc sąsiedzka
    helpRequests.forEach((h) => {
      if (h.status === 'open' && h.latitude && h.longitude) {
        list.push({
          id: h.id,
          type: 'help',
          title: h.title,
          description: h.description,
          categoryName: h.category,
          authorName: h.author.displayName,
          authorId: h.userId,
          authorAvatar: h.author.avatarUrl,
          authorVerified: h.author.isVerified,
          approxLocation: h.approxLocation || 'Stare Stawy',
          latitude: h.latitude,
          longitude: h.longitude,
          urgency: h.urgency,
          status: h.status,
          createdAt: h.createdAt,
          rawItem: h,
        });
      }
    });

    // 4. Rzeczy do pożyczenia
    borrowItems.forEach((b) => {
      if (b.availability === 'available' && b.latitude && b.longitude) {
        list.push({
          id: b.id,
          type: 'borrow',
          title: b.name,
          description: b.description,
          categoryName: b.itemCategory || 'sprzęt',
          authorName: b.owner.displayName,
          authorId: b.userId,
          authorAvatar: b.owner.avatarUrl,
          authorVerified: b.owner.isVerified,
          approxLocation: b.approxLocation || 'Stare Stawy',
          latitude: b.latitude,
          longitude: b.longitude,
          imageUrl: b.imageUrl,
          status: b.availability,
          createdAt: b.createdAt,
          rawItem: b,
        });
      }
    });

    return list;
  }, [posts, alerts, helpRequests, borrowItems]);

  // Filtered pins
  const filteredPins = useMemo(() => {
    return allPins.filter((pin) => {
      if (filterType !== 'all' && pin.type !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = pin.title.toLowerCase().includes(q);
        const matchDesc = pin.description.toLowerCase().includes(q);
        const matchLoc = pin.approxLocation.toLowerCase().includes(q);
        const matchAuthor = pin.authorName.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchLoc && !matchAuthor) return false;
      }
      return true;
    });
  }, [allPins, filterType, searchQuery]);

  // Counts for each category
  const counts = useMemo(() => {
    return {
      all: allPins.length,
      post: allPins.filter((p) => p.type === 'post').length,
      alert: allPins.filter((p) => p.type === 'alert').length,
      help: allPins.filter((p) => p.type === 'help').length,
      borrow: allPins.filter((p) => p.type === 'borrow').length,
    };
  }, [allPins]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Centered at Stare Stawy, Oświęcim
    const map = L.map(mapContainerRef.current, {
      center: [STARE_STAWY_CENTER.lat, STARE_STAWY_CENTER.lng],
      zoom: 15,
      minZoom: 13,
      maxZoom: 18,
      zoomControl: false, // We use custom styled controls
    });

    // Custom attribution & tile layer
    const tileUrls = {
      streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    };

    const currentLayer = L.tileLayer(tileUrls[mapStyle], {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Stare Stawy Sąsiedzi',
      maxZoom: 19,
    }).addTo(map);

    // Layer group for pins
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Click on map to place pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const label = getSafeLocationLabel(lat, lng);
      setNewPin({ lat, lng, label });
      setSelectedPin(null);
    });

    mapInstanceRef.current = map;

    // Invalidate size to prevent grey tiles
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer if mapStyle changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const tileUrls = {
      streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    };

    // Remove old tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    L.tileLayer(tileUrls[mapStyle], {
      attribution:
        mapStyle === 'satellite'
          ? '&copy; Esri World Imagery | Stare Stawy'
          : '&copy; OpenStreetMap | Stare Stawy Sąsiedzi',
      maxZoom: 19,
    }).addTo(map);

    // Re-add markers layer to keep them on top
    if (markersLayerRef.current) {
      markersLayerRef.current.eachLayer((layer: any) => {
        if (typeof layer.bringToFront === 'function') {
          layer.bringToFront();
        }
      });
    }
  }, [mapStyle]);

  // Render markers whenever filteredPins changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    filteredPins.forEach((pin, index) => {
      // Offset slightly if pins share exact same lat/lng to prevent overlapping
      const jitterOffsetLat = ((index % 3) - 1) * 0.00008;
      const jitterOffsetLng = (((index + 1) % 3) - 1) * 0.00008;
      const finalLat = pin.latitude + jitterOffsetLat;
      const finalLng = pin.longitude + jitterOffsetLng;

      let iconHtml = '';
      let markerColorClass = '';
      let badgeLabel = '';

      switch (pin.type) {
        case 'alert':
          markerColorClass = 'bg-rose-600 text-white shadow-rose-600/40 border-rose-300';
          badgeLabel = 'Alert';
          iconHtml = `
            <div class="relative group cursor-pointer transition-transform hover:scale-115">
              <div class="w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 border-2 border-white ring-2 ring-rose-500/20">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <div class="w-2.5 h-2.5 bg-rose-700 rotate-45 mx-auto -mt-1 rounded-xs"></div>
              <span class="absolute -top-1 -right-1 flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-rose-600 border border-white"></span>
              </span>
            </div>
          `;
          break;

        case 'post':
          markerColorClass = 'bg-emerald-600 text-white shadow-emerald-600/40 border-emerald-300';
          badgeLabel = 'Ogłoszenie';
          iconHtml = `
            <div class="relative group cursor-pointer transition-transform hover:scale-115">
              <div class="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 border-2 border-white ring-2 ring-emerald-500/20">
                <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
                </svg>
              </div>
              <div class="w-2.5 h-2.5 bg-teal-800 rotate-45 mx-auto -mt-1 rounded-xs"></div>
            </div>
          `;
          break;

        case 'help':
          markerColorClass = 'bg-indigo-600 text-white shadow-indigo-600/40 border-indigo-300';
          badgeLabel = 'Pomoc';
          iconHtml = `
            <div class="relative group cursor-pointer transition-transform hover:scale-115">
              <div class="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-700 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 border-2 border-white ring-2 ring-indigo-500/20">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </div>
              <div class="w-2.5 h-2.5 bg-blue-800 rotate-45 mx-auto -mt-1 rounded-xs"></div>
            </div>
          `;
          break;

        case 'borrow':
          markerColorClass = 'bg-amber-600 text-white shadow-amber-600/40 border-amber-300';
          badgeLabel = 'Pożyczalnia';
          iconHtml = `
            <div class="relative group cursor-pointer transition-transform hover:scale-115">
              <div class="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/40 border-2 border-white ring-2 ring-amber-500/20">
                <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div class="w-2.5 h-2.5 bg-yellow-700 rotate-45 mx-auto -mt-1 rounded-xs"></div>
            </div>
          `;
          break;
      }

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: iconHtml,
        iconSize: [36, 42],
        iconAnchor: [18, 40],
        popupAnchor: [0, -38],
      });

      const marker = L.marker([finalLat, finalLng], { icon: customIcon });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedPin(pin);
        setNewPin(null);
        map.panTo([finalLat, finalLng], { animate: true });
      });

      markersLayer.addLayer(marker);
    });
  }, [filteredPins]);

  // Handle Newly Created / Dropped Pin on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (newPinMarkerRef.current) {
      map.removeLayer(newPinMarkerRef.current);
      newPinMarkerRef.current = null;
    }

    if (newPin) {
      const dropPinIcon = L.divIcon({
        className: 'new-pin-marker',
        html: `
          <div class="relative group cursor-pointer animate-bounce">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-white flex items-center justify-center shadow-xl shadow-sky-600/50 border-2 border-white ring-4 ring-sky-400/40">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div class="w-3 h-3 bg-blue-800 rotate-45 mx-auto -mt-1.5 rounded-xs"></div>
          </div>
        `,
        iconSize: [40, 46],
        iconAnchor: [20, 44],
      });

      const marker = L.marker([newPin.lat, newPin.lng], {
        icon: dropPinIcon,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', (e) => {
        const markerPos = marker.getLatLng();
        const label = getSafeLocationLabel(markerPos.lat, markerPos.lng);
        setNewPin({ lat: markerPos.lat, lng: markerPos.lng, label });
      });

      newPinMarkerRef.current = marker;
      map.panTo([newPin.lat, newPin.lng], { animate: true });
    }
  }, [newPin]);

  // User GPS position marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (userGps) {
      const userIcon = L.divIcon({
        className: 'user-gps-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-6 h-6 rounded-full bg-emerald-600 border-2 border-white shadow-md flex items-center justify-center text-white text-[10px]">
              <div class="w-2.5 h-2.5 rounded-full bg-white"></div>
            </div>
            <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-500 opacity-50"></span>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([userGps.lat, userGps.lng], { icon: userIcon }).addTo(map);
      userMarkerRef.current = marker;
    }
  }, [userGps]);

  // Center on Stare Stawy Center
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [STARE_STAWY_CENTER.lat, STARE_STAWY_CENTER.lng],
        15,
        { animate: true, duration: 0.8 }
      );
    }
  };

  // Center on user GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Twoja przeglądarka nie obsługuje geolokalizacji.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserGps({ lat, lng });
        setIsLocating(false);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 16, { animate: true });
        }
      },
      (err) => {
        setIsLocating(false);
        alert('Nie udało się ustalić pozycji GPS. Sprawdź uprawnienia w przeglądarce.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Trigger Create Modal with pre-selected location
  const handleCreateFromNewPin = (type: 'post' | 'alert' | 'help' | 'borrow') => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!newPin) return;

    onOpenCreate(type, {
      lat: newPin.lat,
      lng: newPin.lng,
      approxLocation: newPin.label,
    });
    setNewPin(null);
  };

  return (
    <div className={`space-y-3 pb-20 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-0 m-0 pb-0 flex flex-col' : ''}`}>
      {/* Top Banner & Control Bar */}
      {!isFullscreen && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center font-bold">
                  <MapPin className="w-4.5 h-4.5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Interaktywna Mapa Starych Stawów
                  </h2>
                  <p className="text-xs text-slate-500">
                    Sprawdź co dzieje się w okolicy lub kliknij na mapie, aby wskazać lokalizację ogłoszenia lub alertu.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Button to Add Pin */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!currentUser) {
                    onRequireAuth();
                    return;
                  }
                  // Set default center pin if not already placed
                  const centerLat = userGps?.lat || STARE_STAWY_CENTER.lat;
                  const centerLng = userGps?.lng || STARE_STAWY_CENTER.lng;
                  const label = getSafeLocationLabel(centerLat, centerLng);
                  setNewPin({ lat: centerLat, lng: centerLng, label });
                  setIsPinModeActive(true);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.panTo([centerLat, centerLng]);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-sm transition active:scale-95 ${
                  newPin
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>{newPin ? 'Przesuń pinezkę na mapie' : 'Zaznacz punkt na mapie'}</span>
              </button>
            </div>
          </div>

          {/* Category Filter Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Wszystkie</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                {counts.all}
              </span>
            </button>

            <button
              onClick={() => setFilterType('post')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                filterType === 'post'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/50'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Ogłoszenia</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/30 font-bold">
                {counts.post}
              </span>
            </button>

            <button
              onClick={() => setFilterType('alert')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                filterType === 'alert'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Alerty</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/30 font-bold">
                {counts.alert}
              </span>
            </button>

            <button
              onClick={() => setFilterType('help')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                filterType === 'help'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200/50'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Pomoc</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/30 font-bold">
                {counts.help}
              </span>
            </button>

            <button
              onClick={() => setFilterType('borrow')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                filterType === 'borrow'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/50'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Pożyczalnia</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/30 font-bold">
                {counts.borrow}
              </span>
            </button>
          </div>

          {/* Search bar inside map */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtruj pinezki po tytule, rejonie lub autorze..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Map Container Wrapper */}
      <div
        className={`relative overflow-hidden rounded-3xl border border-slate-200/90 shadow-sm ${
          isFullscreen ? 'flex-1 rounded-none border-none' : 'h-[520px] sm:h-[600px]'
        }`}
      >
        {/* Leaflet map DOM target */}
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Quick Action Overlay: Pin Dropped Mode */}
        {newPin && (
          <div className="absolute top-3 left-3 right-3 z-30 animate-in slide-in-from-top duration-200">
            <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <MapPin className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-blue-300 uppercase tracking-wider font-semibold">
                    Zaznaczono punkt na Starych Stawach
                  </p>
                  <p className="text-xs sm:text-sm font-bold truncate">
                    {newPin.label}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Współrzędne: {newPin.lat.toFixed(4)}, {newPin.lng.toFixed(4)} • Możesz przeciągać pinezkę
                  </p>
                </div>
              </div>

              {/* Action Buttons for this point */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
                <button
                  onClick={() => handleCreateFromNewPin('post')}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold whitespace-nowrap flex items-center gap-1 shadow-sm"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>+ Ogłoszenie</span>
                </button>
                <button
                  onClick={() => handleCreateFromNewPin('alert')}
                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold whitespace-nowrap flex items-center gap-1 shadow-sm"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>+ Alert</span>
                </button>
                <button
                  onClick={() => handleCreateFromNewPin('help')}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold whitespace-nowrap flex items-center gap-1 shadow-sm"
                >
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>+ Pomoc</span>
                </button>
                <button
                  onClick={() => setNewPin(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white"
                  title="Wyczyść zaznaczenie"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tip Badge: Click on map */}
        {!newPin && !selectedPin && (
          <div className="absolute top-3 left-3 z-20 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-md text-[11px] font-medium text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Kliknij w dowolne miejsce na mapie, aby dodać własną pinezkę</span>
            </div>
          </div>
        )}

        {/* Map Floating Tools (Right Side) */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
          {/* Locate User GPS */}
          <button
            onClick={handleLocateMe}
            className={`w-9 h-9 rounded-xl bg-white/95 backdrop-blur-md shadow-md border border-slate-200 flex items-center justify-center transition hover:bg-slate-50 text-slate-700 active:scale-95 ${
              isLocating ? 'animate-spin text-emerald-600' : ''
            }`}
            title="Moja lokalizacja GPS"
          >
            <LocateFixed className="w-4.5 h-4.5" />
          </button>

          {/* Recenter Stare Stawy */}
          <button
            onClick={handleRecenter}
            className="w-9 h-9 rounded-xl bg-white/95 backdrop-blur-md shadow-md border border-slate-200 flex items-center justify-center transition hover:bg-slate-50 text-slate-700 active:scale-95"
            title="Centrum Starych Stawów"
          >
            <Compass className="w-4.5 h-4.5 text-emerald-700" />
          </button>

          {/* Style Switcher (Streets / Satellite) */}
          <button
            onClick={() => {
              if (mapStyle === 'streets') setMapStyle('light');
              else if (mapStyle === 'light') setMapStyle('satellite');
              else setMapStyle('streets');
            }}
            className="w-9 h-9 rounded-xl bg-white/95 backdrop-blur-md shadow-md border border-slate-200 flex items-center justify-center transition hover:bg-slate-50 text-slate-700 active:scale-95"
            title={`Zmień styl mapy (teraz: ${mapStyle})`}
          >
            <Layers className="w-4.5 h-4.5 text-slate-700" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => {
              setIsFullscreen(!isFullscreen);
              setTimeout(() => {
                mapInstanceRef.current?.invalidateSize();
              }, 200);
            }}
            className="w-9 h-9 rounded-xl bg-white/95 backdrop-blur-md shadow-md border border-slate-200 flex items-center justify-center transition hover:bg-slate-50 text-slate-700 active:scale-95"
            title={isFullscreen ? 'Zamknij pełny ekran' : 'Pełny ekran'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4.5 h-4.5" />
            ) : (
              <Maximize2 className="w-4.5 h-4.5" />
            )}
          </button>
        </div>

        {/* Sector Quick Badges (Bottom Left Overlay) */}
        <div className="absolute bottom-3 left-3 z-20 hidden md:flex items-center gap-1 bg-white/90 backdrop-blur-md px-2 py-1 rounded-xl border border-slate-200/80 shadow-xs text-[10px] text-slate-600">
          <span className="font-semibold text-slate-800">Sektory:</span>
          {NEIGHBORHOOD_SECTORS.slice(0, 4).map((sec) => (
            <button
              key={sec.id}
              onClick={() => {
                mapInstanceRef.current?.flyTo([sec.lat, sec.lng], 16, { animate: true });
              }}
              className="px-1.5 py-0.5 rounded hover:bg-slate-100 font-medium text-slate-700 hover:text-emerald-700"
            >
              {sec.name.replace('Stare Stawy — ', '')}
            </button>
          ))}
        </div>

        {/* Selected Pin Bottom Drawer Preview */}
        {selectedPin && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-md z-30 animate-in slide-in-from-bottom duration-200">
            <div className="bg-white rounded-3xl p-4 shadow-2xl border border-slate-200/90 text-slate-900 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      selectedPin.type === 'alert'
                        ? 'bg-rose-100 text-rose-800'
                        : selectedPin.type === 'help'
                        ? 'bg-indigo-100 text-indigo-800'
                        : selectedPin.type === 'borrow'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {selectedPin.type === 'alert'
                      ? '⚠️ Alert osiedlowy'
                      : selectedPin.type === 'help'
                      ? '🤝 Pomoc sąsiedzka'
                      : selectedPin.type === 'borrow'
                      ? '🔧 Pożyczalnia'
                      : '🎁 Ogłoszenie'}
                  </span>

                  <span className="text-[11px] text-slate-400">
                    {formatDistanceSafe(
                      currentUser?.latitude,
                      currentUser?.longitude,
                      selectedPin.latitude,
                      selectedPin.longitude
                    ) || selectedPin.approxLocation}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedPin(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Description Preview */}
              <div className="flex gap-3">
                {selectedPin.imageUrl && (
                  <img
                    src={selectedPin.imageUrl}
                    alt={selectedPin.title}
                    className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-200"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                    {selectedPin.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                    {selectedPin.description}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                    <span className="font-medium text-slate-700">
                      {selectedPin.authorName}
                    </span>
                    {selectedPin.authorVerified && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                    )}
                    <span>• {selectedPin.approxLocation}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                {selectedPin.type === 'post' && (
                  <button
                    onClick={() => {
                      onOpenPost(selectedPin.rawItem as Post);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Zobacz ogłoszenie</span>
                  </button>
                )}

                {selectedPin.type !== 'post' && (
                  <button
                    onClick={() => {
                      onStartChat(
                        selectedPin.authorId,
                        `Cześć! Piszę w sprawie z mapy: "${selectedPin.title}"`
                      );
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Napisz do sąsiada</span>
                  </button>
                )}

                {/* External navigation */}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPin.latitude},${selectedPin.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 shrink-0"
                  title="Nawiguj do tego miejsca"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden xs:inline">Nawiguj</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Neighborhood Sectors Grid / List View below map */}
      {!isFullscreen && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Punkty w rejonach Starych Stawów ({filteredPins.length})
            </h3>
            <span className="text-[11px] text-slate-500">
              Kliknij rejon, aby przybliżyć widok
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {NEIGHBORHOOD_SECTORS.map((sec) => {
              const pinsInSector = allPins.filter((p) =>
                p.approxLocation.toLowerCase().includes(sec.name.toLowerCase().replace('stare stawy — ', ''))
              );
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    mapInstanceRef.current?.flyTo([sec.lat, sec.lng], 16, { animate: true });
                  }}
                  className="p-2.5 rounded-2xl border border-slate-200/80 hover:border-emerald-500/80 hover:bg-emerald-50/40 text-left transition group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-800 line-clamp-1">
                      {sec.name.replace('Stare Stawy — ', '')}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-800">
                      {pinsInSector.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {sec.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
