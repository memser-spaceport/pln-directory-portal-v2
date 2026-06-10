'use client';

import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useCurrentUserStore } from '@/services/auth/store';
import { useGetTeamPitchAccess } from '@/services/team-pitch/hooks/useGetTeamPitchAccess';
import { useGetTeamPitch } from '@/services/team-pitch/hooks/useGetTeamPitch';
import { PageTitle } from '@/components/page/demo-day/PageTitle';
import { Alert } from '@/components/page/demo-day/shared/Alert';
import { TeamProfileCard } from '@/components/page/demo-day/ActiveView/components/TeamsList/components/TeamProfileCard/TeamProfileCard';
import { TeamDetailsDrawer } from '@/components/page/demo-day/ActiveView/components/TeamsList/components/TeamDetailsDrawer/TeamDetailsDrawer';
import type { TeamProfile } from '@/services/demo-day/hooks/useGetTeamsList';
import { PitchInvestorHeader } from '@/components/page/pitch/PitchInvestorHeader';
import { PitchConfidentialityModal } from '@/components/page/pitch/PitchConfidentialityModal';
import { PitchComingSoonCard } from '@/components/page/pitch/PitchComingSoonCard';
import { PitchClosedCard } from '@/components/page/pitch/PitchClosedCard';
import { PitchViewSkeleton } from '@/components/page/pitch/PitchViewSkeleton';
import { ProfileSkeleton } from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileSkeleton';
import s from '@/components/page/demo-day/FounderPendingView/FounderPendingView.module.scss';
import pitchHeaderS from '@/components/page/pitch/PitchInvestorHeader.module.scss';

function getPitchStatusLabel(
  status: 'DRAFT' | 'OPEN' | 'CLOSED',
  isPitchAdmin: boolean,
  isInvestor: boolean,
): string | null {
  if (status === 'DRAFT' && isPitchAdmin) {
    return '[Team Pitch Draft]';
  }
  if (status === 'CLOSED' && (isPitchAdmin || !isInvestor)) {
    return '[Team Pitch Closed]';
  }
  return null;
}

export const PitchView = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;
  const prefillEmail = searchParams.get('prefillEmail') ?? undefined;
  const { currentUser, isHydrated } = useCurrentUserStore();
  const isLoggedIn = !!currentUser?.uid;

  const { data: access, isLoading: accessLoading, isError: accessError } = useGetTeamPitchAccess(slug);
  const canLoadPitch =
    isLoggedIn &&
    access &&
    access.access !== 'restricted' &&
    !(access.status === 'CLOSED' && access.participantType === 'INVESTOR' && !access.isPitchAdmin);
  const { data: pitch, isLoading: pitchLoading } = useGetTeamPitch(slug, canLoadPitch);

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

  const isInvestor = access?.participantType === 'INVESTOR';

  if (!isHydrated || accessLoading) {
    return <PitchViewSkeleton />;
  }

  if (accessError || !access) {
    return <div className={s.root}>Pitch not found</div>;
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

  if (isLimitedDraftView) {
    return (
      <div className={s.root}>
        <div className={s.stepsCard}>
          <PitchInvestorHeader variant="draft" {...investorHeaderProps} />
        </div>
        <PitchComingSoonCard teamName={access.teamName} />
      </div>
    );
  }

  if (isLoggedIn && access.access === 'restricted') {
    return (
      <div className={s.root}>
        <div className={s.stepsCard}>
          <PitchInvestorHeader variant="restricted" {...investorHeaderProps} />
        </div>
      </div>
    );
  }

  const isClosedInvestorView = access.status === 'CLOSED' && !access.isPitchAdmin && (isInvestor || !isLoggedIn);

  if (isClosedInvestorView) {
    return (
      <div className={s.root}>
        <div className={s.stepsCard}>
          <PitchInvestorHeader variant="closed" {...investorHeaderProps} />
        </div>
        <PitchClosedCard teamName={access.teamName} teamUid={access.teamUid} />
      </div>
    );
  }

  const teamProfile = pitch?.teamProfile as TeamProfile | undefined;
  const showConfidentialityModal = isLoggedIn && !access.confidentialityAccepted && !access.isPitchAdmin;
  const canEdit = access.access === 'edit';
  const pitchStatusLabel = getPitchStatusLabel(access.status, access.isPitchAdmin, isInvestor);

  return (
    <div className={s.root}>
      {showConfidentialityModal && <PitchConfidentialityModal isOpen pitchSlug={slug} />}

      {isLoggedIn && (
        <div className={s.eventHeader}>
          <div className={s.content}>
            <div className={s.headline}>
              {showInvestorHeader ? (
                <>
                  {access.headerImageUrl && (
                    <div className={s.headerImage}>
                      <img src={access.headerImageUrl} alt="" />
                    </div>
                  )}
                  <PageTitle size="small" title={access.title} description={access.description} />
                  <div className={clsx(s.stepsInHeader, pitchHeaderS.embeddedInEventHeader)}>
                    <PitchInvestorHeader variant="open" {...investorHeaderProps} showWelcomeMessage embedded />
                  </div>
                  <Alert>
                    <p>
                      Confidentiality notice: Materials presented here are confidential and are provided exclusively for
                      your review. DO NOT copy, screenshot, share, or distribute to others. Any unauthorized disclosure
                      will result in removal from the network.
                    </p>
                  </Alert>
                </>
              ) : (
                <>
                  {access.headerImageUrl && (
                    <div className={s.headerImage}>
                      <img src={access.headerImageUrl} alt="" />
                    </div>
                  )}

                  {pitchStatusLabel && <p className={s.pitchLabel}>{pitchStatusLabel}</p>}

                  <PageTitle size="small" title={access.title} description={access.description} />

                  {access.status === 'CLOSED' && !isInvestor && (
                    <Alert>
                      <p>This pitch is closed. Investors no longer have access.</p>
                    </Alert>
                  )}

                  <Alert>
                    <p>
                      Confidentiality notice: Materials presented here are confidential and are provided exclusively for
                      your review. DO NOT copy, screenshot, share, or distribute to others. Any unauthorized disclosure
                      will result in removal from the network.
                    </p>
                  </Alert>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {!isLoggedIn && showInvestorHeader && (
        <div className={s.stepsCard}>
          <PitchInvestorHeader variant="open" {...investorHeaderProps} />
        </div>
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
