'use client';

/**
 * Map view: the events app's third view (Calendar / List / Map), drawn without a map library.
 * The app has none (package.json is outside prototypes/), so this is a small slippy map:
 * Esri's World Street Map tiles, placed with Web Mercator maths. Since 2026-11-18 ("use Google
 * Maps style"): the closest keyless style to Google's (blue water, light land, white streets).
 * Google's own tiles need a Maps API key (none in this repo), and CARTO's Voyager now serves an
 * "API KEY REQUIRED" placeholder. Esri's terms want an ArcGIS account for production use; fine
 * for a prototype. Before that: OSM standard tiles greyed, then slate-washed.
 * One pin per city with its count; from z9 one photo pin per venue. Drag to pan, wheel or +/−/
 * slider to zoom, "Show all" to fit every pin again.
 * Online events have no place, so they sit under the map as their own list.
 */

import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

import { CloseIcon } from '@/components/icons';

import { venueOf } from '../event-drawer-redesign/format';

import { DETAILS, spanLabel, type CalEvent } from './mocks';
import { EventImage } from '../events-shared/EventImage';
import { GoingTag } from '../events-shared/GoingTag';
import m from './EventsMap.module.scss';

const TILE = 256;
const MIN_Z = 1;
const MAX_Z = 16;
/** From this zoom up, pins sit at each event's venue instead of one pin per city. */
const DETAIL_Z = 9;

/** City centres for the mock events (the drawer mocks carry addresses, not coordinates). */
export const CITY_COORDS: Record<string, [number, number]> = {
  Lisbon: [38.7223, -9.1393],
  Berlin: [52.52, 13.405],
  'New York': [40.7128, -74.006],
  'San Francisco': [37.7749, -122.4194],
  'Buenos Aires': [-34.6037, -58.3816],
  Bangalore: [12.9716, 77.5946],
  Paris: [48.8566, 2.3522],
  Singapore: [1.3521, 103.8198],
  Tokyo: [35.6762, 139.6503],
  Austin: [30.2672, -97.7431],
};

/**
 * Each in-person event's venue (2026-11-18: "exact events locations"), from the address the mock
 * carries. Events at one venue share a pin.
 */
export const VENUE_COORDS: Record<string, [number, number]> = {
  'filecoin-builders-ny': [40.7397, -74.008], // Betaworks
  'labweek-lisbon': [38.7339, -9.1056], // Hub Criativo do Beato
  'libp2p-day': [38.7339, -9.1056],
  'ipfs-camp-lisbon': [38.7339, -9.1056],
  'lisbon-founders-breakfast': [38.7069, -9.1458], // Second Home, Mercado da Ribeira
  'lisbon-storage-providers': [38.7108, -9.1371], // Startup Lisboa, Rua da Prata
  'lisbon-closing-party': [38.7034, -9.1785], // LX Factory, Alcântara
  'dai-founders-dinner': [52.529, 13.411], // Remi, Schönhauser Allee
  'funding-commons-sf': [37.7497, -122.4183], // The Fold
  'fil-dev-summit': [-34.6037, -58.4116], // Centro Cultural Konex
  'dai-summit-bangalore': [12.961, 77.6387], // Bangalore International Centre
  'neurotech-salon': [37.7955, -122.3937], // The Commons, Ferry Building
  'paris-builders-night': [48.834, 2.3707], // Station F
  'ipfs-camp-singapore': [1.2966, 103.7892], // BLOCK71
  'tokyo-founders-breakfast': [35.656, 139.7029], // Shibuya Stream
  'desci-austin': [30.269, -97.74], // Capital Factory
  'nyc-founders-demo-night': [40.6995, -73.9705], // Newlab, Brooklyn Navy Yard
};

const toU = (lng: number) => (lng + 180) / 360;
const toV = (lat: number) => {
  const r = (lat * Math.PI) / 180;
  return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2;
};
const wrap = (u: number) => ((u % 1) + 1) % 1;

interface Place {
  /** The city name for a city pin, the venue's coordinates for a venue pin. */
  key: string;
  /** What the pin and its card are called: the city, or the venue. */
  label: string;
  city: string;
  u: number;
  v: number;
  events: CalEvent[];
}

