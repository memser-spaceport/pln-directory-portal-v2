'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { GantryTabs } from '@/components/page/gantry/GantryTabs';
import { useCurrentUserStore } from '@/services/auth/store';
import { useGantryAccess } from '@/services/rbac/hooks/useGantryAccess';
import { useGantryItems } from '@/services/gantry/hooks/useGantryItems';
import { useGantryFocusAreas } from '@/services/gantry/hooks/useGantryFocusAreas';
import { useGantryUpvote } from '@/services/gantry/hooks/useGantryUpvote';
import { useSubmitIdeaModalStore } from '@/services/gantry/store';
import { useGantryAnalytics } from '@/analytics/gantry.analytics';
import type { GantryStage } from '@/services/gantry/types';
import { IdeasFilters } from './IdeasFilters';
import { IdeaListItem } from './IdeaListItem';
import { IdeasSubmitButton } from './IdeasSubmitButton';
import { SubmitIdeaModal } from './SubmitIdeaModal/SubmitIdeaModal';
import gantryPageStyles from '@/components/page/gantry/GantryPage.module.scss';
import s from './Ideas.module.scss';

export function IdeasView() {
  const analytics = useGantryAnalytics();
  const { currentUser } = useCurrentUserStore();
  const { canCreateIdea, canUpvote } = useGantryAccess();
  const { actions: submitIdeaModalActions } = useSubmitIdeaModalStore();
  const [mine, setMine] = useState(false);
  const [stageFilter, setStageFilter] = useState<GantryStage[]>(['IDEA', 'UNDER_REVIEW']);
  const [focusAreaUids, setFocusAreaUids] = useState<string[]>([]);

  const params = useMemo(
    () => ({
      mine,
      stage: stageFilter,
      focusAreaUid: focusAreaUids.length > 0 ? focusAreaUids : undefined,
    }),
    [mine, stageFilter, focusAreaUids],
  );

  const { options: focusAreaOptions } = useGantryFocusAreas(!!currentUser);
  const { data, isLoading, isError } = useGantryItems(params, !!currentUser);
  const upvoteMutation = useGantryUpvote();

  useEffect(() => {
    analytics.onIdeasViewed();
  }, [analytics]);

  const handleUpvoteToggle = async (uid: string, nextHasUpvoted: boolean) => {
    await upvoteMutation.mutateAsync({ uid, nextHasUpvoted });
    if (nextHasUpvoted) analytics.onItemUpvoted(uid);
  };

  const openSubmitModal = () => submitIdeaModalActions.openModal('idea');

  return (
    <div className={s.pageLayout}>
      <DashboardPagesLayout
        filters={
          <IdeasFilters
            mine={mine}
            selectedStages={stageFilter}
            focusAreaUids={focusAreaUids}
            focusAreaOptions={focusAreaOptions}
            onMineChange={setMine}
            onStagesChange={setStageFilter}
            onFocusAreaChange={setFocusAreaUids}
          />
        }
        content={
          <div className={gantryPageStyles.contentShell}>
            <div className={gantryPageStyles.tabsRow}>
              <GantryTabs />
            </div>

            <div className={gantryPageStyles.contentBody}>
            <div className={s.pageHeader}>
              <div className={s.titleRow}>
                <div className={s.titleSection}>
                  <div className={s.titleInline}>
                    <h1 className={s.title}>Ideas</h1>
                    {canCreateIdea && (
                      <div className={s.actionsMobile}>
                        <IdeasSubmitButton onClick={openSubmitModal} />
                      </div>
                    )}
                  </div>
                </div>
                {canCreateIdea && (
                  <div className={s.actions}>
                    <IdeasSubmitButton onClick={openSubmitModal} />
                  </div>
                )}
              </div>
            </div>

            <div className={s.list}>
              {isLoading ? (
                <div className={s.loadingBlock}>
                  <div className={s.skeletonCard} />
                  <div className={s.skeletonCard} />
                  <div className={s.skeletonCard} />
                </div>
              ) : isError ? (
                <p className={s.empty}>Failed to load ideas.</p>
              ) : data?.items?.length ? (
                data.items.map((item) => (
                  <IdeaListItem key={item.uid} item={item} canUpvote={canUpvote} onUpvoteToggle={handleUpvoteToggle} />
                ))
              ) : (
                <p className={s.empty}>No ideas yet — what should we build?</p>
              )}
            </div>
            </div>
          </div>
        }
      />
      <SubmitIdeaModal />
    </div>
  );
}
