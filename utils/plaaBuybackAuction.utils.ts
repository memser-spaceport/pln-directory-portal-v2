import { format, toZonedTime } from 'date-fns-tz';

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export type BuybackAuctionPhase = 'upcoming' | 'live' | 'ended';

export function getBuybackAuctionPhase(nowMs: number, startMs: number, endMs: number): BuybackAuctionPhase {
  if (nowMs < startMs) return 'upcoming';
  if (nowMs > endMs) return 'ended';
  return 'live';
}

export function formatBuybackCountdown(nowMs: number, endMs: number): string {
  const msLeft = Math.max(0, endMs - nowMs);
  const daysLeft = Math.floor(msLeft / MS_PER_DAY);

  if (daysLeft >= 1) {
    return `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left to bid`;
  }

  // Floors at 1 so the last hour reads "1 hour left", never "0 hours left".
  const hoursLeft = Math.max(1, Math.ceil(msLeft / MS_PER_HOUR));
  return `${hoursLeft} ${hoursLeft === 1 ? 'hour' : 'hours'} left to bid`;
}

export function getBuybackAuctionProgressPct(nowMs: number, startMs: number, endMs: number): number {
  if (endMs <= startMs) return 0;
  const pct = ((nowMs - startMs) / (endMs - startMs)) * 100;
  return Math.min(100, Math.max(0, pct));
}

export function formatBuybackAuctionEnd(endIso: string): string {
  try {
    const date = new Date(endIso);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const zonedDate = toZonedTime(date, timeZone);
    return format(zonedDate, 'MMM d, h:mm a zzz', { timeZone });
  } catch {
    return endIso;
  }
}

export type BuybackDebugPhase = 'upcoming' | 'live' | 'ending-soon' | 'ended';

const DEBUG_PHASE_PRESETS: Record<BuybackDebugPhase, (startMs: number, endMs: number) => number> = {
  upcoming: (startMs) => startMs - MS_PER_HOUR,
  live: (startMs, endMs) => startMs + (endMs - startMs) / 2,
  'ending-soon': (_startMs, endMs) => endMs - 3 * MS_PER_HOUR,
  ended: (_startMs, endMs) => endMs + MS_PER_HOUR,
};

/** Callers must gate this on a non-production environment themselves. */
export function getBuybackDebugNowOverride(
  searchParams: URLSearchParams | null | undefined,
  startMs: number,
  endMs: number,
): number | null {
  if (!searchParams) return null;

  const isoParam = searchParams.get('debugBuybackNow');
  if (isoParam) {
    const parsed = Date.parse(isoParam);
    if (!Number.isNaN(parsed)) return parsed;
  }

  const phaseParam = searchParams.get('debugBuybackPhase') as BuybackDebugPhase | null;
  if (phaseParam && phaseParam in DEBUG_PHASE_PRESETS) {
    return DEBUG_PHASE_PRESETS[phaseParam](startMs, endMs);
  }

  return null;
}
