import clsx from 'clsx';
import s from './CoInvestorBadge.module.scss';

interface Props {
  /** PL portfolio team_ids this investor co-invested on. */
  teamIds: string[];
  /** Optional team-id → name lookup so we can show the actual team names in the tooltip. */
  teamNameLookup?: Record<string, string>;
  className?: string;
}

/**
 * Indicator for "this investor has co-invested with PL on at least one team."
 * Shows count + tooltip listing the team names.
 */
export function CoInvestorBadge({ teamIds, teamNameLookup, className }: Props) {
  if (!teamIds || teamIds.length === 0) return null;
  const names = teamNameLookup
    ? teamIds.map((id) => teamNameLookup[id] ?? id).join(', ')
    : `${teamIds.length} team${teamIds.length === 1 ? '' : 's'}`;
  return (
    <span className={clsx(s.chip, className)} title={`Co-invested with PL on: ${names}`}>
      <span className={s.icon}>🤝</span>
      Co-invested
      {teamIds.length > 1 && <span className={s.count}>×{teamIds.length}</span>}
    </span>
  );
}
