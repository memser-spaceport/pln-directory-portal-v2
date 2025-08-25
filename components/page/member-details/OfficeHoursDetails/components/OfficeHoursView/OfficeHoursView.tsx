'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { EditButton } from '@/components/page/member-details/components/EditButton';
import { OfficeHoursDialog } from '@/components/page/member-details/OfficeHoursDetails/components/OfficeHoursDialog';
import { useGetMemberPreferences } from '@/services/members/hooks/useGetMemberPreferences';

import s from './OfficeHoursView.module.scss';
import { InvalidOfficeHoursLinkDialog } from '@/components/page/member-details/OfficeHoursDetails/components/InvalidOfficeHoursLinkDialog';
import { useReportBrokenOfficeHours } from '@/services/members/hooks/useReportBrokenOfficeHours';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo, getParsedValue, triggerLoader, normalizeOfficeHoursUrl } from '@/utils/common.utils';
import { useCreateFollowUp } from '@/services/members/hooks/useCreateFollowUp';
import Cookies from 'js-cookie';
import { getFollowUps } from '@/services/office-hours.service';
import { EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import { toast } from 'react-toastify';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
  isEditable: boolean;
  showIncomplete: boolean;
  onEdit: () => void;
  isOfficeHoursValid: boolean;
}

export const OfficeHoursView = ({ member, isLoggedIn, userInfo, isEditable, showIncomplete, onEdit, isOfficeHoursValid }: Props) => {
  const [showDialog, setShowDialog] = useState(false);
  const [showInvalidLinkDialog, setShowInvalidLinkDialog] = useState(false);
  const isOwner = userInfo?.uid === member.id;
  const hasOfficeHours = !!member.officeHours;
  const hasInterestedIn = !!member.ohInterest?.length;
  const hasCanHelpWith = !!member.ohHelpWith?.length;
  const showPastBookings = !!member?.scheduleMeetingCount && member.scheduleMeetingCount > 5;
  const showAlert = !isOfficeHoursValid && isOwner;
  const showWarning = !showAlert && showIncomplete;
  const showAddButton = !hasOfficeHours && !showAlert && isEditable;
  const showUpdateButton = isEditable && !showAlert && hasOfficeHours && (!hasInterestedIn || !hasCanHelpWith);
  const showAlertUpdateButton = showAlert && isEditable;
  const { onAddOfficeHourClicked, onEditOfficeHourClicked, onOfficeHourClicked } = useMemberAnalytics();
  const { mutateAsync: createFollowUp, data } = useCreateFollowUp();
  const { mutate: reportBrokenLink } = useReportBrokenOfficeHours();
  const { data: memberPreferences } = useGetMemberPreferences(userInfo?.uid);
  const shouldShowDialog = memberPreferences?.memberPreferences?.showOfficeHoursDialog !== false;

  const handleScheduleMeeting = () => {
    if (!hasOfficeHours) return;

    onOfficeHourClicked(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member));

    if (!isOfficeHoursValid) {
      setShowInvalidLinkDialog(true);
      reportBrokenLink({ memberId: member.id });
      return;
    }

    if (shouldShowDialog) {
      setShowDialog(true);
    } else {
      openOfficeHoursLink();
    }
  };

  const openOfficeHoursLink = async () => {
    if (!userInfo.uid || !member.officeHours) {
      return;
    }

    const authToken = Cookies.get('authToken') || '';

    const res = await createFollowUp({
      logInMemberUid: userInfo.uid,
      authToken: getParsedValue(authToken),
      data: {
        data: {},
        hasFollowUp: true,
        type: 'SCHEDULE_MEETING',
        targetMemberUid: member.id,
      },
    });

    if (res?.error) {
      if (res?.error?.data?.message?.includes('yourself is forbidden')) {
        toast.error(TOAST_MESSAGES.SELF_INTERACTION_FORBIDDEN);
      }

      if (res?.error?.data?.message?.includes('Interaction with same user within 30 minutes is forbidden')) {
        toast.error(TOAST_MESSAGES.INTERACTION_RESTRICTED);
      }

      return;
    }

    // Normalize URL - add https:// if no protocol is provided
    const normalizedOfficeHoursUrl = normalizeOfficeHoursUrl(member.officeHours);

    window.open(normalizedOfficeHoursUrl, '_blank');

    const allFollowups = await getFollowUps(userInfo.uid ?? '', getParsedValue(authToken), 'PENDING,CLOSED');

    if (!allFollowups?.error) {
      const result = allFollowups?.data ?? [];

      if (result.length > 0) {
        document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_RATING_POPUP, { detail: { notification: result[0] } }));
        document.dispatchEvent(new CustomEvent(EVENTS.GET_NOTIFICATIONS, { detail: { status: true, isShowPopup: false } }));
      }
    }
  };

  const handleDialogContinue = () => {
    setShowDialog(false);
    openOfficeHoursLink();
  };

  function getDesc() {
    if (!hasOfficeHours) {
      return 'OH are short 15min 1:1 calls to connect about topics of interest or help others with your expertise. Share your calendar. You will also access other members OH';
    }

    if (hasOfficeHours) {
      return (
        <>
          {member.name} is available for a short 1:1 call to connect or help — no introduction needed.
          {(!!member?.ohInterest?.length || isEditable) && (
            <div className={s.keywordsWrapper}>
              <span className={s.keywordsLabel}>Topics of Interest:</span>
              <span className={s.badgesWrapper}>
                {member?.ohInterest?.length ? (
                  member?.ohInterest?.map((item) => (
                    <div key={item} className={s.badge}>
                      {item}
                    </div>
                  ))
                ) : (
                  <button
                    type="button"
                    className={s.addKeywordsBadge}
                    onClick={() => {
                      onEditOfficeHourClicked(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member));
                      onEdit();
                    }}
                  >
                    <AddIcon /> Add keywords
                  </button>
                )}
              </span>
            </div>
          )}
          {(!!member?.ohHelpWith?.length || isEditable) && (
            <div className={s.keywordsWrapper}>
              <span className={s.keywordsLabel}>I Can Help With:</span>
              <span className={s.badgesWrapper}>
                {member?.ohHelpWith?.length ? (
                  member?.ohHelpWith?.map((item) => (
                    <div key={item} className={s.badge}>
                      {item}
                    </div>
                  ))
                ) : (
                  <button
                    type="button"
                    className={s.addKeywordsBadge}
                    onClick={() => {
                      onEditOfficeHourClicked(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member));
                      onEdit();
                    }}
                  >
                    <AddIcon /> Add keywords
                  </button>
                )}
              </span>
            </div>
          )}
        </>
      );
    }
  }

  function getAlertMessage() {
    if (!hasOfficeHours) {
      return (
        <span className={s.warningMessageText}>
          <InfoIcon /> Make it easy for others in the network to connect with you — add your Office Hours link to enable quick 1:1 conversations.
        </span>
      );
    }

    return (
      <span className={s.alertMessageText}>
        <InfoIcon /> Add your expertise and interests to your office hours for more meaningful conversations.
      </span>
    );
  }

  return (
    <>
      {showAlert && (
        <div className={s.incompleteStripAlert}>
          <span>
            <AlertIcon />
          </span>{' '}
          The Office Hours link you added isn’t working. Update it to allow others to schedule 1:1 calls with you.
        </div>
      )}
      {showWarning && <div className={s.incompleteStrip}>{getAlertMessage()}</div>}
      <div
        className={clsx(s.root, {
          [s.missingData]: (showIncomplete || showAlert) && isLoggedIn,
        })}
      >
        <div className={s.header}>
          <h2 className={s.title}>Office Hours {isOwner && hasOfficeHours && <span className={s.titleHintLabel}>&#8226; Available to connect</span>}</h2>
          {isLoggedIn && isEditable && !showAlertUpdateButton && !showAddButton && (
            <EditButton
              onClick={() => {
                onEditOfficeHourClicked(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member));
                onEdit();
              }}
            />
          )}
        </div>

        <div className={s.content}>
          <div className={s.officeHoursSection}>
            <div className={s.col}>
              <div className={s.description}>{getDesc()}</div>
            </div>
            {hasOfficeHours && !showAlert && !isOwner && (
              <div className={s.primaryButtonWrapper}>
                <button className={s.primaryButton} disabled={!hasOfficeHours} onClick={handleScheduleMeeting}>
                  Schedule Meeting
                </button>
                {showPastBookings && <span className={s.subtext}>12 past bookings</span>}
              </div>
            )}
            {showAddButton && (
              <button
                className={s.primaryButton}
                onClick={() => {
                  onAddOfficeHourClicked(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member));
                  onEdit();
                }}
              >
                Add Office Hours <PlusIcon />
              </button>
            )}
            {showAlertUpdateButton && (
              <button
                className={clsx(s.primaryButton, s.alertButton)}
                onClick={() => {
                  onEditOfficeHourClicked(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member));
                  onEdit();
                }}
              >
                Update Office Hours
              </button>
            )}
          </div>
        </div>

        <OfficeHoursDialog isOpen={showDialog} onClose={() => setShowDialog(false)} onContinue={handleDialogContinue} userInfo={userInfo} />
        <InvalidOfficeHoursLinkDialog
          isOpen={showInvalidLinkDialog}
          onClose={() => setShowInvalidLinkDialog(false)}
          recipientName={member.name}
          recipientEmail={member.email}
          recipientTelegram={member.telegramHandle}
        />
      </div>
    </>
  );
};

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6.66667 5.83333V2.5V5.83333ZM13.3333 5.83333V2.5V5.83333ZM5.83333 9.16667H14.1667H5.83333ZM4.16667 17.5H15.8333C16.2754 17.5 16.6993 17.3244 17.0118 17.0118C17.3244 16.6993 17.5 16.2754 17.5 15.8333V5.83333C17.5 5.39131 17.3244 4.96738 17.0118 4.65482C16.6993 4.34226 16.2754 4.16667 15.8333 4.16667H4.16667C3.72464 4.16667 3.30072 4.34226 2.98816 4.65482C2.67559 4.96738 2.5 5.39131 2.5 5.83333V15.8333C2.5 16.2754 2.67559 16.6993 2.98816 17.0118C3.30072 17.3244 3.72464 17.5 4.16667 17.5Z"
      stroke="#1D4ED8"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ minWidth: 18 }}>
    <path
      d="M7.59375 5.90625C7.59375 5.68375 7.65973 5.46624 7.78335 5.28123C7.90697 5.09623 8.08267 4.95203 8.28823 4.86689C8.4938 4.78174 8.72 4.75946 8.93823 4.80287C9.15646 4.84627 9.35691 4.95342 9.51425 5.11075C9.67158 5.26809 9.77873 5.46854 9.82214 5.68677C9.86555 5.905 9.84327 6.1312 9.75812 6.33677C9.67297 6.54234 9.52878 6.71804 9.34377 6.84165C9.15876 6.96527 8.94126 7.03125 8.71875 7.03125C8.42038 7.03125 8.13424 6.91272 7.92326 6.70175C7.71228 6.49077 7.59375 6.20462 7.59375 5.90625ZM16.5938 9C16.5938 10.5019 16.1484 11.9701 15.314 13.2189C14.4796 14.4676 13.2936 15.441 11.906 16.0157C10.5184 16.5905 8.99158 16.7408 7.51854 16.4478C6.04549 16.1548 4.69242 15.4316 3.63041 14.3696C2.56841 13.3076 1.84517 11.9545 1.55217 10.4815C1.25916 9.00842 1.40954 7.48157 1.98429 6.094C2.55905 4.70642 3.53236 3.52044 4.78114 2.68603C6.02993 1.85162 7.4981 1.40625 9 1.40625C11.0133 1.40848 12.9435 2.20925 14.3671 3.63287C15.7907 5.0565 16.5915 6.9867 16.5938 9ZM14.9063 9C14.9063 7.83185 14.5599 6.68994 13.9109 5.71866C13.2619 4.74739 12.3395 3.99037 11.2602 3.54334C10.181 3.09631 8.99345 2.97934 7.84775 3.20724C6.70205 3.43513 5.64966 3.99765 4.82365 4.82365C3.99765 5.64965 3.43513 6.70205 3.20724 7.84775C2.97935 8.99345 3.09631 10.181 3.54334 11.2602C3.99037 12.3394 4.74739 13.2619 5.71867 13.9109C6.68994 14.5599 7.83186 14.9062 9 14.9062C10.5659 14.9046 12.0672 14.2818 13.1745 13.1745C14.2818 12.0672 14.9046 10.5659 14.9063 9ZM9.84375 11.5791V9.28125C9.84375 8.90829 9.69559 8.5506 9.43187 8.28688C9.16815 8.02316 8.81046 7.875 8.4375 7.875C8.23824 7.8747 8.04531 7.94494 7.89287 8.07326C7.74043 8.20158 7.63833 8.37972 7.60464 8.57611C7.57095 8.7725 7.60786 8.97447 7.70882 9.14626C7.80978 9.31805 7.96828 9.44857 8.15625 9.51469V11.8125C8.15625 12.1855 8.30441 12.5431 8.56813 12.8069C8.83186 13.0706 9.18954 13.2188 9.5625 13.2188C9.76176 13.219 9.9547 13.1488 10.1071 13.0205C10.2596 12.8922 10.3617 12.714 10.3954 12.5176C10.4291 12.3213 10.3921 12.1193 10.2912 11.9475C10.1902 11.7757 10.0317 11.6452 9.84375 11.5791Z"
      fill="currentColor"
    />
  </svg>
);

