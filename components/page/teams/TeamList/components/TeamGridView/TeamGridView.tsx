'use client';

import { memo } from 'react';
import { ITag, ITeam, ITeamsSearchParams } from '@/types/teams.types';
import TeamsTagsList from '../../../teams-tags-list';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import Popover from '../../../asks-popover';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { useCarousel } from '@/hooks/use-embla-carousel';
import { IUserInfo } from '@/types/shared.types';
import { getTeamPriority, getPriorityLabel } from '@/utils/team.utils';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { isTierUser } from '@/utils/user/isTierUser';
import { FollowButton } from '@/components/ui/FollowButton/FollowButton';
import { useToggleTeamFollowInList } from '@/services/follow/hooks/useToggleTeamFollowInList';

import s from './TeamGridView.module.scss';

interface ITeamGridView {
  userInfo?: IUserInfo;
  team: ITeam;
  viewType: string;
  isLoggedIn?: boolean;
  searchParams: ITeamsSearchParams;
}

export const TeamGridView = memo(function TeamGridView(props: ITeamGridView) {
  const { team, userInfo, isLoggedIn, searchParams } = props;

  const profile = team?.logo ?? '/icons/team-default-profile.svg';
  const teamName = team?.name;
  const description = team?.shortDescription;
  const analytics = useTeamAnalytics();
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const { toggleFollow, isPending: isTogglingFollow } = useToggleTeamFollowInList({ team, searchParams });
  const carousel: any[] = [];
  const canSearch = userInfo?.rbac?.effectivePermissions.some((p) => p.code === 'team.search.read');
  const canSeePriority = userInfo?.rbac?.effectivePermissions.some((p) => p.code === 'team.priority.read');
  const isTierViewer = isAdminUser(userInfo) || canSearch || isTierUser(userInfo) || canSeePriority;

  const tags = useMemo(() => {
    const priority = getTeamPriority(team);
    if (isTierViewer && priority !== undefined) {
      return [
        {
          title: getPriorityLabel(priority),
          icon: <Image src="/icons/stack.svg" alt="stack" width={14} height={12} />,
        } as ITag,
        ...(team?.industryTags ?? []),
      ];
    }
    return team?.industryTags;
  }, [team?.industryTags, isTierViewer, team?.priority, team?.tier]);

  const { emblaRef, activeIndex, scrollPrev, scrollNext, setActiveIndex, emblaApi } = useCarousel({
    slidesToScroll: 'auto',
    loop: true,
    align: 'start',
    containScroll: 'trimSnaps',
    isPaused: isTooltipOpen,
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div className={s.grid}>
      <div className={s.profileContainer}>
        <Image
          alt="profile"
          height={72}
          width={72}
          layout="intrinsic"
          loading="eager"
          priority={true}
          src={profile}
          className={s.profileImage}
        />
      </div>
      <div className={s.detailsContainer}>
        <div className={s.teamDetail}>
          <h2 className={s.teamName}>{teamName}</h2>
          <p className={s.teamDesc}>{description}</p>
        </div>

        <div className={s.tagsDesc}>
          <TeamsTagsList tags={tags} noOfTagsToShow={2} />
        </div>
        <div className={s.tagsMob}>
          <TeamsTagsList tags={tags} noOfTagsToShow={1} />
        </div>
        {isLoggedIn && (
          <FollowButton
            following={Boolean(team.isFollowed)}
            name={team.name ?? 'team'}
            disabled={isTogglingFollow}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFollow();
            }}
          />
        )}
      </div>
      {carousel.length > 0 && (
        <div className={s.embla} onClick={handleClick}>
          <div className={s.emblaViewport} ref={emblaRef}>
            <div className={s.emblaContainer}>
              {carousel.map((item, index) => (
                <div key={item.id} className={s.emblaSlideContainer}>
                  <div className={`${s.emblaSlide} ${index === activeIndex ? s.active : ''}`}>
                    <Image
                      alt="left"
                      height={15}
                      width={15}
                      src="/icons/tabler_message-filled.svg"
                      className={s.emblaImg}
                    />
                    <div className={s.hideTooltip}>
                      <Popover
                        name={item.name}
                        description={item.description}
                        tags={item.tags}
                        onOpenChange={(isOpen) => setIsTooltipOpen(isOpen)}
                      />
                    </div>
                    <div className={s.hideName}>{item.name}</div>
                  </div>
                </div>
              ))}
            </div>

            {carousel.length > 1 && (
              <div className={s.emblaDashes}>
                {carousel.map((_, index) => (
                  <button
                    key={index}
                    className={`${s.emblaDash} ${index === activeIndex ? s.highlighted : ''}`}
                    onClick={() => {
                      setActiveIndex(index);
                      emblaApi?.scrollTo(index);
                      analytics.onCarouselButtonClicked();
                    }}
                  ></button>
                ))}
              </div>
            )}
          </div>

          {carousel.length > 1 && (
            <>
              <button
                className={`${s.emblaButton} ${s.emblaButtonPrev}`}
                onClick={(e: any) => {
                  e.stopPropagation();
                  e.preventDefault();
                  scrollPrev();
                  analytics.onCarouselPrevButtonClicked();
                }}
              >
                <Image alt="left" height={12} width={12} src="/icons/arrow-left-blue.svg" />
              </button>
              <button
                className={`${s.emblaButton} ${s.emblaButtonNext}`}
                onClick={(e: any) => {
                  e.stopPropagation();
                  e.preventDefault();
                  scrollNext();
                  analytics.onCarouselNextButtonClicked();
                }}
              >
                <Image alt="right" height={12} width={12} src="/icons/arrow-right-blue.svg" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
});
