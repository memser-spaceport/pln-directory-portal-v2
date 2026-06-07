'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUserStore } from '@/services/auth/store';
import { checkInvestorProfileComplete } from '@/utils/member.utils';
import { useMember } from '@/services/members/hooks/useMember';
import type { TeamPitchAccess } from '@/services/team-pitch/hooks/useGetTeamPitchAccess';

export type PitchInvestorVariant = 'open' | 'draft' | 'closed' | 'restricted';

export type PrimaryCtaType = 'login' | 'profile';

type UsePitchInvestorOnboardingStateParams = {
  pitchSlug: string;
  prefillEmail?: string;
  pitchStatus?: TeamPitchAccess['status'];
  investorHasAccess?: boolean;
  variant: PitchInvestorVariant;
};

export function usePitchInvestorOnboardingState({
  pitchSlug,
  prefillEmail,
  pitchStatus,
  investorHasAccess = false,
  variant,
}: UsePitchInvestorOnboardingStateParams) {
  const router = useRouter();
  const { currentUser: userInfo } = useCurrentUserStore();
  const isLoggedIn = !!userInfo?.uid;
  const { data: memberData } = useMember(isLoggedIn ? userInfo?.uid : undefined);

  const isProfileComplete = useMemo(
    () => checkInvestorProfileComplete(memberData?.memberInfo, userInfo),
    [memberData?.memberInfo, userInfo],
  );

  const pitchPath = `/pitch/${pitchSlug}`;

  const handleLogin = () => {
    const email = prefillEmail || '';
    router.replace(`${pitchPath}?prefillEmail=${encodeURIComponent(email)}#login`);
  };

  const canAccessPitch = isLoggedIn && investorHasAccess && pitchStatus === 'OPEN' && variant === 'open';

  const statusLine = useMemo((): React.ReactNode => {
    if (!isLoggedIn) {
      switch (variant) {
        case 'draft':
          return (
            <>
              This is a private team pitch page for invited investors.
              <br />
              Log in with the email that received your invite to confirm access.
              <br />
              We will notify you when pitch materials are available.
            </>
          );
        case 'closed':
          return (
            <>
              This is a private team pitch page for invited investors.
              <br />
              Log in with your invite email to update your investor profile.
            </>
          );
        default:
          return (
            <>
              This is a private team pitch page for invited investors.
              <br />
              Log in with the email that received your invite to view the pitch.
            </>
          );
      }
    }

    switch (variant) {
      case 'restricted':
        return (
          <>
            Your account is not on the invite list for this pitch page.
            <br />
            Contact support if you believe this is a mistake.
          </>
        );
      case 'draft':
        return (
          <>
            You are on the invite list for this pitch. We will email you when materials go live.
            <br />
            {isProfileComplete
              ? 'Update your investor profile below while you wait.'
              : 'Set up your investor profile below while you wait.'}
          </>
        );
      case 'closed':
        return isProfileComplete ? (
          <>
            Use the links below to update your investor profile
            <br />
            or explore the team on the Protocol Labs Network.
          </>
        ) : (
          <>
            Use the links below to set up your investor profile
            <br />
            or explore the team on the Protocol Labs Network.
          </>
        );
      default:
        if (canAccessPitch) {
          return null;
        }
        if (!isProfileComplete) {
          return (
            <>
              Complete your investor profile before reviewing materials.
              <br />
              Founders see this when you are introduced.
            </>
          );
        }
        return null;
    }
  }, [variant, isLoggedIn, canAccessPitch, isProfileComplete]);

  const primaryCtaType: PrimaryCtaType = !isLoggedIn ? 'login' : 'profile';
  const primaryCtaLabel = !isLoggedIn
    ? 'Log in'
    : isProfileComplete
      ? 'Update Investor Profile'
      : 'Set Up Investor Profile';

  return {
    isLoggedIn,
    isProfileComplete,
    userUid: userInfo?.uid,
    statusLine,
    primaryCtaType,
    primaryCtaLabel,
    handleLogin,
  };
}
