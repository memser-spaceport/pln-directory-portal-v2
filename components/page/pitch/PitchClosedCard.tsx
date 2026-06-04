'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCurrentUserStore } from '@/services/auth/store';
import { checkInvestorProfileComplete } from '@/utils/member.utils';
import { useMember } from '@/services/members/hooks/useMember';
import { EditInvestorProfileDrawer } from '@/components/page/demo-day/AppliedInvestorSteps/EditInvestorProfileDrawer/EditInvestorProfileDrawer';
import s from './PitchComingSoonCard.module.scss';

type Props = {
  teamName: string;
  teamUid: string;
  pitchSlug: string;
  prefillEmail?: string;
};

const ClosedIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      d="M16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4Z"
      stroke="#8897AE"
      strokeWidth="2"
    />
    <path d="M11 11L21 21M21 11L11 21" stroke="#8897AE" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const PitchClosedCard = ({ teamName, teamUid, pitchSlug, prefillEmail }: Props) => {
  const router = useRouter();
  const { currentUser: userInfo } = useCurrentUserStore();
  const isLoggedIn = !!userInfo?.uid;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: memberData } = useMember(isLoggedIn ? userInfo?.uid : undefined);

  const isProfileComplete = useMemo(
    () => checkInvestorProfileComplete(memberData?.memberInfo, userInfo),
    [memberData?.memberInfo, userInfo],
  );

  const profileCtaLabel = isProfileComplete ? 'Update Investor Profile' : 'Set Up Investor Profile';

  const handleLogin = () => {
    const email = prefillEmail || '';
    router.replace(`/pitch/${pitchSlug}?prefillEmail=${encodeURIComponent(email)}#login`);
  };

  return (
    <>
      <div className={s.card}>
        <div className={s.icon} aria-hidden>
          <ClosedIcon />
        </div>
        <h2 className={s.title}>Pitch not available</h2>
        <p className={s.description}>
          {isLoggedIn ? (
            <>
              This pitch is closed and materials are no longer available. Update your investor profile so founders have
              your latest information, or explore <strong>{teamName}</strong> on the Protocol Labs Network.
            </>
          ) : (
            <>
              This pitch is closed and materials are no longer available. You can still learn about{' '}
              <strong>{teamName}</strong> on the Protocol Labs Network.
            </>
          )}
        </p>
        <div className={s.actions}>
          {isLoggedIn ? (
            isProfileComplete ? (
              <button type="button" className={s.primaryButton} onClick={() => setDrawerOpen(true)}>
                {profileCtaLabel}
              </button>
            ) : (
              <Link href={`/members/${userInfo!.uid}`} className={s.primaryButton}>
                {profileCtaLabel}
              </Link>
            )
          ) : (
            <button type="button" className={s.primaryButton} onClick={handleLogin}>
              Log in
            </button>
          )}
          <Link href={`/teams/${teamUid}`} target="_blank" rel="noopener noreferrer" className={s.secondaryButton}>
            View team profile
          </Link>
        </div>
      </div>

      {isLoggedIn && userInfo?.uid && isProfileComplete && (
        <EditInvestorProfileDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          uid={userInfo.uid}
          isLoggedIn
          isInvestor
        />
      )}
    </>
  );
};
