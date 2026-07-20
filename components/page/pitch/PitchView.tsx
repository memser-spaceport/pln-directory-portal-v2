'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useCurrentUserStore } from '@/services/auth/store';
import { useGetTeamPitchAccess } from '@/services/team-pitch/hooks/useGetTeamPitchAccess';
import { useGetTeamPitch } from '@/services/team-pitch/hooks/useGetTeamPitch';
import { TeamProfileCard } from '@/components/page/demo-day/ActiveView/components/TeamsList/components/TeamProfileCard/TeamProfileCard';
import { TeamDetailsDrawer } from '@/components/page/demo-day/ActiveView/components/TeamsList/components/TeamDetailsDrawer/TeamDetailsDrawer';
import type { TeamProfile } from '@/services/demo-day/hooks/useGetTeamsList';
import { PitchConfidentialityModal } from '@/components/page/pitch/PitchConfidentialityModal';
import { PitchEventHeader } from '@/components/page/pitch/PitchEventHeader';
import { PitchSpotlightHero } from '@/components/page/pitch/PitchSpotlightHero';
import { PitchViewSkeleton } from '@/components/page/pitch/PitchViewSkeleton';
import { ProfileSkeleton } from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileSkeleton';
import s from '@/components/page/demo-day/FounderPendingView/FounderPendingView.module.scss';
import { useTeamPitchAnalytics } from '@/analytics/team-pitch.analytics';
import { buildEngagementTrackEvent } from '@/analytics/team-pitch-engagement';
import { usePageViewAnalytics } from '@/hooks/usePageViewAnalytics';
import { useTimeOnPage } from '@/hooks/useTimeOnPage';
import { useReportAnalyticsEvent } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { TEAM_PITCH_ANALYTICS } from '@/utils/constants';
import { getTeamSpotlightPath } from '@/services/team-pitch/constants';

