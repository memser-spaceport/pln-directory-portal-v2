'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { EditButton } from '@/components/page/member-details/components/EditButton';
import { OfficeHoursDialog } from '@/components/page/member-details/OfficeHoursDetails/components/OfficeHoursDialog';
import { useGetMemberPreferences } from '@/services/members/hooks/useGetMemberPreferences';

import s from './OfficeHoursView.module.scss';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
  isEditable: boolean;
  showIncomplete: boolean;
  onEdit: () => void;
}

export const OfficeHoursView = ({ member, isLoggedIn, userInfo, isEditable, showIncomplete, onEdit }: Props) => {
  const [showDialog, setShowDialog] = useState(false);
  const hasOfficeHours = !!member.officeHours;
  const hasInterestedIn = !!member.officeHoursInterestedIn;
  const hasCanHelpWith = !!member.officeHoursCanHelpWith;

  const { data: memberPreferences } = useGetMemberPreferences(userInfo?.uid);
  const shouldShowDialog = memberPreferences?.memberPreferences?.showOfficeHoursDialog !== false;

  const handleScheduleMeeting = () => {
    if (!hasOfficeHours) return;

    if (shouldShowDialog) {
      setShowDialog(true);
    } else {
      openOfficeHoursLink();
    }
  };

  const openOfficeHoursLink = () => {
    if (member.officeHours) {
      window.open(member.officeHours, '_blank');
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
          {hasInterestedIn && (
            <div>
              <div className={s.keywordsLabel}>Topics of Interest:</div>
              <div className={s.badgesWrapper}>
                {member?.officeHoursInterestedIn?.map((item) => (
                  <div key={item} className={s.badge}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
          {hasCanHelpWith && (
            <div>
              <div className={s.keywordsLabel}>Areas I Can Help With:</div>
              <div className={s.badgesWrapper}>
                {member?.officeHoursCanHelpWith?.map((item) => (
                  <div key={item} className={s.badge}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      );
    }
  }

  return (
    <>
      {showIncomplete && (
        <div className={s.incompleteStrip}>
          <InfoIcon /> Make it easy for others in the network to connect with you — add your Office Hours link to enable quick 1:1 chats.
        </div>
      )}
      <div
        className={clsx(s.root, {
          [s.missingData]: showIncomplete && isLoggedIn,
        })}
      >
        <div className={s.header}>
          <h2 className={s.title}>Office Hours</h2>
          {isLoggedIn && isEditable && <EditButton onClick={onEdit} />}
        </div>

        <div className={s.content}>
          <div className={s.officeHoursSection}>
            <div className={s.calendarIconWrapper}>
              <CalendarIcon />
            </div>
            <div className={s.col}>
              <h3 className={s.subTitle}>Office Hours</h3>
              <p>{getDesc()}</p>
            </div>
            {!showIncomplete && (
              <button className={s.primaryButton} disabled={!hasOfficeHours} onClick={handleScheduleMeeting}>
                Schedule Meeting
              </button>
            )}
            {showIncomplete && (
              <button className={s.primaryButton} onClick={onEdit}>
                Add Office Hours <PlusIcon />
              </button>
            )}
          </div>
        </div>

        <OfficeHoursDialog isOpen={showDialog} onClose={() => setShowDialog(false)} onContinue={handleDialogContinue} userInfo={userInfo} />
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
      fill="#1B4DFF"
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
