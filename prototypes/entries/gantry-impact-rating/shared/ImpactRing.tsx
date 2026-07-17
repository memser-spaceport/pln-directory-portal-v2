'use client';

// A radial score gauge for the drawer's impact readout — value in the center, brand-colored
// arc (never red→green: impact is priority, not quality). SVG so it stays crisp at any size.

import s from './ImpactRing.module.scss';

interface Props {
  readonly value: number;
  readonly max: number;
  readonly size?: number;
}

export function ImpactRing({ value, max, size = 76 }: Props) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const fraction = Math.max(0, Math.min(1, value / max));
  const dash = circumference * fraction;

  return (
    <div className={s.ring} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle className={s.track} cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle
          className={s.arc}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className={s.center}>
        <span className={s.value}>{value.toFixed(1)}</span>
        <span className={s.max}>/ {max}</span>
      </div>
    </div>
  );
}
