/* Whether this browser has dismissed the PLAA September buyback auction
 * banner (components/core/navbar/components/PlaaBuybackBanner).
 *
 * Same useSyncExternalStore shape as utils/homeLastVisited.ts: read through
 * the store, not an effect, so SSR and the first client render agree — the
 * server can never know what a browser's localStorage holds.
 */
const STORAGE_KEY = 'plaa-buyback-banner-dismissed:2026-09';

function read(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    // Private mode, blocked storage, quota — treat as not dismissed.
    return false;
  }
}

const listeners = new Set<() => void>();

export function subscribeBuybackBannerDismissed(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getBuybackBannerDismissed(): boolean {
  return read();
}

/** The server can never know this. Always false, so SSR and the first client
 *  render agree that the banner has not been dismissed. */
export function getBuybackBannerDismissedServerSnapshot(): boolean {
  return false;
}

export function dismissBuybackBanner(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Losing the stamp only costs the banner reappearing once; never break the page.
  }
  listeners.forEach((listener) => listener());
}
