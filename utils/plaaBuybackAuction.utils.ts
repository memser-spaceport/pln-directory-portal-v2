import { format, toZonedTime } from 'date-fns-tz';

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export type BuybackAuctionPhase = 'upcoming' | 'live' | 'ended';

/** Never treat the auction as live before `startMs`, and stop treating it as
 *  live once `endMs` passes — the two boundaries callers care about. */
export function getBuybackAuctionPhase(nowMs: number, startMs: number, endMs: number): BuybackAuctionPhase {
  if (nowMs < startMs) return 'upcoming';
  if (nowMs > endMs) return 'ended';
  return 'live';
}

/** "3 days left to bid" above one full day remaining; otherwise an hour-based
 *  reading ("6 hours left to bid") so the countdown never bottoms out at a
 *  useless "0 days left to bid" on the auction's last day. */
export function formatBuybackCountdown(nowMs: number, endMs: number): string {
  const msLeft = Math.max(0, endMs - nowMs);
  const daysLeft = Math.floor(msLeft / MS_PER_DAY);

  if (daysLeft >= 1) {
    return `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left to bid`;
  }

  const hoursLeft = Math.max(1, Math.ceil(msLeft / MS_PER_HOUR));
  return `${hoursLeft} ${hoursLeft === 1 ? 'hour' : 'hours'} left to bid`;
}

/** 0–100, how far the auction has progressed from start to end. Clamped so a
 *  debug override outside the window (or a moment of clock skew) can never
 *  invert or overflow the bar. */
export function getBuybackAuctionProgressPct(nowMs: number, startMs: number, endMs: number): number {
  if (endMs <= startMs) return 0;
  const pct = ((nowMs - startMs) / (endMs - startMs)) * 100;
  return Math.min(100, Math.max(0, pct));
}

/** "Sep 29, 12:00 PM EDT" — converts a UTC ISO timestamp into the browser's
 *  own timezone with a live abbreviation, rather than hardcoding Eastern
 *  Time, so it reads correctly for every bidder regardless of where they are. */
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

/** Dev-only "now" override for previewing every auction state without
 *  touching the system clock. Reads `?debugBuybackNow=<ISO timestamp>` for an
 *  exact moment, or `?debugBuybackPhase=upcoming|live|ending-soon|ended` for a
 *  preset relative to the auction's own start/end. Returns null when neither
 *  param is present or valid. Callers must gate this on a non-production
 *  environment themselves — kept out of here so the function stays a plain,
 *  trivially testable read of a URLSearchParams. */
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
