'use client';

import { useState } from 'react';
import { useGantryAnalytics } from '@/analytics/gantry.analytics';
import { useGantryItemPins } from '@/services/gantry/hooks/useGantryItemPins';
import { useGantryPinUpdate } from '@/services/gantry/hooks/useGantryPinUpdate';
import { GANTRY_IMPACT_LABELS, GANTRY_IMPACT_MAX } from '@/services/gantry/constants';
import { hasImpactData } from '@/services/gantry/impact';
import type { GantryImpactValue, GantryItem, GantryPinner } from '@/services/gantry/types';
import { avatarColor, initials } from './gantryAvatars';
import { ImpactControl } from './ImpactControl';
import s from './ImpactDetailSection.module.scss';

const MAX_RATERS_VISIBLE = 10;

/** Radial score gauge — brand-colored arc (impact is priority, not quality; never red→green). */
function ImpactRing({ value, size = 76 }: { readonly value: number; readonly size?: number }) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const fraction = Math.max(0, Math.min(1, value / GANTRY_IMPACT_MAX));
  const dash = circumference * fraction;

  return (
    <div className={s.ring} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle className={s.ringTrack} cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle
          className={s.ringArc}
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
      <div className={s.ringCenter}>
        <span className={s.ringValue}>{value.toFixed(1)}</span>
        <span className={s.ringMax}>/ {GANTRY_IMPACT_MAX}</span>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden>
      <rect x="1.5" y="5.5" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M3.5 5.5V3.5a2 2 0 0 1 4 0v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="5.5" cy="9" r="1" fill="currentColor" />
    </svg>
  );
}

function ImpactBadge({ impact }: { readonly impact: GantryImpactValue | null }) {
  if (impact === null) return <span className={s.noRating}>No rating</span>;
  return (
    <span className={s.impactBadge}>
      {impact} · {GANTRY_IMPACT_LABELS[impact]}
    </span>
  );
}

interface RaterRow {
  key: string;
  name: string;
  impact: GantryImpactValue | null;
  note: string | null;
  isAuthor: boolean;
}

interface Props {
  readonly item: GantryItem;
  readonly canCurate: boolean;
  readonly isAuthor: boolean;
  /** Frozen stages (IN_PROGRESS/SHIPPED/DECLINED): the aggregate is locked — no rating edits. */
  readonly frozen: boolean;
}

/**
 * The item drawer/page impact section: public aggregate (ring + count), the viewer's own
 * editable rating (any active booster — the curator-only rater list is hidden from members,
 * so this row is their affordance), the curator rater list (author + pins, legacy pins as
 * "No rating"), and the author's goal-link reasoning (curator + author, until objectives
 * are assigned).
 */
export function ImpactDetailSection({ item, canCurate, isAuthor, frozen }: Props) {
  const analytics = useGantryAnalytics();
  const pinUpdate = useGantryPinUpdate();
  const [showAll, setShowAll] = useState(false);

  // Same N+1-safe pattern as BoostersSection: embedded pins first, dedicated query as fallback.
  const inlinePins = item.pins;
  const { data: fetchedPins } = useGantryItemPins(item.uid, canCurate && !inlinePins && item.pinCount > 0);
  const pins: GantryPinner[] = inlinePins ?? fetchedPins ?? [];

  const showAggregate = hasImpactData(item) && item.avgImpact !== null;
  const canEditOwnRating = item.viewerHasPinned; // rating rides the active pin
  const showReasoning =
    !!item.authorImpactReasoning && (canCurate || isAuthor) && item.objectives.length === 0;

  if (!showAggregate && !canEditOwnRating && !showReasoning) return null;

  const raterRows: RaterRow[] = [
    ...(item.authorImpact !== null
      ? [
          {
            key: `author-${item.createdByUid}`,
            name: item.createdBy.name,
            impact: item.authorImpact,
            note: null,
            isAuthor: true,
          },
        ]
      : []),
    ...pins
      .filter((p) => p.releasedAt === null)
      .map((p) => ({ key: p.uid, name: p.member.name, impact: p.impact, note: p.note, isAuthor: false })),
  ];
  const visibleRaters = showAll ? raterRows : raterRows.slice(0, MAX_RATERS_VISIBLE);

  const handleOwnRatingChange = (next: GantryImpactValue) => {
    if (frozen || pinUpdate.isPending || next === item.viewerImpact) return;
    pinUpdate.mutate({ uid: item.uid, impact: next });
    analytics.onItemImpactRated(item.uid, next, item.viewerImpact !== null, 'boost');
  };

  return (
    <div className={s.section}>
      {showAggregate && item.avgImpact !== null && (
        <div className={s.aggregateRow}>
          <ImpactRing value={item.avgImpact} />
          <div className={s.aggregateText}>
            <span className={s.aggregateTitle}>Impact on company goals</span>
            <span className={s.aggregateCount}>
              {item.impactCount} rating{item.impactCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      )}

      {canEditOwnRating && (
        <div className={s.ownRating}>
          <span className={s.ownRatingLabel}>
            {item.viewerImpact !== null ? 'Your rating' : 'Add your rating'}
            {frozen && <span className={s.frozenHint}> (locked — item is {item.stage === 'IN_PROGRESS' ? 'in progress' : 'final'})</span>}
          </span>
          <ImpactControl
            value={item.viewerImpact}
            onChange={handleOwnRatingChange}
            label="Your impact rating"
            disabled={frozen || pinUpdate.isPending}
          />
        </div>
      )}

      {showReasoning && (
        <div className={s.reasoning}>
          <span className={s.reasoningLabel}>Author&apos;s goal-link</span>
          {/* Plain JSX text — never rendered as HTML (XSS rule for free-text fields). */}
          <p className={s.reasoningText}>{item.authorImpactReasoning}</p>
        </div>
      )}

      {canCurate && raterRows.length > 0 && (
        <div className={s.raters}>
          <div className={s.ratersHeader}>
            <LockIcon />
            <span>
              {raterRows.length} RATED · TEAM-ONLY
            </span>
          </div>
          {visibleRaters.map((rater) => {
            const c = avatarColor(rater.name);
            return (
              <div key={rater.key} className={s.raterRow}>
                <span className={s.raterAvatar} style={{ background: c.bg, color: c.text }}>
                  {initials(rater.name)}
                </span>
                <div className={s.raterInfo}>
                  <span className={s.raterName}>
                    {rater.name}
                    {rater.isAuthor && <span className={s.authorTag}>Author</span>}
                  </span>
                  {rater.note && <span className={s.raterNote}>{rater.note}</span>}
                </div>
                <ImpactBadge impact={rater.impact} />
              </div>
            );
          })}
          {raterRows.length > MAX_RATERS_VISIBLE && (
            <button type="button" className={s.showAll} onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Show less' : `Show all ${raterRows.length} raters`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
