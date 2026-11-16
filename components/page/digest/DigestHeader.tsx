import type { DigestFrequency } from '@/services/digest/digest.types';

import s from './DigestPage.module.scss';

/** Fixed locale and UTC so the server render and the browser print the same date (no hydration mismatch). */
export function formatDigestDate(sentAt: string): string {
  const date = new Date(sentAt);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function DigestHeader({ frequency, sentAt }: { frequency: DigestFrequency; sentAt: string }) {
  return (
    <header className={s.header}>
      <h1 className={s.headerTitle}>{frequency === 'weekly' ? 'Your weekly digest' : 'Your daily digest'}</h1>
      <p className={s.headerDate}>{formatDigestDate(sentAt)}</p>
    </header>
  );
}
