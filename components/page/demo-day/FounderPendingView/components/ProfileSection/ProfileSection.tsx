import React from 'react';
import s from './ProfileSection.module.scss';
import { EditProfileDrawer } from '../EditProfileDrawer';
import { useGetFundraisingProfile } from '@/services/demo-day/hooks/useGetFundraisingProfile';
import { ProfileSkeleton } from './components/ProfileSkeleton';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileContent } from './components/ProfileContent';
import { ProfileActions } from './components/ProfileActions';
import { ErrorState } from './components/ErrorState';

export const ProfileSection = () => {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const scrollPositionRef = React.useRef<number>(0);

  const { data, isLoading, error } = useGetFundraisingProfile();

  const handleEditProfile = () => {
    // Store current scroll position before opening drawer
    scrollPositionRef.current = window.scrollY;
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
        <div className={s.profileCard}>
          {/* Header */}
          <ProfileHeader
            image={data?.team?.logo || '/images/demo-day/profile-placeholder.svg'}
            name={data?.team?.name || 'Team Name'}
            description={data?.team?.shortDescription || '-'}
            fundingStage={data?.team.fundingStage.title || '-'}
            tags={data?.team.industryTags.map((tag) => tag.title) || []}
          />

          {/* Content */}
          <ProfileContent pitchDeckUrl={data?.onePagerUpload} videoUrl={data?.videoUpload} />

          {/* Divider */}
          <div className={s.profileDivider} />

          {/* Action Area */}
          <ProfileActions onEditProfile={handleEditProfile} />
        </div>
      </div>

      {/* Edit Profile Drawer */}
      <EditProfileDrawer isOpen={isDrawerOpen} onClose={handleCloseDrawer} scrollPosition={scrollPositionRef.current} />
    </>
  );
};
