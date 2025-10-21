import React, { useState, useEffect, useRef } from 'react';
import { EditProfileForm } from '../EditProfileForm';
import { DemoMaterials } from '../DemoMaterials';
import { CompanyFundraiseParagraph } from '../CompanyFundraiseParagraph';
import { SuccessAlert } from '../SuccessAlert';
import s from './EditProfileDrawer.module.scss';
import { clsx } from 'clsx';
import { IUserInfo } from '@/types/shared.types';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { FundraisingProfile } from '@/services/demo-day/hooks/useGetFundraisingProfile';
import Link from 'next/link';
import { useIsPrepDemoDay } from '@/services/demo-day/hooks/useIsPrepDemoDay';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { ADMIN_ROLE, DEMO_DAY_ANALYTICS } from '@/utils/constants';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { useExpressInterest, InterestType } from '@/services/demo-day/hooks/useExpressInterest';
import Image from 'next/image';
import { Drawer } from '@/components/common/Drawer';
import { TeamProfile } from '@/services/demo-day/hooks/useGetTeamsList';
import { ReferCompanyModal } from '@/components/page/demo-day/ActiveView/components/TeamsList/components/ReferCompanyModal';

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

export interface DemoMaterialAnalyticsHandlers {
  onUploadStarted: (fileMetadata: any) => void;
  onUploadSuccess: (fileMetadata: any) => void;
  onUploadFailed: (fileMetadata: any, error: string) => void;
  onDeleted: (materialType: string, fileName: string) => void;
  onViewed: (materialType: string, fileName: string) => void;
}

interface EditProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  scrollPosition: number;
  data?: FundraisingProfile;
  hideActions?: boolean;
  team?: TeamProfile | null;
}

