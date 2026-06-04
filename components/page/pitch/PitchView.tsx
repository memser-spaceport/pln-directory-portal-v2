'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useCurrentUserStore } from '@/services/auth/store';
import { useGetTeamPitchAccess } from '@/services/team-pitch/hooks/useGetTeamPitchAccess';
import { useGetTeamPitch } from '@/services/team-pitch/hooks/useGetTeamPitch';
import { PageTitle } from '@/components/page/demo-day/PageTitle';
import { Alert } from '@/components/page/demo-day/shared/Alert';
import { SupportSection } from '@/components/page/demo-day/components/SupportSection';
import { TeamProfileCard } from '@/components/page/demo-day/ActiveView/components/TeamsList/components/TeamProfileCard/TeamProfileCard';
import { TeamDetailsDrawer } from '@/components/page/demo-day/ActiveView/components/TeamsList/components/TeamDetailsDrawer/TeamDetailsDrawer';
import type { TeamProfile } from '@/services/demo-day/hooks/useGetTeamsList';
import { PitchInvestorSteps } from '@/components/page/pitch/PitchInvestorSteps';
import { PitchTeamTitle } from '@/components/page/pitch/PitchTeamTitle';
import { PitchConfidentialityModal } from '@/components/page/pitch/PitchConfidentialityModal';
import { PitchComingSoonCard } from '@/components/page/pitch/PitchComingSoonCard';
import { PitchClosedCard } from '@/components/page/pitch/PitchClosedCard';
import { PitchViewSkeleton } from '@/components/page/pitch/PitchViewSkeleton';
import { ProfileSkeleton } from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileSkeleton';
import { useContactSupportStore } from '@/services/contact-support/store';
import s from '@/components/page/demo-day/FounderPendingView/FounderPendingView.module.scss';

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
  const { currentUser } = useCurrentUserStore();
  const isLoggedIn = !!currentUser?.uid;
  const { openModal } = useContactSupportStore((s) => s.actions);

  const { data: access, isLoading: accessLoading } = useGetTeamPitchAccess(slug);
  const canLoadPitch =
    isLoggedIn &&
    access &&
    access.access !== 'restricted' &&
    !(access.status === 'CLOSED' && access.participantType === 'INVESTOR' && !access.isPitchAdmin);
  const { data: pitch, isLoading: pitchLoading } = useGetTeamPitch(slug, canLoadPitch);

  const [selectedTeam, setSelectedTeam] = useState<TeamProfile | null>(null);

  useEffect(() => {
    if (prefillEmail && !isLoggedIn && access?.status !== 'CLOSED' && typeof window !== 'undefined') {
      router.replace(`/pitch/${slug}?prefillEmail=${encodeURIComponent(prefillEmail)}#login`);
    }
  }, [prefillEmail, isLoggedIn, access?.status, router, slug]);

  const isInvestor = access?.participantType === 'INVESTOR';

  if (accessLoading) {
    return <PitchViewSkeleton />;
  }

  if (!access) {
    return <div className={s.root}>Pitch not found</div>;
  }

  const pitchTeamTitle =
    access.teamUid && access.teamName ? <PitchTeamTitle teamName={access.teamName} teamUid={access.teamUid} /> : null;

  const isInvestorDraftView = access.status === 'DRAFT' && isInvestor && !access.isPitchAdmin;
  const investorHasAccess = access.access === 'view' || access.access === 'edit';
  const investorStepsProps = {
    pitchSlug: slug,
    prefillEmail,
    pitchStatus: access.status,
    investorHasAccess,
  };

  const supportSection = (
    <div className={s.supportSectionWrap}>
      <SupportSection
        supportEmail={access.supportEmail}
        onContactClick={() => openModal({ supportEmail: access.supportEmail, pitchSlug: slug }, 'team_pitch', '')}
      />
    </div>
  );

  if (isInvestorDraftView) {
    return (
      <div className={s.root}>
        <div className={s.stepsCard}>
          {pitchTeamTitle}
          <div className={s.stepsInHeader}>
            <PitchInvestorSteps {...investorStepsProps} />
          </div>
        </div>
        <PitchComingSoonCard teamName={access.teamName} />
        {supportSection}
      </div>
    );
  }

  if (isLoggedIn && access.access === 'restricted') {
    return (
      <div className={s.root}>
        <div className={s.stepsCard}>
          {pitchTeamTitle}
          <div className={s.stepsInHeader}>
            <PitchInvestorSteps
              {...investorStepsProps}
              onContactSupport={() =>
                openModal(
                  { reason: 'team_pitch_access_denied', pitchSlug: slug },
                  'team_pitch',
                  'I need access to a team pitch page',
                )
              }
            />
          </div>
        </div>
        {supportSection}
      </div>
    );
  }

  const isClosedInvestorView = access.status === 'CLOSED' && !access.isPitchAdmin && (isInvestor || !isLoggedIn);

  if (isClosedInvestorView) {
    return (
      <div className={s.root}>
        <PitchClosedCard
          teamName={access.teamName}
          teamUid={access.teamUid}
          pitchSlug={slug}
          prefillEmail={prefillEmail}
        />
      </div>
    );
  }

  const teamProfile = pitch?.teamProfile as TeamProfile | undefined;
  const showConfidentialityModal = isLoggedIn && !access.confidentialityAccepted && !access.isPitchAdmin;
  const canEdit = access.access === 'edit';
  const showInvestorSteps = !isLoggedIn || (isLoggedIn && access.access !== 'restricted' && isInvestor);
  const embedInvestorStepsInHeader = isLoggedIn && isInvestor && access.status === 'OPEN' && !access.isPitchAdmin;
  const showPitchPageTitle = isLoggedIn;
  const pitchStatusLabel = getPitchStatusLabel(access.status, access.isPitchAdmin, isInvestor);

  return (
    <div className={s.root}>
      {showConfidentialityModal && <PitchConfidentialityModal isOpen pitchSlug={slug} />}

      {isLoggedIn && (
        <div className={s.eventHeader}>
          <div className={s.content}>
            <div className={s.headline}>
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

              {embedInvestorStepsInHeader && (
                <div className={s.stepsInHeader}>
                  <PitchInvestorSteps {...investorStepsProps} />
                </div>
              )}

              <Alert>
                <p>
                  Confidentiality notice: Materials presented here are confidential and are provided exclusively for
                  your review. DO NOT copy, screenshot, share, or distribute to others. Any unauthorized disclosure will
                  result in removal from the network.
                </p>
              </Alert>
            </div>
          </div>
        </div>
      )}

      {showInvestorSteps && !embedInvestorStepsInHeader && (
        <div className={s.stepsCard}>
          {!showPitchPageTitle && pitchTeamTitle}
          <div className={s.stepsInHeader}>
            <PitchInvestorSteps {...investorStepsProps} />
          </div>
        </div>
      )}

      {pitchLoading && !teamProfile && <ProfileSkeleton />}

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
            />
          )}
        </>
      )}

      {supportSection}
    </div>
  );
};
