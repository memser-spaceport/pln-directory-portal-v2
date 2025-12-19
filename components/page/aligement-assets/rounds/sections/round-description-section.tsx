'use client';

import Link from 'next/link';
import { RoundDescriptionSectionData } from '../types';

interface RoundDescriptionSectionProps {
  data: RoundDescriptionSectionData;
}

/**
 * Renders paragraph text with embedded links
 * Replaces placeholders like {linkName} with actual Link components
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
      
      return parts.flatMap((p, i) => 
        i < parts.length - 1 
          ? [p, <Link key={`link-${linkIndex}-${i}`} href={link.url} target="_blank" rel="noopener noreferrer" className="round-description__link">{link.text}</Link>]
          : p
      );
    });
  });

  return result;
}

/**
 * RoundDescriptionSection - Displays round title, badge, and description paragraphs
 * @param data - Round description data from master JSON
 */
export default function RoundDescriptionSection({ data }: RoundDescriptionSectionProps) {
  return (
    <>
      <section className="round-description">
        <div className="round-description__container">
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
      </section>

      <style jsx>{`
        .round-description {
          width: 100%;
        }

        .round-description__container {
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

        @media (max-width: 768px) {
          .round-description__header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
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
      `}</style>
    </>
  );
}
