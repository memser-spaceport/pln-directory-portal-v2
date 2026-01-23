'use client';

import Link from 'next/link';
import { ACTIVITY_FORM_URL } from '@/constants/plaa';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';

interface HeroSectionProps {
  data: {
    title: string;
    description: string;
    note: string;
    submitButtonLabel: string;
    suggestLinkText: string;
    suggestLinkHighlight: string;
  };
}

/**
 * HeroSection - Displays the main title, description, and action buttons for activities page
 */
export default function HeroSection({ data }: HeroSectionProps) {
  const { onActivitiesSubmitBtnClicked, onActivitiesSuggestLinkClicked } = useAlignmentAssetsAnalytics();

  const handleSubmitClick = () => {
    onActivitiesSubmitBtnClicked(ACTIVITY_FORM_URL);
  };

  const handleSuggestClick = () => {
    onActivitiesSuggestLinkClicked(ACTIVITY_FORM_URL);
  };

  return (
    <>
      <section className="activities-hero">
        <div className="activities-hero__content">
          <h1 className="activities-hero__title">{data.title}</h1>
          <p className="activities-hero__description">{data.description}</p>
          <p className="activities-hero__note">{data.note}</p>
          
          <div className="activities-hero__actions">
            <Link 
              href={ACTIVITY_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="activities-hero__submit-btn"
              onClick={handleSubmitClick}
            >
              {data.submitButtonLabel}
            </Link>
          </div>

          <p className="activities-hero__suggest">
            {data.suggestLinkText}{' '}
            <Link 
              href={ACTIVITY_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="activities-hero__suggest-link"
              onClick={handleSuggestClick}
            >
              {data.suggestLinkHighlight}
            </Link>
          </p>
        </div>
      </section>

      <style jsx>{`
        .activities-hero {
          width: 100%;
          text-align: center;
        }

        .activities-hero__content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 26px;
          max-width: 1124px;
          margin: 0 auto;
        }

        .activities-hero__title {
          font-size: 20px;
          font-weight: 600;
          line-height: 28px;
          color: #16161F;
          margin: 0;
        }

        .activities-hero__description {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #475569;
          margin: 0;
        }

        .activities-hero__note {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #475569;
          margin: 0;
          font-style: italic;
        }

        .activities-hero__actions {
          margin-top: 8px;
        }

        .activities-hero__suggest {
          font-size: 16px;
          font-weight: 500;
          line-height: 20px;
          color: #0F172A;
          margin: 0;
        }

        @media (max-width: 768px) {
          .activities-hero {
            text-align: left;
          }

          .activities-hero__content {
            padding: 0 16px;
            align-items: flex-start;
          }

          .activities-hero__title {
            font-size: 20px;
            line-height: 24px;
          }
        }
      `}</style>

      <style jsx global>{`
        .activities-hero__submit-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 40px;
          padding: 10px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          color: white;
          background-color: #156ff7;
          text-decoration: none;
          cursor: pointer;
          transition: background-color 0.15s ease;
          box-shadow: 0px 1px 1px 0px rgba(15, 23, 42, 0.08);
        }

        .activities-hero__submit-btn:hover {
          background-color: #1d4ed8;
        }

        .activities-hero__suggest-link {
          color: #156ff7;
          font-weight: 500;
          font-size: 14px;
          line-height: 20px;
          padding-left: 5px;
          text-decoration: underline;
          text-underline-position: from-font;
          text-decoration-skip-ink: none;
        }

        .activities-hero__suggest-link:hover {
          text-decoration: none;
        }

        @media (max-width: 768px) {
          .activities-hero__submit-btn {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}


