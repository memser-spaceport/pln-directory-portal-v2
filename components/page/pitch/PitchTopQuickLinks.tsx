'use client';

import React from 'react';
import { PitchInvestorQuickLinks } from '@/components/page/pitch/PitchInvestorQuickLinks';
import {
  usePitchInvestorOnboardingState,
  type PitchInvestorVariant,
} from '@/components/page/pitch/hooks/usePitchInvestorOnboardingState';
import type { TeamPitchAccess } from '@/services/team-pitch/hooks/useGetTeamPitchAccess';

type Props = {
  pitchSlug: string;
  variant: PitchInvestorVariant;
  showProfileCta: boolean;
  prefillEmail?: string;
  pitchStatus: TeamPitchAccess['status'];
  investorHasAccess: boolean;
};

export const PitchTopQuickLinks = ({
  pitchSlug,
  variant,
  showProfileCta,
  prefillEmail,
  pitchStatus,
  investorHasAccess,
}: Props) => {
  const { isLoggedIn, userUid, primaryCtaType, primaryCtaLabel, profileCtaAsLink, handleLogin } =
    usePitchInvestorOnboardingState({
      pitchSlug,
      prefillEmail,
      pitchStatus,
      investorHasAccess,
      variant,
    });

  return (
    <PitchInvestorQuickLinks
      pitchSlug={pitchSlug}
      variant={variant}
      primaryCtaType={primaryCtaType}
      primaryCtaLabel={primaryCtaLabel}
      profileCtaAsLink={profileCtaAsLink}
      showProfileCta={showProfileCta}
      isLoggedIn={isLoggedIn}
      userUid={userUid}
      onLogin={handleLogin}
    />
  );
};
