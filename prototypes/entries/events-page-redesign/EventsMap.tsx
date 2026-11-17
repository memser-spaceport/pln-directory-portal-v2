'use client';

/**
 * Map view: the events app's third view (Calendar / List / Map), drawn without a map library.
 * The app has none (package.json is outside prototypes/), so this is a small slippy map:
 * OpenStreetMap's standard tiles (greyed in CSS so the pins lead; CARTO's light tiles now
 * need an API key) placed with Web Mercator maths, one pin per
 * city with its event count, drag to pan, +/− to zoom, "Show all" to fit every pin again.
 * A pin opens a card listing that city's events (Luma's map + list peek); a row opens the drawer.
 * Online events have no place, so they sit under the map as their own list.
 */

import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

import { CloseIcon } from '@/components/icons';

import { DETAILS, spanLabel, type CalEvent } from './mocks';
import m from './EventsMap.module.scss';

const TILE = 256;
const MIN_Z = 1;
const MAX_Z = 12;

/** City centres for the mock events (the drawer mocks carry addresses, not coordinates). */
const CITY_COORDS: Record<string, [number, number]> = {
  Lisbon: [38.7223, -9.1393],
  Berlin: [52.52, 13.405],
  'New York': [40.7128, -74.006],
  'San Francisco': [37.7749, -122.4194],
  'Buenos Aires': [-34.6037, -58.3816],
  Bangalore: [12.9716, 77.5946],
};

const toU = (lng: number) => (lng + 180) / 360;
const toV = (lat: number) => {
  const r = (lat * Math.PI) / 180;
  return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2;
};
const wrap = (u: number) => ((u % 1) + 1) % 1;

interface Place {
  city: string;
  u: number;
  v: number;
  events: CalEvent[];
}

export function EventsMap({
  events,
  goingUids,
  onOpen,
}: {
  events: CalEvent[];
  goingUids: Set<string>;
  onOpen: (uid: string, from: CalEvent[]) => void;
}) {
  const online = events.filter((e) => DETAILS[e.uid].mode === 'Virtual');
  const places = useMemo<Place[]>(() => {
    const byCity = new Map<string, CalEvent[]>();
    events
      .filter((e) => DETAILS[e.uid].mode !== 'Virtual' && CITY_COORDS[e.city])
      .forEach((e) => byCity.set(e.city, [...(byCity.get(e.city) ?? []), e]));
    return Array.from(byCity, ([city, list]) => ({
      city,
      u: toU(CITY_COORDS[city][1]),
      v: toV(CITY_COORDS[city][0]),
      events: list,
    }));
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

  // The smallest zoom whose world is wider than the frame, so the map never repeats side by side.
  const minZ = size.w ? Math.max(MIN_Z, Math.ceil(Math.log2(size.w / TILE))) : MIN_Z;

  const fit = (list: Place[]) => {
    if (!size.w || !list.length) return { z: minZ, u: 0.5, v: 0.42 };
    const us = list.map((p) => p.u);
    const vs = list.map((p) => p.v);
    const [u0, u1, v0, v1] = [Math.min(...us), Math.max(...us), Math.min(...vs), Math.max(...vs)];
    let z = MAX_Z;
    while (z > minZ) {
      const ws = TILE * 2 ** z;
      if ((u1 - u0) * ws <= size.w - 160 && (v1 - v0) * ws <= size.h - 140) break;
      z -= 1;
    }
    return { z: Math.min(z, 10), u: (u0 + u1) / 2, v: (v0 + v1) / 2 };
  };

  const [camera, setCamera] = useState<{ z: number; u: number; v: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const placeKey = places.map((p) => p.city).join('|');
  // Refit when the frame first measures and whenever the filters change which cities show.
  useEffect(() => {
    if (!size.w) return;
    setCamera(fit(places));
    setSelected((cur) => (cur && places.some((p) => p.city === cur) ? cur : null));
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

  const drag = useRef<{ x: number; y: number; u: number; v: number; moved: boolean } | null>(null);
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
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
  const n = 2 ** cam.z;
  const tiles: { key: string; src: string; x: number; y: number }[] = [];
  if (size.w) {
    for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + size.h) / TILE); ty++) {
      if (ty < 0 || ty >= n) continue;
      for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + size.w) / TILE); tx++) {
        const wx = ((tx % n) + n) % n;
        tiles.push({
          key: `${cam.z}/${tx}/${ty}`,
          src: `https://tile.openstreetmap.org/${cam.z}/${wx}/${ty}.png`,
          x: tx * TILE - left,
          y: ty * TILE - top,
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

  const open = places.find((p) => p.city === selected) ?? null;
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
            <img key={t.key} src={t.src} alt="" className={m.tile} style={{ left: t.x, top: t.y }} draggable={false} />
          ))}
        </div>
        {/* Brand-blue tint over the greyed tiles: keeps their light and shade, swaps the colour. */}
        <div className={m.tint} aria-hidden />

        {places.map((p) => {
          const { x, y } = screen(p);
          if (x < -60 || x > size.w + 60 || y < -40 || y > size.h + 40) return null;
          const going = p.events.some((e) => goingUids.has(e.uid));
          return (
            <button
              key={p.city}
              type="button"
              className={clsx(m.pin, compact && m.pinCompact, selected === p.city && m.pinActive)}
              style={{ left: x, top: y }}
              aria-pressed={selected === p.city}
              aria-label={`${p.city}: ${p.events.length} ${p.events.length === 1 ? 'event' : 'events'}`}
              onClick={() => setSelected(selected === p.city ? null : p.city)}
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
          <div className={m.card} role="dialog" aria-label={`Events in ${open.city}`}>
            <div className={m.cardHead}>
              <span className={m.cardTitle}>
                {open.city} · {open.events.length} {open.events.length === 1 ? 'event' : 'events'}
              </span>
              <button type="button" className={m.cardClose} onClick={() => setSelected(null)} aria-label="Close">
                <CloseIcon width={16} height={16} />
              </button>
            </div>
            <ul className={m.cardList}>
              {open.events.map((e) => (
                <li key={e.uid}>
                  <button type="button" className={m.cardRow} onClick={() => onOpen(e.uid, open.events)}>
                    <span className={m.cardDate}>{spanLabel(e.startDate, e.endDate)}</span>
                    <span className={m.cardName}>{e.name}</span>
                    {goingUids.has(e.uid) && <span className={m.cardGoing}>Going</span>}
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
          contributors
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
                  {goingUids.has(e.uid) && <span className={m.cardGoing}>Going</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
