'use client';

// Prototype-local copy of the production item drawer: common Drawer (width 900) wrapping the
// read view of GantryItemDetailContent, 1:1 markup + classes (GantryDetailPage.module.scss,
// imported read-only). Data-bound parts (edit/archive/decline, hooks) are dropped; the two
// prototype additions are the "Impact on company goals" rating section and, for curators,
// the ImpactVotersSection in the BoostersSection slot.

import { clsx } from 'clsx';
import { useIsNarrow } from '@/hooks/useIsNarrow';
import { Drawer } from '@/components/common/Drawer/Drawer';
import { QuillContent } from '@/components/ui/QuillContent/QuillContent';
import { MagicSparklesIcon } from '@/components/icons/MagicSparklesIcon';
import { StageSelector } from '@/components/page/gantry/shared/StageSelector';
import { GantryItemAuthor } from '@/components/page/gantry/shared/GantryItemAuthor';
import { BoostToggle } from './BoostToggle';
import shared from '@/components/page/gantry/shared/Shared.module.scss';
import d from '@/components/page/gantry/GantryDetailPage.module.scss';
import type { MockRoadmapItem } from '../mocks';
import { IMPACT_LABELS, IMPACT_LEVELS_DESC, IMPACT_MAX } from '../mocks';
import { ImpactRing } from './ImpactRing';
import { ImpactVotersSection } from './ImpactVotersSection';
import { deriveAggregate } from './impact';
import type { GoalMode } from './impact';
import type { ItemViewerState } from './useBoardState';
import s from './ItemDrawer.module.scss';

interface Props {
  readonly item: MockRoadmapItem;
  readonly viewer: ItemViewerState;
  readonly goalMode: GoalMode;
  readonly curatorView: boolean;
  readonly onToggleBoost: (item: MockRoadmapItem, next: boolean, el: HTMLButtonElement) => void;
  readonly onClose: () => void;
}

export function ItemDrawer({ item, viewer, goalMode, curatorView, onToggleBoost, onClose }: Props) {
  const isNarrow = useIsNarrow();
  const interactionLocked = item.stage === 'IN_PROGRESS' || item.stage === 'SHIPPED' || item.stage === 'DECLINED';
  const aggregate = deriveAggregate(item.impact, viewer.viewerImpact);
  const distCounts = IMPACT_LEVELS_DESC.filter((l) => aggregate.impactDistribution[l] > 0).map(
    (l) => `${aggregate.impactDistribution[l]} ${IMPACT_LABELS[l]}`,
  );

  // Exactly one goal representation per version: objectives (chips) or the author's reasoning (text).
  const showObjectives = goalMode === 'objectives' && (item.objectives?.length ?? 0) > 0;
  const showReasoning = goalMode === 'reasoning' && !!item.impact.authorClaimNote;

  return (
    <Drawer isOpen onClose={onClose} width={900} fullScreen={isNarrow}>
      <div className={clsx(d.mainContent, d.drawerMain)}>
        <div className={d.drawerToolbar}>
          <button type="button" className={d.drawerBackBtn} onClick={onClose} aria-label="Back">
            ← Back
          </button>
        </div>

        <div className={d.header}>
          <div className={d.headerTop}>
            <h1 className={clsx(d.title, d.drawerTitle)}>{item.title}</h1>
          </div>

          <div className={d.meta}>
            <StageSelector stage={item.stage} canChange={false} onStageSelect={() => undefined} />
            <span className={d.metaDot} aria-hidden />
            <GantryItemAuthor author={item.createdBy} backTo={`/gantry/${item.uid}`} />
            <span className={d.metaDot} aria-hidden />
            <BoostToggle
              hasPinned={viewer.hasBoosted}
              readonly={interactionLocked}
              onToggle={(next, el) => onToggleBoost(item, next, el)}
            />
          </div>

          {/* Impact score is public — everyone sees it. Rating happens by boosting (above). */}
          <div className={s.impactReadout}>
            {aggregate.impactCount > 0 && <ImpactRing value={aggregate.avgImpact!} max={IMPACT_MAX} />}
            <div className={s.impactMeta}>
              <span className={s.impactLabel}>Impact on company goals</span>
              {aggregate.impactCount > 0 ? (
                <>
                  <span className={s.impactScore}>
                    {aggregate.impactCount} {aggregate.impactCount === 1 ? 'rating' : 'ratings'}
                  </span>
                  {/* The rating breakdown is team-only — members see just the score + count. */}
                  {curatorView && distCounts.length > 0 && (
                    <span className={clsx(s.impactScore, s.impactDim)}>{distCounts.join(' · ')}</span>
                  )}
                </>
              ) : (
                <span className={s.impactDim}>No ratings yet — boost to add yours</span>
              )}
            </div>
          </div>

          {curatorView && (
            <div className={d.boostArea}>
              <ImpactVotersSection
                ratings={item.impact.ratings}
                viewerRating={viewer.viewerImpact ? { level: viewer.viewerImpact, note: viewer.viewerNote } : null}
              />
            </div>
          )}
        </div>

        <div className={d.mobileDivider} />

        <div className={clsx(d.content, s.contentTight)}>
          {/* Description gets a caption above it (Tags/Type label style) — no "Details" heading. */}
          {item.description && (
            <div className={s.descriptionBlock}>
              <span className={s.detailLabel}>Description</span>
              <QuillContent html={item.description} className={clsx(d.richContent, s.description)} />
            </div>
          )}

          {(!!item.tags?.length || !!item.type || showObjectives || showReasoning) && (
            <div className={s.details}>
              {item.tags && item.tags.length > 0 && (
                <>
                  <span className={s.detailLabel}>Tags</span>
                  <div className={s.detailValue} aria-label={`Tags: ${item.tags.join(', ')}`}>
                    {item.tags.map((tag) => (
                      <span key={tag} className={d.tagChip}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </>
              )}
              {item.type && (
                <>
                  <span className={s.detailLabel}>Type</span>
                  <div className={s.detailValue}>
                    <span className={d.tagChip}>{item.type}</span>
                  </div>
                </>
              )}
              {/* Objectives version: each objective with the community's impact rating toward it. */}
              {showObjectives && (
                <>
                  <span className={s.detailLabel}>Objectives</span>
                  <div className={s.objectiveList}>
                    {item.objectives.map((objective) => {
                      const po = item.impact.perObjectiveImpact.find((p) => p.objectiveUid === objective.uid);
                      return (
                        <div key={objective.uid} className={s.objectiveListRow}>
                          <span className={d.objectiveChip}>
                            O{objective.order} · {objective.title}
                          </span>
                          <span className={s.objScore}>
                            {po?.avg != null ? `${po.avg.toFixed(1)} / ${IMPACT_MAX}` : 'Not rated'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {/* Reasoning version: the author's own free-text case. */}
              {showReasoning && (
                <>
                  <span className={s.detailLabel}>Reasoning</span>
                  <div className={s.detailValue}>
                    <span className={s.goalText}>{item.impact.authorClaimNote}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className={d.footerExtras}>
          {/* Inert copy of production BuildWithAgentsButton (the real one fires a tracking API call). */}
          <button type="button" className={shared.buildButton} aria-disabled="true">
            <MagicSparklesIcon className={shared.buildButtonIcon} />
            <span>Build this with agents</span>
            <span className={shared.comingSoon}>Coming soon</span>
          </button>
        </div>
      </div>
    </Drawer>
  );
}
