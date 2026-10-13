'use client';

import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LIMITS, envelope, isEnvelope, type BridgeRect, type ParentMessage } from '@/ai-apps-bridge/protocol';
import type { AiAppEnvironment, OverlayFeedbackPin } from '@/services/ai-app-feedback/ai-app-feedback.service';
import { toPinId, toRect } from './validate';

type Options = {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  /** The app's exact origin; messages from anywhere else are dropped. */
  appOrigin: string | null;
  /** Changes when the iframe is remounted (a redeploy): everything located belongs to the old frame. */
  frameKey: string;
  /** Listen for the bridge at all (flag on, app loaded). */
  listening: boolean;
  /** Show pins now (the toggle is on and the member isn't picking new ones). */
  active: boolean;
  pins: OverlayFeedbackPin[];
  /** The app page on screen (pathname, query allowed), or null when the app never reported one. */
  currentPath: string | null;
};

export type OverlayStatus = 'off' | 'waiting' | 'ready' | 'unsupported';

/** A pin the bridge found on the page on screen. `rect: null` = it exists but is scrolled away or hidden. */
export type PlacedFeedbackPin = { pin: OverlayFeedbackPin; pinId: string; rect: BridgeRect | null };

/** Pathname only, without a trailing slash (except the root), so `/pins/` and `/pins?x=1` match `/pins`. */
export function normalizeAppPath(path: string): string {
  const pathname = path.split(/[?#]/)[0] || '/';
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') || '/' : '/';
}

type Located = Record<string, { pinId: string; rect: BridgeRect | null } | null>;
/** Answers to one `locate` request, tagged with the request they answer so an older one is never shown. */
type LocatedState = { request: string; entries: Located };
const NOTHING_LOCATED: LocatedState = { request: '', entries: {} };

/**
 * LabOS's half of the feedback overlay: asks the app's bridge where each
 * stored pin's element is now (`locate`), keeps the answers moving with the
 * page (`pins:rects`), and sorts every pin into placed on this page, not found
 * on this page, or on another page.
 *
 * Its own listener, separate from `useElementPins` (which owns picking): it
 * reads only `ready`, `locate:result` and `pins:rects` for `loc-` ids, and
 * sends only `hello`, `locate` and `pins:unwatch` for ids it located.
 */
export function useFeedbackOverlay({ iframeRef, appOrigin, frameKey, listening, active, pins, currentPath }: Options) {
  const [capabilities, setCapabilities] = useState<string[] | null>(null);
  const [session, setSession] = useState<string | null>(null);
  const [located, setLocated] = useState<LocatedState>(NOTHING_LOCATED);

  /* A remounted frame is a new document: its bridge has to introduce itself again. */
  const frameIdentity = `${listening && appOrigin ? appOrigin : 'off'}|${frameKey}`;
  const [seenIdentity, setSeenIdentity] = useState(frameIdentity);
  if (seenIdentity !== frameIdentity) {
    setSeenIdentity(frameIdentity);
    setCapabilities(null);
    setSession(null);
  }

  /* Each time the overlay is switched on counts as a new request, even for the
     same pins: switching off unwatched everything the bridge had located. */
  const [seenActive, setSeenActive] = useState(active);
  const [activation, setActivation] = useState(0);
  if (seenActive !== active) {
    setSeenActive(active);
    if (active) setActivation((n) => n + 1);
  }

  /** Keys of the last `locate` sent; a result for anything else is stale and dropped. */
  const requestedKeys = useRef<Set<string>>(new Set());
  /** Tag of the last `locate` sent (see LocatedState). */
  const requestRef = useRef('');
  const sessionRef = useRef<string | null>(null);
  /** Bridge ids this hook owns, so `pins:unwatch` never touches the picker's pins. */
  const ownedPinIds = useRef<Set<string>>(new Set());

  const send = useCallback(
    (message: ParentMessage) => {
      const target = iframeRef.current?.contentWindow;
      if (!target || !appOrigin) return;
      target.postMessage(envelope(message), appOrigin);
    },
    [iframeRef, appOrigin],
  );

  useEffect(() => {
    if (!listening || !appOrigin) return;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== appOrigin || event.source !== iframeRef.current?.contentWindow) return;
      if (!isEnvelope(event.data)) return;
      const payload = (event.data.payload ?? {}) as Record<string, unknown>;
      switch (event.data.type) {
        case 'ready': {
          const caps = Array.isArray(payload.capabilities)
            ? payload.capabilities.filter((c): c is string => typeof c === 'string').slice(0, 10)
            : [];
          setCapabilities(caps);
          const next = typeof payload.session === 'string' ? payload.session.slice(0, 40) : null;
          /* A new session is a new document (full-page navigation): it never heard of
             our pins, so the ids we hold mean nothing and a fresh `locate` follows. */
          if (sessionRef.current !== null && sessionRef.current !== next) ownedPinIds.current = new Set();
          sessionRef.current = next;
          setSession(next);
          return;
        }
        case 'locate:result': {
          const results = payload.results;
          if (!results || typeof results !== 'object') return;
          const update: Located = {};
          for (const [key, value] of Object.entries(results as Record<string, unknown>)) {
            if (!requestedKeys.current.has(key)) continue;
            const v = value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
            const pinId = v ? toPinId(v.pinId) : null;
            if (!v || !pinId) {
              update[key] = null;
              continue;
            }
            ownedPinIds.current.add(pinId);
            update[key] = { pinId, rect: toRect(v.rect) };
          }
          const request = requestRef.current;
          setLocated((prev) => ({
            request,
            entries: { ...(prev.request === request ? prev.entries : {}), ...update },
          }));
          return;
        }
        case 'pins:rects': {
          const rects = payload.rects;
          if (!rects || typeof rects !== 'object') return;
          setLocated((prev) => {
            let changed = false;
            const entries: Located = { ...prev.entries };
            for (const [key, entry] of Object.entries(prev.entries)) {
              if (!entry || !Object.prototype.hasOwnProperty.call(rects, entry.pinId)) continue;
              entries[key] = { ...entry, rect: toRect((rects as Record<string, unknown>)[entry.pinId]) };
              changed = true;
            }
            return changed ? { ...prev, entries } : prev;
          });
          return;
        }
        default:
          return;
      }
    };
    window.addEventListener('message', onMessage);
    /* `ready` may have come before this listener existed; the bridge answers hello with it. */
    send({ type: 'hello' });
    return () => window.removeEventListener('message', onMessage);
  }, [listening, appOrigin, iframeRef, send, frameIdentity]);

  const path = currentPath ? normalizeAppPath(currentPath) : null;
  const canLocate = Boolean(capabilities?.includes('locate'));
  /* Pins to look for: this page's, or every pin when the app never said which page it is on. */
  const wanted = useMemo(
    () =>
      active && canLocate
        ? pins.filter((pin) => path === null || normalizeAppPath(pin.pagePath) === path).slice(0, LIMITS.locate)
        : [],
    [active, canLocate, pins, path],
  );
  const wantedSignature = wanted.map((pin) => pin.uid).join(',');
  const request = `${frameIdentity}|${session ?? ''}|${activation}|${wantedSignature}`;

  useEffect(() => {
    const owned = [...ownedPinIds.current];
    if (owned.length > 0) send({ type: 'pins:unwatch', payload: { pinIds: owned } });
    ownedPinIds.current = new Set();
    requestRef.current = request;
    requestedKeys.current = new Set(wanted.map((pin) => pin.uid));
    if (wanted.length === 0) return;
    send({
      type: 'locate',
      payload: {
        requests: wanted.map((pin) => ({ key: pin.uid, selector: pin.selector, tag: pin.tag, text: pin.text })),
      },
    });
    /* Re-run only when the set of pins to find changes, or the document under them does. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, send]);

  /* Stop tracking when the overlay goes away. */
  useEffect(() => {
    return () => {
      const owned = [...ownedPinIds.current];
      if (owned.length > 0) send({ type: 'pins:unwatch', payload: { pinIds: owned } });
      ownedPinIds.current = new Set();
    };
  }, [send]);

  const status: OverlayStatus =
    !listening || !appOrigin ? 'off' : capabilities === null ? 'waiting' : canLocate ? 'ready' : 'unsupported';

  /* Only answers to the request in force: after a toggle, a navigation or a new
     pin set, the previous placements are not shown while the new ones arrive. */
  const current = located.request === request ? located.entries : NOTHING_LOCATED.entries;

  const groups = useMemo(() => {
    const placed: PlacedFeedbackPin[] = [];
    const notFound: OverlayFeedbackPin[] = [];
    const pending: OverlayFeedbackPin[] = [];
    const otherPages = new Map<string, OverlayFeedbackPin[]>();
    const wantedKeys = new Set(wanted.map((pin) => pin.uid));
    for (const pin of pins) {
      if (!wantedKeys.has(pin.uid)) {
        const page = normalizeAppPath(pin.pagePath);
        if (path !== null && page === path) {
          /* This page, but the bridge can't look (no `locate`, or not ready). */
          notFound.push(pin);
          continue;
        }
        otherPages.set(page, [...(otherPages.get(page) ?? []), pin]);
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(current, pin.uid)) {
        pending.push(pin);
        continue;
      }
      const hit = current[pin.uid];
      if (hit) placed.push({ pin, pinId: hit.pinId, rect: hit.rect });
      else notFound.push(pin);
    }
    return { placed, notFound, pending, otherPages };
  }, [pins, wanted, current, path]);

  return { status, capabilities, ...groups };
}

/** The env label a pin needs, when it was made on the other environment. */
export function otherEnvLabel(pin: OverlayFeedbackPin, currentEnv: AiAppEnvironment): string | null {
  if (pin.env === currentEnv) return null;
  return pin.env === 'preview' ? 'From preview' : 'From production';
}
