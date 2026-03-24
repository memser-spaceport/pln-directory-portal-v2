'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel';

import { IFocusArea, IUserInfo } from '@/types/shared.types';
import { HOME, HOME_PAGE_LINKS } from '@/utils/constants';
import { usePrevNextButtons } from '@/hooks/use-prev-next-buttons';
import { useHomeAnalytics } from '@/analytics/home.analytics';
import { getAnalyticsUserInfo, getAnalyticsFocusAreaInfo } from '@/utils/common.utils';

import { FocusAreasData } from './types';

import { FocusAreaHeader } from './components/FocusAreaHeader';
import { FocusAreaCard } from './components/FocusAreaCard';
import { FocusAreaDialog } from './components/FocusAreaDialog';

import s from './FocusAreaSection.module.scss';

const EMBLA_OPTIONS: EmblaOptionsType = { align: 'start' };

interface FocusAreaSectionProps {
  focusAreas: FocusAreasData;
  userInfo: IUserInfo;
}

export function FocusAreaSection(props: FocusAreaSectionProps) {
  const { focusAreas, userInfo } = props;

  const analytics = useHomeAnalytics();
  const protocolVisionUrl = HOME_PAGE_LINKS.FOCUSAREA_PROTOCOL_LABS_VISION_URL as string;

  const [emblaRef, emblaApi] = useEmblaCarousel(EMBLA_OPTIONS);
  const carouselActions = usePrevNextButtons(emblaApi);

  const [mbEmblaRef, mbEmblaApi] = useEmblaCarousel(EMBLA_OPTIONS);
  const [scrollProgress, setScrollProgress] = useState(0);

  const onScroll = useCallback((api: EmblaCarouselType) => {
    const progress = Math.max(0, Math.min(1, api.scrollProgress()));
    setScrollProgress(progress * 100);
  }, []);

  useEffect(() => {
    if (!mbEmblaApi) return;
    onScroll(mbEmblaApi);
    mbEmblaApi.on('reInit', onScroll).on('scroll', onScroll).on('slideFocus', onScroll);
  }, [mbEmblaApi, onScroll]);

  const getProjectFocusAreas = (focusArea: IFocusArea) => {
    return focusAreas?.projectFocusAreas?.find((pf: any) => pf.title === focusArea.title)?.projectAncestorFocusAreas || [];
  };

  const onTeamClick = (focusArea: IFocusArea) => {
    window.open(`/teams?focusAreas=${focusArea.title}`, '_blank');
    analytics.onFocusAreaTeamsClicked(getAnalyticsUserInfo(userInfo), getAnalyticsFocusAreaInfo(focusArea));
  };

  const onProjectClick = (focusArea: IFocusArea) => {
    window.open(`/projects?focusAreas=${focusArea.title}`, '_blank');
    analytics.onFocusAreaProjectsClicked(getAnalyticsUserInfo(userInfo), getAnalyticsFocusAreaInfo(focusArea));
  };

  const onSeeMoreClick = (focusArea: any) => {
    document.dispatchEvent(
      new CustomEvent(HOME.TRIGGER_FOCUS_AREA_DIALOG, {
        detail: { focusArea },
      }),
    );
  };

  const onProtocolVisionUrlClick = () => {
    analytics.onFocusAreaProtocolLabsVisionUrlClicked(protocolVisionUrl, getAnalyticsUserInfo(userInfo));
  };

  return (
    <>
      {/* Desktop */}
      <div className={s.desktop}>
        <FocusAreaHeader userInfo={userInfo} {...carouselActions} />
        <div className={s.embla} ref={emblaRef}>
          <div className={s.emblaContainer}>
            {focusAreas?.teamFocusAreas.map((focusArea: any, index: number) => (
              <FocusAreaCard
                key={`focusArea-${index}`}
                focusArea={focusArea}
                projectAncestorFocusAreas={getProjectFocusAreas(focusArea)}
                onTeamClick={onTeamClick}
                onProjectClick={onProjectClick}
                onSeeMoreClick={onSeeMoreClick}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className={s.mobile}>
        <div className={s.mobileHeader}>
          <div className={s.mobileHeaderTitle}>
            <div className={s.mobileTitleSection}>
              <h2 className={s.mobileTitle}>Focus Areas</h2>
            </div>
            <div>
              <p className={s.mobileDescription}>
                <a
                  href={protocolVisionUrl}
                  target="_blank"
                  className={s.mobileVisionLink}
                  onClick={onProtocolVisionUrlClick}
                >
                  {' '}
                  Protocol Labs&apos; vision{' '}
                </a>{' '}
                for the future is built on four core focus areas that aim to harness humanity&apos;s potential for good,
                navigate potential pitfalls, and ensure a future where technology empowers humanity.
              </p>
            </div>
          </div>
        </div>
        <div className={s.mobileEmbla} ref={mbEmblaRef}>
          <div className={s.mobileEmblaContainer}>
            {focusAreas?.teamFocusAreas.map((focusArea: any, index: number) => (
              <FocusAreaCard
                key={`focusArea-${index}`}
                focusArea={focusArea}
                projectAncestorFocusAreas={getProjectFocusAreas(focusArea)}
                onTeamClick={onTeamClick}
                onProjectClick={onProjectClick}
                onSeeMoreClick={onSeeMoreClick}
              />
            ))}
          </div>
        </div>
        <div className={s.progressBar}>
          <div className={s.progressTrack}>
            <div
              className={s.progressFill}
              style={{ transform: `translate3d(${scrollProgress}%,0px,0px)` }}
            />
          </div>
        </div>
      </div>

      <FocusAreaDialog userInfo={userInfo} />
    </>
  );
}
