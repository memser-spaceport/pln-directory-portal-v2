'use client';

// Prototype-local copy of the production roadmap card body (per prototypes/README "copy & simplify").
// The member-facing card is pixel-pure production: boost is the only signal. Impact renders
// exclusively in the curator strip (curator view) and is collected via the post-boost popover
// or the item drawer — both owned by the page. Production files stay untouched.

import { clsx } from 'clsx';
import { truncateText } from '@/utils/forum';
import { GantryItemAuthor } from '@/components/page/gantry/shared/GantryItemAuthor';
import { BoostToggle } from './shared/BoostToggle';
import s from '@/components/page/gantry/roadmap/Roadmap.module.scss';
import type { MockRoadmapItem } from './mocks';
import { IMPACT_MAX } from './mocks';
import { CuratorStrip } from './shared/CuratorStrip';
import { deriveAggregate } from './shared/impact';
import type { GoalMode } from './shared/impact';
import type { ItemViewerState } from './shared/useBoardState';
import c from './RoadmapImpactCard.module.scss';

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
  readonly viewer: ItemViewerState;
  readonly goalMode: GoalMode;
  readonly curatorView: boolean;
  readonly onToggleBoost: (item: MockRoadmapItem, next: boolean, el: HTMLButtonElement) => void;
  readonly onOpen: (uid: string) => void;
}

export function RoadmapImpactCard({ item, position, viewer, goalMode, curatorView, onToggleBoost, onOpen }: Props) {
  const descriptionPreview = truncateText(toPlainText(item.description ?? ''), CARD_DESCRIPTION_MAX_LENGTH);
  const interactionLocked = item.stage === 'IN_PROGRESS' || item.stage === 'SHIPPED' || item.stage === 'DECLINED';
  const aggregate = deriveAggregate(item.impact, viewer.viewerImpact);

  return (
    <article
      className={s.card}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item.uid)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(item.uid);
        }
      }}
    >
      <div className={s.cardTopRow}>
        <div className={s.cardPositionBadge}>
          {position !== undefined && item.stage !== 'IDEA' && item.stage !== 'SHIPPED' && item.stage !== 'DECLINED' && (
            <span className={clsx(s[`cardPosition_${item.stage}`])}>#{position}</span>
          )}
        </div>
        <h3 className={s.cardTitle}>{item.title}</h3>
        {goalMode === 'objectives' && item.objectives?.length > 0 && (
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
        <div className={c.boostRow}>
          {item.stage !== 'BACKLOG' && (
            <div className={s.cardActions}>
              <BoostToggle
                hasPinned={viewer.hasBoosted}
                readonly={interactionLocked}
                onToggle={(next, el) => onToggleBoost(item, next, el)}
              />
            </div>
          )}
          {/* Public impact score — everyone sees it, right-aligned opposite the boost. */}
          <span className={c.impactInline}>
            {aggregate.impactCount > 0 ? (
              <>
                impact <strong>{aggregate.avgImpact!.toFixed(1)}</strong>/{IMPACT_MAX} ({aggregate.impactCount}{' '}
                {aggregate.impactCount === 1 ? 'boost' : 'boosts'})
              </>
            ) : (
              'Not rated yet'
            )}
          </span>
        </div>
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

      {/* Members see the public score inline (above); curators get the rater breakdown (no per-objective). */}
      {curatorView && (
        <CuratorStrip
          aggregate={aggregate}
          ratings={item.impact.ratings}
          viewerRating={viewer.viewerImpact ? { level: viewer.viewerImpact, note: viewer.viewerNote } : null}
          curator={curatorView}
          onShowRaters={() => onOpen(item.uid)}
        />
      )}
    </article>
  );
}
