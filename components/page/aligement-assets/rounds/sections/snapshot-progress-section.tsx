'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TipContent } from '../types';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';
import { getSnapshotProgress } from '@/utils/plaa-round.utils';

interface SnapshotProgressSectionProps {
  startDate: Date;
  endDate: Date;
  tipContent: TipContent;
}

function isInternalUrl(url: string): boolean {
  return url.startsWith('/');
}

export default function SnapshotProgressSection({ startDate, endDate, tipContent }: SnapshotProgressSectionProps) {
  const { onSnapshotTipLinkClicked } = useAlignmentAssetsAnalytics();

  const handleTipLinkClick = (linkText: string, url: string) => {
    onSnapshotTipLinkClicked(linkText, url);
  };
  const { progressPercentage, timeRemaining, dateRangeLabel } = useMemo(() => {
    const { progressPercentage, timeRemainingLabel, dateRangeLabel } = getSnapshotProgress(
      new Date(startDate),
      new Date(endDate),
    );
    return { progressPercentage, timeRemaining: timeRemainingLabel, dateRangeLabel };
  }, [startDate, endDate]);

  return (
    <>
      <section className="snapshot-section">
        <div className="snapshot-section__container">
          <div className="snapshot-section__header">
            <h2 className="snapshot-section__title">Total Alignment Asset Points &amp; Tokens Collected by Category</h2>
            <p className="snapshot-section__subtitle">Current Snapshot Period - {dateRangeLabel}</p>
          </div>

          <div className="snapshot-section__progress-container">
            <h3 className="snapshot-section__progress-title">Current Snapshot Period - {dateRangeLabel}</h3>
            
            <div className="snapshot-section__progress-bar">
              <div 
                className="snapshot-section__progress-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            <p className="snapshot-section__progress-text">{timeRemaining}</p>
          </div>

          <div className="snapshot-section__tip">
            <div className="snapshot-section__tip-icon">
              <Image src="/icons/rounds/idea.svg" alt="" width={18} height={18} />
            </div>
            <div className="snapshot-section__tip-content">
              <p className="snapshot-section__tip-text">
                <strong>Tip:</strong> {tipContent.tipText}
              </p>
              
              <p className="snapshot-section__tip-explore">{tipContent.exploreTitle}</p>
              
              <div className="snapshot-section__tip-links">
                {tipContent.links.map((link, index) => (
                  <p key={`${link.linkText}-${index}`} className="snapshot-section__tip-link-item">
                    <span className="snapshot-section__tip-arrow">→</span>
                    {' '}{link.prefix}{' '}
                    {link.url === '#' ? (
                      <span className="snapshot-section__tip-link snapshot-section__tip-link--disabled">{link.linkText}</span>
                    ) : isInternalUrl(link.url) ? (
                      <Link href={link.url} className="snapshot-section__tip-link" onClick={() => handleTipLinkClick(link.linkText, link.url)}>{link.linkText}</Link>
                    ) : (
                      <Link href={link.url} target="_blank" rel="noopener noreferrer" className="snapshot-section__tip-link" onClick={() => handleTipLinkClick(link.linkText, link.url)}>{link.linkText}</Link>
                    )}
                    {link.suffix && <>{' '}{link.suffix}</>}
                  </p>
                ))}
              </div>
              
              <p className="snapshot-section__tip-bottom">
                {tipContent.bottomLink.url === '#' ? (
                  <span className="snapshot-section__tip-link snapshot-section__tip-link--disabled">{tipContent.bottomLink.text}</span>
                ) : isInternalUrl(tipContent.bottomLink.url) ? (
                  <Link href={tipContent.bottomLink.url} className="snapshot-section__tip-link" onClick={() => handleTipLinkClick(tipContent.bottomLink.text, tipContent.bottomLink.url)}>{tipContent.bottomLink.text}</Link>
                ) : (
                  <Link href={tipContent.bottomLink.url} target="_blank" rel="noopener noreferrer" className="snapshot-section__tip-link" onClick={() => handleTipLinkClick(tipContent.bottomLink.text, tipContent.bottomLink.url)}>{tipContent.bottomLink.text}</Link>
                )}.
              </p>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .snapshot-section {
          width: 100%;
        }

        .snapshot-section__container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .snapshot-section__header {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .snapshot-section__title {
          font-size: 18px;
          font-weight: 600;
          line-height: normal;
          color: #16161f;
          margin: 0;
        }

        .snapshot-section__subtitle {
          font-size: 14px;
          font-weight: 500;
          line-height: 22px;
          color: #64748b;
          margin: 0;
        }

        .snapshot-section__progress-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px 24px;
          background-color: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
        }

        .snapshot-section__progress-title {
          font-size: 16px;
          font-weight: 500;
          line-height: 24px;
          color: #0f172a;
          margin: 0;
        }

        .snapshot-section__progress-bar {
          width: 100%;
          height: 8px;
          background-color: #dbeafe;
          border-radius: 8px;
          overflow: hidden;
        }

        .snapshot-section__progress-fill {
          height: 100%;
          border-radius: 8px;
          background: linear-gradient(33.4deg, #427dff 8.43%, #44d5bb 87.45%);
          transition: width 0.3s ease;
        }

        .snapshot-section__progress-text {
          font-size: 14px;
          font-weight: 400;
          line-height: 21px;
          color: #475569;
          margin: 0;
        }

        .snapshot-section__tip {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          padding: 24px;
          background-color: #f8fafc;
          border-radius: 16px;
        }

        .snapshot-section__tip-icon {
          width: 32px;
          height: 32px;
          min-width: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #dbeafe;
          border-radius: 4px;
          padding: 8px;
        }

        .snapshot-section__tip-content {
          display: flex;
          flex-direction: column;
          gap: 0;
          flex: 1;
        }

        .snapshot-section__tip-text {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #475569;
          margin: 0 0 20px 0;
        }

        .snapshot-section__tip-text strong {
          font-weight: 600;
          color: #0f172a;
        }

        .snapshot-section__tip-explore {
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          color: #475569;
          margin: 0 0 20px 0;
        }

        .snapshot-section__tip-links {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-bottom: 20px;
        }

        .snapshot-section__tip-link-item {
          font-size: 14px;
          font-weight: 400;
          line-height: 24px;
          color: #475569;
          margin: 0;
        }

        .snapshot-section__tip-arrow {
          color: #156ff7;
        }

        .snapshot-section__tip-bottom {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #475569;
          margin: 0;
        }

        @media (max-width: 768px) {
          .snapshot-section__tip {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>

      <style jsx global>{`
        .snapshot-section__tip-link {
          color: #156ff7;
          text-decoration: underline;
          text-underline-position: from-font;
        }

        .snapshot-section__tip-link:hover {
          text-decoration: none;
        }

        .snapshot-section__tip-link--disabled {
          cursor: default;
          pointer-events: none;
        }

        .snapshot-section__tip-link--disabled:hover {
          text-decoration: underline;
        }
      `}</style>
    </>
  );
}
