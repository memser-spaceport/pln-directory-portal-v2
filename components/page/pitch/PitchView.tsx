'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useCurrentUserStore } from '@/services/auth/store';
import { useGetTeamPitchAccess } from '@/services/team-pitch/hooks/useGetTeamPitchAccess';
import { useGetTeamPitch } from '@/services/team-pitch/hooks/useGetTeamPitch';
import { TeamProfileCard } from '@/components/page/demo-day/ActiveView/components/TeamsList/components/TeamProfileCard/TeamProfileCard';
import { TeamDetailsDrawer } from '@/components/page/demo-day/ActiveView/components/TeamsList/components/TeamDetailsDrawer/TeamDetailsDrawer';
import type { TeamProfile } from '@/services/demo-day/hooks/useGetTeamsList';
import { PitchInvestorHeader } from '@/components/page/pitch/PitchInvestorHeader';
import { PitchConfidentialityModal } from '@/components/page/pitch/PitchConfidentialityModal';
import { PitchComingSoonCard } from '@/components/page/pitch/PitchComingSoonCard';
import { PitchAccessRestrictedModal } from '@/components/page/pitch/PitchAccessRestrictedModal';
import { PitchClosedCard } from '@/components/page/pitch/PitchClosedCard';
import { PitchEventHeader } from '@/components/page/pitch/PitchEventHeader';
import { PitchInvestorEventHeader } from '@/components/page/pitch/PitchInvestorEventHeader';
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
  const { currentUser, isHydrated } = useCurrentUserStore();
  const isLoggedIn = !!currentUser?.uid;

  const { data: access, isLoading: accessLoading, isError: accessError } = useGetTeamPitchAccess(slug);
  const canLoadPitch = isLoggedIn && access && access.access !== 'restricted';
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
      teamPitchAnalytics.onTimeOnPage({ ...pitchPageProperties, timeSpent, sessionId });

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
  const [restrictedModalDismissed, setRestrictedModalDismissed] = useState(false);
  const loginRedirectAttemptedRef = useRef(false);

  const showRestrictedModal =
    isLoggedIn && !accessLoading && access?.access === 'restricted' && !restrictedModalDismissed;

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
  }, [prefillEmail, isLoggedIn, isHydrated, access, accessLoading, router]);

  const handleLogin = () => {
    const email = prefillEmail || '';
    router.replace(`${getTeamSpotlightPath(slug)}?prefillEmail=${encodeURIComponent(email)}#login`);
  };

  const isInvestor = access?.participantType === 'INVESTOR';

  if (!isHydrated || accessLoading) {
    return <PitchViewSkeleton />;
  }

  if (accessError || !access) {
    return <div className={s.root}>Spotlight not found</div>;
  }

  const canViewFullDraftPitch =
    access.isPitchAdmin || access.participantAccess === 'VIEW_ADMIN' || access.participantAccess === 'EDIT';

  const isLimitedDraftView = access.status === 'DRAFT' && !canViewFullDraftPitch;
  const investorHasAccess = access.access === 'view' || access.access === 'edit';
  const showInvestorHeader = !access.isPitchAdmin && (isInvestor || !isLoggedIn);

  const investorHeaderProps = {
    pitchSlug: slug,
    prefillEmail,
    pitchStatus: access.status,
    investorHasAccess,
    title: access.title,
    description: access.description,
    teamName: access.teamName,
    teamUid: access.teamUid,
    headerImageUrl: access.headerImageUrl,
  };

  if (isLoggedIn && access.access === 'restricted') {
    return (
      <div className={s.root}>
        <div className={s.stepsCard}>
          <PitchInvestorHeader variant="restricted" {...investorHeaderProps} />
        </div>
        <PitchAccessRestrictedModal isOpen={showRestrictedModal} onClose={() => setRestrictedModalDismissed(true)} />
      </div>
    );
  }

  if (isLimitedDraftView) {
    if (isLoggedIn && isInvestor && access.participantAccess === 'VIEW') {
      return (
        <div className={s.root}>
          <div className={s.stepsCard}>
            <PitchInvestorHeader variant="draft" {...investorHeaderProps} />
          </div>
        </div>
      );
    }
    return (
      <div className={s.root}>
        <PitchComingSoonCard teamName={access.teamName} isLoggedIn={isLoggedIn} onLogin={handleLogin} />
      </div>
    );
  }

  const isClosedInvestorView = access.status === 'CLOSED' && !access.isPitchAdmin && (isInvestor || !isLoggedIn);

  if (isClosedInvestorView) {
    if (!isLoggedIn) {
      return (
        <div className={s.root}>
          <PitchComingSoonCard
            teamName={access.teamName}
            isLoggedIn={false}
            onLogin={handleLogin}
            variant="closed"
            teamProfileHref={`/teams/${access.teamUid}`}
          />
        </div>
      );
    }
    return (
      <div className={s.root}>
        <PitchClosedCard
          teamName={access.teamName}
          teamUid={access.teamUid}
          pitchSlug={slug}
          prefillEmail={prefillEmail}
          closedAt={pitch?.closedAt}
        />
      </div>
    );
  }

  const teamProfile = pitch?.teamProfile as TeamProfile | undefined;
  const showConfidentialityModal = isLoggedIn && !access.confidentialityAccepted && !access.isPitchAdmin;
  const canEdit = access.access === 'edit';

  return (
    <div className={s.root}>
      {showConfidentialityModal && <PitchConfidentialityModal isOpen pitchSlug={slug} />}

      {isLoggedIn && showInvestorHeader && (
        <PitchInvestorEventHeader
          pitchSlug={slug}
          prefillEmail={prefillEmail}
          pitchStatus={access.status}
          investorHasAccess={investorHasAccess}
          teamName={access.teamName}
          title={access.title}
          description={access.description}
        />
      )}

      {isLoggedIn && !showInvestorHeader && (
        <PitchEventHeader title={access.title} description={access.description} status={access.status} />
      )}

      {!isLoggedIn && showInvestorHeader && (
        <PitchComingSoonCard
          teamName={access.teamName}
          isLoggedIn={false}
          onLogin={handleLogin}
          variant="active"
          hideBadge
        />
      )}

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
            onClick={() => setSelectedTeam(teamProfile)}
          />
          {selectedTeam && (
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
