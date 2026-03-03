'use client';

import React from 'react';
import clsx from 'clsx';
import s from './DemoDayActionButtons.module.scss';

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.3332 4L5.99984 11.3333L2.6665 8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export interface DemoDayActionButtonsProps {
  // Team data
  teamUid: string;
  teamName: string;

  // Button states (from team profile)
  isReferralExpressed?: boolean;
  isConnected?: boolean;
  isInvested?: boolean;

  // Callbacks
  onMakeIntro: (e: React.MouseEvent) => void;
  onGiveFeedback: (e: React.MouseEvent) => void;
  onConnect: (e: React.MouseEvent) => void;
  onInvest: (e: React.MouseEvent) => void;

  // Loading/disabled states
  isLoading?: boolean;
  disabled?: boolean;

  // Layout variant
  variant?: 'card' | 'drawer';

  // Optional: Custom class names
  className?: string;
}

export const DemoDayActionButtons: React.FC<DemoDayActionButtonsProps> = ({
  teamUid,
  isReferralExpressed = false,
  isConnected = false,
  isInvested = false,
  onMakeIntro,
  onGiveFeedback,
  onConnect,
  onInvest,
  isLoading = false,
  disabled = false,
  variant = 'card',
  className,
}) => {
  const isDisabled = disabled || !teamUid;

  const handleClick = (callback: (e: React.MouseEvent) => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    callback(e);
  };

  return (
    <div className={clsx(s.actions, s[variant], className)}>
      {/* Make an Intro Button */}
      <button
        className={s.secondaryButton}
        onClick={handleClick(onMakeIntro)}
        disabled={isLoading || isDisabled}
        type="button"
      >
        {isReferralExpressed ? (
          <>
            ✉️ Make an Intro
            <CheckIcon />
          </>
        ) : (
          <>✉️ Make an Intro</>
        )}
      </button>

      {/* Give Feedback Button */}
      <button
        className={s.feedbackButton}
        onClick={handleClick(onGiveFeedback)}
        disabled={isDisabled}
        type="button"
      >
        📝 Give Feedback
      </button>

      {/* Connect with Company Button */}
      <button
        className={s.secondaryButton}
        onClick={handleClick(onConnect)}
        disabled={isLoading || isDisabled}
        type="button"
      >
        {isConnected ? (
          <>
            🤝 Connected with Company
            <CheckIcon />
          </>
        ) : (
          <>🤝 Connect with Company</>
        )}
      </button>

      {/* Invest in Company Button */}
      <button
        className={s.primaryButton}
        onClick={handleClick(onInvest)}
        disabled={isLoading || isDisabled}
        type="button"
      >
        {isInvested ? (
          <>
            💰 Invest in Company
            <CheckIcon />
          </>
        ) : (
          <>💰 Invest in Company</>
        )}
      </button>
    </div>
  );
};

