'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

import { HighlightsBar } from '@/components/core/navbar/components/HighlightsBar';
import { useCarousel } from '@/hooks/use-embla-carousel';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';

import styles from './PlaaBanner.module.scss';

type BannerType = 'event' | 'bonus';

interface BannerButton {
  label: string;
  link: string;
  variant: 'primary' | 'secondary';
}

interface BannerContent {
  id: string;
  type: BannerType;
  title: string;
  subtitle: string;
  highlightText?: string;
  date: string;
  buttons: BannerButton[];
}

// Shared Confirm Referral link for all bonus-lead items
const CONFIRM_REFERRAL_LINK = 'https://docs.google.com/forms/d/e/1FAIpQLSfuDNC7fGLc5TMhSh1g6IpTXzOkS8Ie-I1QbIxOdqefUKSt3g/viewform';

// Banner data
export const BANNER_CONTENTS: BannerContent[] = [
  {
    id: 'bonus-product-manager',
    type: 'bonus',
    title: 'Bonus Points Multiplier: Product Manager',
    subtitle: 'Bonus Points Multiplier on Key Talent Referrals',
    highlightText: '2×–3×',
    date: 'Submit by Jan 31, 2026',
    buttons: [
      { label: 'View Job Info', link: 'https://jobs.protocol.ai/companies/pl-job-board/jobs/59154950-product-manager-labos-modularization', variant: 'primary' },
      { label: 'Confirm Referral', link: CONFIRM_REFERRAL_LINK, variant: 'secondary' },
    ],
  },
  {
    id: 'bonus-product-lead',
    type: 'bonus',
    title: 'Bonus Points Multiplier: Product Lead',
    subtitle: 'Bonus Points Multiplier on Key Talent Referrals',
    highlightText: '2×–3×',
    date: 'Submit by Jan 31, 2026',
    buttons: [
      { label: 'View Job Info', link: 'https://jobs.protocol.ai/companies/pl-job-board/jobs/47068372-product-manager-alignment-asset', variant: 'primary' },
      { label: 'Confirm Referral', link: CONFIRM_REFERRAL_LINK, variant: 'secondary' },
    ],
  },
  {
    id: 'bonus-network-product-lead',
    type: 'bonus',
    title: 'Bonus Points Multiplier: Network Product Lead',
    subtitle: 'Bonus Points Multiplier on Key Talent Referrals',
    highlightText: '2x-3x',
    date: 'Submit by Jan 31, 2026',
    buttons: [
      { label: 'View Job Info', link: 'https://jobs.protocol.ai/companies/pl-job-board/jobs/60401144-network-product-lead-polaris', variant: 'primary' },
      { label: 'Confirm Referral', link: CONFIRM_REFERRAL_LINK, variant: 'secondary' },
    ],
  },
  {
    id: 'bonus-events-lead',
    type: 'bonus',
    title: 'Bonus Points Multiplier: Events Lead',
    subtitle: 'Bonus Points Multiplier on Key Talent Referrals',
    highlightText: '2x-3x',
    date: 'Submit by Jan 31, 2026',
    buttons: [
      { label: 'View Job Info', link: 'https://jobs.protocol.ai/companies/pl-job-board/jobs/61984015-events-lead#content', variant: 'primary' },
      { label: 'Confirm Referral', link: CONFIRM_REFERRAL_LINK, variant: 'secondary' },
    ],
  },
  {
    id: 'bonus-network-scientist',
    type: 'bonus',
    title: 'Bonus Points Multiplier: Network Scientist',
    subtitle: 'Bonus Points Multiplier on Key Talent Referrals',
    highlightText: '2x-3x',
    date: 'Submit by Jan 31, 2026',
    buttons: [
      { label: 'View Job Info', link: 'https://jobs.protocol.ai/companies/pl-job-board/jobs/60969057-network-scientist-polaris#content', variant: 'primary' },
      { label: 'Confirm Referral', link: CONFIRM_REFERRAL_LINK, variant: 'secondary' },
    ],
  },
  {
    id: 'buyback-auction',
    type: 'event',
    title: 'Upcoming Event',
    subtitle: 'Buyback Auction Q1 2026',
    date: 'February 19 - 26',
    buttons: [
      // { label: 'Learn More', link: 'https://protocol.ai', variant: 'secondary' },
    ],
  },
];

interface PlaaBannerProps {
  variant?: 'desktop' | 'mobile';
}

