import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EditProfileForm } from '../EditProfileForm';
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

const FolderIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M21.5057 4.75428V14.0743C21.5057 14.6609 21.0301 15.1363 20.4436 15.1363H3.55659C2.97016 15.1363 2.49463 14.6609 2.49463 14.0743V2.75385C2.49463 2.16732 2.97016 1.69189 3.55659 1.69189H9.72823C10.4811 1.69189 11.1844 2.06693 11.6038 2.69216C12.0233 3.31717 12.7266 3.69243 13.4794 3.69243H20.4436C21.0301 3.69243 21.5057 4.16785 21.5057 4.75439V4.75428Z"
      fill="url(#paint0_linear_7395_157695)"
    />
    <path
      d="M21.5057 4.75428V14.0743C21.5057 14.6609 21.0301 15.1363 20.4436 15.1363H3.55659C2.97016 15.1363 2.49463 14.6609 2.49463 14.0743V2.75385C2.49463 2.16732 2.97016 1.69189 3.55659 1.69189H9.72823C10.4811 1.69189 11.1844 2.06693 11.6038 2.69216C12.0233 3.31717 12.7266 3.69243 13.4794 3.69243H20.4436C21.0301 3.69243 21.5057 4.16785 21.5057 4.75439V4.75428Z"
      fill="url(#paint1_linear_7395_157695)"
    />
    <g style={{ mixBlendMode: 'multiply' }}>
      <path d="M5.37298 4.40381H19.856C20.3677 4.40381 20.7832 4.81931 20.7832 5.33099V9.27213H4.4458V5.33099C4.4458 4.81931 4.8613 4.40381 5.37298 4.40381Z" fill="#E6E6E6" />
    </g>
    <path d="M4.98244 4.65869H19.7369C20.1737 4.65869 20.5283 5.01338 20.5283 5.4501V9.27194H4.19092V5.4501C4.19092 5.01327 4.5456 4.65869 4.98233 4.65869H4.98244Z" fill="#E6E6E6" />
    <g style={{ mixBlendMode: 'multiply' }}>
      <path d="M4.59466 5.18213H19.0777C19.5894 5.18213 20.0049 5.59763 20.0049 6.10931V9.79549H3.66748V6.10931C3.66748 5.59763 4.08298 5.18213 4.59466 5.18213Z" fill="#E6E6E6" />
    </g>
    <path d="M4.20412 5.43701H18.9586C19.3954 5.43701 19.75 5.7917 19.75 6.22842V10.0503H3.4126V6.22842C3.4126 5.79159 3.76728 5.43701 4.20401 5.43701H4.20412Z" fill="white" />
    <path
      d="M23.2472 10.4102L22.4607 21.3223C22.4586 21.3524 22.4551 21.3821 22.4505 21.4114C22.3703 21.9232 21.9282 22.308 21.4016 22.308H2.61887C2.05809 22.308 1.59394 21.8719 1.5589 21.3122L0.752115 8.39956C0.71386 7.78815 1.19945 7.27148 1.81197 7.27148H9.52575C10.2786 7.27148 10.9819 7.64651 11.4013 8.27175C11.8208 8.89699 12.5242 9.27202 13.2769 9.27202H22.1879C22.8045 9.27202 23.2914 9.79531 23.2472 10.4104V10.4102Z"
      fill="url(#paint2_linear_7395_157695)"
    />
    <defs>
      <linearGradient id="paint0_linear_7395_157695" x1="12.0002" y1="15.1363" x2="12.0002" y2="1.69189" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FA842A" />
        <stop offset="1" stopColor="#FAC03E" />
      </linearGradient>
      <linearGradient id="paint1_linear_7395_157695" x1="12.0002" y1="15.1364" x2="12.0002" y2="1.6918" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1B4DFF" />
        <stop offset="1" stopColor="#5177FF" />
      </linearGradient>
      <linearGradient id="paint2_linear_7395_157695" x1="12" y1="22.3081" x2="12" y2="7.27137" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1B4DFF" />
        <stop offset="1" stopColor="#5177FF" />
      </linearGradient>
    </defs>
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
  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);

      // Lock body scroll and preserve position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);

      // Restore body scroll and position
      if (isOpen) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';

        // Restore scroll position
        window.scrollTo(0, scrollPosition);
      }
    };
  }, [isOpen, onClose, scrollPosition]);

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
              <div className={s.demoMaterialsSection}>
                <h3 className={s.sectionTitle}>Demo Day Materials</h3>
                <div className={s.materialsContainer}>
                  <div className={s.materialUpload}>
                    <div className={s.uploadArea}>
                      <div className={s.uploadIcon}>
                        <FolderIcon />
                      </div>
                      <div className={s.uploadText}>
                        <h4>Drag & Drop or Upload Your Pitch Deck</h4>
                        <p>Accepted format: PDF, max 1 slide only, up to 5MB.</p>
                      </div>
                      <button className={s.browseButton}>Browse</button>
                    </div>
                  </div>
                  <div className={s.materialUpload}>
                    <div className={s.uploadArea}>
                      <div className={s.uploadIcon}>
                        <FolderIcon />
                      </div>
                      <div className={s.uploadText}>
                        <h4>Drag & Drop or Upload Your Pitch Video</h4>
                        <p>Supported: MP4, MOV, WebM. Max 500 MB. Max X min.</p>
                      </div>
                      <button className={s.browseButton}>Browse</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Always Visible */}
            <div className={s.drawerFooter}>{/* Empty footer with border */}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
