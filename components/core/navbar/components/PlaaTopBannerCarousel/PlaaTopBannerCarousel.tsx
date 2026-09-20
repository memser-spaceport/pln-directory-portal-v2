'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import { usePlaaAccess } from '@/services/rbac/hooks/usePlaaAccess';
import { useCurrentSnapshotStatus } from '@/services/plaa/hooks/useCurrentSnapshotStatus';
import { PlaaBuybackBannerBar, useBuybackBannerSlide } from '@/components/core/navbar/components/PlaaBuybackBanner/PlaaBuybackBanner';
import { PlaaSnapshotBarBar } from '@/components/core/navbar/components/PlaaSnapshotBar/PlaaSnapshotBar';

import styles from './PlaaTopBannerCarousel.module.scss';

const ROTATE_INTERVAL_MS = 8000;

type SlideKey = 'buyback' | 'snapshot';

interface Slide {
  key: SlideKey;
  label: string;
  node: React.ReactNode;
}

export function PlaaTopBannerCarousel() {
  const pathname = usePathname();
  const { canView } = usePlaaAccess();

  if (!pathname?.includes('alignment-asset') || !canView) {
    return null;
  }

  return <PlaaTopBannerCarouselContent />;
}

function toSlide(key: SlideKey, label: string, node: React.ReactNode): Slide {
  return { key, label, node };
}

function PlaaTopBannerCarouselContent() {
  const buybackSlide = useBuybackBannerSlide();
  const snapshotStatus = useCurrentSnapshotStatus();

  const slides: Slide[] = [
    buybackSlide ? toSlide('buyback', 'buyback auction', <PlaaBuybackBannerBar slide={buybackSlide} />) : null,
    toSlide('snapshot', 'snapshot', <PlaaSnapshotBarBar status={snapshotStatus} />),
  ].filter((slide): slide is Slide => slide !== null);

  const slideCount = slides.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slideCount < 2 || paused) return;
    const id = setInterval(() => setActiveIndex((i) => (i + 1) % slideCount), ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [slideCount, paused]);

  if (slideCount === 0) {
    return null;
  }

  // A slide can vanish mid-session (auction ends), leaving activeIndex past
  // the end until the next rotation, so clamp rather than read out of bounds.
  const active = slides[Math.min(activeIndex, slideCount - 1)];

  return (
    <div
      className={styles.carousel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div key={active.key} className={styles.slide}>
        {active.node}
      </div>

      {slideCount > 1 && (
        <div className={styles.dots} role="tablist" aria-label="Banner navigation">
          {slides.map((slide, index) => (
            <button
              key={slide.key}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Show ${slide.label} banner`}
              className={index === activeIndex ? styles.dotActive : styles.dot}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
