'use client';

import Link from 'next/link';
import { SupportSectionData } from '../types';

interface SupportSectionProps {
  data: SupportSectionData;
}

/**
 * SupportSection - Displays support contact information
 * @param data - Support section data from master JSON
 */
export default function SupportSection({ data }: SupportSectionProps) {
  return (
    <>
      <section className="support-section">
        <div className="support-section__container">
          <div className="support-section__line" />
          <div className="support-section__content">
            <p className="support-section__text">
              <strong>Have questions or need help with onboarding?</strong>{' '}
              <Link href={data.scheduleUrl} target="_blank" rel="noopener noreferrer" className="support-section__link">Schedule office hours</Link>
              {' '}for 1:1 support or email{' '}
              <Link href={`mailto:${data.email}`} target="_blank" rel="noopener noreferrer" className="support-section__link">{data.email}</Link>
              <span className="support-section__dot">.</span>
            </p>
          </div>
          <div className="support-section__line" />
        </div>
      </section>

      <style jsx>{`
        .support-section {
          width: 100%;
        }

        .support-section__container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          padding: 0;
          background: linear-gradient(to right, rgba(241, 245, 249, 0) 0%, #fafcff 50%, rgba(241, 245, 249, 0) 100%);
        }

        .support-section__line {
          width: 802px;
          max-width: 100%;
          height: 1px;
          background: linear-gradient(to right, rgba(66, 125, 255, 0) 0%, #427dff 50%, rgba(66, 125, 255, 0) 100%);
        }

        .support-section__content {
          padding: 30px 24px;
          text-align: center;
        }

        .support-section__text {
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 500;
          line-height: 20px;
          color: #475569;
          margin: 0;
        }

        .support-section__text strong {
          font-weight: 600;
          color: #0f172a;
        }

        .support-section__dot {
          color: #156ff7;
        }

        @media (max-width: 768px) {
          .support-section__content {
            padding: 20px 16px;
          }
          
          .support-section__text {
            font-size: 14px;
          }
        }
      `}</style>

      <style jsx global>{`
        .support-section__link {
          color: #156ff7;
          text-decoration: underline;
          text-underline-position: from-font;
          font-weight: 500;
        }

        .support-section__link:hover {
          text-decoration: none;
        }
      `}</style>
    </>
  );
}
