import type { CityCoords } from '@/services/events/city-coords.service';
import type { AllEventsItem } from '@/services/events/all-events.types';

import type { LatLngLiteral } from './google-maps.types';

/*
 * What the All Events Map shows (LAB-3321): one pin per city with in-person or hybrid events, the online events, and
 * the in-person events whose city has no known position. Pure, so the grouping and the camera are unit-tested without
 * Google.
 */

export interface CityPin {
  /** The city key, as `AllEventsItem.cityKey`. */
  key: string;
  city: string;
  position: LatLngLiteral;
  /** Soonest first. */
  events: AllEventsItem[];
}

export interface MapLayout {
  pins: CityPin[];
  online: AllEventsItem[];
  /** In person, but no position for their city (or no city): listed under the map so no event goes missing. */
  unplaced: AllEventsItem[];
}

const byStart = (a: AllEventsItem, b: AllEventsItem) =>
  new Date(a.startDate).getTime() - new Date(b.startDate).getTime();

export function mapLayout(items: AllEventsItem[], coords: CityCoords): MapLayout {
  const online: AllEventsItem[] = [];
  const unplaced: AllEventsItem[] = [];
  const byCity = new Map<string, CityPin>();
  for (const item of [...items].sort(byStart)) {
    if (item.mode === 'Virtual') {
      online.push(item);
      continue;
    }
    const at = item.cityKey ? coords[item.cityKey] : undefined;
    if (!item.cityKey || !item.city || !at) {
      unplaced.push(item);
      continue;
    }
    const pin = byCity.get(item.cityKey);
    if (pin) pin.events.push(item);
    else
      byCity.set(item.cityKey, {
        key: item.cityKey,
        city: item.city,
        position: { lat: at[0], lng: at[1] },
        events: [item],
      });
  }
  const pins = Array.from(byCity.values()).sort(
    (a, b) => b.events.length - a.events.length || a.city.localeCompare(b.city),
  );
  return { pins, online, unplaced };
}

/** How close a single city shows: its streets and neighbourhoods. */
export const CITY_ZOOM = 11;
/** The whole world, when no pin shows. */
export const WORLD: { center: LatLngLiteral; zoom: number } = { center: { lat: 20, lng: 0 }, zoom: 2 };

export type MapCamera = { center: LatLngLiteral; zoom: number } | { fit: LatLngLiteral[] };

/** Where the map looks: the linked event's city, else the only city, else every pin, else the world. */
export function mapCamera(pins: CityPin[], highlightUid?: string | null): MapCamera {
  const linked = highlightUid ? pins.find((p) => p.events.some((e) => e.uid === highlightUid)) : undefined;
  if (linked) return { center: linked.position, zoom: CITY_ZOOM };
  if (pins.length === 1) return { center: pins[0].position, zoom: CITY_ZOOM };
  if (pins.length > 1) return { fit: pins.map((p) => p.position) };
  return WORLD;
}
