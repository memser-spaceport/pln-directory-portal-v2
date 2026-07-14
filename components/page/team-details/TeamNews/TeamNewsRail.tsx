'use client';

import { useCallback, useState } from 'react';

import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import { TEAM_NEWS_PREVIEW_LIMIT } from '@/services/team-news/constants';
import type { ITeamNewsByTeamResponse, ITeamNewsItem } from '@/types/team-news.types';

import { TeamNewsCard } from './TeamNewsCard';
import { TeamNewsModal } from './TeamNewsModal';
import s from './TeamNewsRail.module.scss';

interface TeamNewsRailProps {
  teamUid: string;
  teamName: string;
  initialData: ITeamNewsByTeamResponse;
}

export function TeamNewsRail({ teamUid, teamName, initialData }: TeamNewsRailProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const { onTeamNewsCardClicked, onTeamNewsViewAllClicked } = useTeamNewsAnalytics();

  const total = initialData.total;
  const previewItems = initialData.items.slice(0, TEAM_NEWS_PREVIEW_LIMIT);
  const hasMore = total > TEAM_NEWS_PREVIEW_LIMIT;

  const handleCardClick = useCallback(
    (item: ITeamNewsItem, position: number) => {
      onTeamNewsCardClicked(item, position, 'team-profile-rail');
    },
    [onTeamNewsCardClicked],
  );

  return (
    <>
      <aside className={s.rail}>
        <div className={s.railSpacer} aria-hidden="true" />
        <div className={s.newsPanel}>
          <DetailsSectionHeader title={`${teamName} News (${total})`} />
          <div className={s.newsList}>
            {previewItems.map((item, index) => (
              <TeamNewsCard
                key={item.uid}
                item={item}
                position={index}
                variant="flat"
                analyticsSource="team-profile-rail"
                onClick={(clicked) => handleCardClick(clicked, index)}
              />
            ))}
          </div>
          {hasMore && (
            <button
              type="button"
              className={s.viewAll}
              onClick={() => {
                onTeamNewsViewAllClicked(teamUid, teamName, total);
                setModalOpen(true);
              }}
            >
              View all news ({total})
            </button>
          )}
        </div>
      </aside>

      <TeamNewsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        teamUid={teamUid}
        teamName={teamName}
        total={total}
        fullscreen={isMobile}
      />
    </>
  );
}