const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g>
      <path
        d="M18.0312 10C18.0312 10.2238 17.9424 10.4384 17.7841 10.5966C17.6259 10.7549 17.4113 10.8438 17.1875 10.8438H11.8438V16.1875C11.8438 16.4113 11.7549 16.6259 11.5966 16.7841C11.4384 16.9424 11.2238 17.0312 11 17.0312C10.7762 17.0312 10.5616 16.9424 10.4034 16.7841C10.2451 16.6259 10.1562 16.4113 10.1562 16.1875V10.8438H4.8125C4.58872 10.8438 4.37411 10.7549 4.21588 10.5966C4.05764 10.4384 3.96875 10.2238 3.96875 10C3.96875 9.77622 4.05764 9.56161 4.21588 9.40338C4.37411 9.24514 4.58872 9.15625 4.8125 9.15625H10.1562V3.8125C10.1562 3.58872 10.2451 3.37411 10.4034 3.21588C10.5616 3.05764 10.7762 2.96875 11 2.96875C11.2238 2.96875 11.4384 3.05764 11.5966 3.21588C11.7549 3.37411 11.8438 3.58872 11.8438 3.8125V9.15625H17.1875C17.4113 9.15625 17.6259 9.24514 17.7841 9.40338C17.9424 9.56161 18.0312 9.77622 18.0312 10Z"
        fill="white"
      />
    </g>
  </svg>
);

