import clsx from 'clsx';
import type { ScoreBand } from '@/services/investors/warm-intros-v2.types';
import s from './ScorePercentPill.module.scss';

interface Props {
  scorePercent: number;
  scoreBand?: ScoreBand;
  className?: string;
}

function deriveScoreBand(scorePercent: number): ScoreBand {
  if (!Number.isFinite(scorePercent) || scorePercent <= 0) return 'none';
  if (scorePercent > 60) return 'green';
  if (scorePercent >= 25) return 'yellow';
  return 'red';
}

/** Score % colored by API `scoreBand` (or derived): green >60 · yellow 25–60 · red 1–25. */
export function ScorePercentPill({ scorePercent, scoreBand, className }: Props) {
  const band = scoreBand ?? deriveScoreBand(scorePercent);
  const bandClass = band === 'green' ? s.green : band === 'yellow' ? s.yellow : band === 'red' ? s.red : s.muted;

  return (
    <span className={clsx(s.pill, bandClass, className)} title={`Score ${scorePercent}%`}>
      {scorePercent}%
    </span>
  );
}
