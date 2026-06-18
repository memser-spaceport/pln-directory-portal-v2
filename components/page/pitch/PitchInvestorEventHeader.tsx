'use client';

import React, { useState } from 'react';
import { Alert } from '@/components/page/demo-day/shared/Alert';
import { EditInvestorProfileDrawer } from '@/components/page/demo-day/AppliedInvestorSteps/EditInvestorProfileDrawer/EditInvestorProfileDrawer';
import { ProfileWhileYouWait } from '@/components/page/pitch/InvestorProfileInlineLink';
import { usePitchInvestorOnboardingState } from '@/components/page/pitch/hooks/usePitchInvestorOnboardingState';
import { useContactSupportStore } from '@/services/contact-support/store';
import { useTeamPitchAnalytics } from '@/analytics/team-pitch.analytics';
import { buildEngagementTrackEvent } from '@/analytics/team-pitch-engagement';
import { useReportAnalyticsEvent } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { useCurrentUserStore } from '@/services/auth/store';
import { getTeamSpotlightPath } from '@/services/team-pitch/constants';
import { TEAM_PITCH_ANALYTICS } from '@/utils/constants';
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
  const teamPitchAnalytics = useTeamPitchAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();
  const { currentUser: userInfo } = useCurrentUserStore();

  const openProfileDrawer = () => {
    teamPitchAnalytics.onInvestorProfileCtaClicked({ pitchSlug, variant: 'open', profileCtaAsLink: true });
    if (userInfo?.email) {
      reportAnalytics.mutate(
        buildEngagementTrackEvent(
          TEAM_PITCH_ANALYTICS.ON_INVESTOR_PROFILE_CTA_CLICKED,
          userInfo.email,
          getTeamSpotlightPath(pitchSlug),
          pitchSlug,
          {
            userId: userInfo.uid,
            userEmail: userInfo.email,
            userName: userInfo.name,
            variant: 'open',
            profileCtaAsLink: true,
          },
        ),
      );
    }
    setDrawerOpen(true);
  };

  const { primaryCtaLabel, primaryCtaType, userUid, isProfileComplete, handleLogin } = usePitchInvestorOnboardingState({
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
                <ProfileWhileYouWait isComplete={isProfileComplete} onClick={openProfileDrawer} />
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
              {primaryCtaType === 'login' && (
                <button type="button" className={s.primaryButton} onClick={handleLogin}>
                  {primaryCtaLabel}
                </button>
              )}
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
