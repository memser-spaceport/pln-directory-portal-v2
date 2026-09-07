'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * A progress bar for a wait nobody can measure.
 *
 * The parse is asynchronous and gives up no percentage: `cv-import.service`
 * uploads, gets a 202, then polls `/cv-imports/latest` every 2s until the row
 * reaches a terminal status. There is a *status* to read and never a fraction,
 * so any bar over this wait is invented.
 *
 * Which is worth doing carefully rather than not doing — the honest alternative
 * already exists here and was rejected on purpose. `core/Loader/ProgressBar`
 * sweeps indeterminately, and says why in its own doc: "there is no real progress
 * signal behind it (the trigger is a boolean), so it sweeps rather than faking a
 * percentage." That is right for a bar covering arbitrary navigation of unknown
 * length. It is not right here: this is *one bounded operation*, with a ceiling
 * the client itself enforces (`PARSE_TIMEOUT_MS`, 60s) and a real completion
 * event to land on. A determinate bar can be truthful about all of that, on one
 * condition — that it never claims to be finished before it is.
 *
 * **So the curve cannot reach 100.** `settle` is the only route there, and only a
 * resolved read calls it. 100% means done, always; the long tail is a bar still
 * visibly moving rather than one parked at 95.
 */

/**
 * The asymptote, and the reason there is only one formula here.
 *
 * A single exponential does both halves of the brief — "ease to about 90% over
 * ten seconds" and "keep creeping afterwards" — with no phase to switch between
 * and no branch to get wrong:
 *
 *     p(t) = CEIL * (1 - exp(-t / TAU))
 *
 *     t = 10s → 90%      t = 20s → ~96%      t = 60s → ~97%
 *
 * Monotonic and self-limiting: it approaches CEIL and cannot pass it, so the gap
 * between the curve and 100 is structural rather than a clamp somebody could
 * later "simplify" away.
 */
const CEIL = 97;

/**
 * How fast the curve fills — and a **guess**, not a measurement.
 *
 * Chosen so p(10s) ≈ 90%, because ten seconds is the expectation this was
 * designed around. Nobody has p50/p95 for the parse. If the real median turns
 * out to be ~3s the bar sits near 55% on every success; if it is ~25s most
 * people watch the crawl. Both are wrong in a way that is invisible from the
 * code, so: fit this to real latency once the funnel can report it.
 */
const TAU_MS = 3_800;

/**
 * Sampling rate. Shorter than the 300ms CSS transition, so consecutive
 * transitions overlap and the fill moves continuously rather than in steps.
 *
 * Bounded by the parse timeout: 60s ⇒ ~300 renders of a three-node row that is
 * the only thing on screen.
 */
const TICK_MS = 200;

const curveAt = (elapsedMs: number) => CEIL * (1 - Math.exp(-elapsedMs / TAU_MS));

/**
 * Driven by events, not by a status flag.
 *
 * An earlier version took `active: boolean` and reset itself in an effect, which
 * is the shape `react-hooks/set-state-in-effect` exists to catch — and the rule
 * was right: the panel already knows exactly when a read begins and ends, so a
 * flag for the hook to *notice* was a second copy of something already known.
 * `start`/`stop`/`settle` are called from the three places that make those
 * things happen, and the interval is the only thing left for an effect to own.
 */
export function useReadingProgress() {
  /** When the current read began, or `null` between reads. Owns the interval. */
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (startedAt === null) return;

    const id = setInterval(() => {
      /* Position from an ABSOLUTE start, never accumulated tick by tick: a
         backgrounded tab has its intervals throttled to roughly once a second,
         and a counter that added up its own ticks would come back visibly
         behind. This one comes back exactly where it should be.

         `Math.max` keeps the bar monotonic, which also closes a small race: a
         tick already queued when `settle` runs would otherwise land after the
         100 and drag the finished bar back down to ~90 for the length of the
         hold. The curve tops out below CEIL, so it can never win against 100. */
      setProgress((previous) => Math.max(previous, curveAt(Date.now() - startedAt)));
    }, TICK_MS);

    return () => clearInterval(id);
  }, [startedAt]);

  /** A read has begun. */
  const start = useCallback(() => {
    setProgress(0);
    setStartedAt(Date.now());
  }, []);

  /** A read ended without finishing — cancelled, superseded, or failed. */
  const stop = useCallback(() => {
    setStartedAt(null);
    setProgress(0);
  }, []);

  /** The read came back. The only route to 100. */
  const settle = useCallback(() => {
    setStartedAt(null);
    setProgress(100);
  }, []);

  return { progress, start, stop, settle };
}
