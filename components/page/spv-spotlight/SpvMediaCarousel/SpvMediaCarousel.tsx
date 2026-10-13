'use client';

import React, { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import useEmblaCarousel from 'embla-carousel-react';
import type { SpvMedia } from '@/services/spv-spotlight/types';
import { ChevronIcon } from '../icons';
import s from './SpvMediaCarousel.module.scss';

type Props = {
  images: SpvMedia[];
  /** Accessible name, e.g. "Netholabs, from its website". */
  label: string;
  sourceUrl: string;
};

/**
 * The team card's media: images from the team's own website, where PL
 * Spotlight's card had its pitch deck and video. Embla brings touch swipe;
 * prev/next, the counter, thumbnails and arrow keys are ours.
 */
export function SpvMediaCarousel({ images, label, sourceUrl }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [index, setIndex] = useState(0);
  const total = images.length;

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on('select', onSelect).on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect).off('reInit', onSelect);
    };
  }, [emblaApi]);

  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    }
  };

  if (!total) return null;
  const host = sourceUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <section className={s.root} aria-roledescription="carousel" aria-label={label} onKeyDown={onKeyDown}>
      <div className={s.stage}>
        <div className={s.viewport} ref={emblaRef} tabIndex={0} aria-label={`${label}. Use arrow keys to move.`}>
          <div className={s.track}>
            {images.map((image, i) => (
              <div
                key={image.url}
                className={s.slide}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${total}`}
                aria-hidden={i !== index}
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className={clsx(s.image, { [s.imageContain]: image.fit === 'contain' })}
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        {total > 1 && (
          <>
            <button type="button" className={clsx(s.navButton, s.prev)} onClick={prev} aria-label="Previous image">
              <ChevronIcon direction="left" />
            </button>
            <button type="button" className={clsx(s.navButton, s.next)} onClick={next} aria-label="Next image">
              <ChevronIcon direction="right" />
            </button>
            <span className={s.counter} aria-hidden>
              {index + 1} / {total}
            </span>
          </>
        )}
      </div>

      {total > 1 && (
        <div className={s.thumbs}>
          {images.map((image, i) => (
            <button
              key={image.url}
              type="button"
              className={clsx(s.thumb, { [s.thumbActive]: i === index })}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Show image ${i + 1} of ${total}: ${image.alt}`}
              aria-current={i === index}
            >
              <img src={image.url} alt="" draggable={false} />
            </button>
          ))}
        </div>
      )}

      <p className={s.caption} aria-live="polite">
        <span className={s.captionText}>{images[index]?.alt}</span>
        {host && (
          <span className={s.source}>
            From{' '}
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
              {host}
            </a>
          </span>
        )}
      </p>
    </section>
  );
}
