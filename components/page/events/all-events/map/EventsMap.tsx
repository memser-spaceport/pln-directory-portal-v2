'use client';

import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

import { EventImage } from '@/components/page/events/EventImage/EventImage';
import { spanLabel } from '@/services/events/all-events.filters';
import type { AllEventsItem } from '@/services/events/all-events.types';
import { useCityCoords } from '@/services/events/hooks/useCityCoords';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_MAP_ID } from '@/utils/events-page';

import { EventRows } from './EventRows';
import type { GoogleMapsLibs } from './google-maps.types';
import { loadGoogleMaps } from './loadGoogleMaps';
import {
  CITY_ZOOM,
  EVENT_PIN_ZOOM,
  WORLD,
  eventPins,
  mapCamera,
  mapLayout,
  type CityPin,
  type EventPin,
  type MapCamera,
} from './pins';
import m from './EventsMap.module.scss';

/*
 * The All Events Map (LAB-3321, design D7; LAB-3353): Google Maps with, zoomed out, one pin per city that has
 * in-person or hybrid events, labelled with its count. A city pin zooms into its city; from `EVENT_PIN_ZOOM` up each
 * event has its own round pin with its picture (green ring: you're going; brand ring: the linked or last opened
 * event), and pressing one opens its drawer. Zoom with the wheel or trackpad (`gestureHandling: 'greedy'`, so the page
 * doesn't scroll under the pointer), + / − and, on wider screens, the slider. Online events, and in-person ones whose
 * city has no position, are listed under the map.
 */

const MIN_ZOOM = 2;
const MAX_ZOOM = 18;
/** Room around the pins when "Show all" fits them: a pin stands about 40px above its point. */
const FIT_PADDING = 64;

interface Ready {
  libs: GoogleMapsLibs;
  map: google.maps.Map;
}

function applyCamera({ libs, map }: Ready, camera: MapCamera) {
  if ('fit' in camera) {
    const bounds = new libs.LatLngBounds();
    camera.fit.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, FIT_PADDING);
  } else {
    map.setCenter(camera.center);
    map.setZoom(camera.zoom);
  }
}

const pinTitle = (pin: CityPin, going: boolean) => {
  const n = pin.events.length;
  return `${pin.city}: ${n} ${n === 1 ? 'event' : 'events'}${going ? ", you're going" : ''}. Zoom in to the events`;
};

const eventPinTitle = ({ event }: EventPin, going: boolean) =>
  `${event.name}, ${spanLabel(event.startDay, event.endDay)}${going ? ", you're going" : ''}`;

/** A marker per city (`city:<key>`) and per event (`event:<uid>`); the zoom decides which set is on the map. */
const cityKey = (key: string) => `city:${key}`;
const eventKey = (uid: string) => `event:${uid}`;

