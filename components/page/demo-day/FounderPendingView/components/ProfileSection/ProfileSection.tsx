import React from 'react';
import s from './ProfileSection.module.scss';
import { EditProfileDrawer } from '../EditProfileDrawer';
import { useGetFundraisingProfile } from '@/services/demo-day/hooks/useGetFundraisingProfile';
import { ProfileSkeleton } from './components/ProfileSkeleton';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileContent } from './components/ProfileContent';
import { ErrorState } from './components/ErrorState';
import Image from 'next/image';
import { useIsPrepDemoDay } from '@/services/demo-day/hooks/useIsPrepDemoDay';
import { useExpressInterest, InterestType } from '@/services/demo-day/hooks/useExpressInterest';
import { ProfileActions } from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileActions';
import { IUserInfo } from '@/types/shared.types';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { DEMO_DAY_ANALYTICS } from '@/utils/constants';

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

interface ProfileSectionProps {
  investorData?: {
    name: string;
    teamName: string;
    email: string;
  };
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ investorData }) => {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const scrollPositionRef = React.useRef<number>(0);
  const isPrepDemoDay = useIsPrepDemoDay();

  const { data, isLoading, error } = useGetFundraisingProfile();
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));

  // Analytics hooks
  const { onFounderTeamFundraisingCardClicked, onFounderEditTeamProfileButtonClicked } = useDemoDayAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();
  const expressInterest = useExpressInterest(data?.team?.name);

  const isNotCompleted = !data?.onePagerUpload?.url || !data?.videoUpload?.url;

  const handleEditProfile = () => {
    if (userInfo?.email) {
      // PostHog analytics
      onFounderEditTeamProfileButtonClicked();

      // Custom analytics event
      const editButtonClickedEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_FOUNDER_EDIT_TEAM_PROFILE_BUTTON_CLICKED,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          teamName: data?.team?.name,
          teamUid: data?.teamUid,
          hasOnePager: !!data?.onePagerUpload?.url,
          hasVideo: !!data?.videoUpload?.url,
        },
      };

      reportAnalytics.mutate(editButtonClickedEvent);
    }

    // Store current scroll position before opening drawer
    scrollPositionRef.current = document.body.scrollTop;
    setIsDrawerOpen(true);
  };

  const handleCardClick = () => {
    if (userInfo?.email) {
      // PostHog analytics
      onFounderTeamFundraisingCardClicked();

      // Custom analytics event
      const cardClickedEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_FOUNDER_TEAM_FUNDRAISING_CARD_CLICKED,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          teamName: data?.team?.name,
          teamUid: data?.teamUid,
          fundingStage: data?.team?.fundingStage?.title,
          industryTags: data?.team?.industryTags?.map((tag) => tag.title) || [],
        },
      };

      reportAnalytics.mutate(cardClickedEvent);
    }

    // Store current scroll position before opening drawer
    scrollPositionRef.current = document.body.scrollTop;
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  if (isLoading) {
    return (
      <div className={s.profileSection}>
        <ProfileSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={s.profileSection}>
        <ErrorState />
      </div>
    );
  }

  return (
    <>
      <div className={s.profileSection}>
        <div className={s.profileCard} onClick={handleEditProfile}>
          {!isNotCompleted && (
            <div className={s.editButtonContainer}>
              <button className={s.drawerEditButton} onClick={handleEditProfile}>
                <EditIcon />
                <span>Edit</span>
              </button>
            </div>
          )}
          {/* Header */}
          <ProfileHeader
            image={data?.team?.logo?.url || '/images/demo-day/profile-placeholder.svg'}
            name={data?.team?.name || 'Team Name'}
            description={data?.team?.shortDescription || '-'}
            fundingStage={data?.team?.fundingStage?.title || '-'}
            tags={data?.team?.industryTags?.map((tag) => tag.title) || []}
            uid={data?.team?.uid}
          />

          {/* Content */}
          <ProfileContent
            pitchDeckUrl={data?.onePagerUpload?.url}
            videoUrl={data?.videoUpload?.url}
            pitchDeckPreviewUrl={data?.onePagerUpload?.previewImageUrl}
            pitchDeckPreviewSmallUrl={data?.onePagerUpload?.previewImageSmallUrl}
          />

          {/* Divider */}
          <div className={s.profileDivider} />

          {/* Action Area */}
          {isNotCompleted ? (
            <ProfileActions onEditProfile={handleEditProfile} />
          ) : (
            <div className={s.actions}>
              <button
                className={s.secondaryButton}
                onClick={() =>
                  expressInterest.mutate({
                    teamFundraisingProfileUid: data?.uid,
                    interestType: 'like',
                    isPrepDemoDay,
                  })
                }
                disabled={expressInterest.isPending || !data?.uid}
              >
                {data?.liked ? (
                  <>
                    <Image src="/images/demo-day/heart.png" alt="Like" width={16} height={16} />
                    Liked Company
                    <CheckIcon />
                  </>
                ) : (
                  <>
                    <Image src="/images/demo-day/heart.png" alt="Like" width={16} height={16} /> Like Company
                  </>
                )}
              </button>
              <button
                className={s.secondaryButton}
                onClick={() =>
                  expressInterest.mutate({
                    teamFundraisingProfileUid: data?.uid,
                    interestType: 'connect',
                    isPrepDemoDay,
                  })
                }
                disabled={expressInterest.isPending || !data?.uid}
              >
                {data?.connected ? (
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
                onClick={() =>
                  expressInterest.mutate({
                    teamFundraisingProfileUid: data?.uid,
                    interestType: 'invest',
                    isPrepDemoDay,
                  })
                }
                disabled={expressInterest.isPending || !data?.uid}
              >
                {data?.invested ? (
                  <>
                    💰 Invest in Company
                    <CheckIcon />
                  </>
                ) : (
                  <>💰 Invest in Company</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Drawer */}
      <EditProfileDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        scrollPosition={scrollPositionRef.current}
        data={data}
        hideActions={isNotCompleted}
      />
    </>
  );
};

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.25 3H3a1.5 1.5 0 0 0-1.5 1.5v10.5A1.5 1.5 0 0 0 3 16.5h10.5a1.5 1.5 0 0 0 1.5-1.5V9.75M6.75 11.25h2.25L16.5 3.75a1.5 1.5 0 0 0-2.25-2.25L6.75 9v2.25Z"
      stroke="#1B4DFF"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
