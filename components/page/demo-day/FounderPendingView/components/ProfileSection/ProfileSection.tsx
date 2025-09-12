import React from 'react';
import s from './ProfileSection.module.scss';
import { EditProfileDrawer } from '../EditProfileDrawer';

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.25 3H3a1.5 1.5 0 0 0-1.5 1.5v10.5A1.5 1.5 0 0 0 3 16.5h10.5a1.5 1.5 0 0 0 1.5-1.5V9.75M6.75 11.25h2.25L16.5 3.75a1.5 1.5 0 0 0-2.25-2.25L6.75 9v2.25Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ImageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
    <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2" />
    <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const VideoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="23 7 16 12 23 17 23 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const ProfileSection = () => {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const scrollPositionRef = React.useRef<number>(0);

  const handleEditProfile = () => {
    // Store current scroll position before opening drawer
    scrollPositionRef.current = window.scrollY;
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <>
      <div className={s.profileSection}>
        <div className={s.profileCard}>
          {/* Header */}
          <div className={s.profileHeader}>
            <div className={s.profileImage}>{/* Placeholder for profile image */}</div>
            <div className={s.memberDetails}>
              <div className={s.memberInfo}>
                <div className={s.memberNameContainer}>
                  <h2 className={s.memberName}>Randamu</h2>
                </div>
                <p className={s.memberDescription}>Randamu increases fairness in our world by harnessing entropy.</p>
              </div>
              <div className={s.tagList}>
                <div className={s.stageTag}>Stage: Seed</div>
                <div className={s.tagDivider} />
                <div className={s.tag}>VR/AR</div>
                <div className={s.tag}>Frontier Tech</div>
                <div className={s.tag}>Service Providers</div>
                <div className={s.tag}>Enterprise Solutions</div>
                <div className={s.tag}>+2</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className={s.profileContent}>
            <div className={s.pitchDeck}>
              <ImageIcon />
            </div>
            <div className={s.video}>
              <VideoIcon />
            </div>
          </div>

          {/* Divider */}
          <div className={s.profileDivider} />

          {/* Action Area */}
          <div className={s.actionArea}>
            <button className={s.editButton} onClick={handleEditProfile}>
              <EditIcon />
              <span>Edit Team Fundraising Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Drawer */}
      <EditProfileDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        scrollPosition={scrollPositionRef.current}
      />
    </>
  );
};
