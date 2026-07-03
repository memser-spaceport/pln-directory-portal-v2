'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel';

import { usePrevNextButtons } from '@/hooks/use-prev-next-buttons';

import { FocusAreaCard } from '@/components/page/home/FocusAreaSection/components/FocusAreaCard';

// Reuse the production focus-area styling 1:1.
import s from '@/components/page/home/FocusAreaSection/FocusAreaSection.module.scss';
import h from '@/components/page/home/FocusAreaSection/components/FocusAreaHeader/FocusAreaHeader.module.scss';

import { MOCK_FOCUS_AREAS, PROTOCOL_VISION_URL } from './mocks';

const EMBLA_OPTIONS: EmblaOptionsType = { align: 'start' };

/**
 * Copy of the production `FocusAreaSection`. Analytics hooks are stripped, the
 * see-more `FocusAreaDialog` (custom-event driven) is omitted, and data comes
 * from mocks; the carousel, cards, header, and SCSS are the production ones —
 * the header JSX is inlined below because the real `FocusAreaHeader` is
 * analytics-bound.
 */
export function FocusAreaSectionMock() {
  const [emblaRef, emblaApi] = useEmblaCarousel(EMBLA_OPTIONS);
  const carouselActions = usePrevNextButtons(emblaApi);
  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } = carouselActions;

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

  const onTeamClick = (focusArea: any) => window.open(`/teams?focusAreas=${focusArea.title}`, '_blank');
  const onProjectClick = (focusArea: any) => window.open(`/projects?focusAreas=${focusArea.title}`, '_blank');
  const onSeeMoreClick = () => {}; // production opens FocusAreaDialog; out of scope here

  const description = (
    <>
      <a href={PROTOCOL_VISION_URL} target="_blank" rel="noopener noreferrer" className={h.visionLink}>
        {' '}
        Protocol Labs’ vision{' '}
      </a>{' '}
      for the future is built on four core focus areas that aim to harness humanity’s potential for good, navigate
      potential pitfalls, and ensure a future where technology empowers humanity.
    </>
  );

  return (
    <>
      {/* Desktop */}
      <div className={s.desktop}>
        <div className={h.header}>
          <div className={h.titleContainer}>
            <div className={h.titleSection}>
              <h2 className={h.title}>Focus Areas</h2>
            </div>
            <div>
              <p className={h.description}>{description}</p>
            </div>
          </div>
          {(!prevBtnDisabled || !nextBtnDisabled) && (
            <div className={h.actions}>
              <button className={clsx(h.actionButton, { [h.disabled]: prevBtnDisabled })} onClick={onPrevButtonClick}>
                <img
                  src={prevBtnDisabled ? '/icons/left-arrow-circle-disabled.svg' : '/icons/left-arrow-circle.svg'}
                  alt="left arrow"
                />
              </button>
              <button
                className={clsx(h.actionButton, h.right, { [h.disabled]: nextBtnDisabled })}
                onClick={onNextButtonClick}
              >
                <img
                  src={nextBtnDisabled ? '/icons/right-arrow-circle-disabled.svg' : '/icons/right-arrow-circle.svg'}
                  alt="right arrow"
                />
              </button>
            </div>
          )}
        </div>
        <div className={s.embla} ref={emblaRef}>
          <div className={s.emblaContainer}>
            {MOCK_FOCUS_AREAS.map((focusArea: any, index: number) => (
              <FocusAreaCard
                key={`focusArea-${index}`}
                focusArea={focusArea}
                projectAncestorFocusAreas={focusArea.projectAncestorFocusAreas}
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
              <p className={s.mobileDescription}>{description}</p>
            </div>
          </div>
        </div>
        <div className={s.mobileEmbla} ref={mbEmblaRef}>
          <div className={s.mobileEmblaContainer}>
            {MOCK_FOCUS_AREAS.map((focusArea: any, index: number) => (
              <FocusAreaCard
                key={`focusArea-${index}`}
                focusArea={focusArea}
                projectAncestorFocusAreas={focusArea.projectAncestorFocusAreas}
                onTeamClick={onTeamClick}
                onProjectClick={onProjectClick}
                onSeeMoreClick={onSeeMoreClick}
              />
            ))}
          </div>
        </div>
        <div className={s.progressBar}>
          <div className={s.progressTrack}>
            <div className={s.progressFill} style={{ transform: `translate3d(${scrollProgress}%,0px,0px)` }} />
          </div>
        </div>
      </div>
    </>
  );
}
