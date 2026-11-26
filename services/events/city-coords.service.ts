import { unstable_cache } from 'next/cache';

import { toDisplayCity } from './all-events.service';

/*
 * City positions for the All Events Map (LAB-3321, design D3). They exist only on `GET /v1/irl/locations`: one row per
 * gathering, 1.5–2.6 MB because each row carries its events, and slow. Only the Map view asks for them, through
 * `GET /api/events/city-coords`, and the small result is cached for a day.
 */

/** `[lat, lng]` by city key (the lower-cased display city, as `AllEventsItem.cityKey`). */
export type CityCoords = Record<string, [number, number]>;

/**
 * Cities whose stored position is wrong (checked 2026-11-19 on dev's copy): Berlin sits in Düsseldorf, Lisbon in
 * Virginia, Healdsburg in Argentina, Colorado in Chicago and California at Singapore's longitude. San Francisco
 * (LAB-3444) is pinned to its city point, so its events show on the map. Add any city found wrong in review.
 */
export const CITY_COORD_FIXES: CityCoords = {
  berlin: [52.52, 13.405],
  lisbon: [38.7223, -9.1393],
  healdsburg: [38.6102, -122.8694],
  colorado: [39.7392, -104.9903],
  california: [36.7783, -119.4179],
  'san francisco': [37.7749, -122.4194],
};

/**
 * One coordinate from the API: a number, a number string ("-34.60") or a hemisphere form ("15.8700° N",
 * "122.4194° W"). Null when it doesn't parse, is out of range, or names the other axis's hemisphere.
 */
export function parseCoord(value: unknown, axis: 'lat' | 'lng'): number | null {
  let n: number;
  if (typeof value === 'number') {
    n = value;
  } else if (typeof value === 'string') {
    const match = /^\s*(-?\d+(?:\.\d+)?)\s*°?\s*([NSEW])?\s*$/i.exec(value);
    if (!match) return null;
    n = Number(match[1]);
    const hemisphere = match[2]?.toUpperCase();
    if (hemisphere) {
      if ((axis === 'lat') !== (hemisphere === 'N' || hemisphere === 'S')) return null;
      if (hemisphere === 'S' || hemisphere === 'W') n = -Math.abs(n);
    }
  } else {
    return null;
  }
  const limit = axis === 'lat' ? 90 : 180;
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
}

interface LocationRow {
  location?: string | null;
  latitude?: unknown;
  longitude?: unknown;
}

/** Every gathering with a usable position, by city key. "Others" and rows that don't parse are dropped. */
export function toCityCoords(rows: LocationRow[]): CityCoords {
  const out: CityCoords = {};
  for (const row of rows) {
    const city = toDisplayCity(row.location);
    if (!city) continue;
    const key = city.toLowerCase();
    if (out[key]) continue;
    const fix = CITY_COORD_FIXES[key];
    if (fix) {
      out[key] = fix;
      continue;
    }
    const lat = parseCoord(row.latitude, 'lat');
    const lng = parseCoord(row.longitude, 'lng');
    if (lat !== null && lng !== null) out[key] = [lat, lng];
  }
  return out;
}

async function loadCityCoords(): Promise<CityCoords> {
  // Not fetch-cached: the body is past Next's 2 MB fetch-cache entry limit. The small result is cached instead.
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/irl/locations?pagination=false`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`IRL locations responded with ${response.status}`);
  const body = await response.json();
  return toCityCoords(Array.isArray(body) ? body : []);
}

// The cache key must change when a fix changes the cached positions.
export const getCityCoords = unstable_cache(loadCityCoords, ['events-city-coords-v2'], { revalidate: 86400 });