export const EditProfileDrawer: React.FC<EditProfileDrawerProps> = ({
  isOpen,
  onClose,
  scrollPosition,
  data,
  hideActions,
  team,
}) => {
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));
  const isDirectoryAdmin = userInfo?.roles?.includes(ADMIN_ROLE);
  const isPrepDemoDay = useIsPrepDemoDay();
  const [editView, setEditView] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const successAlertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Analytics hooks
  const {
    onFounderSaveTeamDetailsClicked,
    onFounderCancelTeamDetailsClicked,
    onFounderDemoMaterialUploadStarted,
    onFounderDemoMaterialUploadSuccess,
    onFounderDemoMaterialUploadFailed,
    onFounderDemoMaterialDeleted,
    onFounderDemoMaterialViewed,
    onFounderEditTeamProfileButtonClicked,
  } = useDemoDayAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();
  const expressInterest = useExpressInterest(data?.team?.name);
  const previousDataRef = useRef<FundraisingProfile | undefined>(data);

  const handleEditClick = () => {
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

    setEditView(true);
    // Hide success alert when entering edit mode
    setShowSuccessAlert(false);
    if (successAlertTimeoutRef.current) {
      clearTimeout(successAlertTimeoutRef.current);
    }
  };

  const handleBackToView = () => {
    if (userInfo?.email) {
      // PostHog analytics
      onFounderCancelTeamDetailsClicked();

      // Custom analytics event
      const cancelEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_FOUNDER_CANCEL_TEAM_DETAILS_CLICKED,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          teamName: data?.team?.name,
          teamUid: data?.teamUid,
          action: 'back_to_view',
        },
      };

      reportAnalytics.mutate(cancelEvent);
    }

    setEditView(false);
  };

  const handleFormClose = (saved = false) => {
    if (userInfo?.email && saved) {
      // PostHog analytics
      onFounderSaveTeamDetailsClicked();

      // Custom analytics event
      const saveEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_FOUNDER_SAVE_TEAM_DETAILS_CLICKED,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          teamName: data?.team?.name,
          teamUid: data?.teamUid,
        },
      };

      reportAnalytics.mutate(saveEvent);
    }

    setEditView(false);
  };

  // Reset edit mode and hide alert when drawer closes
  useEffect(() => {
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

        // Report team profile ready analytics
        if (userInfo?.email) {
          const teamProfileReadyEvent: TrackEventDto = {
            name: DEMO_DAY_ANALYTICS.ON_TEAM_PROFILE_READY,
            distinctId: userInfo.email,
            properties: {
              userId: userInfo.uid,
              userEmail: userInfo.email,
              userName: userInfo.name,
              path: '/demoday',
              timestamp: new Date().toISOString(),
              teamId: data?.team?.uid,
              teamName: data?.team?.name,
              hasOnePager: !!currentData?.onePagerUpload,
              hasVideo: !!currentData?.videoUpload,
            },
          };

          reportAnalytics.mutate(teamProfileReadyEvent);
        }

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
  }, [data, isOpen, editView, reportAnalytics, userInfo.email, userInfo.name, userInfo.uid]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successAlertTimeoutRef.current) {
        clearTimeout(successAlertTimeoutRef.current);
      }
    };
  }, []);

  const handleCloseSuccessAlert = () => {
    setShowSuccessAlert(false);
    if (successAlertTimeoutRef.current) {
      clearTimeout(successAlertTimeoutRef.current);
    }
  };

  // Analytics helper functions for demo materials
  const handleDemoMaterialUploadStarted = (fileMetadata: any) => {
    if (userInfo?.email) {
      onFounderDemoMaterialUploadStarted(fileMetadata);

      const uploadStartedEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_FOUNDER_DEMO_MATERIAL_UPLOAD_STARTED,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          teamName: data?.team?.name,
          teamUid: data?.teamUid,
          fileName: fileMetadata.fileName,
          fileSize: fileMetadata.fileSize,
          fileType: fileMetadata.fileType,
          materialType: fileMetadata.materialType, // 'onePager' or 'video'
        },
      };

      reportAnalytics.mutate(uploadStartedEvent);
    }
  };

  const handleDemoMaterialUploadSuccess = (fileMetadata: any) => {
    if (userInfo?.email) {
      onFounderDemoMaterialUploadSuccess(fileMetadata);

      const uploadSuccessEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_FOUNDER_DEMO_MATERIAL_UPLOAD_SUCCESS,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          teamName: data?.team?.name,
          teamUid: data?.teamUid,
          fileName: fileMetadata.fileName,
          fileSize: fileMetadata.fileSize,
          fileType: fileMetadata.fileType,
          materialType: fileMetadata.materialType,
          uploadDuration: fileMetadata.uploadDuration,
        },
      };

      reportAnalytics.mutate(uploadSuccessEvent);
    }
  };

  const handleDemoMaterialUploadFailed = (fileMetadata: any, error: string) => {
    if (userInfo?.email) {
      onFounderDemoMaterialUploadFailed({ ...fileMetadata, error });

      const uploadFailedEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_FOUNDER_DEMO_MATERIAL_UPLOAD_FAILED,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          teamName: data?.team?.name,
          teamUid: data?.teamUid,
          fileName: fileMetadata.fileName,
          fileSize: fileMetadata.fileSize,
          fileType: fileMetadata.fileType,
          materialType: fileMetadata.materialType,
          error: error,
        },
      };

      reportAnalytics.mutate(uploadFailedEvent);
    }
  };

  const handleDemoMaterialDeleted = (materialType: string, fileName: string) => {
    if (userInfo?.email) {
      onFounderDemoMaterialDeleted({ materialType, fileName });

      const deletedEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_FOUNDER_DEMO_MATERIAL_DELETED,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          teamName: data?.team?.name,
          teamUid: data?.teamUid,
          materialType: materialType,
          fileName: fileName,
        },
      };

      reportAnalytics.mutate(deletedEvent);
    }
  };

  const handleDemoMaterialViewed = (materialType: string, fileName: string) => {
    if (userInfo?.email) {
      onFounderDemoMaterialViewed({ materialType, fileName });

      const viewedEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_FOUNDER_DEMO_MATERIAL_VIEWED,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          teamName: data?.team?.name,
          teamUid: data?.teamUid,
          materialType: materialType,
          fileName: fileName,
        },
      };

      reportAnalytics.mutate(viewedEvent);
    }
  };

  const handleReferSubmit = (referralData: { investorName: string; investorEmail: string; message: string }) => {
    if (data?.uid) {
      expressInterest.mutate(
        {
          teamFundraisingProfileUid: data.uid,
          interestType: 'referral',
          isPrepDemoDay,
          referralData,
        },
        {
          onSuccess: () => {
            setIsReferModalOpen(false);
          },
        },
      );
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
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
          <SuccessAlert
            isVisible={showSuccessAlert}
            onClose={handleCloseSuccessAlert}
            message="Thanks for the submission! You are all set."
          />

          {/* Conditional Top Section */}
          {editView ? (
            <EditProfileForm onClose={handleFormClose} userInfo={userInfo} profileData={data} />
          ) : (
            /* Profile Header */
            <div className={s.drawerProfileHeader}>
              <div className={s.drawerProfileImage}>
                <img
                  src={
                    data?.team?.logo?.url ||
                    getDefaultAvatar(data?.team?.name) ||
                    '/images/demo-day/profile-placeholder.svg'
                  }
                  alt={data?.team?.name || 'Team Logo'}
                />
              </div>
              <div className={s.drawerMemberDetails}>
                <div className={s.drawerMemberInfo}>
                  <div className={s.drawerTitleContainer}>
                    <h2 className={s.drawerMemberName}>
                      {data?.team.name}
                      <Link className={s.externalLinkIcon} href={`/teams/${data?.team.uid}`} target="_blank">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path
                            d="M13.5 4.5L4.5 13.5M13.5 4.5H8.25M13.5 4.5V9.75"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
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
                  <div className={s.drawerStageTag}>Stage: {data?.team?.fundingStage?.title}</div>
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
                <img
                  src={item.image?.url || getDefaultAvatar(item.name) || '/images/demo-day/profile-placeholder.svg'}
                  alt={item.name}
                />
              </div>
              <div className={s.memberInfo}>
                <div className={s.memberNameRole}>
                  <h4 className={s.memberName}>{item.name}</h4>
                  <p className={s.memberRole}>{item.role}</p>
                </div>
                {item.officeHours && <p className={s.memberStatus}>Available to connect</p>}
              </div>
              <div className={s.memberBadges}>
                {item.skills.slice(0, 3).map((skill) => (
                  <span className={s.memberBadge} key={skill.uid}>
                    {skill.title}
                  </span>
                ))}
                {item.skills.length > 3 && (
                  <Tooltip
                    asChild
                    trigger={<span className={s.memberBadge}>+{item.skills.length - 3}</span>}
                    content={
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {item.skills.slice(3).map((skill) => (
                          <div key={skill.uid}>{skill.title}</div>
                        ))}
                      </div>
                    }
                  />
                )}
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
              <p className={s.warningText}>
                To participate in Demo Day, you must upload all Demo Day Materials. Profiles without these will not be
                shown to investors.
              </p>
            </div>
          </div>
        )}

        {/* Demo Day Materials - Always Visible */}
        <DemoMaterials
          existingPitchDeck={data?.onePagerUpload}
          existingVideo={data?.videoUpload}
          analyticsHandlers={{
            onUploadStarted: handleDemoMaterialUploadStarted,
            onUploadSuccess: handleDemoMaterialUploadSuccess,
            onUploadFailed: handleDemoMaterialUploadFailed,
            onDeleted: handleDemoMaterialDeleted,
            onViewed: handleDemoMaterialViewed,
          }}
          companyFundraiseParagraph={
            <CompanyFundraiseParagraph
              paragraph={data?.description}
              editable={true}
              teamUid={isDirectoryAdmin ? data?.teamUid : undefined}
            />
          }
          teamUid={isDirectoryAdmin ? data?.teamUid : undefined}
        />
      </div>

      {/* Footer - Always Visible */}
      {!hideActions && (
        <div className={s.drawerFooter}>
          <button
            className={s.secondaryButton}
            onClick={() => setIsReferModalOpen(true)}
            disabled={expressInterest.isPending || !data?.uid}
          >
            {team?.referral ? (
              <>
                ✉️ Sent intro
                <CheckIcon />
              </>
            ) : (
              <>✉️ Send intro</>
            )}
          </button>
          <button
            className={s.secondaryButton}
            onClick={() =>
              expressInterest.mutate({
                teamFundraisingProfileUid: data?.uid || '',
                interestType: 'like',
                isPrepDemoDay,
              })
            }
            disabled={expressInterest.isPending || !data?.uid}
          >
            {team?.liked ? (
              <>
                <Image src="/images/demo-day/heart.png" alt="Like" width={16} height={16} /> Liked Company
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
                teamFundraisingProfileUid: data?.uid || '',
                interestType: 'connect',
                isPrepDemoDay,
              })
            }
            disabled={expressInterest.isPending || !data?.uid}
          >
            {team?.connected ? (
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
                teamFundraisingProfileUid: data?.uid || '',
                interestType: 'invest',
                isPrepDemoDay,
              })
            }
            disabled={expressInterest.isPending || !data?.uid}
          >
            {team?.invested ? (
              <>
                💰 Invested in Company
                <CheckIcon />
              </>
            ) : (
              <>💰 Invest in Company</>
            )}
          </button>
        </div>
      )}

      {/* Refer Company Modal */}
      <ReferCompanyModal
        isOpen={isReferModalOpen}
        onClose={() => setIsReferModalOpen(false)}
        onSubmit={handleReferSubmit}
        teamName={data?.team?.name || ''}
        isSubmitting={expressInterest.isPending}
      />
    </Drawer>
  );
};
