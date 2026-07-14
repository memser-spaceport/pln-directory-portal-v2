'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
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

interface BannerCta {
  label: string;
  link: string;
}

interface BannerContent {
  id: string;
  type: BannerType;
  title: string;
  // Inline CTA rendered between the title and the supporting copy.
  // Use this instead of `buttons` when the CTA must precede the copy.
  cta?: BannerCta;
  // Bold lead-in rendered immediately before `subtitle`.
  subtitleBold?: string;
  subtitle: string;
  highlightText?: string;
  date: string;
  buttons: BannerButton[];
}

// Shared Confirm Referral link for all bonus-lead items
const CONFIRM_REFERRAL_LINK = 'https://docs.google.com/forms/d/e/1FAIpQLSfuDNC7fGLc5TMhSh1g6IpTXzOkS8Ie-I1QbIxOdqefUKSt3g/viewform';

// Scroll distance (px) after which the mobile banner collapses to title-only
const COMPACT_SCROLL_OFFSET = 24;

// Banner data
export const BANNER_CONTENTS: BannerContent[] = [
  {
    id: 'buyback-auction-july',
    type: 'event',
    title: 'The July Buyback Auction Is Now Live',
    cta: {
      label: 'Place Your Bid Now on the Surus Platform',
      link: 'https://auction-interface.fly.dev/',
    },
    subtitleBold: 'All bids must be in no later than July 21 at 12 PM ET',
    subtitle: ' for the opportunity to redeem your PLAA in exchange for cash.',
    date: '',
    buttons: [],
  },
];

