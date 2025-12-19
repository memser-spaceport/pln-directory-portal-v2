'use client';

import Link from 'next/link';
import { LearnMoreSectionData } from '../types';

interface LearnMoreSectionProps {
  data: LearnMoreSectionData;
}

/**
 * LearnMoreSection - Displays a banner with FAQ link
 * @param data - Learn more section data from master JSON
 */
export default function LearnMoreSection({ data }: LearnMoreSectionProps) {
  return (
    <>
      <section className="learn-more-section">
        <div className="learn-more-section__wrapper">
          <div className="learn-more-section__container">
            <p className="learn-more-section__text">
              <span className="learn-more-section__text-bold">Learn more:</span>
              <span className="learn-more-section__text-space"> </span>
              <span className="learn-more-section__text-body">Read the </span>
              {data.faqUrl === '#' ? (
                <span className="learn-more-section__link learn-more-section__link--disabled">FAQ</span>
              ) : (
                <Link href={data.faqUrl} target="_blank" rel="noopener noreferrer" className="learn-more-section__link">FAQ</Link>
              )}
              <span className="learn-more-section__text-body"> for details on batch auctions, clearing price calculation, and how bids are selected.</span>
            </p>
          </div>
        </div>
      </section>

      <style jsx>{`
        .learn-more-section {
          width: 100%;
        }

        .learn-more-section__wrapper {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        .learn-more-section__container {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 17.5px 22px;
          background-color: white;
          border: 1.5px solid #427dff;
          border-radius: 100px;
          overflow: hidden;
        }

        .learn-more-section__text {
          font-size: 16px;
          font-weight: 500;
          line-height: 20px;
          margin: 0;
          white-space: nowrap;
        }

        .learn-more-section__text-bold {
          font-weight: 600;
          color: #0f172a;
        }

        .learn-more-section__text-space {
          font-weight: 600;
        }

        .learn-more-section__text-body {
          color: #475569;
        }

        @media (max-width: 768px) {
          .learn-more-section__container {
            padding: 8px 16px;
          }
          
          .learn-more-section__text {
            font-size: 14px;
            white-space: normal;
            text-align: center;
          }
        }
      `}</style>

      <style jsx global>{`
        .learn-more-section__link {
          color: #156ff7;
          text-decoration: underline;
          text-underline-position: from-font;
          font-weight: 500;
        }

        .learn-more-section__link:hover {
          text-decoration: none;
        }

        .learn-more-section__link--disabled {
          cursor: default;
          pointer-events: none;
        }

        .learn-more-section__link--disabled:hover {
          text-decoration: underline;
        }
      `}</style>
    </>
  );
}