'use client';

import { clsx } from 'clsx';
import type { ImpactLevel, ImpactRating, PerObjectiveImpact } from '../mocks';
import { IMPACT_LABELS, IMPACT_LEVELS_DESC, IMPACT_MAX } from '../mocks';
import type { ImpactAggregate } from './impact';
import { avatarColor, initials } from './ImpactVotersSection';
import bs from '@/components/page/gantry/shared/BoostersSection.module.scss';
import s from './CuratorStrip.module.scss';

const MAX_STACK = 2;

// The production team-only lock (BoostersSection), reused so the badge reads exactly like the app.
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
  readonly aggregate: ImpactAggregate;
  /** Everyone who rated (excluding the viewer) — team-only names. */
  readonly ratings: ImpactRating[];
  /** The viewer's live rating, layered on top of the mocked raters. */
  readonly viewerRating: { level: ImpactLevel; note: string | null } | null;
  /** Team members (curators) additionally see who rated + the author claim. */
  readonly curator: boolean;
  /** Opens the item drawer, where the full rater list + notes live. */
  readonly onShowRaters: () => void;
  /** When provided, renders a per-objective impact breakdown (team-only). */
  readonly objectives?: { uid: string; order: number; title: string }[];
  readonly perObjective?: PerObjectiveImpact[];
}

export function CuratorStrip({
  aggregate,
  ratings,
  viewerRating,
  curator,
  onShowRaters,
  objectives,
  perObjective,
}: Props) {
  const { impactDistribution: dist } = aggregate;

  const levelCounts = IMPACT_LEVELS_DESC.filter((level) => dist[level] > 0).map(
    (level) => `${dist[level]} ${IMPACT_LABELS[level]}`,
  );

  const raterNames = [...(viewerRating ? ['You'] : []), ...ratings.map((r) => r.member.name)];
  const stack = raterNames.slice(0, MAX_STACK);
  const overflow = raterNames.length - stack.length;

  // The rating distribution as one dim line to keep the strip compact.
  const summaryParts = levelCounts;

  return (
    <div className={s.strip} onClick={(e) => e.stopPropagation()}>
      <div className={bs.boostersHeader}>
        <LockIcon />
        <span>Team-only</span>
      </div>

      {curator && summaryParts.length > 0 && <div className={clsx(s.stats, s.dim)}>{summaryParts.join(' · ')}</div>}

      {curator && raterNames.length > 0 && (
        <button
          type="button"
          className={s.raterStack}
          onClick={onShowRaters}
          aria-label={`Show all ${raterNames.length} ratings & notes`}
          title={`Show all ${raterNames.length} ratings & notes`}
        >
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
          {overflow > 0 && <span className={clsx(s.stackAvatar, s.stackMore)}>+{overflow}</span>}
        </button>
      )}

      {curator && objectives && perObjective && perObjective.length > 0 && (
        <div className={s.objectives}>
          {objectives.map((obj) => {
            const po = perObjective.find((p) => p.objectiveUid === obj.uid);
            return (
              <div key={obj.uid} className={s.objectiveRow}>
                <span className={s.objectiveBadge}>O{obj.order}</span>
                <span className={s.objectiveTitle}>{obj.title}</span>
                <span className={s.objectiveAvg}>{po?.avg != null ? `${po.avg.toFixed(1)} / ${IMPACT_MAX}` : '—'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
