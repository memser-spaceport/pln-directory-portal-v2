'use client';

import React, { useState } from 'react';
import { Alert } from '@/components/page/demo-day/shared/Alert';
import { EditInvestorProfileDrawer } from '@/components/page/demo-day/AppliedInvestorSteps/EditInvestorProfileDrawer/EditInvestorProfileDrawer';
import { usePitchInvestorOnboardingState } from '@/components/page/pitch/hooks/usePitchInvestorOnboardingState';
import { useContactSupportStore } from '@/services/contact-support/store';
import type { TeamPitchAccess } from '@/services/team-pitch/hooks/useGetTeamPitchAccess';
import s from './PitchInvestorEventHeader.module.scss';

type Props = {
  pitchSlug: string;
  prefillEmail?: string;
  pitchStatus: TeamPitchAccess['status'];
  investorHasAccess: boolean;
  teamName: string;
  title: string;
  description: string;
};

export const PitchInvestorEventHeader = ({
  pitchSlug,
  prefillEmail,
  pitchStatus,
  investorHasAccess,
  teamName,
  title,
  description,
}: Props) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { openModal } = useContactSupportStore((state) => state.actions);

  const { primaryCtaLabel, userUid, isProfileComplete } = usePitchInvestorOnboardingState({
    pitchSlug,
    prefillEmail,
    pitchStatus,
    investorHasAccess,
    variant: 'open',
  });

  const isComingSoon = pitchStatus === 'DRAFT' || !investorHasAccess;
  const isInvestorDraft = pitchStatus === 'DRAFT' && investorHasAccess;

  return (
    <div className={s.card}>
      <div className={s.content}>
        <div className={s.headline}>
          <div className={s.headlineText}>
            {isComingSoon && !isInvestorDraft && (
              <div className={s.badgeComingSoon}>
                <span className={s.dotComingSoon} aria-hidden />
                <span className={s.badgeLabel}>Coming Soon</span>
              </div>
            )}

            <h1 className={s.title}>
              {isInvestorDraft || isComingSoon ? `${teamName} Spotlight` : title}
              {isComingSoon && !isInvestorDraft && (
                <>
                  <br />
                  has not yet opened to investors
                </>
              )}
            </h1>

            {isInvestorDraft ? (
              <p className={s.description}>
                {teamName} has not opened this spotlight to investors yet
                <br />
                You are on the invite list for this spotlight. We will email you when materials go live.
                <br />
                {isProfileComplete
                  ? 'Update your investor profile below while you wait.'
                  : 'Set up your investor profile below while you wait.'}
              </p>
            ) : isComingSoon ? (
              <p className={s.description}>
                If you received an invitation, we&apos;ll notify you when materials become available.
              </p>
            ) : (
              description && <p className={s.description} dangerouslySetInnerHTML={{ __html: description }} />
            )}
          </div>

          {isComingSoon && (
            <div className={s.actions}>
              <button type="button" className={s.primaryButton} onClick={() => setDrawerOpen(true)}>
                {primaryCtaLabel}
              </button>
              <p className={s.supportText}>
                <button type="button" className={s.supportLink} onClick={() => openModal({ pitchSlug }, 'askQuestion')}>
                  Questions or feedback?
                </button>
              </p>
            </div>
          )}
        </div>

        <Alert>
          <p>
            Confidentiality notice: Materials presented here are confidential and are provided exclusively for your
            review. DO NOT copy, screenshot, share, or distribute to others. Any unauthorized disclosure will result in
            removal from the network.
          </p>
        </Alert>
      </div>

      {userUid && (
        <EditInvestorProfileDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          uid={userUid}
          isLoggedIn
          isInvestor
        />
      )}
    </div>
  );
};
