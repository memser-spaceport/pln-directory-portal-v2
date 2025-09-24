import React from 'react';
import s from './ProfileSection.module.scss';
import { EditProfileDrawer } from '../EditProfileDrawer';
import { useGetFundraisingProfile } from '@/services/demo-day/hooks/useGetFundraisingProfile';
import { ProfileSkeleton } from './components/ProfileSkeleton';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileContent } from './components/ProfileContent';
import { ErrorState } from './components/ErrorState';
import Image from 'next/image';
import { createDemoDayEmailHandler, DemoDayEmailData } from '@/utils/demo-day-email.utils';
import { ProfileActions } from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileActions';
import { IUserInfo } from '@/types/shared.types';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';

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

  const { data, isLoading, error } = useGetFundraisingProfile();

  // Create email data for demo day actions
  const createEmailData = (): DemoDayEmailData | null => {
    const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));

    const founder = data?.founders?.[0];

    if (!founder || !userInfo) return null;

    const founderEmail = founder.email;
    const founderName = founder.name;

    return {
      founderEmail,
      founderName,
      demotingTeamName: data.team?.name || 'Team Name',
      investorName: userInfo.name ?? '',
      investorTeamName: '',
    };
  };

  const emailData = createEmailData();

  const handleEditProfile = () => {
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

  console.log(data);

  return (
    <>
      <div className={s.profileSection}>
        <div className={s.profileCard}>
          <div className={s.editButtonContainer}>
            <button className={s.drawerEditButton} onClick={handleEditProfile}>
              <EditIcon />
              <span>Edit</span>
            </button>
          </div>
          {/* Header */}
          <ProfileHeader
            image={data?.team?.logo?.url || '/images/demo-day/profile-placeholder.svg'}
            name={data?.team?.name || 'Team Name'}
            description={data?.team?.shortDescription || '-'}
            fundingStage={data?.team.fundingStage.title || '-'}
            tags={data?.team.industryTags.map((tag) => tag.title) || []}
          />

          {/* Content */}
          <ProfileContent pitchDeckUrl={data?.onePagerUpload?.url} videoUrl={data?.videoUpload?.url} />

          {/* Divider */}
          <div className={s.profileDivider} />

          {/* Action Area */}
          {!data?.onePagerUpload?.url || !data?.videoUpload?.url ? (
            <ProfileActions onEditProfile={handleEditProfile} />
          ) : (
            <div className={s.actions}>
              <button
                className={s.secondaryButton}
                onClick={emailData ? createDemoDayEmailHandler('like', emailData) : undefined}
                disabled={!emailData}
              >
                <Image src="/images/demo-day/heart.png" alt="Like" width={16} height={16} /> Like Company
              </button>
              <button
                className={s.secondaryButton}
                onClick={emailData ? createDemoDayEmailHandler('connect', emailData) : undefined}
                disabled={!emailData}
              >
                🤝 Connect with Company
              </button>
              <button
                className={s.primaryButton}
                onClick={emailData ? createDemoDayEmailHandler('invest', emailData) : undefined}
                disabled={!emailData}
              >
                💰 Invest in Company
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
