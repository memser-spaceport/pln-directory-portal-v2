'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { usePrevNextButtons } from '@/hooks/use-prev-next-buttons';
import { EmblaOptionsType } from 'embla-carousel';
import React, { Fragment, useState } from 'react';
import FeaturedHeader from './featured-header';
import IrlCard from './irl-card';
import MemberCard from './member-card';
import TeamCard from './team-card';
import ProjectCard from './project-card';
import { ADMIN_ROLE, PAGE_ROUTES } from '@/utils/constants';
import { useHomeAnalytics } from '@/analytics/home.analytics';
import { getAnalyticsLocationCardInfo, getAnalyticsMemberInfo, getAnalyticsProjectInfo, getAnalyticsTeamInfo, getAnalyticsUserInfo, getParsedValue } from '@/utils/common.utils';
import dynamic from 'next/dynamic';
import { isPastDate } from '@/utils/irl.utils';
import LocationCard from './location-card';
import { getFeaturedData } from '@/services/featured.service';
import { useRouter } from 'next/navigation';
import { formatFeaturedData } from '@/utils/home.utils';
import Cookies from 'js-cookie';
import { useFilter } from '@/hooks/useFilter';

const MemberBioModal = dynamic(() => import('./member-bio-modal'), { ssr: false });

function RenderCard(item: any, isLoggedIn: boolean, userInfo: any, getFeaturedDataa: () => void) {
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

  const onIrlLocationClicked = (location: any) => {
    analytics.onIrlLocationClicked(getAnalyticsUserInfo(userInfo), getAnalyticsLocationCardInfo(location));
  };

  const getEventLocation = (event: any) => {
    try {
      const isPast = isPastDate(event.endDate);
      const country = event?.location?.split(',')[0].trim();
      return `${PAGE_ROUTES.IRL}/?location=${country}&type=${isPast ? 'past' : 'upcoming'}&${isPast ? `event=${event?.slugUrl}` : ''}`;
    } catch (error) {
      return '';
    }
  };

  switch (category) {
    case 'event':
      return (
        <a target="_blank" href={getEventLocation(item)} onClick={() => onEventClicked(item)}>
          <IrlCard {...item} />
        </a>
      );

    case 'member':
      return (
        <a target="_blank" href={`${PAGE_ROUTES.MEMBERS}/${item?.id}`} onClick={() => onMemberClicked(item)}>
          <MemberCard member={item} />
        </a>
      );
    case 'team':
      return (
        <a target="_blank" href={`${PAGE_ROUTES.TEAMS}/${item?.id}`} onClick={() => onTeamClicked(item)}>
          <TeamCard {...item} />
        </a>
      );
    case 'project':
      return (
        <a target="_blank" href={`${PAGE_ROUTES.PROJECTS}/${item?.id}`} onClick={() => onProjectClicked(item)}>
          <ProjectCard {...item} />
        </a>
      );

    case 'location':
      return (
        <a
          target="_blank"
          href={`${PAGE_ROUTES.IRL}?location=${item?.location?.split(',')[0].trim()}`}
          onClick={(e: any) => {
            onIrlLocationClicked(item);
            if (e.defaultPrevented) return;
          }}
        >
          <LocationCard {...item} userInfo={userInfo} getFeaturedDataa={getFeaturedDataa} />
        </a>
      );
    default:
      return null;
  }
}

const Featured = (props: any) => {
  const isLoggedIn = props?.isLoggedIn;
  const userInfo = props?.userInfo;
  const isAdmin = userInfo?.roles?.includes(ADMIN_ROLE);
  const options: EmblaOptionsType = { slidesToScroll: 'auto', loop: true, align: 'start' };
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const cauroselActions = usePrevNextButtons(emblaApi);
  const router = useRouter();
  const [unfilteredFeaturedData, setUnfilteredFeaturedData] = useState(props.featuredData ?? []);
  const { activeFilter, onFilterClick: handleFilterSelected } = useFilter<string>('all');

  const getFeaturedDataa = async () => {
    const authToken = getParsedValue(Cookies.get('authToken'));
    const featData = await getFeaturedData(authToken, isLoggedIn, isAdmin);
    setUnfilteredFeaturedData(formatFeaturedData(featData.data));
    router.refresh();
  };

  const displayedFeaturedData = activeFilter === 'all'
    ? unfilteredFeaturedData
    : unfilteredFeaturedData.filter((item: any) => item.category === activeFilter);

  return (
    <>
      <div className="featured">
        <FeaturedHeader
          {...cauroselActions}
          userInfo={userInfo}
          activeFilter={activeFilter}
          onClick={handleFilterSelected}
        />
        <div>
          <div className={`featured__body`}>
            {displayedFeaturedData?.map((item: any, index: number) => (
              <Fragment key={`${item.category}-${index}`}>
                {item?.category === 'location' ? (
                  item?.upcomingEvents?.length > 0 && <div>{RenderCard(item, isLoggedIn, userInfo, getFeaturedDataa)}</div>
                ) : (
                  <div>{RenderCard(item, isLoggedIn, userInfo, getFeaturedDataa)}</div>
                )}
              </Fragment>
            ))}
          </div>
        </div>

        <MemberBioModal />
      </div>
      <style jsx>{`
        .embla {
          position: relative;
          overflow: hidden;
          padding: 20px 0px 20px 2px;
        }

        .embla__gradient {
          display: none;
          position: absolute;
          top: 20px;
          right: -2px;
          width: 137px;
          height: 290px;
          background: linear-gradient(90deg, rgba(241, 245, 249, 0) 0.02%, #f1f5f9 61.31%);
        }

        .embla__container {
          display: flex;
        }

        .featured__body {
          display: grid;
          grid-template-columns: repeat(auto-fit, 289px) !important;
          justify-content: center;
          gap: 14px;
        }

        .embla__slide {
          flex: 0 0 290px;
          min-width: 0;
          margin-inline-end: 10px;
          cursor: pointer;
        }

        .featured {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }

        @media (min-width: 1920px) {
          .embla__gradient {
            display: block;
            position: absolute;
            top: 20px;
            right: -2px;
            width: 137px;
            height: 290px;
            background: linear-gradient(90deg, rgba(241, 245, 249, 0) 0.02%, #f1f5f9 61.31%);
          }

          .featured__body {
            justify-content: start;
          }
        }
      `}</style>
    </>
  );
};

export default Featured;
