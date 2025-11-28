import React from 'react';
import { format } from 'date-fns';
import Link from 'next/link';

import s from './DemoDayInfoRow.module.scss';

interface DemoDayInfoRowProps {
  date?: string;
  teamsCount?: number;
  investorsCount?: number;
  showInvestorsLink?: boolean;
  approximateStartDate?: string;
}

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14.25 3H3.75C2.92157 3 2.25 3.67157 2.25 4.5V15C2.25 15.8284 2.92157 16.5 3.75 16.5H14.25C15.0784 16.5 15.75 15.8284 15.75 15V4.5C15.75 3.67157 15.0784 3 14.25 3Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 1.5V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 1.5V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2.25 7.5H15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DotIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
  </svg>
);

const ArrowUpRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5.25 12.75L12.75 5.25"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.25 5.25H12.75V12.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const DemoDayInfoRow: React.FC<DemoDayInfoRowProps> = ({
  date,
  teamsCount,
  investorsCount,
  showInvestorsLink = false,
  approximateStartDate,
}) => {
  const formattedDate = approximateStartDate
    ? approximateStartDate
    : date
      ? format(new Date(date), 'MMM dd, yyyy, HH:mm')
      : null;

  return (
    <div className={s.container}>
      {formattedDate && (
        <div className={s.item}>
          <CalendarIcon />
          <span className={s.text}>{formattedDate}</span>
        </div>
      )}

      {formattedDate && (teamsCount !== undefined || investorsCount !== undefined) && (
        <div className={s.separator}>
          <DotIcon />
        </div>
      )}

      {teamsCount !== undefined && (
        <div className={s.item}>
          <span className={s.text}>{teamsCount} Teams</span>
        </div>
      )}

      {teamsCount !== undefined && investorsCount !== undefined && (
        <div className={s.separator}>
          <DotIcon />
        </div>
      )}

      {investorsCount !== undefined && (
        <>
          {showInvestorsLink ? (
            <Link href="/members?isInvestor=true" className={s.link} target="_blank">
              <span className={s.text}>{investorsCount} Investors</span>
              <ArrowUpRightIcon />
            </Link>
          ) : (
            <div className={s.item}>
              <span className={s.text}>{investorsCount} Investors</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