export function PlaaBanner() {
  const pathname = usePathname();
  const [isCompact, setIsCompact] = useState(false);

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

  // Collapse the banner to title-only once the page is scrolled.
  // The banner sits inside a `position: sticky` header, so a sentinel placed next to
  // it never leaves the viewport - read the scroll container directly instead.
  // `body` is the vertical scroller here (globals.scss sets height: 100dvh +
  // overflow-x: hidden, which forces overflow-y to auto), so window.scrollY stays 0.
  useEffect(() => {
    const getScrollOffset = () =>
      Math.max(document.body?.scrollTop ?? 0, document.documentElement?.scrollTop ?? 0, window.scrollY || 0);

    const onScroll = () => setIsCompact(getScrollOffset() > COMPACT_SCROLL_OFFSET);

    onScroll();

    const targets: Array<EventTarget> = [document.body, document, window];
    targets.forEach((t) => t.addEventListener('scroll', onScroll, { passive: true }));

    return () => {
      targets.forEach((t) => t.removeEventListener('scroll', onScroll));
    };
  }, [pathname]);

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

  return (
    <>
      <HighlightsBar variant="plaa">
        <div className={styles.banner}>
          {/* Left Arrow - far left */}
          {totalSlides > 1 && (
            <button className={styles.navBtnLeft} onClick={handlePrevClick} aria-label="Previous">
              <Image src="/icons/chevron-left-white.svg" alt="" width={16} height={16} />
            </button>
          )}

          {/* Center Content */}
          <div className={styles.centerContent}>
            {/* Embla Carousel */}
            <div className={styles.emblaViewport} ref={desktopCarousel.emblaRef}>
              <div className={styles.emblaContainer}>
                {BANNER_CONTENTS.map((item) => {
                  const hasSubtitle = !!(item.subtitle || item.subtitleBold || item.date || item.highlightText);
                  const hasButtons = item.buttons.length > 0;
                  const titleOnly = !hasSubtitle && !hasButtons && !item.cta;
                  return (
                  <div key={item.id} className={`${styles.emblaSlide} ${titleOnly ? styles.emblaSlideTitleOnly : ''}`}>
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
                      {item.cta && (
                        <a
                          href={item.cta.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.ctaLink}
                          onClick={() => onBannerButtonClicked(item.cta!.label, item.cta!.link)}
                        >
                          {item.cta.label}
                        </a>
                      )}
                      {hasSubtitle && (
                        <div className={styles.subtitle}>
                          <span>
                            {item.type === 'bonus' && item.highlightText ? (
                              <>
                                Bonus Points Multiplier <span className={styles.highlight}>{item.highlightText}</span> on Key Talent Referrals
                              </>
                            ) : (
                              <>
                                {item.subtitleBold && <strong className={styles.subtitleStrong}>{item.subtitleBold}</strong>}
                                {item.subtitle}
                              </>
                            )}
                          </span>
                          {item.date && (
                            <>
                              <span className={styles.separator} />
                              <span>{item.date}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Buttons - only when present */}
                    {hasButtons && (
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
                    )}
                  </div>
                );})}
              </div>
            </div>
          </div>

          {/* Pagination */}
          {totalSlides > 1 && (
            <span className={styles.pagination}>{desktopCarousel.activeIndex + 1}/{totalSlides}</span>
          )}

          {/* Right Arrow - far right */}
          {totalSlides > 1 && (
            <button className={styles.navBtnRight} onClick={handleNextClick} aria-label="Next">
              <Image src="/icons/chevron-right-white.svg" alt="" width={16} height={16} />
            </button>
          )}
        </div>
      </HighlightsBar>

      <div className={styles.mobileBannerWrapper}>
        <div className={`${styles.mobileBanner} ${isCompact ? styles.mobileBannerCompact : ''}`}>
      {/* Dots - always visible, positioned at top in compact mode */}
      {totalSlides > 1 && (
        <div className={styles.dotsWrapper}>
          <div className={styles.dots}>
            {BANNER_CONTENTS.map((_, i) => (
              <span key={i} className={`${styles.dot} ${i === mobileCarousel.activeIndex ? styles.dotActive : ''}`} />
            ))}
          </div>
        </div>
      )}

      {/* Single carousel - always mounted for consistent swipe */}
      <div className={styles.mobileEmblaViewport} ref={mobileCarousel.emblaRef}>
        <div className={styles.mobileEmblaContainer}>
          {BANNER_CONTENTS.map((item) => (
            <div key={item.id} className={styles.mobileEmblaSlide}>
              {/* Title - always visible */}
              <p className={styles.mobileTitle}>{item.title}</p>
              
              {/* Content hidden in compact mode */}
              <div className={styles.mobileHideOnCompact}>
                {item.cta && (
                  <a
                    href={item.cta.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.mobileCtaLink}
                    onClick={() => onBannerButtonClicked(item.cta!.label, item.cta!.link)}
                  >
                    {item.cta.label}
                  </a>
                )}
                <div className={styles.mobileTextGroup}>
                  {item.type === 'event' ? (
                    <p className={styles.mobileSubtitle}>
                      {item.subtitleBold && <strong className={styles.subtitleStrong}>{item.subtitleBold}</strong>}
                      {item.subtitle}{item.date && ` - ${item.date}`}
                    </p>
                  ) : (
                    <>
                      <p className={styles.mobileSubtitle}>
                        {item.highlightText ? (
                          <>
                            Bonus Points Multiplier <span className={styles.highlight}>{item.highlightText}</span> on Key Talent Referrals
                          </>
                        ) : (
                          <>
                            {item.subtitleBold && <strong className={styles.subtitleStrong}>{item.subtitleBold}</strong>}
                            {item.subtitle}
                          </>
                        )}
                      </p>
                      {item.date && <p className={styles.mobileDate}>{item.date}</p>}
                    </>
                  )}
                </div>
                {item.buttons.length > 0 && (
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
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination with dots - bottom right in full mode */}
      {totalSlides > 1 && (
        <div className={styles.mobilePaginationFixed}>
          <span className={styles.paginationText}>{mobileCarousel.activeIndex + 1}/{totalSlides}</span>
          <div className={styles.dots}>
            {BANNER_CONTENTS.map((_, i) => (
              <span key={i} className={`${styles.dot} ${i === mobileCarousel.activeIndex ? styles.dotActive : ''}`} />
            ))}
          </div>
        </div>
      )}
        </div>
      </div>
    </>
  );
}
