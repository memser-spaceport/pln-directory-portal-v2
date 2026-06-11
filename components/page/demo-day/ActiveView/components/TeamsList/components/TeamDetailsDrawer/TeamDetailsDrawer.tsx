import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ProfileHeader } from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileHeader';
import { ProfileContent } from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileContent';
import { CompanyFundraiseParagraph } from '@/components/page/demo-day/FounderPendingView/components/CompanyFundraiseParagraph';
import { TeamProfile } from '@/services/demo-day/hooks/useGetTeamsList';
import s from './TeamDetailsDrawer.module.scss';
import { EditProfileDrawer } from '@/components/page/demo-day/FounderPendingView/components/EditProfileDrawer';
import { TeamPitchEditProvider } from '@/components/page/pitch/TeamPitchEditContext';
import { mapTeamProfileToFundraisingProfile } from '@/services/team-pitch/mapTeamProfileToFundraisingProfile';
import { useGetFundraisingProfile } from '@/services/demo-day/hooks/useGetFundraisingProfile';
import { useExpressInterest } from '@/services/demo-day/hooks/useExpressInterest';
import { useTeamPitchExpressInterest } from '@/services/team-pitch/hooks/useTeamPitchExpressInterest';
import { useDemoDayMode } from '@/services/demo-day/hooks/useDemoDayMode';
import { useCurrentUserStore } from '@/services/auth/store';
import Link from 'next/link';
import { useIsPrepDemoDay } from '@/services/demo-day/hooks/useIsPrepDemoDay';
import { useTeamEngagementAnalytics } from '@/analytics/team-pitch-engagement';
import { useReportAnalyticsEvent } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { getVideoPlaybackUrl } from '@/utils/upload-url.utils';
import { VideoWatchTimeData } from '@/components/common/VideoPlayer/hooks/useTrackVideoWatchTime';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { ReferCompanyModal } from '../ReferCompanyModal';
import { GiveFeedbackModal } from '@/components/page/demo-day/GiveFeedbackModal';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { DemoDayActionButtons } from '@/components/page/demo-day/DemoDayActionButtons';
import { usePathname } from 'next/navigation';

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12.5 5L7.5 10L12.5 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface TeamDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamProfile | null;
  scrollPosition: number;
  investorData?: {
    name: string;
    teamName: string;
    email: string;
  };
  isAdmin?: boolean;
  canEdit?: boolean;
  pitchSlug?: string;
  isPrepPitch?: boolean;
}

