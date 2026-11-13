/**
 * The story image slot, shaped like a newsfeed story image (fixed ratio, cover
 * crop, rounded corners).
 *
 * Production uses the story's existing newsfeed image (the same image the
 * LabOS newsfeed and the digest emails show, which can include people). This
 * repo is public, so the prototype draws a neutral abstract illustration
 * instead: no photos, no real people, no network requests.
 */
import clsx from 'clsx';

import s from './PlDigestIssue.module.scss';

/** Muted pairs: background, then two shape tones. */
const PALETTES = [
  ['#e8edff', '#aebfff', '#1b4dff'],
  ['#e9f6f1', '#9fd8c3', '#127a5a'],
  ['#fdf1e7', '#f5c49b', '#b54708'],
  ['#f1ecfb', '#c9b6f0', '#6941c6'],
  ['#eef1f5', '#b8c2d0', '#455468'],
] as const;

function hash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function StoryImage({ seed, size, className }: { seed: string; size: 'hero' | 'side' | 'thumb'; className?: string }) {
  const h = hash(seed);
  const [bg, soft, ink] = PALETTES[h % PALETTES.length];
  const cx = 90 + (h % 140);
  const cy = 50 + ((h >>> 3) % 80);
  const r = 40 + ((h >>> 5) % 40);
  return (
    <span className={clsx(s.image, s[`image_${size}`], className)} aria-hidden="true">
      <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" focusable="false">
        <rect width="320" height="180" fill={bg} />
        <circle cx={cx} cy={cy} r={r * 1.8} fill={soft} opacity="0.55" />
        <circle cx={320 - cx / 2} cy={180 - cy / 2} r={r} fill={soft} />
        <path d={`M0 ${130 + (h % 30)} Q 160 ${60 + (h % 50)} 320 ${120 + ((h >>> 2) % 40)} V180 H0 Z`} fill={ink} opacity="0.14" />
        <rect x={cx - 18} y={cy - 18} width="36" height="36" rx="8" fill={ink} opacity="0.7" />
      </svg>
    </span>
  );
}
