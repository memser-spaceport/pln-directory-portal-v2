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

  const { primaryCtaLabel, userUid } = usePitchInvestorOnboardingState({
    pitchSlug,
    prefillEmail,
    pitchStatus,
    investorHasAccess,
    variant: 'open',
  });

  const isComingSoon = pitchStatus === 'DRAFT' || !investorHasAccess;

  return (
    <div className={s.card}>
      <div className={s.content}>
        <div className={s.headline}>
          <div className={s.headlineText}>
            <div className={isComingSoon ? s.badgeComingSoon : s.badgeActive}>
              <span className={isComingSoon ? s.dotComingSoon : s.dotActive} aria-hidden />
              <span className={s.badgeLabel}>{isComingSoon ? 'Coming Soon' : 'Pitch Active'}</span>
            </div>

            {isComingSoon ? (
              <h1 className={s.title}>
                {teamName} Pitch
                <br />
                has not yet opened to investors
              </h1>
            ) : (
              <h1 className={s.title}>{title}</h1>
            )}

            {isComingSoon ? (
              <p className={s.description}>
                If you received an invitation, we&apos;ll notify you when materials become available.
              </p>
            ) : (
              description && (
                <p className={s.description} dangerouslySetInnerHTML={{ __html: description }} />
              )
            )}
          </div>

          {isComingSoon && (
            <div className={s.actions}>
              <button type="button" className={s.primaryButton} onClick={() => setDrawerOpen(true)}>
                {primaryCtaLabel}
              </button>
              <p className={s.supportText}>
                Questions or feedback?{' '}
                <button type="button" className={s.supportLink} onClick={() => openModal({ pitchSlug }, 'askQuestion')}>
                  Contact support
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
