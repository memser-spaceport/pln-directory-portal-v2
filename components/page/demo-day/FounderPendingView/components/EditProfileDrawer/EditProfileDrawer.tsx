import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EditProfileForm } from '../EditProfileForm';
import { DemoMaterials } from '../DemoMaterials';
import { SuccessAlert } from '../SuccessAlert';
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
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const successAlertTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<FundraisingProfile | undefined>(data);

  const handleEditClick = () => {
    setEditView(true);
    // Hide success alert when entering edit mode
    setShowSuccessAlert(false);
    if (successAlertTimeoutRef.current) {
      clearTimeout(successAlertTimeoutRef.current);
    }
  };

  const handleBackToView = () => {
    setEditView(false);
  };

  const handleFormClose = () => {
    setEditView(false);
  };

  // Reset edit mode and hide alert when drawer closes
  React.useEffect(() => {
    if (!isOpen) {
      setEditView(false);
      setShowSuccessAlert(false);
      if (successAlertTimeoutRef.current) {
        clearTimeout(successAlertTimeoutRef.current);
      }
    }
  }, [isOpen]);

  // Check if both files are uploaded and show success alert
  useEffect(() => {
    const previousData = previousDataRef.current;
    const currentData = data;

    // Only show alert if drawer is open and not in edit view
    if (!isOpen || editView) {
      // Update reference even when not showing alert
      previousDataRef.current = currentData;
      return;
    }

    // Only check for completion if we have previous data to compare against
    if (previousData) {
      // Check if we just completed both uploads
      const hadBothFilesBefore = previousData.onePagerUpload && previousData.videoUpload;
      const hasBothFilesNow = currentData?.onePagerUpload && currentData?.videoUpload;

      // Show success alert if we didn't have both files before but do now
      if (!hadBothFilesBefore && hasBothFilesNow) {
        setShowSuccessAlert(true);

        // Clear any existing timeout
        if (successAlertTimeoutRef.current) {
          clearTimeout(successAlertTimeoutRef.current);
        }

        // Hide alert after 10 seconds
        successAlertTimeoutRef.current = setTimeout(() => {
          setShowSuccessAlert(false);
        }, 10000);
      }
    }

    // Update previous data reference
    previousDataRef.current = currentData;
  }, [data, isOpen, editView]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successAlertTimeoutRef.current) {
        clearTimeout(successAlertTimeoutRef.current);
      }
    };
  }, []);

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

  const handleCloseSuccessAlert = () => {
    setShowSuccessAlert(false);
    if (successAlertTimeoutRef.current) {
      clearTimeout(successAlertTimeoutRef.current);
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
                {/* Success Alert */}
                <SuccessAlert isVisible={showSuccessAlert} onClose={handleCloseSuccessAlert} message="Thanks for the submission! You are all set." />

                {/* Conditional Top Section */}
                {editView ? (
                  <EditProfileForm onClose={handleFormClose} userInfo={userInfo} />
                ) : (
                  /* Profile Header */
                  <div className={s.drawerProfileHeader}>
                    <div className={s.drawerProfileImage}>
                      <img src={data?.team?.logo?.url || '/images/demo-day/profile-placeholder.svg'} alt={data?.team?.name || 'Team Logo'} />
                    </div>
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
                {data?.founders?.map((item) => (
                  <div className={s.memberRow} key={item.uid}>
                    <div className={s.memberAvatar}>
                      <img src={item.image?.url || '/images/demo-day/profile-placeholder.svg'} alt={item.name} />
                    </div>
                    <div className={s.memberInfo}>
                      <div className={s.memberNameRole}>
                        <h4 className={s.memberName}>{item.name}</h4>
                        <p className={s.memberRole}>{item.role}</p>
                      </div>
                      {item.officeHours && <p className={s.memberStatus}>Available to connect</p>}
                    </div>
                    <div className={s.memberBadges}>
                      {item.skills.map((skill) => (
                        <span className={s.memberBadge} key={skill.uid}>
                          {skill.title}
                        </span>
                      ))}
                    </div>
                    <Link href={`/members/${item.uid}`} target="_blank" className={s.memberArrow}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M11.354 8.35354L6.35403 13.3535C6.30757 13.4 6.25242 13.4368 6.19173 13.462C6.13103 13.4871 6.06598 13.5001 6.00028 13.5001C5.93458 13.5001 5.86953 13.4871 5.80883 13.462C5.74813 13.4368 5.69298 13.4 5.64653 13.3535C5.60007 13.3071 5.56322 13.2519 5.53808 13.1912C5.51294 13.1305 5.5 13.0655 5.5 12.9998C5.5 12.9341 5.51294 12.869 5.53808 12.8083C5.56322 12.7476 5.60007 12.6925 5.64653 12.646L10.2934 7.99979L5.64653 3.35354C5.55271 3.25972 5.5 3.13247 5.5 2.99979C5.5 2.86711 5.55271 2.73986 5.64653 2.64604C5.74035 2.55222 5.8676 2.49951 6.00028 2.49951C6.13296 2.49951 6.26021 2.55222 6.35403 2.64604L11.354 7.64604C11.4005 7.69248 11.4374 7.74762 11.4626 7.80832C11.4877 7.86902 11.5007 7.93408 11.5007 7.99979C11.5007 8.0655 11.4877 8.13056 11.4626 8.19126C11.4374 8.25196 11.4005 8.3071 11.354 8.35354Z"
                          fill="#455468"
                        />
                      </svg>
                    </Link>
                  </div>
                ))}
              </div>

              {(!data?.onePagerUpload || !data?.videoUpload) && (
                <div className={s.warningSection}>
                  <div className={s.warningContent}>
                    <WarningIcon />
                    <p className={s.warningText}>To participate in Demo Day, you must upload all Demo Day Materials. Profiles without these will not be shown to investors.</p>
                  </div>
                </div>
              )}

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
