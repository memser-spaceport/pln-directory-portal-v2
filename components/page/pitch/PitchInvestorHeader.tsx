'use client';

import React, { useState } from 'react';
import { PageTitle } from '@/components/page/demo-day/PageTitle';
import { PitchTeamTitle } from '@/components/page/pitch/PitchTeamTitle';
import { PitchInvestorQuickLinks } from '@/components/page/pitch/PitchInvestorQuickLinks';
import { EditInvestorProfileDrawer } from '@/components/page/demo-day/AppliedInvestorSteps/EditInvestorProfileDrawer/EditInvestorProfileDrawer';
import {
  usePitchInvestorOnboardingState,
  type PitchInvestorVariant,
} from '@/components/page/pitch/hooks/usePitchInvestorOnboardingState';
import type { TeamPitchAccess } from '@/services/team-pitch/hooks/useGetTeamPitchAccess';
import { useTeamPitchAnalytics } from '@/analytics/team-pitch.analytics';
import { buildEngagementTrackEvent } from '@/analytics/team-pitch-engagement';
import { useReportAnalyticsEvent } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { useCurrentUserStore } from '@/services/auth/store';
import { getTeamSpotlightPath } from '@/services/team-pitch/constants';
import { TEAM_PITCH_ANALYTICS } from '@/utils/constants';
import clsx from 'clsx';
import s from './PitchInvestorHeader.module.scss';

type Props = {
  variant: PitchInvestorVariant;
  pitchSlug: string;
  prefillEmail?: string;
  pitchStatus?: TeamPitchAccess['status'];
  investorHasAccess?: boolean;
  title: string;
  description: string;
  teamName: string;
  teamUid: string;
  headerImageUrl?: string | null;
  pitchStatusLabel?: string | null;
  showWelcomeMessage?: boolean;
  embedded?: boolean;
};

export const PitchInvestorHeader = ({
  variant,
  pitchSlug,
  prefillEmail,
  pitchStatus,
  investorHasAccess,
  title,
  description,
  teamName,
  teamUid,
  headerImageUrl,
  pitchStatusLabel,
  showWelcomeMessage = false,
  embedded = false,
}: Props) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const teamPitchAnalytics = useTeamPitchAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();
  const { currentUser: userInfo } = useCurrentUserStore();

  const openProfileDrawer = () => {
    teamPitchAnalytics.onInvestorProfileCtaClicked({ pitchSlug, variant, profileCtaAsLink: true });
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
            variant,
            profileCtaAsLink: true,
          },
        ),
      );
    }
    setDrawerOpen(true);
  };

  const { isLoggedIn, userUid, statusLine, primaryCtaType, primaryCtaLabel, handleLogin } =
    usePitchInvestorOnboardingState({
      pitchSlug,
      prefillEmail,
      pitchStatus,
      investorHasAccess,
      variant,
      onProfileClick: openProfileDrawer,
    });

  return (
    <div className={clsx(s.headerContent, embedded && s.embedded, embedded && !statusLine && s.embeddedCompact)}>
      {!embedded && showWelcomeMessage && headerImageUrl && (
        <div className={s.headerImage}>
          <img src={headerImageUrl} alt="" />
        </div>
      )}

      {!embedded && pitchStatusLabel && <p className={s.pitchLabel}>{pitchStatusLabel}</p>}

      {!embedded &&
        (showWelcomeMessage ? (
          <PageTitle size="small" title={title} description={description} />
        ) : (
          <PitchTeamTitle teamName={teamName} teamUid={teamUid} />
        ))}

      {(variant === 'draft' || statusLine) && (
        <p className={s.statusLine}>
          {variant === 'draft' && teamName && (
            <>
              {teamName} has not opened this spotlight to investors yet
              <br />
            </>
          )}
          {statusLine}
        </p>
      )}

      <PitchInvestorQuickLinks
        pitchSlug={pitchSlug}
        variant={variant}
        primaryCtaType={primaryCtaType}
        primaryCtaLabel={primaryCtaLabel}
        isLoggedIn={isLoggedIn}
        onLogin={handleLogin}
      />

      {isLoggedIn && userUid && (
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
