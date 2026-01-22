'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { RoundDescriptionSectionData } from '../types';

interface RoundDescriptionSectionProps {
  data: RoundDescriptionSectionData;
  /** Tokens allocated for this round (shown in mobile collapsed view) */
  tokensAllocated?: string;
}

/**
 * Check if a URL is internal (starts with /)
 */
function isInternalUrl(url: string): boolean {
  return url.startsWith('/');
}

/**
 * Renders paragraph text with embedded links
 * Replaces placeholders like {linkName} with actual Link components
 * If URL is '#', renders as styled text (non-clickable)
 * Internal links open in same tab, external links open in new tab
 */
function renderParagraphWithLinks(paragraph: RoundDescriptionSectionData['paragraphs'][0]) {
  if (!paragraph.links || paragraph.links.length === 0) {
    return paragraph.text;
  }

  let result: (string | JSX.Element)[] = [paragraph.text];
  
  paragraph.links.forEach((link, linkIndex) => {
    result = result.flatMap((part) => {
      if (typeof part !== 'string') return part;
      
      const parts = part.split(link.placeholder);
      if (parts.length === 1) return part;
      
      return parts.flatMap((p, i) => {
        if (i < parts.length - 1) {
          // If URL is '#', render as non-clickable styled text
          if (link.url === '#') {
            return [p, <span key={`link-${linkIndex}-${i}`} className="round-description__link round-description__link--disabled">{link.text}</span>];
          }
          // Internal links open in same tab, external links open in new tab
          const linkProps = isInternalUrl(link.url) 
            ? {} 
            : { target: '_blank' as const, rel: 'noopener noreferrer' };
          return [p, <Link key={`link-${linkIndex}-${i}`} href={link.url} {...linkProps} className="round-description__link">{link.text}</Link>];
        }
        return p;
      });
    });
  });

  return result;
}


/**
 * RoundDescriptionSection - Displays round title, badge, and description paragraphs
 * On mobile devices, renders as a collapsible card
 * @param data - Round description data from master JSON
 * @param tokensAllocated - Optional tokens allocated string for mobile subtitle
 */
export default function RoundDescriptionSection({ data, tokensAllocated }: RoundDescriptionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <section className="round-description">
        {/* Desktop view - original layout */}
        <div className="round-description__container round-description__container--desktop">
          {/* Header with title and badge */}
          <div className="round-description__header">
            <h2 className="round-description__title">Round {data.roundNumber}: {data.monthYear}</h2>
            <span className="round-description__badge">{data.badgeText}</span>
          </div>

          {/* Description paragraphs */}
          <div className="round-description__content">
            {data.paragraphs.map((paragraph, index) => (
              <p key={`paragraph-${index}`} className="round-description__paragraph">
                {renderParagraphWithLinks(paragraph)}
              </p>
            ))}
          </div>
        </div>

        {/* Mobile view - collapsible card */}
        <div className="round-description__card round-description__card--mobile">
          <button 
            className="round-description__card-header"
            onClick={handleToggle}
            aria-expanded={isExpanded}
          >
            <div className="round-description__card-info">
              <span className="round-description__badge round-description__badge--mobile">{data.badgeText}</span>
              <div className="round-description__card-title-row">
                <h2 className="round-description__card-title">
                  Round {data.roundNumber}: {data.monthYear}
                </h2>
                <Image 
                  src="/icons/arrow-down-light.svg" 
                  alt="" 
                  width={16} 
                  height={16}
                  className={`round-description__chevron ${isExpanded ? 'round-description__chevron--expanded' : ''}`}
                />
              </div>
              {tokensAllocated && (
                <p className="round-description__card-subtitle">
                  {tokensAllocated} tokens allocated
                </p>
              )}
            </div>
          </button>

          <div className={`round-description__card-content ${isExpanded ? 'round-description__card-content--expanded' : ''}`}>
            <div className="round-description__card-content-inner">
              <div className="round-description__content">
                {data.paragraphs.map((paragraph, index) => (
                  <p key={`paragraph-mobile-${index}`} className="round-description__paragraph">
                    {renderParagraphWithLinks(paragraph)}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .round-description {
          width: 100%;
        }

        /* Desktop container styles */
        .round-description__container--desktop {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .round-description__header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .round-description__title {
          font-size: 18px;
          font-weight: 600;
          line-height: normal;
          color: #16161f;
          margin: 0;
        }

        .round-description__badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          background-color: #edf5ff;
          border-radius: 24px;
          font-size: 12px;
          font-weight: 500;
          line-height: 14px;
          color: #156ff7;
        }

        .round-description__content {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .round-description__paragraph {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #475569;
          margin: 0 0 20px 0;
        }

        .round-description__paragraph:last-child {
          margin-bottom: 0;
        }

        /* Mobile card styles - hidden by default on desktop */
        .round-description__card--mobile {
          display: none;
        }

        /* Mobile view styles */
        @media (max-width: 768px) {
          .round-description__container--desktop {
            display: none;
          }

          .round-description__card--mobile {
            display: block;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
          }

          .round-description__card-header {
            display: flex;
            align-items: flex-start;
            width: 100%;
            padding: 16px 20px;
            background: transparent;
            border: none;
            cursor: pointer;
            text-align: left;
          }

          .round-description__card-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
            width: 100%;
          }

          .round-description__badge--mobile {
            align-self: flex-start;
            margin-bottom: 8px;
          }

          .round-description__card-title-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
          }

          .round-description__card-title {
            font-size: 16px;
            font-weight: 600;
            line-height: 24px;
            color: #16161f;
            margin: 0;
          }

          .round-description__card-subtitle {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            color: #64748b;
            margin: 0;
          }

          .round-description__card-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
          }

          .round-description__card-content--expanded {
            max-height: 1000px;
            transition: max-height 0.5s ease-in;
          }

          .round-description__card-content-inner {
            padding: 0 20px 20px 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
        }
      `}</style>

      <style jsx global>{`
        .round-description__link {
          color: #156ff7;
          text-decoration: underline;
          text-underline-position: from-font;
        }

        .round-description__link:hover {
          text-decoration: none;
        }

        .round-description__link--disabled {
          cursor: default;
          pointer-events: none;
        }

        .round-description__link--disabled:hover {
          text-decoration: underline;
        }

        .round-description__chevron {
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .round-description__chevron--expanded {
          transform: rotate(180deg);
        }
      `}</style>
    </>
  );
}
