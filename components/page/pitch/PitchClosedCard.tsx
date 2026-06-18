'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { EditInvestorProfileDrawer } from '@/components/page/demo-day/AppliedInvestorSteps/EditInvestorProfileDrawer/EditInvestorProfileDrawer';
import { usePitchInvestorOnboardingState } from '@/components/page/pitch/hooks/usePitchInvestorOnboardingState';
import s from './PitchComingSoonCard.module.scss';

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      d="M11.375 1.53125H10.2812V1.3125C10.2812 1.13845 10.2121 0.971532 10.089 0.848461C9.96597 0.72539 9.79905 0.65625 9.625 0.65625C9.45095 0.65625 9.28403 0.72539 9.16096 0.848461C9.03789 0.971532 8.96875 1.13845 8.96875 1.3125V1.53125H5.03125V1.3125C5.03125 1.13845 4.96211 0.971532 4.83904 0.848461C4.71597 0.72539 4.54905 0.65625 4.375 0.65625C4.20095 0.65625 4.03403 0.72539 3.91096 0.848461C3.78789 0.971532 3.71875 1.13845 3.71875 1.3125V1.53125H2.625C2.33492 1.53125 2.05672 1.64648 1.8516 1.8516C1.64648 2.05672 1.53125 2.33492 1.53125 2.625V11.375C1.53125 11.6651 1.64648 11.9433 1.8516 12.1484C2.05672 12.3535 2.33492 12.4688 2.625 12.4688H11.375C11.6651 12.4688 11.9433 12.3535 12.1484 12.1484C12.3535 11.9433 12.4688 11.6651 12.4688 11.375V2.625C12.4688 2.33492 12.3535 2.05672 12.1484 1.8516C11.9433 1.64648 11.6651 1.53125 11.375 1.53125ZM3.71875 2.84375C3.71875 3.0178 3.78789 3.18472 3.91096 3.30779C4.03403 3.43086 4.20095 3.5 4.375 3.5C4.54905 3.5 4.71597 3.43086 4.83904 3.30779C4.96211 3.18472 5.03125 3.0178 5.03125 2.84375H8.96875C8.96875 3.0178 9.03789 3.18472 9.16096 3.30779C9.28403 3.43086 9.45095 3.5 9.625 3.5C9.79905 3.5 9.96597 3.43086 10.089 3.30779C10.2121 3.18472 10.2812 3.0178 10.2812 2.84375H11.1562V4.15625H2.84375V2.84375H3.71875ZM2.84375 11.1562V5.46875H11.1562V11.1562H2.84375Z"
      fill="#455468"
    />
  </svg>
);

type Props = {
  teamName: string;
  teamUid: string;
  pitchSlug: string;
  prefillEmail?: string;
  closedAt?: string | null;
};

export const PitchClosedCard = ({ teamName, teamUid, pitchSlug, prefillEmail, closedAt }: Props) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { isProfileComplete, userUid } = usePitchInvestorOnboardingState({
    pitchSlug,
    prefillEmail,
    pitchStatus: 'CLOSED',
    investorHasAccess: true,
    variant: 'closed',
  });

  const primaryCtaLabel = isProfileComplete ? 'Update Investor Profile' : 'Set Up Investor Profile';

  return (
    <div className={s.card}>
      <div className={s.badgeRow}>
        <div className={s.badgeCompleted}>
          <span className={s.dotCompleted} aria-hidden />
          <span className={s.badgeLabel}>Completed</span>
        </div>
        {closedAt && (
          <span className={s.badgeDate}>
            <CalendarIcon />
            {format(new Date(closedAt), 'MMM dd, yyyy')}
          </span>
        )}
      </div>

      <h2 className={s.title}>{teamName} Spotlight Closed</h2>

      <p className={s.description}>
        This spotlight is closed and materials are no longer available.
        <br />
        Use the links below to set up your investor profile
        <br />
        or explore the team on the Protocol Labs Network.
      </p>

      <div className={s.actions}>
        <button type="button" className={s.primaryButton} onClick={() => setDrawerOpen(true)}>
          {primaryCtaLabel}
        </button>
        <Link href={`/teams/${teamUid}`} target="_blank" rel="noopener noreferrer" className={s.secondaryButton}>
          View team profile
        </Link>
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
