import React from 'react';
import s from './ArticleStats.module.scss';

interface Props {
  viewCount: number;
  readingTime: number;
  updatedAt: string;
}

export function ArticleStats({ viewCount, readingTime, updatedAt }: Props) {
  const updatedDate = new Date(updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={s.root}>
      <span className={s.stat}>
        <EyeIcon /> {viewCount.toLocaleString()} views
      </span>
      <span className={s.divider}>·</span>
      <span className={s.stat}>
        <ClockIcon /> {readingTime} min read
      </span>
      <span className={s.divider}>·</span>
      <span className={s.stat}>
        <CalendarIcon /> Updated {updatedDate}
      </span>
    </div>
  );
}

const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 3C4 3 1.5 7 1.5 7C1.5 7 4 11 7 11C10 11 12.5 7 12.5 7C12.5 7 10 3 7 3Z" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="7" cy="7" r="1.8" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M7 4.5V7L8.5 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M1.5 5.5H12.5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M4.5 1.5V3.5M9.5 1.5V3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);
