'use client';

import React, { useState } from 'react';
import clsx from 'clsx';
import { IUserInfo } from '@/types/shared.types';
import { useGetMemberPreferences } from '@/services/members/hooks/useGetMemberPreferences';
import { useUpdateMemberPreferences } from '@/services/members/hooks/useUpdateMemberPreferences';
import { ActionConfirmModal } from './ActionConfirmModal';
import s from './DemoDayActionButtons.module.scss';

// No-op fake event for calling parent callbacks from modal confirm.
// Callbacks use e.stopPropagation() to prevent card click — not needed when
// firing from a modal (the modal overlay already isolates the event).
const FAKE_EVENT = {
  stopPropagation: () => {},
  preventDefault: () => {},
} as unknown as React.MouseEvent;

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
  isFeedbackGiven?: boolean;

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

  // User info for server-side preference persistence
  userInfo?: IUserInfo;
}

export const DemoDayActionButtons: React.FC<DemoDayActionButtonsProps> = ({
  teamUid,
  isReferralExpressed = false,
  isConnected = false,
  isInvested = false,
  isFeedbackGiven = false,
  onMakeIntro,
  onGiveFeedback,
  onConnect,
  onInvest,
  isLoading = false,
  disabled = false,
  variant = 'card',
  className,
  userInfo,
}) => {
  const isDisabled = disabled || !teamUid;
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [investModalOpen, setInvestModalOpen] = useState(false);

  const { data: memberPrefs } = useGetMemberPreferences(userInfo?.uid);
  const { mutateAsync: updatePreferences } = useUpdateMemberPreferences();

  const handleClick = (callback: (e: React.MouseEvent) => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    callback(e);
  };

  const handleConnectClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (memberPrefs?.memberPreferences?.showDemoDayConnectDialog === false) {
      onConnect(e);
    } else {
      setConnectModalOpen(true);
    }
  };

  const handleInvestClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (memberPrefs?.memberPreferences?.showDemoDayInvestDialog === false) {
      onInvest(e);
    } else {
      setInvestModalOpen(true);
    }
  };

  return (
    <>
      <div className={clsx(s.actions, s[variant], className)}>
        {/* Give Feedback Button */}
        <button className={s.feedbackButton} onClick={handleClick(onGiveFeedback)} disabled={isDisabled} type="button">
          {isFeedbackGiven ? (
            <>
              📝 Feedback Given
              <CheckIcon />
            </>
          ) : (
            <>📝 Give Feedback</>
          )}
        </button>

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

        {/* Connect with Company Button */}
        <button
          className={s.secondaryButton}
          onClick={handleConnectClick}
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
          onClick={handleInvestClick}
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

      <ActionConfirmModal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        onConfirm={() => {
          onConnect(FAKE_EVENT);
          setConnectModalOpen(false);
        }}
        onDismiss={async () => {
          if (userInfo?.uid) {
            await updatePreferences({ uid: userInfo.uid, payload: { showDemoDayConnectDialog: false } });
          }
        }}
        title="Connect with Company"
        description="Sends an email to the company founder(s) and you, expressing your intent to connect."
      />

      <ActionConfirmModal
        isOpen={investModalOpen}
        onClose={() => setInvestModalOpen(false)}
        onConfirm={() => {
          onInvest(FAKE_EVENT);
          setInvestModalOpen(false);
        }}
        onDismiss={async () => {
          if (userInfo?.uid) {
            await updatePreferences({ uid: userInfo.uid, payload: { showDemoDayInvestDialog: false } });
          }
        }}
        title="Invest in Company"
        description="Sends an introduction email to the company founder(s) and you, expressing your intent to invest."
      />
    </>
  );
};
