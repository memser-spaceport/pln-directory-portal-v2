'use client';
import { usePathname } from 'next/navigation';

import { HighlightsBar } from '@/components/core/navbar/components/HighlightsBar';
import { useCarousel } from '@/hooks/use-embla-carousel';

import s from './PlaaBanner.module.scss';

interface TextSegment {
  text: string;
  link?: string;
}

interface BannerContent {
  id: string;
  segments: TextSegment[];
}

// Add your banner contents here
// Each segment can have optional link - text without link renders as plain text
const BANNER_CONTENTS: BannerContent[] = [
  {
    id: 'talent-referral',
    segments: [
      { text: 'Bonus Points Multiplier for Referring Key Roles: Collect 2× – 3× points on ' },
      { text: 'Talent Referral Program submissions', link: 'https://docs.google.com/forms/d/e/1FAIpQLSfuDNC7fGLc5TMhSh1g6IpTXzOkS8Ie-I1QbIxOdqefUKSt3g/viewform' },
      { text: ' for ' },
      { text: 'Product Manager', link: 'https://jobs.protocol.ai/companies/pl-job-board/jobs/59154950-product-manager-labos-modularization' },
      { text: ', ' },
      { text: 'Product Lead', link: 'https://jobs.protocol.ai/companies/pl-job-board/jobs/47068372-product-manager-alignment-asset' },
      { text: ', ' },
      { text: 'Network Product Lead', link: 'https://jobs.protocol.ai/companies/pl-job-board/jobs/60401144-network-product-lead-polaris' },
      { text: ', ' },
      { text: 'Events Lead', link: ' https://jobs.protocol.ai/companies/pl-job-board/jobs/61984015-events-lead#content' },
      { text: ', and ' },
      { text: 'Network Scientist', link: ' https://jobs.protocol.ai/companies/pl-job-board/jobs/60969057-network-scientist-polaris#content' },
      { text: ' roles. Submit by Jan 31, 2026.' },
    ],
  },
  {
    id: 'buyback-auction',
    segments: [
      { text: 'Upcoming: Buyback Auction - February 19-26' }
    ],
  },
];

/**
 * PlaaBanner - Announcement banner carousel for alignment-asset pages only
 * Shows PLAA-specific announcements on alignment-asset routes with auto-rotating carousel
 * Supports rich text with multiple inline links per announcement
 */
export function PlaaBanner() {
  const pathname = usePathname();
  const { emblaRef, activeIndex, scrollPrev, scrollNext } = useCarousel({
    loop: true,
    align: 'center',
  });

  // Show banner only on alignment-asset pages
  if (!pathname?.includes('alignment-asset')) {
    return null;
  }

  const showNavigation = BANNER_CONTENTS.length > 1;

  return (
    <HighlightsBar variant="plaa">
      <div className={s.root}>
        {showNavigation && (
          <button
            className={`${s.arrow} ${s.arrowLeft}`}
            onClick={scrollPrev}
            aria-label="Previous announcement"
          >
            ‹
          </button>
        )}

        <div className={s.bannerContent}>
          <div className={s.carousel} ref={emblaRef}>
            <div className={s.container}>
              {BANNER_CONTENTS.map((content) => (
                <div key={content.id} className={s.slide}>
                  <p className={s.text}>
                    {content.segments.map((segment, idx) =>
                      segment.link ? (
                        <a key={idx} target="_blank" href={segment.link} className={s.link}>
                          {segment.text}
                        </a>
                      ) : (
                        <span key={idx}>{segment.text}</span>
                      )
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {showNavigation && (
          <button
            className={`${s.arrow} ${s.arrowRight}`}
            onClick={scrollNext}
            aria-label="Next announcement"
          >
            ›
          </button>
        )}

        {showNavigation && (
          <div className={s.indicators}>
            {BANNER_CONTENTS.map((_, index) => (
              <span
                key={index}
                className={`${s.indicator} ${index === activeIndex ? s.active : ''}`}
                aria-label={`Slide ${index + 1}${index === activeIndex ? ' (current)' : ''}`}
              >
                {index === activeIndex ? '—' : '•'}
              </span>
            ))}
          </div>
        )}
      </div>
    </HighlightsBar>
  );
}
