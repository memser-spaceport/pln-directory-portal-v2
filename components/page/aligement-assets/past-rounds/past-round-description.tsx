'use client';

import Link from 'next/link';

interface PastRoundDescriptionProps {
  /** The round number (e.g., 10) */
  roundNumber: number;
  /** The month of the round (e.g., "November") */
  month: string;
  /** The year of the round (e.g., 2025) */
  year: number;
}

/**
 * PastRoundDescription - Displays past round description with embedded links
 */
export default function PastRoundDescription({
  roundNumber,
  month,
  year,
}: PastRoundDescriptionProps) {
  return (
    <>
      <section className="past-round-description">
        <div className="past-round-description__container">
          {/* Header with title */}
          <h2 className="past-round-description__title">
            Round {roundNumber}: {month} {year}
          </h2>

          {/* Description paragraphs */}
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
      </section>

      <style jsx>{`
        .past-round-description {
          width: 100%;
        }

        .past-round-description__container {
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
      `}</style>
    </>
  );
}
