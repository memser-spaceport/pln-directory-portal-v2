'use client';

import clsx from 'clsx';

import { SUGGESTION_BAND_LABEL, type SuggestionBand } from './mocks';
import s from './MatchBadge.module.scss';

/**
 * The match band — "Strong match" / "Good match" — as one component for the
 * row, the pane's Why we suggested and the email, so the three cannot drift.
 *
 * **Gradient fills (2026-10-13, Polina's mock).** Strong wears a green → blue
 * → indigo sweep, Good a quieter teal-green. White text on both. A span, not
 * the DS `Badge`: every property of Badge's paint (fill, border, ink) is
 * overridden here, so wrapping it would only be a second opinion to beat.
 * Each fill has a solid `background-color` first, for mail clients that drop
 * gradients (Outlook).
 */
export function MatchBadge({ band, className }: { band: SuggestionBand; className?: string }) {
  return <span className={clsx(s.badge, s[band], className)}>{SUGGESTION_BAND_LABEL[band]}</span>;
}
