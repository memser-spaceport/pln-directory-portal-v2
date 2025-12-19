'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TipContent } from '../types';

interface SnapshotProgressSectionProps {
  startDate: Date;
  endDate: Date;
  tipContent: TipContent;
}

/**
 * SnapshotProgressSection - Displays snapshot period progress and tip content
 * @param startDate - Snapshot period start date
 * @param endDate - Snapshot period end date
 * @param tipContent - Tip section content from master JSON
 */
export default function SnapshotProgressSection({ startDate, endDate, tipContent }: SnapshotProgressSectionProps) {
  const { progressPercentage, timeRemaining, dateRangeLabel } = useMemo(() => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calculate total duration and elapsed time
    const totalDuration = end.getTime() - start.getTime();
    const elapsedTime = now.getTime() - start.getTime();
    
    // Calculate percentage (clamped between 0 and 100)
    let percentage = 0;
    if (now < start) {
      percentage = 0;
    } else if (now > end) {
      percentage = 100;
    } else {
      percentage = Math.min(100, Math.max(0, (elapsedTime / totalDuration) * 100));
    }
    
    // Calculate remaining time
    const remainingMs = Math.max(0, end.getTime() - now.getTime());
    const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
    
    let remaining = '';
    if (now > end) {
      remaining = 'Snapshot period has ended';
    } else if (now < start) {
      remaining = 'Snapshot period has not started yet';
    } else if (remainingDays === 1) {
      remaining = '1 day remaining in current snapshot period';
    } else {
      remaining = `${remainingDays} days remaining in current snapshot period`;
    }
    
    // Format date range label
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };
    const startMonth = start.toLocaleDateString('en-US', { month: 'long' });
    const startDay = start.getDate();
    const endDay = end.getDate();
    const year = end.getFullYear();
    
    // Check if same month
    const isSameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    const label = isSameMonth 
      ? `${startMonth} ${startDay}-${endDay}, ${year}`
      : `${formatDate(start)} - ${formatDate(end)}`;
    
    return {
      progressPercentage: Math.round(percentage * 100) / 100,
      timeRemaining: remaining,
      dateRangeLabel: label
    };
  }, [startDate, endDate]);

  return (
    <>
      <section className="snapshot-section">
        <div className="snapshot-section__container">
          {/* Header */}
          <div className="snapshot-section__header">
            <h2 className="snapshot-section__title">Total Alignment Asset Points &amp; Tokens Collected by Category</h2>
            <p className="snapshot-section__subtitle">Current Snapshot Period - {dateRangeLabel}</p>
          </div>

          {/* Progress Bar Container */}
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

          {/* Tip Info Section */}
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
                    <Link href={link.url} target="_blank" rel="noopener noreferrer" className="snapshot-section__tip-link">{link.linkText}</Link>
                    {link.suffix && <>{' '}{link.suffix}</>}
                  </p>
                ))}
              </div>
              
              <p className="snapshot-section__tip-bottom">
                <Link href={tipContent.bottomLink.url} target="_blank" rel="noopener noreferrer" className="snapshot-section__tip-link">{tipContent.bottomLink.text}</Link>.
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
      `}</style>
    </>
  );
}
