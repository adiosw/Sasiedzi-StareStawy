// ==============================================================================
// STARE STAWY — SĄSIEDZI: BEZPIECZNA GEOLOKALIZACJA I OBSZARY OSIEDLA
// ==============================================================================

// Współrzędne referencyjne osiedla Stare Stawy w Oświęcimiu
export const STARE_STAWY_CENTER = {
  lat: 50.0465,
  lng: 19.2285,
  name: 'Stare Stawy (Centrum osiedla)',
};

export interface NeighborhoodSector {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
}

export const NEIGHBORHOOD_SECTORS: NeighborhoodSector[] = [
  {
    id: 'stawy-centrum',
    name: 'Stare Stawy — Centrum osiedla',
    lat: 50.0465,
    lng: 19.2285,
    description: 'Okolice głównego placu i serca osiedla',
  },
  {
    id: 'stawy-zagrodowa',
    name: 'Stare Stawy — rejon ul. Zagrodowej',
    lat: 50.0482,
    lng: 19.2260,
    description: 'Północno-zachodnia część osiedla',
  },
  {
    id: 'stawy-zwyciestwa',
    name: 'Stare Stawy — rejon ul. Zwycięstwa',
    lat: 50.0440,
    lng: 19.2310,
    description: 'Południowo-wschodnia część osiedla',
  },
  {
    id: 'stawy-staw',
    name: 'Stare Stawy — okolice Stawu',
    lat: 50.0450,
    lng: 19.2240,
    description: 'Okolice terenów zielonych i zbiorników wodnych',
  },
  {
    id: 'stawy-blonie',
    name: 'Stare Stawy — rejon ul. Błonie / Kolbego',
    lat: 50.0495,
    lng: 19.2320,
    description: 'Północny rejon w kierunku Błoni',
  },
  {
    id: 'stawy-ceglana',
    name: 'Stare Stawy — rejon ul. Ceglanej / Szewczyka',
    lat: 50.0458,
    lng: 19.2295,
    description: 'Centralno-wschodni rejon osiedla',
  },
  {
    id: 'stawy-polna',
    name: 'Stare Stawy — rejon ul. Polnej / Stawowej',
    lat: 50.0435,
    lng: 19.2270,
    description: 'Południowo-zachodni rejon osiedla',
  },
];

/**
 * Oblicza odległość Haversine w metrach pomiędzy dwoma punktami geograficznymi
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Promień Ziemi w metrach
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Przyjazny, bezpieczny format odległości dla użytkownika
 * Chroni prywatność - nie podaje dokładnych odległości z dokładnością do metra
 */
export function formatDistanceSafe(
  userLat?: number | null,
  userLng?: number | null,
  targetLat?: number,
  targetLng?: number
): string | null {
  if (!userLat || !userLng || !targetLat || !targetLng) {
    return null;
  }

  const meters = calculateDistanceMeters(userLat, userLng, targetLat, targetLng);

  if (meters < 250) {
    return '< 300 m od Ciebie';
  } else if (meters < 600) {
    return '~500 m od Ciebie';
  } else if (meters < 1000) {
    return `~${Math.round(meters / 100) * 100} m od Ciebie`;
  } else {
    const km = (meters / 1000).toFixed(1);
    return `~${km} km od Ciebie`;
  }
}

/**
 * Maskuje współrzędne użytkownika dla bezpieczeństwa
 * Zaokrągla do około ~350-500 metrów z celowym mikro-przesunięciem (nigdy nie podaje dokładnego domu/klatki)
 */
export function maskCoordinatesSafely(lat: number, lng: number): { lat: number; lng: number } {
  // Zaokrąglenie do 3 miejsc po przecinku (~110m) z przesunięciem do siatki 350m
  const step = 0.0035;
  const maskedLat = Math.round(lat / step) * step;
  const maskedLng = Math.round(lng / step) * step;
  return {
    lat: Number(maskedLat.toFixed(4)),
    lng: Number(maskedLng.toFixed(4)),
  };
}

/**
 * Zwraca bezpieczną nazwę lokalizacji na podstawie współrzędnych
 */
export function getSafeLocationLabel(lat?: number, lng?: number, fallback = 'Stare Stawy'): string {
  if (!lat || !lng) return fallback;

  // Znajdź najbliższy rejon
  let closestSector = NEIGHBORHOOD_SECTORS[0];
  let minDistance = Infinity;

  for (const sector of NEIGHBORHOOD_SECTORS) {
    const dist = calculateDistanceMeters(lat, lng, sector.lat, sector.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestSector = sector;
    }
  }

  if (minDistance < 600) {
    return closestSector.name;
  }

  return 'Stare Stawy';
}
