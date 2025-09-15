import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EditProfileForm } from '../EditProfileForm';
import { DemoMaterials } from '../DemoMaterials';
import s from './EditProfileDrawer.module.scss';
import { clsx } from 'clsx';
import { IUserInfo } from '@/types/shared.types';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { FundraisingProfile } from '@/services/demo-day/hooks/useGetFundraisingProfile';
import Link from 'next/link';

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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

const WarningIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="9" r="8" fill="#F59E0B" />
    <path d="M9 5v4M9 13h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface EditProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  scrollPosition: number;
  data?: FundraisingProfile;
}

export const EditProfileDrawer: React.FC<EditProfileDrawerProps> = ({ isOpen, onClose, scrollPosition, data }) => {
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));
  const [editView, setEditView] = useState(false);

  const handleEditClick = () => {
    setEditView(true);
  };

  const handleBackToView = () => {
    setEditView(false);
  };

  const handleFormClose = () => {
    setEditView(false);
  };

  // Reset edit mode when drawer closes
  React.useEffect(() => {
    if (!isOpen) {
      setEditView(false);
    }
  }, [isOpen]);

  // Handle ESC key press and body scroll lock
  // React.useEffect(() => {
  // const handleEscKey = (event: KeyboardEvent) => {
  //   if (event.key === 'Escape' && isOpen) {
  //     onClose();
  //   }
  // };

  //   if (isOpen) {
  //     // document.addEventListener('keydown', handleEscKey);
  //
  //     // Lock body scroll and preserve position
  //     const scrollY = window.scrollY;
  //     document.body.style.position = 'fixed';
  //     document.body.style.top = `-${scrollY}px`;
  //     document.body.style.width = '100%';
  //     document.body.style.overflow = 'hidden';
  //   }
  //
  //   return () => {
  //     // document.removeEventListener('keydown', handleEscKey);
  //
  //     // Restore body scroll and position
  //     if (isOpen) {
  //       document.body.style.position = '';
  //       document.body.style.top = '';
  //       document.body.style.width = '';
  //       document.body.style.overflow = '';
  //
  //       // Restore scroll position
  //       document.body.scrollTop = scrollPosition;
  //     }
  //   };
  // }, [isOpen, onClose, scrollPosition]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className={s.drawerOverlay} onClick={handleOverlayClick} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
          <motion.div className={s.drawerContainer} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: 'easeOut' }}>
            {/* Header */}
            <div className={s.drawerHeader}>
              <div className={s.breadcrumbs}>
                <button className={s.backButton} onClick={editView ? handleBackToView : onClose}>
                  <BackIcon />
                  <span>Back</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className={s.drawerContent}>
              <div
                className={clsx(s.root, {
                  [s.editView]: editView,
                })}
              >
                {/* Conditional Top Section */}
                {editView ? (
                  <EditProfileForm onClose={handleFormClose} userInfo={userInfo} />
                ) : (
                  /* Profile Header */
                  <div className={s.drawerProfileHeader}>
                    <div className={s.drawerProfileImage} />
                    <div className={s.drawerMemberDetails}>
                      <div className={s.drawerMemberInfo}>
                        <div className={s.drawerTitleContainer}>
                          <h2 className={s.drawerMemberName}>
                            {data?.team.name}
                            <Link className={s.externalLinkIcon} href={`/teams/${data?.team.uid}`} target="_blank">
                              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M13.5 4.5L4.5 13.5M13.5 4.5H8.25M13.5 4.5V9.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </Link>
                          </h2>

                          <button className={s.drawerEditButton} onClick={handleEditClick}>
                            <EditIcon />
                            <span>Edit</span>
                          </button>
                        </div>
                        <p className={s.drawerMemberDescription}>{data?.team.shortDescription}</p>
                      </div>
                      <div className={s.drawerTagList}>
                        <div className={s.drawerStageTag}>Stage: {data?.team?.fundingStage.title}</div>
                        <div className={s.drawerTagDivider} />
                        {data?.team.industryTags.map((tag) => (
                          <div className={s.drawerTag} key={tag.uid}>
                            {tag.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Team Members Section - Always Visible */}
              <div className={s.teamMembersSection}>
                <h3 className={s.sectionTitle}>Founders</h3>
                <div className={s.memberRow}>
                  <div className={s.memberAvatar} />
                  <div className={s.memberInfo}>
                    <div className={s.memberNameRole}>
                      <h4 className={s.memberName}>Eric Watson</h4>
                      <p className={s.memberRole}>Co-Founder & CEO</p>
                    </div>
                    <p className={s.memberStatus}>Available to connect</p>
                  </div>
                  <div className={s.memberBadges}>
                    <span className={s.memberBadge}>Management</span>
                    <span className={s.memberBadge}>Operations</span>
                    <span className={s.memberBadge}>Marketing</span>
                  </div>
                  <button className={s.memberArrow}>
                    <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
                      <path d="M9.5 2.5L14 7L9.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Warning Section - Always Visible */}
              <div className={s.warningSection}>
                <div className={s.warningContent}>
                  <WarningIcon />
                  <p className={s.warningText}>To participate in Demo Day, you must upload all Demo Day Materials. Profiles without these will not be shown to investors.</p>
                </div>
              </div>

              {/* Demo Day Materials - Always Visible */}
              <DemoMaterials existingPitchDeck={data?.onePagerUpload} existingVideo={data?.videoUpload} />
            </div>

            {/* Footer - Always Visible */}
            <div className={s.drawerFooter}>{/* Empty footer with border */}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
