'use client';

import React, { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import useEmblaCarousel from 'embla-carousel-react';
import type { WebsiteImage } from './netholabs';
import s from './SpvSpotlight.module.scss';

type Props = {
  images: WebsiteImage[];
  // Accessible name for the carousel, e.g. "Netholabs, from its website".
  label: string;
  sourceUrl: string;
};

/**
 * The team card's media: images from the team's own website, where PL
 * Spotlight's card had its pitch slide and video (ProfileContent).
 *
 * Production has no presentational carousel to import — the home rows
 * (featured, discover) drive embla-carousel-react inline — so this is the same
 * library with its own controls. Embla brings touch swipe; the rest is ours:
 * prev/next on the image, a counter, thumbnails, arrow keys on the focused
 * region, "n of N" slide labels.
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
    <section className={s.carousel} aria-roledescription="carousel" aria-label={label} onKeyDown={onKeyDown}>
      {/* The stage: image, prev/next on its edges and an "n / N" counter in
          its corner (Klook's and Care.com's galleries). */}
      <div className={s.carouselStage}>
        <div
          className={s.carouselViewport}
          ref={emblaRef}
          tabIndex={0}
          aria-label={`${label}. Use arrow keys to move.`}
        >
          <div className={s.carouselTrack}>
            {images.map((image, i) => (
              <div
                key={image.src}
                className={s.carouselSlide}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${total}`}
                aria-hidden={i !== index}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className={clsx(s.carouselImage, { [s.carouselImageContain]: image.fit === 'contain' })}
                  loading="eager"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              className={clsx(s.carouselButton, s.carouselButtonPrev)}
              onClick={prev}
              aria-label="Previous image"
            >
              <Chevron direction="left" />
            </button>
            <button
              type="button"
              className={clsx(s.carouselButton, s.carouselButtonNext)}
              onClick={next}
              aria-label="Next image"
            >
              <Chevron direction="right" />
            </button>
            <span className={s.carouselCounter} aria-hidden>
              {index + 1} / {total}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails instead of dots: with three images, showing them says
          more than three dots do. */}
      {total > 1 && (
        <div className={s.carouselThumbs}>
          {images.map((image, i) => (
            <button
              key={image.src}
              type="button"
              className={clsx(s.carouselThumb, { [s.carouselThumbActive]: i === index })}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Show image ${i + 1} of ${total}: ${image.alt}`}
              aria-current={i === index}
            >
              <img src={image.src} alt="" draggable={false} />
            </button>
          ))}
        </div>
      )}

      {/* The slide's own caption (the site's alt text), then where it came from. */}
      <p className={s.carouselCaption} aria-live="polite">
        <span className={s.carouselCaptionText}>{images[index]?.alt}</span>
        <span className={s.carouselSource}>
          From{' '}
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
            {host}
          </a>
        </span>
      </p>
    </section>
  );
}

const Chevron = ({ direction }: { direction: 'left' | 'right' }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d={direction === 'left' ? 'M10 3.5L5.5 8L10 12.5' : 'M6 3.5L10.5 8L6 12.5'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