export function EventsMap({
  events,
  goingUids,
  highlightUid,
  onOpen,
  onPrepare,
}: {
  events: AllEventsItem[];
  goingUids: Set<string>;
  /** The event a link landed on (`?event=`), or the last one opened: its pin is marked. */
  highlightUid?: string | null;
  onOpen: (uid: string) => void;
  onPrepare: (uid: string) => void;
}) {
  const coords = useCityCoords();
  const { pins, online, unplaced } = useMemo(() => mapLayout(events, coords.data ?? {}), [events, coords.data]);
  const perEvent = useMemo(() => eventPins(pins), [pins]);

  // Google's map, made once the script has loaded (in its promise, never in render).
  const canvasRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState<Ready | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [zoom, setZoom] = useState(WORLD.zoom);
  const detail = zoom >= EVENT_PIN_ZOOM;

  useEffect(() => {
    let live = true;
    const listeners: google.maps.MapsEventListener[] = [];
    loadGoogleMaps(GOOGLE_MAPS_API_KEY).then(
      (libs) => {
        if (!live || !canvasRef.current) return;
        const map = new libs.Map(canvasRef.current, {
          mapId: GOOGLE_MAPS_MAP_ID,
          center: WORLD.center,
          zoom: WORLD.zoom,
          minZoom: MIN_ZOOM,
          maxZoom: MAX_ZOOM,
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          clickableIcons: false,
        });
        listeners.push(map.addListener('zoom_changed', () => setZoom(map.getZoom() ?? WORLD.zoom)));
        setReady({ libs, map });
      },
      () => {
        if (live) setLoadFailed(true);
      },
    );
    return () => {
      live = false;
      listeners.forEach((listener) => listener.remove());
    };
  }, [attempt]);

  // One element per city for its marker's content; React draws the pin into it through a portal.
  const [hosts] = useState(() => new Map<string, HTMLElement>());
  const hostFor = useCallback(
    (key: string) => {
      let host = hosts.get(key);
      if (!host) {
        host = document.createElement('div');
        hosts.set(key, host);
      }
      return host;
    },
    [hosts],
  );

  const linkedPin = highlightUid ? pins.find((p) => p.events.some((e) => e.uid === highlightUid)) : undefined;

  // A city pin zooms into its city, where its events have their own pins; an event pin opens the drawer.
  const press = (key: string) => {
    if (key.startsWith('event:')) {
      onOpen(key.slice('event:'.length));
      return;
    }
    const pin = pins.find((p) => cityKey(p.key) === key);
    if (!pin || !ready) return;
    ready.map.setCenter(pin.position);
    ready.map.setZoom(Math.max(CITY_ZOOM, ready.map.getZoom() ?? CITY_ZOOM));
  };
  const pressRef = useRef(press);
  const highlightRef = useRef(highlightUid);
  useEffect(() => {
    pressRef.current = press;
    highlightRef.current = highlightUid;
  });

  // Markers follow the pins: new cities and events get one, those filtered out lose theirs. Only the set for the
  // current zoom is on the map.
  const markersRef = useRef(new Map<string, google.maps.marker.AdvancedMarkerElement>());
  useEffect(() => {
    if (!ready) return;
    const markers = markersRef.current;
    const wanted = new Map<string, { position: google.maps.LatLngLiteral; title: string; shown: boolean }>();
    for (const pin of pins) {
      const going = pin.events.some((e) => goingUids.has(e.uid));
      wanted.set(cityKey(pin.key), { position: pin.position, title: pinTitle(pin, going), shown: !detail });
    }
    for (const pin of perEvent) {
      const title = eventPinTitle(pin, goingUids.has(pin.event.uid));
      wanted.set(eventKey(pin.event.uid), { position: pin.position, title, shown: detail });
    }
    markers.forEach((marker, key) => {
      if (wanted.has(key)) return;
      marker.map = null;
      markers.delete(key);
    });
    wanted.forEach(({ position, title, shown }, key) => {
      let marker = markers.get(key);
      if (!marker) {
        marker = new ready.libs.AdvancedMarkerElement({ position, content: hostFor(key), title, gmpClickable: true });
        marker.addEventListener('gmp-click', () => pressRef.current(key));
        markers.set(key, marker);
      }
      marker.title = title;
      marker.zIndex = key === eventKey(highlightUid ?? '') ? 1 : null;
      const map = shown ? ready.map : null;
      if (marker.map !== map) marker.map = map;
    });
  }, [ready, pins, perEvent, goingUids, hostFor, detail, highlightUid]);
  useEffect(() => {
    const markers = markersRef.current;
    return () => markers.forEach((marker) => (marker.map = null));
  }, []);

  // The camera: on the linked event's city the first time, then fitting every pin whenever the filters change them.
  const pinsKey = pins.map((p) => p.key).join('|');
  const framedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || !coords.data || framedRef.current === pinsKey) return;
    const first = framedRef.current === null;
    framedRef.current = pinsKey;
    applyCamera(ready, mapCamera(pins, first ? highlightRef.current : null));
    // `pins` is read through `pinsKey`: a new array with the same cities is not a reason to move the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, coords.data, pinsKey]);

  const showAll = () => {
    if (ready) applyCamera(ready, mapCamera(pins));
  };
  const zoomTo = (next: number) => ready?.map.setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next)));
  const retry = () => {
    setLoadFailed(false);
    setAttempt((n) => n + 1);
    if (coords.isError) void coords.refetch();
  };

  const failed = loadFailed || coords.isError;
  const loading = !failed && (!ready || coords.isPending);

  return (
    <div className={m.root}>
      <div className={m.frame}>
        <div ref={canvasRef} className={m.canvas} data-testid="events-map-canvas" />

        {ready &&
          !coords.isPending &&
          !detail &&
          pins.map((pin) => {
            const going = pin.events.some((e) => goingUids.has(e.uid));
            const active = pin === linkedPin;
            return createPortal(
              <span
                className={clsx(m.pin, active && m.pinActive)}
                data-city={pin.key}
                data-active={active || undefined}
                data-going={going || undefined}
              >
                <span className={m.pinName}>{pin.city}</span>
                <span className={m.pinCount}>{pin.events.length}</span>
                {going && <span className={m.pinGoing} aria-hidden />}
              </span>,
              hostFor(cityKey(pin.key)),
              cityKey(pin.key),
            );
          })}

        {ready &&
          !coords.isPending &&
          detail &&
          perEvent.map(({ event, offset }) => {
            const going = goingUids.has(event.uid);
            const active = event.uid === highlightUid;
            return createPortal(
              <span
                className={clsx(m.eventPin, going && m.eventPinGoing, active && m.eventPinActive)}
                style={{ '--dx': `${offset.x}px`, '--dy': `${offset.y}px` } as CSSProperties}
                data-event-pin={event.uid}
                data-active={active || undefined}
                data-going={going || undefined}
                onPointerEnter={() => onPrepare(event.uid)}
              >
                <span className={m.eventPhoto}>
                  <EventImage src={event.picture} className={m.eventFill} />
                </span>
              </span>,
              hostFor(eventKey(event.uid)),
              eventKey(event.uid),
            );
          })}

        {ready && !failed && (
          <>
            <div className={m.controls}>
              <button type="button" onClick={() => zoomTo(zoom + 1)} aria-label="Zoom in" disabled={zoom >= MAX_ZOOM}>
                +
              </button>
              <input
                type="range"
                className={m.zoomSlider}
                aria-label="Zoom"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={1}
                value={zoom}
                onChange={(e) => zoomTo(Number(e.target.value))}
              />
              <button type="button" onClick={() => zoomTo(zoom - 1)} aria-label="Zoom out" disabled={zoom <= MIN_ZOOM}>
                −
              </button>
            </div>
            {pins.length > 0 && (
              <button type="button" className={m.fitBtn} onClick={showAll}>
                Show all
              </button>
            )}
          </>
        )}

        {loading && <p className={m.status}>Loading the map…</p>}
        {failed && (
          <div className={m.status} role="alert">
            The map couldn&apos;t load.
            <button type="button" className={m.retry} onClick={retry}>
              Try again
            </button>
          </div>
        )}
        {!loading && !failed && pins.length === 0 && (
          <p className={m.status}>No in-person events match these filters.</p>
        )}
      </div>

      {online.length > 0 && (
        <section className={m.list} aria-labelledby="events-map-online">
          <h3 id="events-map-online" className={m.listTitle}>
            Online · {online.length}
          </h3>
          <EventRows
            events={online}
            goingUids={goingUids}
            highlightUid={highlightUid}
            onOpen={onOpen}
            onPrepare={onPrepare}
          />
        </section>
      )}
      {!coords.isPending && !failed && unplaced.length > 0 && (
        <section className={m.list} aria-labelledby="events-map-unplaced">
          <h3 id="events-map-unplaced" className={m.listTitle}>
            Not on the map · {unplaced.length}
          </h3>
          <EventRows
            events={unplaced}
            goingUids={goingUids}
            highlightUid={highlightUid}
            onOpen={onOpen}
            onPrepare={onPrepare}
          />
        </section>
      )}
    </div>
  );
}
