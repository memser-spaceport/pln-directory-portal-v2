'use client';

// Qualitative alignment — for when we don't have an exact % yet, only a bucket.
// A discrete 3-segment meter (filled count = level) + the word, so it reads as a
// coarse "High / Medium / Low" and never implies false precision. Single hue:
// the number of filled segments is the signal, not color.
import clsx from 'clsx';
import { alignmentTier, type AlignmentTier } from './tiers';
import s from './AlignmentLevel.module.scss';

const LEVEL: Record<AlignmentTier, { filled: number; tierClass: string }> = {
  strong: { filled: 3, tierClass: s.tierStrong },
  promising: { filled: 2, tierClass: s.tierPromising },
  marginal: { filled: 1, tierClass: s.tierMarginal },
};

interface Props {
  /** Alignment as a 0–1 fraction. The meter shows the tier; the % shows the value. */
  value: number;
  size?: 'sm' | 'lg';
}

export function AlignmentLevel({ value, size = 'sm' }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  const { filled, tierClass } = LEVEL[alignmentTier(value)];
  return (
    <div className={clsx(s.wrap, size === 'lg' && s.lg, tierClass)} role="img" aria-label={`Alignment ${pct} percent`}>
      <span className={s.meter} aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className={clsx(s.seg, i < filled && s.segOn)} />
        ))}
      </span>
      <span className={s.value}>{pct}%</span>
    </div>
  );
}
