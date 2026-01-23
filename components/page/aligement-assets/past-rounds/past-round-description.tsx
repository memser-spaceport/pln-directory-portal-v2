'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface PastRoundDescriptionProps {
  /** The round number (e.g., 10) */
  roundNumber: number;
  /** The month of the round (e.g., "November") */
  month: string;
  /** The year of the round (e.g., 2025) */
  year: number;
  /** The number of tokens allocated for the round (e.g., "10,000") */
  tokensAllocated?: string;
}

/**
 * PastRoundDescription - Displays past round description with embedded links
 * On mobile: Collapsible card that expands on click
 * On desktop: Always shows full content
 */
export default function PastRoundDescription({
  roundNumber,
  month,
  year,
  tokensAllocated = '10,000',
}: PastRoundDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <section className="past-round-description">
        {/* Desktop view - original layout */}
        <div className="past-round-description__container past-round-description__container--desktop">
          <h2 className="past-round-description__title">
            Round {roundNumber}: {month} {year}
          </h2>

          <div className="past-round-description__content">
            <p className="past-round-description__paragraph">
              Up to 10,000 tokens are allocated each month for verified contributions through{' '}
              <Link
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="past-round-description__link"
              >
                Incentivized Activities
              </Link>{' '}
              completed and submitted by network contributors. Each category is allocated a fixed
              portion of these tokens based on network priorities.
            </p>

            <p className="past-round-description__paragraph">
              Your token amount depends on participation within each category: when more people
              contribute, the token pool is more widely distributed; when activity is lower in a
              category, more tokens are available per contributor.
            </p>

            <p className="past-round-description__paragraph">
              Some categories update in real time, while others rely on participants submitting
              information. Consequently, the point totals may not always reflect the most recent
              activity — especially for activities such as Custom Incentive Experiments, Blog
              Creation, Talent Referrals, Curated X Spaces, and Referral Program submissions. Our
              new{' '}
              <Link
                href="https://forms.gle/DiACtNgcsaAS8B6P8"
                target="_blank"
                rel="noopener noreferrer"
                className="past-round-description__link"
              >
                unified reporting form
              </Link>{' '}
              streamlines most submissions, though some activities will still require manual
              updates. We&apos;ll continue updating as new submissions come in and are working
              toward more automation in 2026.
            </p>

            <p className="past-round-description__paragraph">
              Each round represents a single monthly snapshot period. View the token allocations and
              activity levels for Round {roundNumber} below.
            </p>
          </div>
        </div>

        {/* Mobile view - collapsible card */}
        <div className="past-round-description__card past-round-description__card--mobile">
          <button
            className="past-round-description__card-header"
            onClick={handleToggle}
            aria-expanded={isExpanded}
          >
            <div className="past-round-description__card-info">
              <div className="past-round-description__card-title-row">
                <h2 className="past-round-description__card-title">
                  Round {roundNumber}: {month} {year}
                </h2>
                <Image
                  src="/icons/arrow-down-light.svg"
                  alt=""
                  width={16}
                  height={16}
                  className={`past-round-description__chevron ${isExpanded ? 'past-round-description__chevron--expanded' : ''}`}
                />
              </div>
              <p className="past-round-description__card-subtitle">
                {tokensAllocated} tokens allocated
              </p>
            </div>
          </button>

          <div
            className={`past-round-description__card-content ${isExpanded ? 'past-round-description__card-content--expanded' : ''}`}
          >
            <div className="past-round-description__card-content-inner">
              <div className="past-round-description__content">
                <p className="past-round-description__paragraph">
                  Up to 10,000 tokens are allocated each month for verified contributions through{' '}
                  <Link
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="past-round-description__link"
                  >
                    Incentivized Activities
                  </Link>{' '}
                  completed and submitted by network contributors. Each category is allocated a
                  fixed portion of these tokens based on network priorities.
                </p>

                <p className="past-round-description__paragraph">
                  Your token amount depends on participation within each category: when more people
                  contribute, the token pool is more widely distributed; when activity is lower in a
                  category, more tokens are available per contributor.
                </p>

                <p className="past-round-description__paragraph">
                  Some categories update in real time, while others rely on participants submitting
                  information. Consequently, the point totals may not always reflect the most recent
                  activity — especially for activities such as Custom Incentive Experiments, Blog
                  Creation, Talent Referrals, Curated X Spaces, and Referral Program submissions.
                  Our new{' '}
                  <Link
                    href="https://forms.gle/DiACtNgcsaAS8B6P8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="past-round-description__link"
                  >
                    unified reporting form
                  </Link>{' '}
                  streamlines most submissions, though some activities will still require manual
                  updates. We&apos;ll continue updating as new submissions come in and are working
                  toward more automation in 2026.
                </p>

                <p className="past-round-description__paragraph">
                  Each round represents a single monthly snapshot period. View the token allocations
                  and activity levels for Round {roundNumber} below.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .past-round-description {
          width: 100%;
        }

        /* Desktop container styles */
        .past-round-description__container--desktop {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .past-round-description__title {
          font-size: 18px;
          font-weight: 600;
          line-height: normal;
          color: #16161f;
          margin: 0;
        }

        .past-round-description__content {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .past-round-description__paragraph {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #475569;
          margin: 0 0 20px 0;
        }

        .past-round-description__paragraph:last-child {
          margin-bottom: 0;
        }

        /* Mobile card styles - hidden by default on desktop */
        .past-round-description__card--mobile {
          display: none;
        }

        /* Mobile view styles */
        @media (max-width: 768px) {
          .past-round-description__container--desktop {
            display: none;
          }

          .past-round-description__card--mobile {
            display: block;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
          }

          .past-round-description__card-header {
            display: flex;
            align-items: flex-start;
            width: 100%;
            padding: 16px 20px;
            background: transparent;
            border: none;
            cursor: pointer;
            text-align: left;
          }

          .past-round-description__card-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
            width: 100%;
          }

          .past-round-description__card-title-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
          }

          .past-round-description__card-title {
            font-size: 16px;
            font-weight: 600;
            line-height: 24px;
            color: #16161f;
            margin: 0;
          }

          .past-round-description__card-subtitle {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            color: #64748b;
            margin: 0;
          }

          .past-round-description__card-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
          }

          .past-round-description__card-content--expanded {
            max-height: 1000px;
            transition: max-height 0.5s ease-in;
          }

          .past-round-description__card-content-inner {
            padding: 0 20px 20px 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
        }
      `}</style>

      <style jsx global>{`
        .past-round-description__link {
          color: #156ff7;
          text-decoration: underline;
          text-underline-position: from-font;
        }

        .past-round-description__link:hover {
          text-decoration: none;
        }

        .past-round-description__chevron {
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .past-round-description__chevron--expanded {
          transform: rotate(180deg);
        }
      `}</style>
    </>
  );
}
