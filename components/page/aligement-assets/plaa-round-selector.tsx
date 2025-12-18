'use client';

import { useState, useRef, useEffect } from 'react';

/* ==========================================================================
   PlaaRoundSelector Component
   Pixel-perfect implementation based on Figma design
   Figma: https://www.figma.com/design/xrvyUEqgZ0oRNT0spUruMW/Untitled?node-id=1-5250
   ========================================================================== */

interface PlaaRoundSelectorProps {
  currentRound: number;
  totalRounds: number;
  onRoundChange?: (round: number) => void;
}

function PlaaRoundSelector({
  currentRound,
  totalRounds,
  onRoundChange,
}: PlaaRoundSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState(currentRound);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handlePrevRound = () => {
    if (selectedRound > 1) {
      const newRound = selectedRound - 1;
      setSelectedRound(newRound);
      onRoundChange?.(newRound);
    }
  };

  const handleNextRound = () => {
    if (selectedRound < totalRounds) {
      const newRound = selectedRound + 1;
      setSelectedRound(newRound);
      onRoundChange?.(newRound);
    }
  };

  const handleGoToCurrent = () => {
    setSelectedRound(currentRound);
    onRoundChange?.(currentRound);
    setIsOpen(false);
  };

  const isCurrentRound = selectedRound === currentRound;
  const displayText = isCurrentRound ? 'Current Round' : `Round ${selectedRound}`;

  return (
    <>
      <div className="round-selector" ref={dropdownRef}>
        {/* Trigger Button */}
        <button
          className="round-selector__trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={`Select round. Currently ${displayText}`}
        >
          <span className="round-selector__trigger-text">{displayText}</span>
          <svg
            className={`round-selector__trigger-icon ${isOpen ? 'round-selector__trigger-icon--open' : ''}`}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="#64748B"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div
            className="round-selector__dropdown"
            role="listbox"
            aria-label="Round selection"
          >
            {/* Navigation Row */}
            <div className="round-selector__nav">
              <span className="round-selector__nav-label">Round</span>

              <div className="round-selector__nav-controls">
                {/* Previous Button */}
                <button
                  className="round-selector__nav-btn"
                  onClick={handlePrevRound}
                  disabled={selectedRound <= 1}
                  aria-label="Previous round"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 12L6 8L10 4"
                      stroke="#94A3B8"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* Current Round Number */}
                <span className="round-selector__nav-number">{selectedRound}</span>

                {/* Next Button */}
                <button
                  className="round-selector__nav-btn"
                  onClick={handleNextRound}
                  disabled={selectedRound >= totalRounds}
                  aria-label="Next round"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 4L10 8L6 12"
                      stroke="#94A3B8"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              <span className="round-selector__nav-of">of</span>

              {/* Total Rounds Box */}
              <div className="round-selector__total-box">
                <span>{totalRounds}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="round-selector__divider" />

            {/* Go to Current Round Link */}
            <button
              className="round-selector__go-current"
              onClick={handleGoToCurrent}
              aria-label="Go to current round"
            >
              <span>Go to current round</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M2.5 6H9.5M9.5 6L6.5 3M9.5 6L6.5 9"
                  stroke="#156FF7"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      <style jsx>
        {`
          /* =================================================================
             Round Selector - Figma Design Tokens
             ================================================================= */

          .round-selector {
            position: relative;
            width: 150px;
          }

          /* ---------------------------------------------------------------
             Trigger Button
             Figma: 150x35px, border 1px #427dff, radius 8px
             --------------------------------------------------------------- */
          .round-selector__trigger {
            width: 150px;
            height: 35px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 0 24px;
            background-color: #ffffff;
            border: 1px solid #427dff;
            border-radius: 8px;
            cursor: pointer;
            transition: border-width 0.1s ease;
            overflow: hidden;
          }

          .round-selector__trigger:hover {
            background-color: #fafbfc;
          }

          .round-selector__trigger:focus {
            outline: none;
            border-width: 2px;
          }

          .round-selector__trigger-text {
            font-family: 'Inter', sans-serif;
            font-size: 12px;
            font-weight: 500;
            color: #0f172a;
            line-height: normal;
            white-space: nowrap;
          }

          .round-selector__trigger-icon {
            flex-shrink: 0;
            transition: transform 0.15s ease;
          }

          .round-selector__trigger-icon--open {
            transform: rotate(180deg);
          }

          /* ---------------------------------------------------------------
             Dropdown Panel
             Figma: white bg, radius 4px, shadow 0px 2px 6px rgba(15,23,42,0.16)
             --------------------------------------------------------------- */
          .round-selector__dropdown {
            position: absolute;
            top: calc(100% + 8px);
            left: 0;
            width: 167px;
            background-color: #ffffff;
            border-radius: 4px;
            box-shadow: 0px 2px 6px rgba(15, 23, 42, 0.16);
            padding: 8px;
            z-index: 10;
          }

          /* ---------------------------------------------------------------
             Navigation Row
             Figma: height 36px, flex, space-between
             --------------------------------------------------------------- */
          .round-selector__nav {
            display: flex;
            align-items: center;
            height: 36px;
            gap: 4px;
          }

          .round-selector__nav-label {
            font-family: 'Inter', sans-serif;
            font-size: 12px;
            font-weight: 500;
            color: #475569;
            line-height: normal;
          }

          .round-selector__nav-controls {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .round-selector__nav-btn {
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

          .round-selector__nav-btn:hover:not(:disabled) {
            opacity: 0.7;
          }

          .round-selector__nav-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
          }

          .round-selector__nav-btn:focus {
            outline: none;
            box-shadow: 0 0 0 2px rgba(21, 111, 247, 0.3);
          }

          .round-selector__nav-number {
            font-family: 'Inter', sans-serif;
            font-size: 12px;
            font-weight: 500;
            color: #0f172a;
            line-height: normal;
            min-width: 8px;
            text-align: center;
          }

          .round-selector__nav-of {
            font-family: 'Inter', sans-serif;
            font-size: 12px;
            font-weight: 500;
            color: #475569;
            line-height: normal;
            margin-left: auto;
          }

          /* ---------------------------------------------------------------
             Total Rounds Box
             Figma: 30x24px, border 1px #e2e8f0, radius 4px
             --------------------------------------------------------------- */
          .round-selector__total-box {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 24px;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            font-family: 'Inter', sans-serif;
            font-size: 12px;
            font-weight: 500;
            color: #0f172a;
            line-height: normal;
          }

          /* ---------------------------------------------------------------
             Divider
             Figma: 1px height, #e2e8f0
             --------------------------------------------------------------- */
          .round-selector__divider {
            height: 1px;
            background-color: #e2e8f0;
            margin: 6px 0;
          }

          /* ---------------------------------------------------------------
             Go to Current Round Link
             Figma: height 36px, padding 8px, flex, gap 4px
             --------------------------------------------------------------- */
          .round-selector__go-current {
            display: flex;
            align-items: center;
            gap: 4px;
            width: 100%;
            height: 36px;
            padding: 8px;
            background: none;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-family: 'Inter', sans-serif;
            font-size: 12px;
            font-weight: 500;
            color: #475569;
            line-height: normal;
            transition: background-color 0.15s ease, color 0.15s ease;
          }

          .round-selector__go-current:hover {
            background-color: #f8fafc;
          }

          .round-selector__go-current:focus {
            outline: none;
            box-shadow: 0 0 0 2px rgba(21, 111, 247, 0.3);
          }
        `}
      </style>
    </>
  );
}

export default PlaaRoundSelector;
