import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ProfileHeader } from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileHeader';
import { ProfileContent } from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileContent';
import { CompanyFundraiseParagraph } from '@/components/page/demo-day/FounderPendingView/components/CompanyFundraiseParagraph';
import { TeamProfile } from '@/services/demo-day/hooks/useGetTeamsList';
import s from './TeamDetailsDrawer.module.scss';
import { EditProfileDrawer } from '@/components/page/demo-day/FounderPendingView/components/EditProfileDrawer';
import { useGetFundraisingProfile } from '@/services/demo-day/hooks/useGetFundraisingProfile';
import { useExpressInterest } from '@/services/demo-day/hooks/useExpressInterest';
import { IUserInfo } from '@/types/shared.types';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { useIsPrepDemoDay } from '@/services/demo-day/hooks/useIsPrepDemoDay';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { DEMO_DAY_ANALYTICS } from '@/utils/constants';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { ReferCompanyModal } from '../ReferCompanyModal';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';

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

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.3337 4L6.00033 11.3333L2.66699 8"
      stroke="currentColor"
      strokeWidth="2"
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
}

export const TeamDetailsDrawer: React.FC<TeamDetailsDrawerProps> = ({
  isOpen,
  onClose,
  team,
  scrollPosition,
  investorData,
  isAdmin = false,
}) => {
  const { data: demoDayData } = useGetDemoDayState();
  const { data } = useGetFundraisingProfile(demoDayData?.access === 'FOUNDER');
  const isPrepDemoDay = useIsPrepDemoDay();
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);

  // Analytics hooks
  const {
    onActiveViewLikeCompanyClicked,
    onActiveViewConnectCompanyClicked,
    onActiveViewInvestCompanyClicked,
    onActiveViewTeamPitchDeckViewed,
    onActiveViewTeamPitchVideoViewed,
  } = useDemoDayAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();
  const expressInterest = useExpressInterest(team?.team?.name);
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));

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
      // PostHog analytics
      onActiveViewLikeCompanyClicked(getTeamAnalyticsData());

      // Custom analytics event
      const likeEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_LIKE_COMPANY_CLICKED,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          action: 'like_company',
          ...getTeamAnalyticsData(),
        },
      };

      reportAnalytics.mutate(likeEvent);
    }

    // Express interest via API (state will be updated automatically via useGetExpressedInterests)
    expressInterest.mutate({
      teamFundraisingProfileUid: team.uid,
      interestType: 'like',
      isPrepDemoDay,
    });
  };

  const handleConnectCompanyClick = () => {
    if (userInfo?.email) {
      // PostHog analytics
      onActiveViewConnectCompanyClicked(getTeamAnalyticsData());

      // Custom analytics event
      const connectEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_CONNECT_COMPANY_CLICKED,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          action: 'connect_company',
          ...getTeamAnalyticsData(),
        },
      };

      reportAnalytics.mutate(connectEvent);
    }

    // Express interest via API (state will be updated automatically via useGetExpressedInterests)
    expressInterest.mutate({
      teamFundraisingProfileUid: team.uid,
      interestType: 'connect',
      isPrepDemoDay,
    });
  };

  const handleInvestCompanyClick = () => {
    if (userInfo?.email) {
      // PostHog analytics
      onActiveViewInvestCompanyClicked(getTeamAnalyticsData());

      // Custom analytics event
      const investEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_INVEST_COMPANY_CLICKED,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          action: 'invest_company',
          ...getTeamAnalyticsData(),
        },
      };

      reportAnalytics.mutate(investEvent);
    }

    // Express interest via API (state will be updated automatically via useGetExpressedInterests)
    expressInterest.mutate({
      teamFundraisingProfileUid: team.uid,
      interestType: 'invest',
      isPrepDemoDay,
    });
  };

  const handleReferCompanyClick = () => {
    setIsReferModalOpen(true);
  };

  const handleReferSubmit = (referralData: { investorName: string; investorEmail: string; message: string }) => {
    if (userInfo?.email) {
      // Custom analytics event
      const referEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_REFER_COMPANY_CLICKED,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          action: 'refer_company',
          ...getTeamAnalyticsData(),
          referralInvestorName: referralData.investorName,
          referralInvestorEmail: referralData.investorEmail,
        },
      };

      reportAnalytics.mutate(referEvent);
    }

    // Express interest via API with referral data
    expressInterest.mutate({
      teamFundraisingProfileUid: team.uid,
      interestType: 'referral',
      isPrepDemoDay,
      referralData,
    });

    // Close modal
    setIsReferModalOpen(false);
  };

  // Analytics handlers for media viewing
  const handlePitchDeckView = () => {
    if (userInfo?.email) {
      // PostHog analytics
      onActiveViewTeamPitchDeckViewed(getTeamAnalyticsData());

      // Custom analytics event
      const pitchDeckEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_TEAM_PITCH_DECK_VIEWED,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          materialType: 'pitch_deck',
          materialUrl: team.onePagerUpload?.url,
          ...getTeamAnalyticsData(),
        },
      };

      reportAnalytics.mutate(pitchDeckEvent);
    }
  };

  const handlePitchVideoView = () => {
    if (userInfo?.email) {
      // PostHog analytics
      onActiveViewTeamPitchVideoViewed(getTeamAnalyticsData());

      // Custom analytics event
      const pitchVideoEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_TEAM_PITCH_VIDEO_VIEWED,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          materialType: 'pitch_video',
          materialUrl: team.videoUpload?.url,
          ...getTeamAnalyticsData(),
        },
      };

      reportAnalytics.mutate(pitchVideoEvent);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isOwnTeam = team?.team?.uid === data?.teamUid;

  if (isOwnTeam || isAdmin) {
    const editData = isAdmin && !isOwnTeam ? (team as any) : data;
    return <EditProfileDrawer isOpen={isOpen} onClose={onClose} scrollPosition={0} data={editData} team={team} />;
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
                        image={displayTeam.team.logo?.url || '/images/demo-day/profile-placeholder.svg'}
                        name={displayTeam.team?.name || 'Team Name'}
                        description={displayTeam?.team?.shortDescription || '-'}
                        fundingStage={displayTeam?.team?.fundingStage?.title || '-'}
                        tags={displayTeam?.team.industryTags.map((tag) => tag.title) || []}
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
                            <Link href={`/members/${founder.uid}`} target="_blank" className={s.founderArrow}>
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
                          videoUrl={displayTeam?.videoUpload?.url}
                          onPitchDeckView={handlePitchDeckView}
                          onPitchVideoView={handlePitchVideoView}
                          pitchDeckPreviewUrl={displayTeam?.onePagerUpload?.previewImageUrl}
                          pitchDeckPreviewSmallUrl={displayTeam?.onePagerUpload?.previewImageSmallUrl}
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
                  <div className={s.actions}>
                    <button
                      className={s.secondaryButton}
                      onClick={handleReferCompanyClick}
                      disabled={expressInterest.isPending || !team.uid}
                    >
                      {team.referral ? (
                        <>
                          ✉️ Send Introduction
                          <CheckIcon />
                        </>
                      ) : (
                        <>✉️ Send Introduction</>
                      )}
                    </button>
                    <button
                      className={s.secondaryButton}
                      onClick={handleLikeCompanyClick}
                      disabled={expressInterest.isPending || !team.uid}
                    >
                      {team.liked ? (
                        <>
                          <Image src="/images/demo-day/heart.png" alt="Like" width={16} height={16} />
                          Liked Company
                          <CheckIcon />
                        </>
                      ) : (
                        <>
                          <Image src="/images/demo-day/heart.png" alt="Like" width={16} height={16} />
                          Like Company
                        </>
                      )}
                    </button>
                    <button
                      className={s.secondaryButton}
                      onClick={handleConnectCompanyClick}
                      disabled={expressInterest.isPending || !team.uid}
                    >
                      {team.connected ? (
                        <>
                          🤝 Connected with Company
                          <CheckIcon />
                        </>
                      ) : (
                        <>🤝 Connect with Company</>
                      )}
                    </button>
                    <button
                      className={s.primaryButton}
                      onClick={handleInvestCompanyClick}
                      disabled={expressInterest.isPending || !team.uid}
                    >
                      {team.invested ? (
                        <>
                          💰 Invested in Company
                          <CheckIcon />
                        </>
                      ) : (
                        <>💰 Invest in Company</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Refer Company Modal */}
          <ReferCompanyModal
            isOpen={isReferModalOpen}
            onClose={() => setIsReferModalOpen(false)}
            onSubmit={handleReferSubmit}
            teamName={team?.team?.name || 'this company'}
            isSubmitting={expressInterest.isPending}
          />
        </>
      )}
    </AnimatePresence>
  );
};
