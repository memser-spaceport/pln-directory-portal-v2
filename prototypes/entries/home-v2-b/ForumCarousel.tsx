'use client';

import useEmblaCarousel from 'embla-carousel-react';
import type { ReactNode } from 'react';

import { usePrevNextButtons } from '@/hooks/use-prev-next-buttons';

import hr from '../home-refactor/HomeRefactorPrototype.module.scss';
import hrb from '../home-refactor-b/HomeRefactorB.module.scss';
import s from './HomeV2B.module.scss';

/**
 * "From the forum" as a carousel: production Home's Featured carousel engine
 * (embla + usePrevNextButtons, its arrow-circle icons), over the feed's own
 * ForumPostCard. Two cards a view on desktop, one and a peek on phones, where
 * the strip is swiped and the arrows hide.
 */
export function ForumCarousel({ uids, renderPost }: { uids: string[]; renderPost: (uid: string) => ReactNode }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', slidesToScroll: 'auto', containScroll: 'trimSnaps' });
  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } = usePrevNextButtons(emblaApi);

  return (
    <section className={s.section} aria-labelledby="home-forum-title">
      <div className={hr.sectionHead}>
        <h2 id="home-forum-title" className={hrb.moduleTitle}>
          From the forum
        </h2>
        <div className={s.headActions}>
          <a href="/forum" className={hr.seeAll}>
            Go to forum
          </a>
          <div className={s.arrows}>
            <button
              type="button"
              className={s.arrow}
              onClick={onPrevButtonClick}
              disabled={prevBtnDisabled}
              aria-label="Previous posts"
            >
              <img
                src={prevBtnDisabled ? '/icons/left-arrow-circle-disabled.svg' : '/icons/left-arrow-circle.svg'}
                alt=""
                width={24}
                height={24}
              />
            </button>
            <button
              type="button"
              className={s.arrow}
              onClick={onNextButtonClick}
              disabled={nextBtnDisabled}
              aria-label="Next posts"
            >
              <img
                src={nextBtnDisabled ? '/icons/right-arrow-circle-disabled.svg' : '/icons/right-arrow-circle.svg'}
                alt=""
                width={24}
                height={24}
              />
            </button>
          </div>
        </div>
      </div>

      <div className={s.embla} ref={emblaRef}>
        <div className={s.emblaTrack}>
          {uids.map((uid) => (
            <div key={uid} className={s.emblaSlide}>
              {renderPost(uid)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
