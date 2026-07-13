'use client';

// Prototype-local copy of the production roadmap card body (per prototypes/README "copy & simplify"),
// with the new Impact signal: a quiet read-only aggregate badge next to Boost, and the rating itself
// collected in the post-boost popover (mirroring production's PinNotePopover moment). Reuses
// production styles + presentational sub-components by import (read-only); production stays untouched.

import { clsx } from 'clsx';
import { truncateText } from '@/utils/forum';
import { GantryItemAuthor } from '@/components/page/gantry/shared/GantryItemAuthor';
import { BoostButton } from '@/components/page/gantry/shared/BoostButton';
import s from '@/components/page/gantry/roadmap/Roadmap.module.scss';
import type { MockRoadmapItem } from './mocks';
import { BoostImpactPopover } from './shared/BoostImpactPopover';
import { CuratorStrip } from './shared/CuratorStrip';
import { ImpactBadge } from './shared/ImpactBadge';
import { foldObjectiveImpact, useImpactCardState } from './shared/useImpactCardState';

const CARD_DESCRIPTION_MAX_LENGTH = 160;

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M6 3.5V6l1.75 1.75"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function toPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

interface Props {
  readonly item: MockRoadmapItem;
  readonly position?: number;
  readonly variant: 'overall' | 'per-objective';
  readonly curatorView: boolean;
}

export function RoadmapImpactCard({ item, position, variant, curatorView }: Props) {
  const {
    hasBoosted,
    boostCount,
    toggleBoost,
    viewerImpact,
    objectiveRatings,
    aggregate,
    popoverPos,
    saveRating,
    skipRating,
  } = useImpactCardState(item, variant);

  const descriptionPreview = truncateText(toPlainText(item.description ?? ''), CARD_DESCRIPTION_MAX_LENGTH);
  const interactionLocked = item.stage === 'IN_PROGRESS' || item.stage === 'SHIPPED' || item.stage === 'DECLINED';
  const perObjective = item.impact.perObjectiveImpact.map((po) =>
    foldObjectiveImpact(po, objectiveRatings[po.objectiveUid]),
  );

  return (
    <article className={s.card}>
      <div className={s.cardTopRow}>
        <div className={s.cardPositionBadge}>
          {position !== undefined && item.stage !== 'IDEA' && item.stage !== 'SHIPPED' && item.stage !== 'DECLINED' && (
            <span className={clsx(s[`cardPosition_${item.stage}`])}>#{position}</span>
          )}
        </div>
        <h3 className={s.cardTitle}>{item.title}</h3>
        {item.objectives?.length > 0 && (
          <span className={s.objectiveBadges}>
            {item.objectives.map((objective) => (
              <span key={objective.uid} className={s.objectiveBadge}>
                <span
                  aria-hidden
                  style={{
                    display: 'inline-block',
                    flex: '0 0 auto',
                    alignSelf: 'center',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'currentColor',
                  }}
                />
                O{objective.order}
              </span>
            ))}
          </span>
        )}
      </div>

      {descriptionPreview && <p className={s.cardDescription}>{descriptionPreview}</p>}

      {item.tags && item.tags.length > 0 && (
        <div className={s.cardTags} aria-label={`Tags: ${item.tags.join(', ')}`}>
          {item.tags.map((tag) => (
            <span key={tag} className={s.cardTagChip}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {item.type && (
        <div className={s.cardTypeBadge} aria-label={`Type: ${item.type}`}>
          {item.type}
        </div>
      )}

      <div className={s.meta}>
        <GantryItemAuthor author={item.createdBy} backTo={`/gantry/${item.uid}`} />
        {item.stage !== 'BACKLOG' && (
          <div className={s.cardActions}>
            <ImpactBadge aggregate={aggregate} hasRated={viewerImpact !== null} />
            <BoostButton
              count={boostCount}
              hasPinned={hasBoosted}
              readonly={interactionLocked}
              onToggle={(next, el) => toggleBoost(next, el)}
            />
          </div>
        )}
      </div>

      {item.stage === 'IN_PROGRESS' && (
        <p className={s.cardFrozenNote}>
          <span className={s.cardFrozenBullet}>*</span> Boost count frozen — entered with {item.pinCount ?? 0} boosts
        </p>
      )}

      {(item.stage === 'SHIPPED' || item.stage === 'DECLINED') && (
        <p className={s.cardFinalNote}>
          <ClockIcon />
          {item.stage === 'SHIPPED' ? 'Shipped' : 'Declined'} — final: {item.pinCount ?? 0} boosts
        </p>
      )}

      {curatorView && (
        <CuratorStrip
          boostCount={boostCount}
          aggregate={aggregate}
          objectives={variant === 'per-objective' ? item.objectives : undefined}
          perObjective={variant === 'per-objective' ? perObjective : undefined}
        />
      )}

      {popoverPos && (
        <BoostImpactPopover
          pos={popoverPos}
          objectives={variant === 'per-objective' ? item.objectives : undefined}
          onSave={saveRating}
          onSkip={skipRating}
        />
      )}
    </article>
  );
}