const AlertIcon = () => (
  <svg width="15" height="13" viewBox="0 0 15 13" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7.5 0.625C7.88281 0.625 8.23828 0.84375 8.42969 1.17188L14.3359 11.2344C14.5273 11.5898 14.5273 12 14.3359 12.3281C14.1445 12.6836 13.7891 12.875 13.4062 12.875H1.59375C1.18359 12.875 0.828125 12.6836 0.636719 12.3281C0.445312 12 0.445312 11.5898 0.636719 11.2344L6.54297 1.17188C6.73438 0.84375 7.08984 0.625 7.5 0.625ZM7.5 4.125C7.11719 4.125 6.84375 4.42578 6.84375 4.78125V7.84375C6.84375 8.22656 7.11719 8.5 7.5 8.5C7.85547 8.5 8.15625 8.22656 8.15625 7.84375V4.78125C8.15625 4.42578 7.85547 4.125 7.5 4.125ZM8.375 10.25C8.375 9.78516 7.96484 9.375 7.5 9.375C7.00781 9.375 6.625 9.78516 6.625 10.25C6.625 10.7422 7.00781 11.125 7.5 11.125C7.96484 11.125 8.375 10.7422 8.375 10.25Z"
      fill="#B45309"
    />
  </svg>
);

const AddIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 1.25C6.66498 1.25 5.35994 1.64588 4.2499 2.38758C3.13987 3.12928 2.27471 4.18349 1.76382 5.41689C1.25292 6.65029 1.11925 8.00749 1.3797 9.31686C1.64015 10.6262 2.28303 11.829 3.22703 12.773C4.17104 13.717 5.37377 14.3598 6.68314 14.6203C7.99251 14.8808 9.34971 14.7471 10.5831 14.2362C11.8165 13.7253 12.8707 12.8601 13.6124 11.7501C14.3541 10.6401 14.75 9.33502 14.75 8C14.748 6.2104 14.0362 4.49466 12.7708 3.22922C11.5053 1.96378 9.7896 1.25199 8 1.25ZM8 13.25C6.96165 13.25 5.94662 12.9421 5.08326 12.3652C4.2199 11.7883 3.547 10.9684 3.14964 10.0091C2.75228 9.04978 2.64831 7.99418 2.85088 6.97578C3.05345 5.95738 3.55347 5.02191 4.28769 4.28769C5.02192 3.55346 5.95738 3.05345 6.97578 2.85088C7.99418 2.6483 9.04978 2.75227 10.0091 3.14963C10.9684 3.54699 11.7883 4.2199 12.3652 5.08326C12.9421 5.94661 13.25 6.96165 13.25 8C13.2485 9.39193 12.6949 10.7264 11.7107 11.7107C10.7264 12.6949 9.39193 13.2485 8 13.25ZM11.25 8C11.25 8.19891 11.171 8.38968 11.0303 8.53033C10.8897 8.67098 10.6989 8.75 10.5 8.75H8.75V10.5C8.75 10.6989 8.67098 10.8897 8.53033 11.0303C8.38968 11.171 8.19892 11.25 8 11.25C7.80109 11.25 7.61032 11.171 7.46967 11.0303C7.32902 10.8897 7.25 10.6989 7.25 10.5V8.75H5.5C5.30109 8.75 5.11032 8.67098 4.96967 8.53033C4.82902 8.38968 4.75 8.19891 4.75 8C4.75 7.80109 4.82902 7.61032 4.96967 7.46967C5.11032 7.32902 5.30109 7.25 5.5 7.25H7.25V5.5C7.25 5.30109 7.32902 5.11032 7.46967 4.96967C7.61032 4.82902 7.80109 4.75 8 4.75C8.19892 4.75 8.38968 4.82902 8.53033 4.96967C8.67098 5.11032 8.75 5.30109 8.75 5.5V7.25H10.5C10.6989 7.25 10.8897 7.32902 11.0303 7.46967C11.171 7.61032 11.25 7.80109 11.25 8Z"
      fill="#D97706"
    />
  </svg>
);
