'use client';

import { GANTRY_IMPACT_LABELS, GANTRY_IMPACT_VALUES } from '@/services/gantry/constants';
import { hasImpactData } from '@/services/gantry/impact';
import type { GantryItem } from '@/services/gantry/types';
import { avatarColor, initials } from './gantryAvatars';
import s from './ImpactSummaryStrip.module.scss';

const MAX_STACK = 3;

// Same team-only lock as BoostersSection so the badge reads exactly like the rest of the app.
function LockIcon() {
  return (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden>
      <rect x="1.5" y="5.5" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M3.5 5.5V3.5a2 2 0 0 1 4 0v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="5.5" cy="9" r="1" fill="currentColor" />
    </svg>
  );
}

interface Props {
  readonly item: GantryItem;
  readonly canCurate: boolean;
}

/**
 * Curator-only board-card rater breakdown (the PUBLIC score renders inline in the card's
 * meta row, next to Boost — prototype layout). Shows the rating distribution and the rater
 * avatar stack, built from the already-embedded curator `pins[]` (never a per-card query)
 * plus the author. PURE PROPS — no hooks: cards are unmemoized and re-render on every dnd
 * drag frame. Full rater details live on the item drawer/page.
 */
export function ImpactSummaryStrip({ item, canCurate }: Props) {
  if (!canCurate || !hasImpactData(item)) return null;

  const distribution = item.impactDistribution;
  const stats = distribution
    ? [...GANTRY_IMPACT_VALUES]
        .reverse()
        .filter((value) => distribution[value] > 0)
        .map((value) => `${distribution[value]} ${GANTRY_IMPACT_LABELS[value]}`)
    : [];

  const raterNames = [
    ...(item.authorImpact !== null ? [item.createdBy.name] : []),
    ...(item.pins ?? []).filter((p) => p.impact !== null && p.releasedAt === null).map((p) => p.member.name),
  ];
  const stack = raterNames.slice(0, MAX_STACK);
  const overflow = raterNames.length - stack.length;

  return (
    <div className={s.strip}>
      <div className={s.headerRow}>
        <span className={s.teamOnly}>
          <LockIcon />
          <span>Team-only</span>
        </span>
        {raterNames.length > 0 && (
          <span className={s.raterStack} aria-label={`Rated by ${raterNames.length} members (team-only)`}>
            {stack.map((name, i) => {
              const c = avatarColor(name);
              return (
                <span
                  key={`${name}-${i}`}
                  className={s.stackAvatar}
                  style={{ background: c.bg, color: c.text, zIndex: MAX_STACK - i }}
                  aria-hidden
                >
                  {initials(name)}
                </span>
              );
            })}
            {overflow > 0 && <span className={`${s.stackAvatar} ${s.stackMore}`}>+{overflow}</span>}
          </span>
        )}
      </div>
      {stats.length > 0 && <div className={s.stats}>{stats.join(' · ')}</div>}
    </div>
  );
}
