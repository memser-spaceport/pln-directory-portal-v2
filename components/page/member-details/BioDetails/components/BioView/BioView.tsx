'use client';

import React from 'react';
import { clsx } from 'clsx';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { EditButton } from '@/components/page/member-details/components/EditButton';

import s from './BioView.module.scss';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
  isEditable: boolean;
  showIncomplete: boolean;
  onEdit: () => void;
  onGenerateBio: () => void;
}

export const BioView = ({ member, isLoggedIn, userInfo, isEditable, showIncomplete, onEdit, onGenerateBio }: Props) => {
  const hasBio = !!member.bio;

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h2 className={s.title}>Bio</h2>
        {isLoggedIn && isEditable && <EditButton onClick={onEdit} />}
      </div>

      <div className={clsx(s.content)}>
        {hasBio && member.bio ? (
          <div className={s.bioContent} dangerouslySetInnerHTML={{ __html: member.bio }} />
        ) : (
          <div className={s.officeHoursSection}>
            <div className={s.col}>
              <p>Tell others who you are, what you’re working on, and what you’re looking to connect around.</p>
            </div>
            {isEditable && (
              <button className={s.primaryButton} onClick={onEdit}>
                Gen Bio with AI <AiIcon />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AiIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_8852_536)">
      <path
        d="M15.9923 9.81086L12.4844 8.51852L11.1892 5.00781C11.0901 4.73906 10.911 4.50716 10.676 4.34336C10.441 4.17955 10.1615 4.09173 9.87506 4.09173C9.58863 4.09173 9.30908 4.17955 9.0741 4.34336C8.83912 4.50716 8.66001 4.73906 8.56092 5.00781L7.26858 8.51852L3.75788 9.81086C3.48913 9.90995 3.25722 10.0891 3.09342 10.324C2.92962 10.559 2.8418 10.8386 2.8418 11.125C2.8418 11.4114 2.92962 11.691 3.09342 11.926C3.25722 12.1609 3.48913 12.34 3.75788 12.4391L7.26577 13.7315L8.56092 17.2422C8.66001 17.5109 8.83912 17.7428 9.0741 17.9066C9.30908 18.0704 9.58863 18.1583 9.87506 18.1583C10.1615 18.1583 10.441 18.0704 10.676 17.9066C10.911 17.7428 11.0901 17.5109 11.1892 17.2422L12.4815 13.7343L15.9923 12.4391C16.261 12.34 16.4929 12.1609 16.6567 11.926C16.8205 11.691 16.9083 11.4114 16.9083 11.125C16.9083 10.8386 16.8205 10.559 16.6567 10.324C16.4929 10.0891 16.261 9.90995 15.9923 9.81086ZM11.7735 12.1945C11.5834 12.2644 11.4107 12.3748 11.2674 12.5181C11.1242 12.6613 11.0138 12.834 10.9438 13.0241L9.87506 15.9259L8.80561 13.0234C8.73565 12.8335 8.6253 12.661 8.48218 12.5179C8.33905 12.3748 8.16656 12.2644 7.97663 12.1945L5.07413 11.125L7.97663 10.0555C8.16656 9.98559 8.33905 9.87524 8.48218 9.73211C8.6253 9.58899 8.73565 9.4165 8.80561 9.22656L9.87506 6.32406L10.9445 9.22656C11.0145 9.4167 11.1249 9.58937 11.2681 9.73263C11.4114 9.87588 11.5841 9.98631 11.7742 10.0563L14.676 11.125L11.7735 12.1945ZM11.8438 3.8125C11.8438 3.58872 11.9327 3.37411 12.0909 3.21588C12.2492 3.05765 12.4638 2.96875 12.6876 2.96875H13.5313V2.125C13.5313 1.90122 13.6202 1.68661 13.7784 1.52838C13.9367 1.37014 14.1513 1.28125 14.3751 1.28125C14.5988 1.28125 14.8134 1.37014 14.9717 1.52838C15.1299 1.68661 15.2188 1.90122 15.2188 2.125V2.96875H16.0626C16.2863 2.96875 16.5009 3.05765 16.6592 3.21588C16.8174 3.37411 16.9063 3.58872 16.9063 3.8125C16.9063 4.03628 16.8174 4.25089 16.6592 4.40912C16.5009 4.56736 16.2863 4.65625 16.0626 4.65625H15.2188V5.5C15.2188 5.72378 15.1299 5.93839 14.9717 6.09662C14.8134 6.25486 14.5988 6.34375 14.3751 6.34375C14.1513 6.34375 13.9367 6.25486 13.7784 6.09662C13.6202 5.93839 13.5313 5.72378 13.5313 5.5V4.65625H12.6876C12.4638 4.65625 12.2492 4.56736 12.0909 4.40912C11.9327 4.25089 11.8438 4.03628 11.8438 3.8125ZM19.7188 7.1875C19.7188 7.41128 19.6299 7.62589 19.4717 7.78412C19.3134 7.94236 19.0988 8.03125 18.8751 8.03125H18.5938V8.3125C18.5938 8.53628 18.5049 8.75089 18.3467 8.90912C18.1884 9.06736 17.9738 9.15625 17.7501 9.15625C17.5263 9.15625 17.3117 9.06736 17.1534 8.90912C16.9952 8.75089 16.9063 8.53628 16.9063 8.3125V8.03125H16.6251C16.4013 8.03125 16.1867 7.94236 16.0284 7.78412C15.8702 7.62589 15.7813 7.41128 15.7813 7.1875C15.7813 6.96372 15.8702 6.74911 16.0284 6.59088C16.1867 6.43265 16.4013 6.34375 16.6251 6.34375H16.9063V6.0625C16.9063 5.83872 16.9952 5.62411 17.1534 5.46588C17.3117 5.30765 17.5263 5.21875 17.7501 5.21875C17.9738 5.21875 18.1884 5.30765 18.3467 5.46588C18.5049 5.62411 18.5938 5.83872 18.5938 6.0625V6.34375H18.8751C19.0988 6.34375 19.3134 6.43265 19.4717 6.59088C19.6299 6.74911 19.7188 6.96372 19.7188 7.1875Z"
        fill="#455468"
      />
    </g>
    <defs>
      <filter
        id="filter0_d_8852_536"
        x="0"
        y="0"
        width="22"
        height="22"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="1" />
        <feGaussianBlur stdDeviation="1" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.054902 0 0 0 0 0.0588235 0 0 0 0 0.0666667 0 0 0 0.06 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_8852_536" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_8852_536" result="shape" />
      </filter>
    </defs>
  </svg>
);