export const PitchView = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;
  const prefillEmail = searchParams.get('prefillEmail') ?? undefined;
  const loginToken = searchParams.get('loginToken');
  const { currentUser, isHydrated } = useCurrentUserStore();
  const isLoggedIn = !!currentUser?.uid;

  const { data: access, isLoading: accessLoading, isError: accessError } = useGetTeamPitchAccess(slug);
  const canViewFullPitch =
    !!access &&
    (access.isPitchAdmin || access.participantAccess === 'VIEW_ADMIN' || access.participantAccess === 'EDIT');
  const canLoadPitch =
    isLoggedIn && !!access && access.access !== 'restricted' && (access.status !== 'CLOSED' || canViewFullPitch);
  const { data: pitch, isLoading: pitchLoading } = useGetTeamPitch(slug, canLoadPitch);
  const teamPitchAnalytics = useTeamPitchAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();

  const pitchPageProperties = {
    pitchSlug: slug,
    pitchStatus: access?.status,
    participantType: access?.participantType,
    isPitchAdmin: access?.isPitchAdmin,
    isLoggedIn,
  };

  usePageViewAnalytics({
    postHogEventFunction: () => teamPitchAnalytics.onPageOpened(pitchPageProperties),
    customEventName: TEAM_PITCH_ANALYTICS.ON_PAGE_OPENED,
    path: getTeamSpotlightPath(slug),
    requireAuth: false,
    distinctId: currentUser?.email ?? `pitch-anonymous-${slug}`,
    skip: accessLoading || !access,
    additionalProperties: pitchPageProperties,
  });

  useTimeOnPage({
    enabled: !accessLoading && !!access,
    onTimeReport: (timeSpent, sessionId) => {
      const distinctId = currentUser?.email ?? `pitch-anonymous-${slug}`;
      reportAnalytics.mutate(
        buildEngagementTrackEvent(TEAM_PITCH_ANALYTICS.ON_TIME_ON_PAGE, distinctId, getTeamSpotlightPath(slug), slug, {
          ...(currentUser ? { userId: currentUser.uid, userEmail: currentUser.email, userName: currentUser.name } : {}),
          timeSpent,
          eventId: sessionId,
          ...pitchPageProperties,
        }),
      );
    },
    reportInterval: 30000,
  });

  const [selectedTeam, setSelectedTeam] = useState<TeamProfile | null>(null);
  const loginRedirectAttemptedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !isHydrated || accessLoading || !access) {
      return;
    }
    if (loginRedirectAttemptedRef.current) {
      return;
    }
    if (!prefillEmail || isLoggedIn || access.status === 'CLOSED') {
      return;
    }
    // Login-token redeem handles auth; do not open Privy until redeem fails
    if (loginToken) {
      return;
    }

    const canViewFullDraftPitch =
      access.isPitchAdmin || access.participantAccess === 'VIEW_ADMIN' || access.participantAccess === 'EDIT';
    if (canViewFullDraftPitch) {
      return;
    }

    if (window.location.hash === '#login') {
      return;
    }

    loginRedirectAttemptedRef.current = true;
    router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });
  }, [prefillEmail, loginToken, isLoggedIn, isHydrated, access, accessLoading, router]);

  const isInvestor = access?.participantType === 'INVESTOR';

  if (!isHydrated || accessLoading) {
    return <PitchViewSkeleton />;
  }

  if (accessError || !access) {
    return <div className={s.root}>Spotlight not found</div>;
  }

  const canViewFullDraftPitch = canViewFullPitch;

  const isLimitedDraftView = access.status === 'DRAFT' && !canViewFullDraftPitch;
  const investorHasAccess = access.access === 'view' || access.access === 'edit';
  const showAdminHeader = isLoggedIn && (canViewFullDraftPitch || access.access === 'edit');
  const showInvestorHeader = !canViewFullDraftPitch && (isInvestor || !isLoggedIn);

  const spotlightHeroProps = {
    pitchSlug: slug,
    prefillEmail,
    title: access.title,
    description: access.description,
    spotlightStatement: access.spotlightStatement,
    teamName: access.teamName,
    teamUid: access.teamUid,
  };

  if (isLoggedIn && access.access === 'restricted') {
    return (
      <div className={s.root}>
        <PitchSpotlightHero variant="restricted" {...spotlightHeroProps} />
      </div>
    );
  }

  if (isLimitedDraftView) {
    if (isLoggedIn && isInvestor && access.participantAccess === 'VIEW') {
      return (
        <div className={s.root}>
          <PitchSpotlightHero variant="draftWhitelist" {...spotlightHeroProps} />
        </div>
      );
    }
    return (
      <div className={s.root}>
        <PitchSpotlightHero variant="notLoggedIn" {...spotlightHeroProps} />
      </div>
    );
  }

  const isClosedInvestorView = access.status === 'CLOSED' && !canViewFullDraftPitch && (isInvestor || !isLoggedIn);

  if (isClosedInvestorView) {
    return (
      <div className={s.root}>
        <PitchSpotlightHero variant={isLoggedIn ? 'closed' : 'closedLoggedOut'} {...spotlightHeroProps} />
      </div>
    );
  }

  const teamProfile = pitch?.teamProfile as TeamProfile | undefined;
  const showConfidentialityModal = isLoggedIn && !access.confidentialityAccepted && !access.isPitchAdmin;
  const canEdit = access.access === 'edit';
  const isOpenInvestorView = isLoggedIn && showInvestorHeader && access.status === 'OPEN';

  return (
    <div className={s.root}>
      {showConfidentialityModal && <PitchConfidentialityModal isOpen pitchSlug={slug} />}

      {isOpenInvestorView && <PitchSpotlightHero variant="open" {...spotlightHeroProps} />}

      {showAdminHeader && access.status === 'DRAFT' && (
        <PitchSpotlightHero variant="draftPreview" {...spotlightHeroProps} />
      )}

      {showAdminHeader && access.status === 'CLOSED' && (
        <PitchSpotlightHero variant="closedPreview" {...spotlightHeroProps} />
      )}

      {showAdminHeader && access.status !== 'DRAFT' && access.status !== 'CLOSED' && (
        <PitchEventHeader title={access.title} description={access.description} />
      )}

      {!isLoggedIn && showInvestorHeader && <PitchSpotlightHero variant="notLoggedIn" {...spotlightHeroProps} />}

      {canLoadPitch && pitchLoading && !teamProfile && <ProfileSkeleton />}

      {teamProfile && (
        <>
          <TeamProfileCard
            team={teamProfile}
            pitchSlug={slug}
            isPrepPitch={access.status === 'DRAFT' || access.isPitchAdmin}
            hideSave
            showStageAlways
            canEdit={canEdit}
            isAdmin={access.isPitchAdmin}
            onClick={() => {
              if (canEdit || access.isPitchAdmin) {
                setSelectedTeam(teamProfile);
              }
            }}
          />
          {selectedTeam && (canEdit || access.isPitchAdmin) && (
            <TeamDetailsDrawer
              team={pitch?.teamProfile ?? selectedTeam}
              isOpen={!!selectedTeam}
              onClose={() => setSelectedTeam(null)}
              scrollPosition={0}
              canEdit={canEdit}
              isAdmin={access.isPitchAdmin}
              pitchSlug={slug}
              isPrepPitch={access.status === 'DRAFT' || access.isPitchAdmin}
            />
          )}
        </>
      )}
    </div>
  );
};