export function PlaaBanner({ variant = 'desktop' }: PlaaBannerProps) {
  const pathname = usePathname();
  const [isCompact, setIsCompact] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  
  const { onBannerCarouselPrevClicked, onBannerCarouselNextClicked, onBannerButtonClicked } = useAlignmentAssetsAnalytics();
  
  // Desktop carousel
  const desktopCarousel = useCarousel({
    loop: true,
    align: 'start',
  });
  
  // Mobile carousel with drag/swipe enabled
  const mobileCarousel = useCarousel({
    loop: true,
    align: 'start',
    dragFree: false,
  });

  // Intersection Observer to detect when banner becomes "stuck"
  // We observe a sentinel placed BEFORE the mobile banner wrapper
  useEffect(() => {
    if (variant !== 'mobile') return;

    // Find the mobile banner wrapper in the layout
    const bannerWrapper = document.querySelector('[class*="plaa__mobile-banner"]');
    if (!bannerWrapper) return;

    // Create sentinel and place it BEFORE the banner wrapper
    const sentinel = document.createElement('div');
    sentinel.id = 'plaa-scroll-sentinel';
    sentinel.style.cssText = 'height: 1px; width: 100%; pointer-events: none;';
    bannerWrapper.parentNode?.insertBefore(sentinel, bannerWrapper);

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel exits viewport (scrolled past), show compact
        setIsCompact(!entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: `-${getComputedStyle(document.documentElement).getPropertyValue('--app-header-height') || '64px'} 0px 0px 0px`,
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      sentinel.remove();
    };
  }, [variant]);

  if (!pathname?.includes('alignment-asset')) {
    return null;
  }

  const totalSlides = BANNER_CONTENTS.length;

  const handlePrevClick = () => {
    onBannerCarouselPrevClicked();
    desktopCarousel.scrollPrev();
  };

  const handleNextClick = () => {
    onBannerCarouselNextClicked();
    desktopCarousel.scrollNext();
  };

  // Desktop variant
  if (variant === 'desktop') {
    return (
      <HighlightsBar variant="plaa">
        <div className={styles.banner}>
          {/* Left Arrow - far left */}
          <button className={styles.navBtnLeft} onClick={handlePrevClick} aria-label="Previous">
            <Image src="/icons/chevron-left-white.svg" alt="" width={16} height={16} />
          </button>

          {/* Center Content */}
          <div className={styles.centerContent}>
            {/* Embla Carousel */}
            <div className={styles.emblaViewport} ref={desktopCarousel.emblaRef}>
              <div className={styles.emblaContainer}>
                {BANNER_CONTENTS.map((item) => (
                  <div key={item.id} className={styles.emblaSlide}>
                    {/* Icon */}
                    <div className={styles.iconBox}>
                      <Image
                        src={item.type === 'event' ? '/icons/calendar-white.svg' : '/icons/zap-yellow.svg'}
                        alt=""
                        width={24}
                        height={24}
                      />
                    </div>

                    {/* Text */}
                    <div className={styles.textArea}>
                      <p className={styles.title}>{item.title}</p>
                      <div className={styles.subtitle}>
                        <span>
                          {item.type === 'bonus' && item.highlightText ? (
                            <>
                              Bonus Points Multiplier <span className={styles.highlight}>{item.highlightText}</span> on Key Talent Referrals
                            </>
                          ) : (
                            item.subtitle
                          )}
                        </span>
                        <span className={styles.separator} />
                        <span>{item.date}</span>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className={styles.buttons}>
                      {item.buttons.map((btn, i) => (
                        <a
                          key={i}
                          href={btn.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={btn.variant === 'primary' ? styles.btnPrimary : styles.btnSecondary}
                          onClick={() => onBannerButtonClicked(btn.label, btn.link)}
                        >
                          {btn.label}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pagination */}
          <span className={styles.pagination}>{desktopCarousel.activeIndex + 1}/{totalSlides}</span>

          {/* Right Arrow - far right */}
          <button className={styles.navBtnRight} onClick={handleNextClick} aria-label="Next">
            <Image src="/icons/chevron-right-white.svg" alt="" width={16} height={16} />
          </button>
        </div>
      </HighlightsBar>
    );
  }

  // Mobile variant
  return (
    <div 
      ref={bannerRef}
      className={`${styles.mobileBanner} ${isCompact ? styles.mobileBannerCompact : ''}`}
    >
      {/* Dots - always visible, positioned at top in compact mode */}
      <div className={styles.dotsWrapper}>
        <div className={styles.dots}>
          {BANNER_CONTENTS.map((_, i) => (
            <span key={i} className={`${styles.dot} ${i === mobileCarousel.activeIndex ? styles.dotActive : ''}`} />
          ))}
        </div>
      </div>

      {/* Single carousel - always mounted for consistent swipe */}
      <div className={styles.mobileEmblaViewport} ref={mobileCarousel.emblaRef}>
        <div className={styles.mobileEmblaContainer}>
          {BANNER_CONTENTS.map((item) => (
            <div key={item.id} className={styles.mobileEmblaSlide}>
              {/* Title - always visible */}
              <p className={styles.mobileTitle}>{item.title}</p>
              
              {/* Content hidden in compact mode */}
              <div className={styles.mobileHideOnCompact}>
                <div className={styles.mobileTextGroup}>
                  <p className={styles.mobileSubtitle}>
                    {item.type === 'bonus' && item.highlightText ? (
                      <>
                        Bonus Points Multiplier <span className={styles.highlight}>{item.highlightText}</span> on Key Talent Referrals
                      </>
                    ) : (
                      item.subtitle
                    )}
                  </p>
                  <p className={styles.mobileDate}>{item.date}</p>
                </div>
                <div className={styles.mobileButtons}>
                  {item.buttons.map((btn, i) => (
                    <a
                      key={i}
                      href={btn.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={btn.variant === 'primary' ? styles.mobileBtnPrimary : styles.mobileBtnSecondary}
                      onClick={() => onBannerButtonClicked(btn.label, btn.link)}
                    >
                      {btn.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination with dots - bottom right in full mode */}
      <div className={styles.mobilePaginationFixed}>
        <span className={styles.paginationText}>{mobileCarousel.activeIndex + 1}/{totalSlides}</span>
        <div className={styles.dots}>
          {BANNER_CONTENTS.map((_, i) => (
            <span key={i} className={`${styles.dot} ${i === mobileCarousel.activeIndex ? styles.dotActive : ''}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
