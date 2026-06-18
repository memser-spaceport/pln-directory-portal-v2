'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { EditInvestorProfileDrawer } from '@/components/page/demo-day/AppliedInvestorSteps/EditInvestorProfileDrawer/EditInvestorProfileDrawer';
import { usePitchInvestorOnboardingState } from '@/components/page/pitch/hooks/usePitchInvestorOnboardingState';
import { InvestorProfileInlineLink } from '@/components/page/pitch/InvestorProfileInlineLink';
import s from './PitchComingSoonCard.module.scss';

type Props = {
  teamName: string;
  teamUid: string;
  pitchSlug: string;
  prefillEmail?: string;
};

export const PitchClosedCard = ({ teamName, teamUid, pitchSlug, prefillEmail }: Props) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { isProfileComplete, userUid } = usePitchInvestorOnboardingState({
    pitchSlug,
    prefillEmail,
    pitchStatus: 'CLOSED',
    investorHasAccess: true,
    variant: 'closed',
  });

  const profilePhrase = isProfileComplete ? 'update your investor profile' : 'set up your investor profile';

  return (
    <div className={s.card}>
      <h2 className={s.title}>{teamName} Spotlight Closed</h2>

      <p className={s.description}>
        This spotlight is closed and materials are no longer available.
        <br />
        You can{' '}
        <InvestorProfileInlineLink onClick={() => setDrawerOpen(true)}>
          {profilePhrase}
        </InvestorProfileInlineLink> or{' '}
        <Link href={`/teams/${teamUid}`} target="_blank" rel="noopener noreferrer" className={s.teamLink}>
          explore {teamName}
        </Link>{' '}
        on the Protocol Labs Network.
      </p>

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
