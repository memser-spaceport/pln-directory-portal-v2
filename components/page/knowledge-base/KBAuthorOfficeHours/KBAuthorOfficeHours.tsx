'use client';

import React from 'react';
import { normalizeOfficeHoursUrl } from '@/utils/common.utils';
import s from './KBAuthorOfficeHours.module.scss';

interface Props {
  authorName: string;
  authorRole: string;
  authorImageUrl: string;
  officeHoursUrl: string | null;
  isLoggedIn: boolean;
}

export function KBAuthorOfficeHours({
  authorName,
  authorRole,
  authorImageUrl,
  officeHoursUrl,
  isLoggedIn,
}: Props) {
  const initials = authorName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const handleBooking = () => {
    if (!officeHoursUrl) return;
    window.open(normalizeOfficeHoursUrl(officeHoursUrl), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={s.root}>
      <p className={s.sectionLabel}>About the Author</p>

      <div className={s.authorCard}>
        {authorImageUrl ? (
          <img src={authorImageUrl} alt={authorName} className={s.avatar} />
        ) : (
          <div className={s.avatarFallback}>{initials}</div>
        )}
        <div className={s.info}>
          <span className={s.name}>{authorName}</span>
          {authorRole && <span className={s.role}>{authorRole}</span>}
        </div>
      </div>

      {officeHoursUrl && (
        <div className={s.bookingSection}>
          {isLoggedIn ? (
            <button className={s.bookButton} onClick={handleBooking}>
              <CalendarIcon /> Book a 15-min call
            </button>
          ) : (
            <p className={s.loginPrompt}>
              <a href="/sign-up" className={s.loginLink}>Log in</a> to book office hours with the author
            </p>
          )}
          <p className={s.hint}>Short 1:1 call — no introduction needed.</p>
        </div>
      )}
    </div>
  );
}

const CalendarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <rect x="1.5" y="2.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M1.5 6H13.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M5 1.5V3.5M10 1.5V3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);
