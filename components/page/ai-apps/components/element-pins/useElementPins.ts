'use client';

import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { LIMITS, envelope, isEnvelope, type ParentMessage } from '@/ai-apps-bridge/protocol';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { toCaptureKey, toCaptureResult, toCropDataUrl, toDescriptor, toPinId, toPoint, toRect } from './validate';
import type { ElementPin } from './types';

/**
 * How long after the iframe's `load` event the app has to say `ready` before
 * the feedback button settles on the screenshot flow. The bridge normally
 * announces itself BEFORE `load` (it is a deferred script), so this only runs
 * out for apps built without it.
 */
export const BRIDGE_READY_TIMEOUT_MS = 2000;
const HELLO_RETRY_MS = [300, 1000, 2500];
/** Loading the bridge's renderer (first use) plus rendering the viewport. Measured well under this. */
export const CAPTURE_TIMEOUT_MS = 20_000;

/** A picture of the app as it is on screen; `width`/`height` are the viewport in CSS px. */
export type AppCapture = { dataUrl: string; width: number; height: number };

/**
 * Why `capture()` gave no picture: `unsupported` (no bridge, or one older than
 * `capture`), `timeout`, `reloaded` (the frame changed document meanwhile), or
 * the bridge's own error (`too-large`, `capture-missing`, a renderer message).
 */
export class AppCaptureError extends Error {
  constructor(readonly reason: string) {
    super(reason);
    this.name = 'AppCaptureError';
  }
}

type PendingCapture = {
  resolve: (capture: AppCapture) => void;
  reject: (error: AppCaptureError) => void;
  timer: ReturnType<typeof setTimeout>;
};

export type BridgeStatus = 'off' | 'waiting' | 'ready' | 'unavailable';

type Options = {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  /** The app's exact origin; messages from anywhere else are dropped. */
  appOrigin: string | null;
  /** Changes when the iframe is remounted (a redeploy): all pin state belongs to the old frame. */
  frameKey: string;
  enabled: boolean;
  appUid: string;
};

export type ElementPinsController = ReturnType<typeof useElementPins>;

/**
 * LabOS's half of the bridge: the handshake, the pin list, and the only place
 * that reads messages from the app. See `ai-apps-bridge/protocol.ts` for the
 * contract and the spike doc for the security model.
 */
