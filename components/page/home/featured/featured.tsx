'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { usePrevNextButtons } from '@/hooks/use-prev-next-buttons';
import { EmblaOptionsType } from 'embla-carousel';
import React from 'react';
import FeaturedHeader from './featured-header';
import IrlCard from './irl-card';
import MemberCard from './member-card';
import TeamCard from './team-card';
import ProjectCard from './project-card';
import { PAGE_ROUTES } from '@/utils/constants';
import { useHomeAnalytics } from '@/analytics/home.analytics';
import { getAnalyticsMemberInfo, getAnalyticsProjectInfo, getAnalyticsTeamInfo, getAnalyticsUserInfo } from '@/utils/common.utils';

function RenderCard(item: any, isLoggedIn: boolean, userInfo: any) {
  const { category } = item;

  const analytics = useHomeAnalytics();

  const onEventClicked = (event: any) => {
    analytics.onIrlCardClicked(getAnalyticsUserInfo(userInfo), {
      uid: event.id,
      name: event.name,
      slugUrl: event.slugUrl,
      isInviteOnly: event.type,
    });
  };

  const onMemberClicked = (member: any) => {
    analytics.onMemberCardClicked(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member));
  };

  const onTeamClicked = (team: any) => {
    analytics.onTeamCardClicked(getAnalyticsUserInfo(userInfo), getAnalyticsTeamInfo(team));
  };

  const onProjectClicked = (project: any) => {
    analytics.onProjectCardClicked(getAnalyticsUserInfo(userInfo), getAnalyticsProjectInfo(project));
  };

  switch (category) {
    case 'event':
      return (
        <a target="_blank" href={`${PAGE_ROUTES.IRL}/${item.slugUrl}`} onClick={() => onEventClicked(item)}>
          <IrlCard {...item} />
        </a>
      );

    case 'member':
      return (
        <a target="_blank" href={`${PAGE_ROUTES.MEMBERS}/${item.id}`} onClick={() => onMemberClicked(item)}>
          <MemberCard member={item} isUserLoggedIn={isLoggedIn} />
        </a>
      );
    case 'team':
      return (
        <a target="_blank" href={`${PAGE_ROUTES.TEAMS}/${item.id}`} onClick={() => onTeamClicked(item)}>
          <TeamCard {...item} />
        </a>
      );
    case 'project':
      return (
        <a target="_blank" href={`${PAGE_ROUTES.PROJECTS}/${item.id}`} onClick={() => onProjectClicked(item)}>
          <ProjectCard {...item} />
        </a>
      );
    default:
      return null;
  }
}

const Featured = (props: any) => {
  const featuredData = props?.featuredData ?? [];
  const isLoggedIn = props?.isLoggedIn;
  const userInfo = props?.userInfo;

  const options: EmblaOptionsType = { slidesToScroll: 'auto', loop: true, align: 'start' };
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const cauroselActions = usePrevNextButtons(emblaApi);

  return (
    <>
      <div className="featured">
        <FeaturedHeader {...cauroselActions} userInfo={userInfo} />
        <div className="embla" ref={emblaRef}>
          <div className="featured__body embla__container">
            {featuredData?.map((item: any, index: number) => (
              <div key={`${item.category}-${index}`} className="embla__slide">
                {RenderCard(item, isLoggedIn, userInfo)}
              </div>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        .embla {
          overflow: hidden;
          padding: 20px 5px;
        }

        .embla__container {
          display: flex;
        }

        .embla__slide {
          flex: 0 0 289px;
          min-width: 0;
          margin-inline-end: 12px;
          cursor: pointer;
        }

        .featured {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }
      `}</style>
    </>
  );
};

export default Featured;
