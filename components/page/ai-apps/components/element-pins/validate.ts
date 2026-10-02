import { LIMITS, type BridgeRect, type ElementDescriptor } from '@/ai-apps-bridge/protocol';

/**
 * Everything the embedded app sends is untrusted: apps are member-written code
 * and the bridge runs inside them. These guards turn an arbitrary payload into
 * a well-formed value or `null` — never throw, never pass a string through
 * uncapped. Nothing validated here is ever rendered as HTML.
 */

function str(value: unknown, max: number): string | null {
  return typeof value === 'string' ? value.slice(0, max) : null;
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function toRect(value: unknown): BridgeRect | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const x = num(v.x);
  const y = num(v.y);
  const w = num(v.w);
  const h = num(v.h);
  if (x === null || y === null || w === null || h === null || w < 0 || h < 0) return null;
  /* Bound to something a screen could hold; a hostile app could send 1e308. */
  const clamp = (n: number) => Math.max(-100_000, Math.min(100_000, Math.round(n)));
  return { x: clamp(x), y: clamp(y), w: clamp(w), h: clamp(h) };
}

export function toDescriptor(value: unknown): ElementDescriptor | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const page = (v.page && typeof v.page === 'object' ? v.page : {}) as Record<string, unknown>;
  const selector = str(v.selector, LIMITS.selector);
  const tag = str(v.tag, 40);
  const rect = toRect(v.rect);
  if (!selector || !tag || !rect) return null;
  return {
    selector,
    tag,
    text: str(v.text, LIMITS.text) ?? '',
    html: str(v.html, LIMITS.html) ?? '',
    role: str(v.role, LIMITS.name),
    ariaLabel: str(v.ariaLabel, LIMITS.name),
    component: str(v.component, LIMITS.name),
    source: str(v.source, LIMITS.name),
    rect,
    page: {
      path: str(page.path, LIMITS.path) ?? '/',
      title: str(page.title, LIMITS.title) ?? '',
      viewportW: num(page.viewportW) ?? 0,
      viewportH: num(page.viewportH) ?? 0,
    },
  };
}

/** A click point within an element: both fractions in 0–1, or nothing. */
export function toPoint(value: unknown): { ox: number; oy: number } | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const ox = num(v.ox);
  const oy = num(v.oy);
  if (ox === null || oy === null || ox < 0 || ox > 1 || oy < 0 || oy > 1) return null;
  return { ox, oy };
}

/** Only raster images LabOS itself will re-host through `/v1/images`. */
export function toCropDataUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > LIMITS.cropDataUrl) return null;
  return /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(value) ? value : null;
}

/** A picked pin (`pin-N`) or a stored pin the bridge located again for the overlay (`loc-N`). */
export function toPinId(value: unknown): string | null {
  return typeof value === 'string' && /^(pin|loc)-\d{1,6}$/.test(value) ? value : null;
}

/** A `capture` correlation key LabOS minted (`cap-N`). */
export function toCaptureKey(value: unknown): string | null {
  return typeof value === 'string' && /^cap-\d{1,9}$/.test(value) ? value : null;
}

/** A viewport picture: a raster LabOS can re-host, and the CSS viewport size it shows. */
export function toCaptureResult(
  payload: Record<string, unknown>,
): { dataUrl: string; width: number; height: number } | null {
  const dataUrl = toCropDataUrl(payload.dataUrl);
  const width = num(payload.width);
  const height = num(payload.height);
  if (!dataUrl || width === null || height === null) return null;
  if (width < 1 || height < 1 || width > 100_000 || height > 100_000) return null;
  return { dataUrl, width, height };
}
