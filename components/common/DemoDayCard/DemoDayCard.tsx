import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

import s from './DemoDayCard.module.scss';
import { DemoDayListResponse } from '@/services/demo-day/hooks/useGetDemoDaysList';

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

  return (
    <Link href={`/demoday/${slug}`} className={`${s.card} ${className || ''}`}>
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
        </div>
      </div>
    </Link>
  );
};
