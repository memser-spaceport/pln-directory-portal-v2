'use client';

import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';

/* ==========================================================================
   PlaaRoundSelector Component
   Pixel-perfect implementation based on Figma design
   Figma: https://www.figma.com/design/xrvyUEqgZ0oRNT0spUruMW/Untitled?node-id=1-5250
   ========================================================================== */

interface PlaaRoundSelectorProps {
  currentRound: number;
  totalRounds: number;
  viewingRound?: number; // The round being viewed on the current page (defaults to currentRound)
}

function PlaaRoundSelector({
  currentRound,
  totalRounds,
  viewingRound,
}: PlaaRoundSelectorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  // Use viewingRound if provided, otherwise fall back to currentRound
  const [selectedRound, setSelectedRound] = useState(viewingRound ?? currentRound);
  const [inputValue, setInputValue] = useState(String(viewingRound ?? currentRound));
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { onRoundSelectorOpened, onRoundSelectorPrevClicked, onRoundSelectorNextClicked, onRoundSelectorGoToCurrentClicked } = useAlignmentAssetsAnalytics();

  // Sync selectedRound with viewingRound prop when it changes (e.g., direct URL access)
  useEffect(() => {
    if (viewingRound !== undefined) {
      setSelectedRound(viewingRound);
      setInputValue(String(viewingRound));
    }
  }, [viewingRound]);

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

  const navigateToRound = (round: number) => {
    router.push(`/alignment-asset/rounds/${round}`);
  };

  const handlePrevRound = () => {
    if (selectedRound > 1) {
      const newRound = selectedRound - 1;
      onRoundSelectorPrevClicked(selectedRound, newRound);
      setSelectedRound(newRound);
      setInputValue(String(newRound));
      navigateToRound(newRound);
    }
  };

  const handleNextRound = () => {
    if (selectedRound < totalRounds-1) {
      const newRound = selectedRound + 1;
      onRoundSelectorNextClicked(selectedRound, newRound);
      setSelectedRound(newRound);
      setInputValue(String(newRound));
      navigateToRound(newRound);
    }
    else{
      handleGoToCurrent();
    }
  };

  const handleGoToCurrent = () => {
    onRoundSelectorGoToCurrentClicked(selectedRound, currentRound);
    setSelectedRound(currentRound);
    setInputValue(String(currentRound));
    setIsOpen(false);
    router.push('/alignment-asset/rounds');
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers
    if (value === '' || /^\d+$/.test(value)) {
      setInputValue(value);
    }
  };

  const handleInputBlur = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalRounds) {
      if (parsed !== selectedRound) {
        setSelectedRound(parsed);
        navigateToRound(parsed);
      }
    } else {
      // Reset to current selected round if invalid
      setInputValue(String(selectedRound));
    }
  };

  const handleInputKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleRoundLabelClick = () => {
    // Navigate to the selected round page
    if (isCurrentRound) {
      router.push('/alignment-asset/rounds');
    } else {
      navigateToRound(selectedRound);
    }
  };

  const handleDropdownToggle = () => {
    if (!isOpen) {
      onRoundSelectorOpened(currentRound, selectedRound);
    }
    setIsOpen(!isOpen);
  };

  const isCurrentRound = selectedRound === currentRound;
  const displayText = isCurrentRound ? 'Current Round' : `Round ${selectedRound}`;

  return (
    <div className="round-selector-container">
      <div className="round-selector" ref={dropdownRef}>
        {/* Trigger Button - Split into two sections */}
        <div
          className="round-selector__trigger"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          {/* First Section - Round Label (navigates to round page) */}
          <button
            className="round-selector__trigger-label"
            onClick={handleRoundLabelClick}
            aria-label={`Go to ${displayText}`}
          >
            <span className="round-selector__trigger-text">{displayText}</span>
          </button>

          {/* Separator */}
          <div className="round-selector__trigger-separator" />

          {/* Second Section - Arrow (opens dropdown) */}
          <button
            className="round-selector__trigger-arrow"
            onClick={handleDropdownToggle}
            aria-label="Open round selector dropdown"
          >
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
        </div>

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

                {/* Current Round Number - Editable */}
                <input
                  type="text"
                  className="round-selector__nav-input"
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onKeyDown={handleInputKeyDown}
                  aria-label="Round number"
                />

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

              {/* Total Rounds Display */}
              <span className="round-selector__total">{totalRounds}</span>
            </div>

            {/* Go to Current Round - Only show when not on current round */}
            {!isCurrentRound && (
              <>
                <div className="round-selector__divider" />
                <button
                  className="round-selector__dropdown-go-current"
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
              </>
            )}
          </div>
        )}
      </div>

       {/* Go to Current Round Link */}
      {!isCurrentRound && (
        <button className="round-selector__go-current" onClick={handleGoToCurrent} aria-label="Go to current round">
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
      )}

      <style jsx>
        {`
          /* =================================================================
             Round Selector - Figma Design Tokens
             ================================================================= */

          .round-selector {
            position: relative;
            width: 100%;
          }

          /* ---------------------------------------------------------------
             Trigger Button
             Figma: 150x35px, border 1px #427dff, radius 8px
             --------------------------------------------------------------- */
          .round-selector-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            padding: ${isCurrentRound ? '8px 8px 8px 8px' : '8px 8px 4px 8px'};
          }

          .round-selector__trigger {
            position: relative;
            width: 100%;
            height: 35px;
            display: flex;
            align-items: center;
            background-color: #F1F5F9;
            border-radius: 8px;
            overflow: visible;
          }

          .round-selector__trigger::before {
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

          /* First Section - Round Label */
          .round-selector__trigger-label {
            flex: 1;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 12px;
            background: none;
            border: none;
            cursor: pointer;
            border-radius: 8px 0 0 8px;
            transition: background-color 0.15s ease;
          }

          .round-selector__trigger-label:hover {
            background-color: rgba(66, 125, 255, 0.08);
          }

          /* Separator */
          .round-selector__trigger-separator {
            width: 1px;
            height: 20px;
            background: linear-gradient(180deg, #427DFF 0%, #44D5BB 100%);
            opacity: 0.5;
            flex-shrink: 0;
          }

          /* Second Section - Arrow */
          .round-selector__trigger-arrow {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 10px;
            background: none;
            border: none;
            cursor: pointer;
            border-radius: 0 8px 8px 0;
            transition: background-color 0.15s ease;
          }

          .round-selector__trigger-arrow:hover {
            background-color: rgba(66, 125, 255, 0.08);
          }

          .round-selector__trigger-text {
            font-size: 12px;
            font-weight: 500;
            color: #0F172A;
            line-height: 100%;
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
            right: 0;
            width: 100%;
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

          .round-selector__nav-input {
            width: 30px;
            height: 24px;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            font-size: 12px !important;
            font-weight: 500;
            color: #0f172a;
            line-height: normal;
            text-align: center;
            padding: 0;
            background: #ffffff;
          }

          .round-selector__nav-input:focus {
            outline: none;
            border-color: #156ff7;
          }

          .round-selector__nav-of {
            font-size: 12px;
            font-weight: 500;
            color: #475569;
            line-height: normal;
            margin-left: auto;
          }

          /* ---------------------------------------------------------------
             Total Rounds Display
             Display only, no border
             --------------------------------------------------------------- */
          .round-selector__total {
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
             Go to Current Round Link (outside dropdown)
             Figma: height 36px, padding 8px, flex, gap 4px
             --------------------------------------------------------------- */
          .round-selector__go-current {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            width: 100%;
            height: 36px;
            font-weight: 500;
            font-size: 12px;
            line-height: 100%;
            color: #475569;
          }

          /* ---------------------------------------------------------------
             Go to Current Round Button (inside dropdown)
             --------------------------------------------------------------- */
          .round-selector__dropdown-go-current {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            width: 100%;
            height: 32px;
            padding: 0 8px;
            background: none;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            font-size: 12px;
            line-height: 100%;
            color: #156FF7;
            transition: background-color 0.15s ease;
          }

          .round-selector__dropdown-go-current:hover {
            background-color: rgba(21, 111, 247, 0.08);
          }
        `}
      </style>
    </div>
  );
}

export default PlaaRoundSelector;