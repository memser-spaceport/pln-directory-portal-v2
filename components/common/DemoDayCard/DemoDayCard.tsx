import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

import s from './DemoDayCard.module.scss';
import { DemoDayListResponse } from '@/services/demo-day/hooks/useGetDemoDaysList';
import clsx from 'clsx';

type DemoDayStatus = DemoDayListResponse['status'];

export type DemoDayCardProps = {
  slug: string;
  title: string;
  description: string;
  date: string;
  status: DemoDayStatus;
  className?: string;
};

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M11.0833 2.33331H2.91667C2.27233 2.33331 1.75 2.85565 1.75 3.49998V11.6666C1.75 12.311 2.27233 12.8333 2.91667 12.8333H11.0833C11.7277 12.8333 12.25 12.311 12.25 11.6666V3.49998C12.25 2.85565 11.7277 2.33331 11.0833 2.33331Z"
      stroke="currentColor"
      strokeWidth="1.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.33331 1.16669V3.50002"
      stroke="currentColor"
      strokeWidth="1.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.66669 1.16669V3.50002"
      stroke="currentColor"
      strokeWidth="1.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M1.75 5.83331H12.25"
      stroke="currentColor"
      strokeWidth="1.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BadgeDot = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="3.5" fill="currentColor" />
  </svg>
);

const getStatusConfig = (status: DemoDayStatus) => {
  switch (status) {
    case 'UPCOMING':
      return {
        label: 'Upcoming',
        className: s.badgeUpcoming,
      };
    case 'ACTIVE':
      return {
        label: 'Active',
        className: s.badgeActive,
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        className: s.badgeCompleted,
      };
    case 'ARCHIVED':
      return {
        label: 'Archived',
        className: s.badgeArchived,
      };
    case 'REGISTRATION_OPEN':
      return {
        label: 'Registration Open',
        className: s.badgeUpcoming,
      };
    default:
      return {
        label: status,
        className: s.badgeDefault,
      };
  }
};

export const DemoDayCard: React.FC<DemoDayCardProps> = ({ slug, title, description, date, status, className }) => {
  const statusConfig = getStatusConfig(status);
  const formattedDate = format(new Date(date), 'dd MMM yyyy');
  const showMore = status !== 'UPCOMING';

  return (
    <Link
      href={`/demoday/${slug}`}
      className={clsx(`${s.card} ${className || ''}`, {
        [s.nonClickable]: status === 'UPCOMING',
      })}
      onClick={(e) => {
        if (status === 'UPCOMING') {
          e.preventDefault();
        }
      }}
    >
      <div className={s.cardContent}>
        <div className={s.eventInfo}>
          <div className={s.overline}>
            <div className={`${s.badge} ${statusConfig.className}`}>
              <BadgeDot />
              <span className={s.badgeText}>{statusConfig.label}</span>
            </div>
            <div className={s.date}>
              <CalendarIcon />
              <span className={s.dateText}>{formattedDate}</span>
            </div>
          </div>
          <h3 className={s.title}>{title}</h3>
          <p className={s.description}>{description}</p>
          {showMore && (
            <div className={s.more}>
              More Info{' '}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12.2768 7.46409L8.3393 11.4016C8.21601 11.5249 8.0488 11.5941 7.87445 11.5941C7.7001 11.5941 7.53289 11.5249 7.40961 11.4016C7.28633 11.2783 7.21707 11.1111 7.21707 10.9367C7.21707 10.7624 7.28633 10.5952 7.40961 10.4719L10.2266 7.65604H2.1875C2.01345 7.65604 1.84653 7.5869 1.72346 7.46383C1.60039 7.34076 1.53125 7.17384 1.53125 6.99979C1.53125 6.82574 1.60039 6.65882 1.72346 6.53575C1.84653 6.41268 2.01345 6.34354 2.1875 6.34354H10.2266L7.4107 3.52604C7.28742 3.40276 7.21816 3.23555 7.21816 3.0612C7.21816 2.88685 7.28742 2.71964 7.4107 2.59635C7.53399 2.47307 7.7012 2.40381 7.87555 2.40381C8.0499 2.40381 8.21711 2.47307 8.34039 2.59635L12.2779 6.53385C12.3391 6.5949 12.3876 6.66744 12.4207 6.7473C12.4538 6.82716 12.4707 6.91276 12.4706 6.9992C12.4705 7.08563 12.4534 7.1712 12.4201 7.25098C12.3868 7.33076 12.3381 7.40318 12.2768 7.46409Z"
                  fill="#1B4DFF"
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