export function EventsMap({
  events,
  goingUids,
  onOpen,
  highlightUid,
}: {
  events: CalEvent[];
  goingUids: Set<string>;
  onOpen: (uid: string, from: CalEvent[]) => void;
  /** Arriving from a link to one event: its city's card opens with the row marked. */
  highlightUid?: string | null;
}) {
  const online = events.filter((e) => DETAILS[e.uid].mode === 'Virtual');
  const places = useMemo<Place[]>(() => {
    const byCity = new Map<string, CalEvent[]>();
    events
      .filter((e) => DETAILS[e.uid].mode !== 'Virtual' && CITY_COORDS[e.city])
      .forEach((e) => byCity.set(e.city, [...(byCity.get(e.city) ?? []), e]));
    return Array.from(byCity, ([city, list]) => ({
      key: city,
      label: city,
      city,
      u: toU(CITY_COORDS[city][1]),
      v: toV(CITY_COORDS[city][0]),
      events: list,
    }));
  }, [events]);

  // Zoomed in: one pin per venue (events at the same address share it).
  const venues = useMemo<Place[]>(() => {
    const byVenue = new Map<string, CalEvent[]>();
    events
      .filter((e) => DETAILS[e.uid].mode !== 'Virtual' && VENUE_COORDS[e.uid])
      .forEach((e) => {
        const k = VENUE_COORDS[e.uid].join(',');
        byVenue.set(k, [...(byVenue.get(k) ?? []), e]);
      });
    return Array.from(byVenue, ([key, list]) => {
      const [lat, lng] = VENUE_COORDS[list[0].uid];
      return {
        key,
        label: venueOf(DETAILS[list[0].uid]).venue,
        city: list[0].city,
        u: toU(lng),
        v: toV(lat),
        events: list,
      };
    });
  }, [events]);

  const frame = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The smallest zoom whose world is as wide as the frame, so the map never repeats side by side.
  // Fractional (2026-11-18): at whole steps the smallest such world was twice the frame, so pins
  // spread across the globe (SF to Tokyo) could not all fit. Tiles load at the next whole zoom up
  // and are drawn scaled down.
  const minZ = size.w ? Math.max(MIN_Z, Math.log2(size.w / TILE)) : MIN_Z;

  const fit = (list: Place[], cap = 10) => {
    if (!size.w || !list.length) return { z: minZ, u: 0.5, v: 0.42 };
    const us = list.map((p) => p.u);
    const vs = list.map((p) => p.v);
    const [u0, u1, v0, v1] = [Math.min(...us), Math.max(...us), Math.min(...vs), Math.max(...vs)];
    const zw = u1 > u0 ? Math.log2((size.w - 160) / ((u1 - u0) * TILE)) : cap;
    const zh = v1 > v0 ? Math.log2((size.h - 140) / ((v1 - v0) * TILE)) : cap;
    const z = Math.max(minZ, Math.min(zw, zh, cap));
    return { z, u: (u0 + u1) / 2, v: (v0 + v1) / 2 - 28 / (TILE * 2 ** z) }; // pins stand ~56px above their point, so centre half of that higher
  };

  const [camera, setCamera] = useState<{ z: number; u: number; v: number } | null>(null);
  /** A venue pin holding several events can have its card open; city pins zoom instead. */
  const [selected, setSelected] = useState<string | null>(null);
  /** A city pin zooms into that city's venues (street level, at most z14). */
  const zoomToCity = (city: string) => {
    setCamera(
      fit(
        venues.filter((p) => p.city === city),
        14,
      ),
    );
    setSelected(null);
  };
  const placeKey = places.map((p) => p.city).join('|');
  // Refit when the frame first measures and whenever the filters change which cities show.
  // Arriving from a link to one event (?event=), the map opens on that event's venue instead.
  useEffect(() => {
    if (!size.w) return;
    const linked = highlightUid ? venues.find((p) => p.events.some((e) => e.uid === highlightUid)) : undefined;
    setCamera(linked ? fit([linked], 14) : fit(places));
    setSelected((cur) => (cur && venues.some((p) => p.key === cur) ? cur : null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeKey, size.w > 0]);

  const cam = camera ?? fit(places);
  const ws = TILE * 2 ** cam.z;
  // Keep the poles off screen: the centre may not come closer to the edge than half a frame.
  const clampV = (v: number, z: number) => {
    const half = size.h / 2 / (TILE * 2 ** z);
    return half >= 0.5 ? 0.5 : Math.min(1 - half, Math.max(half, v));
  };
  const v = clampV(cam.v, cam.z);

  const zoom = (delta: number) =>
    setCamera((c) => {
      const base = c ?? cam;
      const z = Math.min(MAX_Z, Math.max(minZ, base.z + delta));
      return { ...base, z, v: clampV(base.v, z) };
    });

  // Mouse wheel / trackpad zoom over the map (2026-11-18), anchored on the pointer: the spot under
  // the cursor stays put, as in Google Maps. A native listener, because React's wheel handler is
  // passive and can't stop the page from scrolling while you zoom.
  const wheelState = useRef({ cam, size, minZ });
  wheelState.current = { cam: { ...cam, v }, size, minZ };
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const { cam: c, size: sz, minZ: zMin } = wheelState.current;
      if (!sz.w) return;
      e.preventDefault();
      // Trackpads send many small deltas, wheels a few big ones; both map to a smooth step.
      const step = -e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0025);
      const z = Math.min(MAX_Z, Math.max(zMin, c.z + step));
      if (z === c.z) return;
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left - sz.w / 2;
      const my = e.clientY - rect.top - sz.h / 2;
      const ws0 = TILE * 2 ** c.z;
      const ws1 = TILE * 2 ** z;
      const u = wrap(c.u + mx / ws0 - mx / ws1);
      const half = sz.h / 2 / ws1;
      const vRaw = c.v + my / ws0 - my / ws1;
      const vNext = half >= 0.5 ? 0.5 : Math.min(1 - half, Math.max(half, vRaw));
      setCamera({ z, u, v: vNext });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const drag = useRef<{ x: number; y: number; u: number; v: number; moved: boolean } | null>(null);
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, a, input')) return;
    drag.current = { x: e.clientX, y: e.clientY, u: cam.u, v, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    setCamera({ z: cam.z, u: wrap(d.u - dx / ws), v: clampV(d.v - dy / ws, cam.z) });
  };
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current && !drag.current.moved) setSelected(null);
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Tiles covering the frame; x wraps around the world, y stops at the poles.
  const left = cam.u * ws - size.w / 2;
  const top = v * ws - size.h / 2;
  const tz = Math.min(MAX_Z, Math.ceil(cam.z - 1e-6));
  const n = 2 ** tz;
  const tileSize = ws / n;
  const tiles: { key: string; src: string; x: number; y: number }[] = [];
  if (size.w) {
    for (let ty = Math.floor(top / tileSize); ty <= Math.floor((top + size.h) / tileSize); ty++) {
      if (ty < 0 || ty >= n) continue;
      for (let tx = Math.floor(left / tileSize); tx <= Math.floor((left + size.w) / tileSize); tx++) {
        const wx = ((tx % n) + n) % n;
        tiles.push({
          key: `${tz}/${tx}/${ty}`,
          src: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${tz}/${ty}/${wx}`,
          x: tx * tileSize - left,
          y: ty * tileSize - top,
        });
      }
    }
  }

  // A pin's screen position, taking the copy of the world nearest the centre.
  const screen = (p: Place) => {
    let dx = (p.u - cam.u) * ws;
    if (dx > ws / 2) dx -= ws;
    if (dx < -ws / 2) dx += ws;
    return { x: size.w / 2 + dx, y: (p.v - v) * ws + size.h / 2 };
  };

  // Zoomed in far enough, the city pins split into venue pins.
  const detail = cam.z >= DETAIL_Z;
  const shown = detail ? venues : places;
  const open = shown.find((p) => p.key === selected) ?? null;
  // Phones: at world zoom the cities sit a few dozen pixels apart, so pins drop the name and
  // show the count only; the card names the city once you tap.
  const compact = size.w > 0 && size.w < 600;

  return (
    <div className={m.root}>
      <div
        ref={frame}
        className={m.frame}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className={m.tiles} aria-hidden>
          {tiles.map((t) => (
            <img
              key={t.key}
              src={t.src}
              alt=""
              className={m.tile}
              style={{ left: t.x, top: t.y, width: tileSize, height: tileSize }}
              draggable={false}
            />
          ))}
        </div>

        {shown.map((p) => {
          const { x, y } = screen(p);
          if (x < -60 || x > size.w + 60 || y < -40 || y > size.h + 60) return null;
          const going = p.events.some((e) => goingUids.has(e.uid));
          if (detail) {
            // A venue: the event's own picture in a round pin (Luma's map). One event opens its
            // drawer straight away; a venue with several opens the card listing them.
            const first = p.events[0];
            const single = p.events.length === 1;
            const name = single ? `${first.name}, ${p.label}` : `${p.label}: ${p.events.length} events`;
            return (
              <button
                key={p.key}
                type="button"
                className={clsx(
                  m.venuePin,
                  going && m.venuePinGoing,
                  (selected === p.key || p.events.some((e) => e.uid === highlightUid)) && m.venuePinActive,
                )}
                style={{ left: x, top: y }}
                aria-label={name}
                title={name}
                data-event-uid={single ? first.uid : undefined}
                onClick={() => (single ? onOpen(first.uid, p.events) : setSelected(selected === p.key ? null : p.key))}
              >
                <span className={m.venuePhoto}>
                  <EventImage uid={first.uid} className={m.venueFill} />
                </span>
                {!single && <span className={m.venueCount}>{p.events.length}</span>}
              </button>
            );
          }
          return (
            <button
              key={p.key}
              type="button"
              className={clsx(m.pin, compact && m.pinCompact)}
              style={{ left: x, top: y }}
              aria-label={`${p.city}: ${p.events.length} ${p.events.length === 1 ? 'event' : 'events'}. Zoom in to the venues`}
              onClick={() => zoomToCity(p.city)}
            >
              {!compact && p.city}
              <span className={m.pinCount}>{p.events.length}</span>
              {going && <span className={m.pinGoing} title="You're going to an event here" />}
            </button>
          );
        })}

        <div className={m.controls}>
          <button type="button" onClick={() => zoom(1)} aria-label="Zoom in" disabled={cam.z >= MAX_Z}>
            +
          </button>
          {/* The zoom slider (2026-11-18): drag down to zoom out, up to zoom in; fractional, so it
            glides between the whole steps the buttons take. */}
          <input
            type="range"
            className={m.zoomSlider}
            aria-label="Zoom"
            min={minZ}
            max={MAX_Z}
            step={0.05}
            value={cam.z}
            onChange={(e) => {
              const z = Number(e.target.value);
              setCamera((c) => {
                const base = c ?? cam;
                return { ...base, z, v: clampV(base.v, z) };
              });
            }}
          />
          <button type="button" onClick={() => zoom(-1)} aria-label="Zoom out" disabled={cam.z <= minZ}>
            −
          </button>
        </div>
        {places.length > 0 && (
          <button
            type="button"
            className={m.fitBtn}
            onClick={() => {
              setCamera(fit(places));
              setSelected(null);
            }}
          >
            Show all
          </button>
        )}

        {open && (
          <div className={m.card} role="dialog" aria-label={`Events at ${open.label}`}>
            <div className={m.cardHead}>
              <span className={m.cardTitle}>
                {open.label} · {open.events.length} {open.events.length === 1 ? 'event' : 'events'}
              </span>
              <button type="button" className={m.cardClose} onClick={() => setSelected(null)} aria-label="Close">
                <CloseIcon width={16} height={16} />
              </button>
            </div>
            <ul className={m.cardList}>
              {open.events.map((e) => (
                <li key={e.uid}>
                  <button
                    type="button"
                    className={clsx(m.cardRow, e.uid === highlightUid && m.cardRowHighlight)}
                    data-event-uid={e.uid}
                    onClick={() => onOpen(e.uid, open.events)}
                  >
                    <span className={m.cardDate}>{spanLabel(e.startDate, e.endDate)}</span>
                    <span className={m.cardName}>{e.name}</span>
                    {goingUids.has(e.uid) && <GoingTag />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!places.length && <p className={m.empty}>No in-person events match these filters.</p>}

        <span className={m.attribution}>
          ©{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            OpenStreetMap
          </a>{' '}
          contributors ©{' '}
          <a href="https://www.esri.com/en-us/legal/terms/data-attributions" target="_blank" rel="noreferrer">
            Esri
          </a>
        </span>
      </div>

      {online.length > 0 && (
        <section className={m.online} aria-labelledby="online-title">
          <h3 id="online-title" className={m.onlineTitle}>
            Online · {online.length}
          </h3>
          <ul className={m.cardList}>
            {online.map((e) => (
              <li key={e.uid}>
                <button type="button" className={m.cardRow} onClick={() => onOpen(e.uid, online)}>
                  <span className={m.cardDate}>{spanLabel(e.startDate, e.endDate)}</span>
                  <span className={m.cardName}>{e.name}</span>
                  {goingUids.has(e.uid) && <GoingTag />}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
