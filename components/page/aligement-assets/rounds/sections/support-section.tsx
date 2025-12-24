'use client';

import Link from 'next/link';
import {SUPPORT_URL, SUPPORT_EMAIL} from '@/constants/plaa';

/**
 * SupportSection - Displays support contact information with gradient background
 * Figma: https://www.figma.com/design/xrvyUEqgZ0oRNT0spUruMW/Untitled?node-id=1-2296
 * @param data - Support section data from master JSON
 */
export default function SupportSection() {
  return (
    <>
      <section className="support-section">
        {/* Top gradient line */}
        <div className="support-section__line-wrapper">
          <div className="support-section__line" />
        </div>
        
        {/* Content with gradient background */}
        <div className="support-section__bg-wrapper">
          <div className="support-section__content">
            <p className="support-section__text">
              <strong>Have questions or need help with onboarding?</strong>{' '}
              <Link href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="support-section__link">Schedule office hours</Link>
              {' '}for 1:1 support or email{' '}
              <Link href={`mailto:${SUPPORT_EMAIL}`} target="_blank" rel="noopener noreferrer" className="support-section__link">{SUPPORT_EMAIL}</Link>
              <span className="support-section__dot">.</span>
            </p>
          </div>
        </div>
        
        {/* Bottom gradient line */}
        <div className="support-section__line-wrapper">
          <div className="support-section__line" />
        </div>
      </section>

      <style jsx>{`
        .support-section {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .support-section__line-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .support-section__line {
          width: 802px;
          max-width: 100%;
          height: 1px;
          background: linear-gradient(
            90deg,
            rgba(66, 125, 255, 0) 0%,
            #427dff 50%,
            rgba(66, 125, 255, 0) 100%
          );
        }

        .support-section__bg-wrapper {
          width: 100%;
          background: linear-gradient(
            90deg,
            rgba(241, 245, 249, 0) 0%,
            #fafcff 50.205%,
            rgba(241, 245, 249, 0) 100%
          );
        }

        .support-section__content {
          width: 100%;
          max-width: 1170px;
          margin: 0 auto;
          padding: 24px;
          text-align: center;
        }

        .support-section__text {
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
          font-weight: 400;
        }

        @media (max-width: 768px) {
          .support-section__content {
            padding: 20px 16px;
          }
          
          .support-section__text {
            font-size: 14px;
            line-height: 18px;
          }
        }
      `}</style>

      <style jsx global>{`
        .support-section__link {
          color: #156ff7;
          text-decoration: underline;
          text-underline-position: from-font;
          text-decoration-skip-ink: none;
          font-weight: 500;
        }

        .support-section__link:hover {
          text-decoration: none;
        }
      `}</style>
    </>
  );
}