export const TeamDetailsDrawer: React.FC<TeamDetailsDrawerProps> = ({
  isOpen,
  onClose,
  team,
  scrollPosition,
  investorData,
  isAdmin = false,
  canEdit: canEditTeams = true,
  pitchSlug,
  isPrepPitch = false,
}) => {
  const pathname = usePathname();
  const { data: demoDayData } = useGetDemoDayState();
  const { data: fundraisingProfile } = useGetFundraisingProfile(!pitchSlug && demoDayData?.access === 'FOUNDER');
  const isPrepDemoDay = useIsPrepDemoDay();
  const demoDayMode = useDemoDayMode();
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const engagement = useTeamEngagementAnalytics(pitchSlug);
  const reportAnalytics = useReportAnalyticsEvent();
  const expressInterest = useExpressInterest(team?.team?.name);
  const pitchExpressInterest = useTeamPitchExpressInterest(pitchSlug ?? '', team?.team?.name);
  const interestPending = pitchSlug ? pitchExpressInterest.isPending : expressInterest.isPending;
  const { currentUser: userInfo } = useCurrentUserStore();

  if (!team) return null;

  const displayTeam = team;

  // Analytics helper function for team details
  const getTeamAnalyticsData = () => ({
    teamName: team.team?.name,
    teamUid: team.uid,
    teamShortDescription: team.team?.shortDescription,
    fundingStage: team.team?.fundingStage?.title,
    fundingStageUid: team.team?.fundingStage?.uid,
    industryTags: team.team?.industryTags?.map((tag) => tag.title),
    industryTagUids: team.team?.industryTags?.map((tag) => tag.uid),
    foundersCount: team.founders?.length || 0,
    founderNames: team.founders?.map((f) => f.name),
    hasLogo: !!team.team?.logo?.url,
  });

  // Analytics handlers for action buttons
  const handleLikeCompanyClick = () => {
    if (userInfo?.email) {
      const analyticsData = getTeamAnalyticsData();
      engagement.capture.likeCompanyClicked(analyticsData);
      const event = engagement.trackEngagement('likeCompanyClicked', userInfo, {
        action: 'like_company',
        ...analyticsData,
      });
      if (event) reportAnalytics.mutate(event);
    }

    // Express interest via API (state will be updated automatically via useGetExpressedInterests)
    expressInterest.mutate({
      teamFundraisingProfileUid: team.uid,
      interestType: 'like',
      isPrepDemoDay,
      demoDayMode: demoDayMode ?? undefined,
    });
  };

  const handleConnectCompanyClick = () => {
    if (userInfo?.email) {
      const analyticsData = getTeamAnalyticsData();
      engagement.capture.connectClicked(analyticsData);
      const event = engagement.trackEngagement('connectClicked', userInfo, {
        action: 'connect_company',
        ...analyticsData,
      });
      if (event) reportAnalytics.mutate(event);
    }

    // Express interest via API (state will be updated automatically via useGetExpressedInterests)
    if (pitchSlug) {
      pitchExpressInterest.mutate({
        teamPitchProfileUid: team.uid,
        interestType: 'connect',
        isPrep: isPrepPitch,
      });
    } else {
      expressInterest.mutate({
        teamFundraisingProfileUid: team.uid,
        interestType: 'connect',
        isPrepDemoDay,
        demoDayMode: demoDayMode ?? undefined,
      });
    }
  };

  const handleInvestCompanyClick = () => {
    if (userInfo?.email) {
      const analyticsData = getTeamAnalyticsData();
      engagement.capture.investClicked(analyticsData);
      const event = engagement.trackEngagement('investClicked', userInfo, {
        action: 'invest_company',
        ...analyticsData,
      });
      if (event) reportAnalytics.mutate(event);
    }

    // Express interest via API (state will be updated automatically via useGetExpressedInterests)
    if (pitchSlug) {
      pitchExpressInterest.mutate({
        teamPitchProfileUid: team.uid,
        interestType: 'invest',
        isPrep: isPrepPitch,
      });
    } else {
      expressInterest.mutate({
        teamFundraisingProfileUid: team.uid,
        interestType: 'invest',
        isPrepDemoDay,
        demoDayMode: demoDayMode ?? undefined,
      });
    }
  };

  const handleReferCompanyClick = () => {
    setIsReferModalOpen(true);

    if (userInfo?.email) {
      const analyticsData = getTeamAnalyticsData();
      engagement.capture.introClicked(analyticsData);
      const event = engagement.trackEngagement('introClicked', userInfo, { action: 'intro_company', ...analyticsData });
      if (event) reportAnalytics.mutate(event);
    }
  };

  const handleReferSubmit = (referralData: { investorName: string; investorEmail: string; message: string }) => {
    if (userInfo?.email) {
      const analyticsData = getTeamAnalyticsData();

      const referParams = {
        ...analyticsData,
        referralName: referralData.investorName,
        referralEmail: referralData.investorEmail,
      };
      engagement.capture.introConfirmClicked(referParams);
      const event = engagement.trackEngagement('introConfirmClicked', userInfo, {
        action: 'intro_company',
        ...referParams,
      });
      if (event) reportAnalytics.mutate(event);
    }

    // Express interest via API with referral data
    if (pitchSlug) {
      pitchExpressInterest.mutate({
        teamPitchProfileUid: team.uid,
        interestType: 'referral',
        isPrep: isPrepPitch,
        referralData,
      });
    } else {
      expressInterest.mutate({
        teamFundraisingProfileUid: team.uid,
        interestType: 'referral',
        isPrepDemoDay,
        demoDayMode: demoDayMode ?? undefined,
        referralData,
      });
    }

    // Close modal
    setIsReferModalOpen(false);
  };

  const handleGiveFeedbackClick = () => {
    if (userInfo?.email) {
      const analyticsData = getTeamAnalyticsData();
      engagement.capture.giveFeedbackClicked(analyticsData);
      const event = engagement.trackEngagement('giveFeedbackClicked', userInfo, {
        action: 'give_feedback',
        ...analyticsData,
      });
      if (event) reportAnalytics.mutate(event);
    }

    setIsFeedbackModalOpen(true);
  };

  const handleFeedbackSubmit = (feedbackData: { feedback: string }) => {
    if (userInfo?.email) {
      const analyticsData = getTeamAnalyticsData();
      const feedbackParams = { ...analyticsData, feedbackLength: feedbackData.feedback.length };
      engagement.capture.feedbackSubmitted(feedbackParams);
      const event = engagement.trackEngagement('feedbackSubmitted', userInfo, {
        action: 'feedback_submitted',
        ...feedbackParams,
      });
      if (event) reportAnalytics.mutate(event);
    }

    // Express interest via API with feedback data
    if (pitchSlug) {
      pitchExpressInterest.mutate(
        {
          teamPitchProfileUid: team.uid,
          interestType: 'feedback',
          isPrep: isPrepPitch,
          feedbackData,
        },
        {
          onSuccess: () => {
            setIsFeedbackModalOpen(false);
          },
        },
      );
    } else {
      expressInterest.mutate(
        {
          teamFundraisingProfileUid: team.uid,
          interestType: 'feedback' as any,
          isPrepDemoDay,
          demoDayMode: demoDayMode ?? undefined,
          feedbackData,
        },
        {
          onSuccess: () => {
            setIsFeedbackModalOpen(false);
          },
        },
      );
    }
  };

  // Analytics handlers for media viewing
  const handlePitchDeckView = () => {
    if (userInfo?.email) {
      const analyticsData = {
        ...getTeamAnalyticsData(),
        materialType: 'pitch_deck',
        materialUrl: team.onePagerUpload?.url,
      };
      engagement.capture.deckViewed(analyticsData);
      const event = engagement.trackEngagement('deckViewed', userInfo, analyticsData);
      if (event) reportAnalytics.mutate(event);
    }
  };

  const handlePitchVideoView = () => {
    if (userInfo?.email) {
      const analyticsData = {
        ...getTeamAnalyticsData(),
        materialType: 'pitch_video',
        materialUrl: team.videoUpload?.url,
      };
      engagement.capture.videoViewed(analyticsData);
      const event = engagement.trackEngagement('videoViewed', userInfo, analyticsData);
      if (event) reportAnalytics.mutate(event);
    }
  };

  const handleVideoWatchTime = (data: VideoWatchTimeData) => {
    if (!userInfo?.email) return;

    const watchParams = { ...getTeamAnalyticsData(), ...data };
    engagement.capture.videoWatchTime(watchParams);
    const event = engagement.trackEngagement('videoWatchTime', userInfo, watchParams);
    if (event) reportAnalytics.mutate(event);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isOwnTeam = team?.team?.uid === fundraisingProfile?.teamUid;
  const canEdit = pitchSlug ? canEditTeams : isAdmin ? canEditTeams : isOwnTeam;

  if (canEdit) {
    const editData = pitchSlug
      ? mapTeamProfileToFundraisingProfile(team)
      : isAdmin && !isOwnTeam
        ? (team as any)
        : fundraisingProfile;

    const drawer = (
      <EditProfileDrawer isOpen={isOpen} onClose={onClose} scrollPosition={0} data={editData} team={team} />
    );

    if (pitchSlug) {
      return (
        <TeamPitchEditProvider pitchSlug={pitchSlug} isPrep={isPrepPitch}>
          {drawer}
        </TeamPitchEditProvider>
      );
    }

    return drawer;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={s.drawerOverlay}
            onClick={handleOverlayClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <motion.div
              className={s.drawerContainer}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className={s.drawerContent}>
                {/* Header */}
                <div className={s.drawerHeader}>
                  <div className={s.breadcrumbs}>
                    <button className={s.backButton} onClick={onClose}>
                      <BackIcon />
                      <span>Back</span>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className={s.drawerBody}>
                  <>
                    {/* Profile Header */}
                    <div className={s.profileSection}>
                      <ProfileHeader
                        classes={{
                          name: s.teamName,
                        }}
                        uid={displayTeam.team.uid}
                        image={
                          displayTeam.team.logo?.url ||
                          getDefaultAvatar(displayTeam?.team?.name) ||
                          '/images/demo-day/profile-placeholder.svg'
                        }
                        name={displayTeam.team?.name || 'Team Name'}
                        description={displayTeam?.team?.shortDescription || '-'}
                        fundingStage={displayTeam?.team?.fundingStage?.title || '-'}
                        program={displayTeam.program ?? undefined}
                        showStage={demoDayData?.stageTagEnabled !== false}
                        tags={displayTeam?.team.industryTags.map((tag) => tag.title) || []}
                        website={displayTeam?.team?.website}
                      />
                    </div>

                    {/* Founders Section */}
                    {displayTeam?.founders && displayTeam.founders.length > 0 && (
                      <div className={s.foundersSection}>
                        <h3 className={s.sectionTitle}>Founders</h3>
                        {displayTeam.founders.map((founder) => (
                          <div className={s.founderRow} key={founder.uid}>
                            <div className={s.founderAvatar}>
                              <Image
                                src={founder.image?.url || getDefaultAvatar(founder.name)}
                                alt={founder.name}
                                width={48}
                                height={48}
                              />
                            </div>
                            <div className={s.founderInfo}>
                              <div className={s.founderNameRole}>
                                <h4 className={s.founderName}>{founder.name}</h4>
                                <p className={s.founderRole}>{founder.role}</p>
                              </div>
                              {founder.officeHours && <p className={s.founderStatus}>Available to connect</p>}
                            </div>
                            <div className={s.founderBadges}>
                              {founder.skills.slice(0, 3).map((skill) => (
                                <span className={s.founderBadge} key={skill.uid}>
                                  {skill.title}
                                </span>
                              ))}
                              {founder.skills.length > 3 && (
                                <Tooltip
                                  asChild
                                  trigger={<span className={s.founderBadge}>+{founder.skills.length - 3}</span>}
                                  content={
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      {founder.skills.slice(3).map((skill) => (
                                        <div key={skill.uid}>{skill.title}</div>
                                      ))}
                                    </div>
                                  }
                                />
                              )}
                            </div>
                            <Link
                              href={`/members/${founder.uid}?backTo=${encodeURIComponent(pathname)}`}
                              target="_blank"
                              className={s.founderArrow}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M11.354 8.35354L6.35403 13.3535C6.30757 13.4 6.25242 13.4368 6.19173 13.462C6.13103 13.4871 6.06598 13.5001 6.00028 13.5001C5.93458 13.5001 5.86953 13.4871 5.80883 13.462C5.74813 13.4368 5.69298 13.4 5.64653 13.3535C5.60007 13.3071 5.56322 13.2519 5.53808 13.1912C5.51294 13.1305 5.5 13.0655 5.5 12.9998C5.5 12.9341 5.51294 12.869 5.53808 12.8083C5.56322 12.7476 5.60007 12.6925 5.64653 12.646L10.2934 7.99979L5.64653 3.35354C5.55271 3.25972 5.5 3.13247 5.5 2.99979C5.5 2.86711 5.55271 2.73986 5.64653 2.64604C5.74035 2.55222 5.8676 2.49951 6.00028 2.49951C6.13296 2.49951 6.26021 2.55222 6.35403 2.64604L11.354 7.64604C11.4005 7.69248 11.4374 7.74762 11.4626 7.80832C11.4877 7.86902 11.5007 7.93408 11.5007 7.99979C11.5007 8.0655 11.4877 8.13056 11.4626 8.19126C11.4374 8.25196 11.4005 8.3071 11.354 8.35354Z"
                                  fill="#455468"
                                />
                              </svg>
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Profile Content */}
                    <div className={s.contentSection}>
                      <h3 className={s.sectionTitle}>Demo Day Materials</h3>
                      <div className={s.sectionMaterials}>
                        <ProfileContent
                          pitchDeckUrl={displayTeam?.onePagerUpload?.url}
                          videoUrl={getVideoPlaybackUrl(displayTeam?.videoUpload)}
                          onPitchDeckView={handlePitchDeckView}
                          onPitchVideoView={handlePitchVideoView}
                          pitchDeckPreviewUrl={displayTeam?.onePagerUpload?.previewImageUrl}
                          pitchDeckPreviewSmallUrl={displayTeam?.onePagerUpload?.previewImageSmallUrl}
                          onVideoWatchTime={handleVideoWatchTime}
                        />
                        {displayTeam?.description && (
                          <CompanyFundraiseParagraph paragraph={displayTeam?.description} editable={false} />
                        )}
                      </div>
                    </div>
                  </>
                </div>

                {/* Footer Actions */}
                <div className={s.drawerFooter}>
                  <DemoDayActionButtons
                    teamUid={team.uid}
                    teamName={team.team?.name || ''}
                    isReferralExpressed={team.referral}
                    isConnected={team.connected}
                    isInvested={team.invested}
                    isFeedbackGiven={team.feedback}
                    onMakeIntro={handleReferCompanyClick}
                    onGiveFeedback={handleGiveFeedbackClick}
                    onConnect={handleConnectCompanyClick}
                    onInvest={handleInvestCompanyClick}
                    isLoading={interestPending}
                    variant="drawer"
                    userInfo={userInfo ?? undefined}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Refer Company Modal */}
          <ReferCompanyModal
            isOpen={isReferModalOpen}
            onClose={() => {
              setIsReferModalOpen(false);

              if (userInfo?.email) {
                const analyticsData = getTeamAnalyticsData();
                engagement.capture.introCancelClicked(analyticsData);
                const event = engagement.trackEngagement('introCancelClicked', userInfo, {
                  action: 'intro_company_cancel',
                  ...analyticsData,
                });
                if (event) reportAnalytics.mutate(event);
              }
            }}
            onSubmit={handleReferSubmit}
            teamName={team?.team?.name || 'this company'}
            isSubmitting={interestPending}
          />

          {/* Give Feedback Modal */}
          <GiveFeedbackModal
            isOpen={isFeedbackModalOpen}
            onClose={() => setIsFeedbackModalOpen(false)}
            onSubmit={handleFeedbackSubmit}
            teamName={team?.team?.name || 'this company'}
            isSubmitting={interestPending}
          />
        </>
      )}
    </AnimatePresence>
  );
};