export function useElementPins({ iframeRef, appOrigin, frameKey, enabled, appUid }: Options) {
  /* useAiAppsAnalytics returns a fresh object every render. Held in a ref so
     the message listener subscribes once per origin — re-subscribing on every
     render re-sent `hello` each time and the echoed `ready` cancelled picking. */
  const analyticsNow = useAiAppsAnalytics();
  const analyticsRef = useRef(analyticsNow);
  useEffect(() => {
    analyticsRef.current = analyticsNow;
  });
  const [status, setStatus] = useState<BridgeStatus>(enabled && appOrigin ? 'waiting' : 'off');
  const [isPicking, setIsPicking] = useState(false);
  const [pins, setPins] = useState<ElementPin[]>([]);
  /** What the bridge said it can do in its last `ready` (recorded with feedback as context). */
  const [capabilities, setCapabilities] = useState<string[]>([]);
  /* The message handler is registered once per origin and reads these instead
     of state, so it never re-subscribes (and never misses a message) on a pin
     change. `pinsRef` is the source of truth: every write goes through
     `commitPins`, so a `pins:rects` arriving mid-keystroke can't resurrect an
     older note. */
  const statusRef = useRef(status);
  const pinsRef = useRef(pins);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  const commitPins = useCallback((update: (prev: ElementPin[]) => ElementPin[]) => {
    const next = update(pinsRef.current);
    if (next === pinsRef.current) return;
    pinsRef.current = next;
    setPins(next);
  }, []);
  const readyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Read by `capture()` without re-creating it on every `ready`. */
  const capabilitiesRef = useRef<string[]>([]);
  const pendingCaptures = useRef(new Map<string, PendingCapture>());
  const captureCounter = useRef(0);
  /** Every capture still waiting fails: its frame is gone or the app reloaded. */
  const failPendingCaptures = useCallback((reason: string) => {
    for (const [key, pending] of pendingCaptures.current) {
      clearTimeout(pending.timer);
      pending.reject(new AppCaptureError(reason));
      pendingCaptures.current.delete(key);
    }
  }, []);
  /** The bridge's per-page-load id from the last `ready`. */
  const bridgeSession = useRef<string | null>(null);
  const reportedUnavailable = useRef<string | null>(null);

  const send = useCallback(
    (message: ParentMessage) => {
      const target = iframeRef.current?.contentWindow;
      if (!target || !appOrigin) return;
      target.postMessage(envelope(message), appOrigin);
    },
    [iframeRef, appOrigin],
  );

  /* A remounted frame is a new document: nothing from the old one carries
     over. State is reset during render (not in an effect) so no frame renders
     the previous document's pins; the ref follows in the effect. */
  const frameIdentity = `${enabled && appOrigin ? appOrigin : 'off'}|${frameKey}`;
  const [seenIdentity, setSeenIdentity] = useState(frameIdentity);
  if (seenIdentity !== frameIdentity) {
    setSeenIdentity(frameIdentity);
    setStatus(enabled && appOrigin ? 'waiting' : 'off');
    setIsPicking(false);
    setPins([]);
    setCapabilities([]);
  }
  useEffect(() => {
    pinsRef.current = [];
    bridgeSession.current = null;
    capabilitiesRef.current = [];
    return () => {
      if (readyTimer.current) clearTimeout(readyTimer.current);
      failPendingCaptures('reloaded');
    };
  }, [frameIdentity, failPendingCaptures]);

  useEffect(() => {
    if (!enabled || !appOrigin) return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== appOrigin || event.source !== iframeRef.current?.contentWindow) return;
      if (!isEnvelope(event.data)) return;
      const payload = (event.data.payload ?? {}) as Record<string, unknown>;

      switch (event.data.type) {
        case 'ready': {
          if (readyTimer.current) clearTimeout(readyTimer.current);
          setStatus('ready');
          if (Array.isArray(payload.capabilities)) {
            const next = payload.capabilities
              .filter((c): c is string => typeof c === 'string')
              .map((c) => c.slice(0, 32))
              .slice(0, 10);
            capabilitiesRef.current = next;
            setCapabilities(next);
          }
          const session = typeof payload.session === 'string' ? payload.session.slice(0, 40) : null;
          const previous = bridgeSession.current;
          bridgeSession.current = session;
          /* Same session = an answer to our `hello`, nothing changed. A new one
             means the app loaded a new document (a full-page navigation): its
             bridge has never heard of our pins, and it isn't picking. */
          if (previous === null || previous === session) return;
          setIsPicking(false);
          failPendingCaptures('reloaded');
          commitPins((prev) => (prev.some((p) => p.rect) ? prev.map((p) => ({ ...p, rect: null })) : prev));
          return;
        }
        case 'pick:selected': {
          const pinId = toPinId(payload.pinId);
          const element = toDescriptor(payload.element);
          setIsPicking(false);
          const current = pinsRef.current;
          if (!pinId || !element || current.length >= LIMITS.pins || current.some((p) => p.id === pinId)) return;
          const next = [
            ...current,
            {
              id: pinId,
              element,
              rect: element.rect,
              note: '',
              crop: { status: 'pending' },
              point: toPoint(payload.point),
            } as ElementPin,
          ];
          commitPins(() => next);
          analyticsRef.current.onFeedbackPinAdded({
            appUid,
            hasComponent: Boolean(element.component),
            pinCount: next.length,
          });
          send({ type: 'crop', payload: { pinId } });
          return;
        }
        case 'pick:cancelled':
          setIsPicking(false);
          return;
        case 'pins:rects': {
          const rects = payload.rects;
          if (!rects || typeof rects !== 'object') return;
          const next = pinsRef.current.map((pin) => {
            if (!Object.prototype.hasOwnProperty.call(rects, pin.id)) return pin;
            const rect = toRect((rects as Record<string, unknown>)[pin.id]);
            if (!rect && pin.rect) analyticsRef.current.onFeedbackPinDetached({ appUid });
            return { ...pin, rect };
          });
          commitPins(() => next);
          return;
        }
        case 'crop:result': {
          const pinId = toPinId(payload.pinId);
          if (!pinId) return;
          const dataUrl = toCropDataUrl(payload.dataUrl);
          const error = dataUrl ? null : typeof payload.error === 'string' ? payload.error.slice(0, 60) : 'invalid';
          if (error) analyticsRef.current.onFeedbackPinCropFailed({ appUid, error });
          commitPins((prev) =>
            prev.map((pin) =>
              pin.id !== pinId
                ? pin
                : { ...pin, crop: dataUrl ? { status: 'done', dataUrl } : { status: 'failed', error: error ?? '' } },
            ),
          );
          return;
        }
        case 'capture:result': {
          const key = toCaptureKey(payload.key);
          const pending = key ? pendingCaptures.current.get(key) : undefined;
          if (!key || !pending) return;
          clearTimeout(pending.timer);
          pendingCaptures.current.delete(key);
          const result = toCaptureResult(payload);
          if (result) pending.resolve(result);
          else
            pending.reject(
              new AppCaptureError(typeof payload.error === 'string' ? payload.error.slice(0, 60) : 'invalid'),
            );
          return;
        }
        case 'shortcut:feedback':
          /* Replayed here so it goes through the same checks as Alt+F pressed
             outside the frame (dialogs open, comment mode, and so on). */
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ƒ', code: 'KeyF', altKey: true }));
          return;
        default:
          return;
      }
    };

    window.addEventListener('message', onMessage);
    /* The frame may have loaded — and announced itself — before this listener
       existed (seen in the harness: `ready` and `load` both landed first). Ask
       again. If the frame is still on about:blank the browser drops this with a
       console warning about the target origin; the `onLoad` hello covers it. */
    send({ type: 'hello' });
    /* …and a few more times: when the iframe is in server-rendered HTML it can
       finish loading before React attaches `onLoad`, so neither the first
       hello (still about:blank) nor the load hello ever reaches the bridge. */
    const retries = HELLO_RETRY_MS.map((ms) =>
      setTimeout(() => {
        if (statusRef.current !== 'ready') send({ type: 'hello' });
      }, ms),
    );
    return () => {
      retries.forEach(clearTimeout);
      window.removeEventListener('message', onMessage);
    };
  }, [enabled, appOrigin, iframeRef, send, appUid, commitPins, failPendingCaptures]);

  /* Captures can't outlive the hook (a page change, the flag turned off). */
  useEffect(() => () => failPendingCaptures('reloaded'), [failPendingCaptures]);

  /**
   * A picture of the app as it is on screen, from its bridge — no screen-share
   * prompt. Rejects at once with `unsupported` when the bridge isn't ready or
   * predates `capture` (callers fall back to the screen share), and after
   * CAPTURE_TIMEOUT_MS with `timeout`.
   */
  const capture = useCallback(
    () =>
      new Promise<AppCapture>((resolve, reject) => {
        if (statusRef.current !== 'ready' || !capabilitiesRef.current.includes('capture')) {
          reject(new AppCaptureError('unsupported'));
          return;
        }
        captureCounter.current += 1;
        const key = `cap-${captureCounter.current}`;
        const timer = setTimeout(() => {
          pendingCaptures.current.delete(key);
          reject(new AppCaptureError('timeout'));
        }, CAPTURE_TIMEOUT_MS);
        pendingCaptures.current.set(key, { resolve, reject, timer });
        send({ type: 'capture', payload: { key } });
      }),
    [send],
  );

  /**
   * Scrolls the app as a wheel at `x`,`y` (the app's viewport, CSS px) would
   * have: Pick a part's layer sits over the frame and catches the wheel. A
   * no-op unless the bridge says it can.
   */
  const scrollApp = useCallback(
    (x: number, y: number, dx: number, dy: number) => {
      if (statusRef.current !== 'ready' || !capabilitiesRef.current.includes('scroll')) return;
      send({ type: 'scroll', payload: { x, y, dx, dy } });
    },
    [send],
  );

  /** Wire to the iframe's `onLoad`. Asks a bridge that loaded before we listened to announce itself again. */
  const onFrameLoad = useCallback(() => {
    if (!enabled || !appOrigin) return;
    send({ type: 'hello' });
    if (readyTimer.current) clearTimeout(readyTimer.current);
    readyTimer.current = setTimeout(() => {
      if (statusRef.current === 'ready') return;
      setStatus('unavailable');
      if (reportedUnavailable.current !== frameKey) {
        reportedUnavailable.current = frameKey;
        analyticsRef.current.onFeedbackBridgeUnavailable({ appUid });
      }
    }, BRIDGE_READY_TIMEOUT_MS);
  }, [enabled, appOrigin, send, frameKey, appUid]);

  const startPicking = useCallback(() => {
    if (statusRef.current !== 'ready') return;
    setIsPicking(true);
    send({ type: 'pick:start' });
    /* Esc and ⌥ are read by the bridge, inside the frame. */
    iframeRef.current?.focus();
  }, [send, iframeRef]);

  const stopPicking = useCallback(() => {
    setIsPicking(false);
    send({ type: 'pick:stop' });
  }, [send]);

  const setNote = useCallback(
    (pinId: string, note: string) => {
      commitPins((prev) => prev.map((pin) => (pin.id === pinId ? { ...pin, note } : pin)));
    },
    [commitPins],
  );

  const removePin = useCallback(
    (pinId: string) => {
      analyticsRef.current.onFeedbackPinRemoved({ appUid });
      commitPins((prev) => prev.filter((pin) => pin.id !== pinId));
      send({ type: 'pins:unwatch', payload: { pinIds: [pinId] } });
    },
    [send, appUid, commitPins],
  );

  const clearPins = useCallback(() => {
    setIsPicking(false);
    commitPins(() => []);
    send({ type: 'pins:clear' });
  }, [send, commitPins]);

  return {
    status,
    capabilities,
    /** The bridge can take a picture of the app (`capture()` won't reject as `unsupported`). */
    canCapture: status === 'ready' && capabilities.includes('capture'),
    capture,
    /** The bridge can scroll the app for Pick a part (`scrollApp` won't be a no-op). */
    canScroll: status === 'ready' && capabilities.includes('scroll'),
    scrollApp,
    isPicking,
    pins,
    onFrameLoad,
    startPicking,
    stopPicking,
    setNote,
    removePin,
    clearPins,
  };
}
