'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getRoundDateInfo } from '@/utils/plaa-round.utils';

const DROPDOWN_OPEN_KEY = 'points-round-selector-open';

interface PointsRoundSelectorProps {
  currentRound: number;
  viewingRound: number;
}

export default function PointsRoundSelector({ currentRound, viewingRound }: PointsRoundSelectorProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Restore open state after page navigation
  useEffect(() => {
    if (sessionStorage.getItem(DROPDOWN_OPEN_KEY) === 'true') {
      setIsOpen(true);
      sessionStorage.removeItem(DROPDOWN_OPEN_KEY);
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roundInfo = getRoundDateInfo(viewingRound);
  const isCurrentRound = viewingRound === currentRound;
  const shortMonth = `${roundInfo.monthName.slice(0, 3)} ${roundInfo.year}`;
  const triggerLabel = isCurrentRound
    ? `Current Snapshot: Round ${viewingRound} - ${shortMonth}`
    : `Round ${viewingRound} - ${shortMonth}`;

  function navigateTo(round: number) {
    sessionStorage.setItem(DROPDOWN_OPEN_KEY, 'true');
    router.push(`/alignment-asset/rounds/${round}`);
  }

  return (
    <div className="prs" ref={dropdownRef}>
      {/* Trigger */}
      <button
        className="prs__trigger"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg className="prs__trigger-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="1" y="2.5" width="12" height="10.5" rx="1.5" stroke="#475569" strokeWidth="1.2" />
          <path d="M1 5.5H13" stroke="#475569" strokeWidth="1.2" />
          <rect x="4" y="1" width="1.2" height="3" rx="0.6" fill="#475569" />
          <rect x="8.8" y="1" width="1.2" height="3" rx="0.6" fill="#475569" />
        </svg>
        <span className="prs__trigger-text">{triggerLabel}</span>
        <svg
          className={`prs__trigger-chevron${isOpen ? ' prs__trigger-chevron--open' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M3 5L7 9L11 5" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="prs__dropdown">
          {/* Navigation row */}
          <div className="prs__nav-row">
            <span className="prs__nav-label">Round</span>

            <div className="prs__nav-controls">
              <button
                className="prs__nav-btn"
                onClick={() => navigateTo(viewingRound - 1)}
                disabled={viewingRound <= 1}
                aria-label="Previous round"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 12L6 8L10 4" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <span className="prs__nav-num">{viewingRound}</span>

              <button
                className="prs__nav-btn"
                onClick={() => navigateTo(viewingRound + 1)}
                disabled={viewingRound >= currentRound}
                aria-label="Next round"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 4L10 8L6 12" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <span className="prs__nav-of">of</span>
            <span className="prs__nav-total">{currentRound}</span>
          </div>

          {/* Month label row */}
          <span className="prs__nav-month">{roundInfo.label}</span>

          {/* Go to current round */}
          {!isCurrentRound && (
            <>
              <div className="prs__divider" />
              <button className="prs__go-current" onClick={() => navigateTo(currentRound)}>
                <span>Go to current round</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M2.5 6H9.5M9.5 6L6.5 3M9.5 6L6.5 9" stroke="#156FF7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .prs {
          position: relative;
          display: inline-block;
          width: 100%;
        }

        /* ── Trigger ─────────────────────────────────────────────────── */
        .prs__trigger {
          display: flex;
          align-items: center;
          gap: 6px;
          width: 100%;
          height: 35px;
          padding: 0 10px 0 10px;
          background-color: #F1F5F9;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          position: relative;
        }

        .prs__trigger::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 8px;
          padding: 1px;
          background: linear-gradient(71.47deg, #427DFF 8.43%, #44D5BB 87.45%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        .prs__trigger-text {
          flex: 1;
          font-size: 12px;
          font-weight: 500;
          color: #0F172A;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: left;
        }

        .prs__trigger-icon {
          flex-shrink: 0;
        }

        .prs__trigger-chevron {
          flex-shrink: 0;
          transition: transform 0.15s ease;
        }

        .prs__trigger-chevron--open {
          transform: rotate(180deg);
        }

        /* ── Dropdown ────────────────────────────────────────────────── */
        .prs__dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          min-width: 160px;
          background: #ffffff;
          border-radius: 6px;
          box-shadow: 0px 2px 8px rgba(15, 23, 42, 0.16);
          padding: 8px;
          z-index: 20;
        }

        /* ── Nav row ─────────────────────────────────────────────────── */
        .prs__nav-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          height: 28px;
        }

        .prs__nav-label {
          font-size: 12px;
          font-weight: 500;
          color: #475569;
        }

        .prs__nav-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .prs__nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          padding: 0;
          background: none;
          border: none;
          cursor: pointer;
          border-radius: 2px;
          transition: opacity 0.15s ease;
        }

        .prs__nav-btn:hover:not(:disabled) {
          opacity: 0.7;
        }

        .prs__nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .prs__nav-num {
          min-width: 28px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          color: #0f172a;
          background: #ffffff;
          padding: 0 4px;
        }

        .prs__nav-of {
          font-size: 12px;
          font-weight: 500;
          color: #475569;
        }

        .prs__nav-total {
          font-size: 12px;
          font-weight: 500;
          color: #0f172a;
        }

        /* ── Month row ───────────────────────────────────────────────── */
        .prs__nav-month {
          display: block;
          text-align: center;
          font-size: 10px;
          font-weight: 400;
          color: #94A3B8;
          margin-top: 4px;
          width: 100%;
        }

        /* ── Divider ─────────────────────────────────────────────────── */
        .prs__divider {
          height: 1px;
          background: #e2e8f0;
          margin: 6px 0;
        }

        /* ── Go to current ───────────────────────────────────────────── */
        .prs__go-current {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          width: 100%;
          height: 30px;
          padding: 0 8px;
          background: none;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          color: #156FF7;
          transition: background-color 0.15s ease;
        }

        .prs__go-current:hover {
          background-color: rgba(21, 111, 247, 0.08);
        }
      `}</style>
    </div>
  );
}
