import type { ReactNode } from 'react';

import type { DigestFrequency } from '@/services/digest/digest.types';

import s from './DigestPage.module.scss';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * "16 November 2026", or with `weekday` "Wednesday, 18 November". Built by hand in UTC rather than with Intl, so the
 * server render and the browser print the same string whatever their ICU data (no hydration mismatch).
 */
export function formatDigestDate(iso: string, style: 'date' | 'weekday'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const day = `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
  return style === 'weekday' ? `${WEEKDAYS[date.getUTCDay()]}, ${day}` : `${day} ${date.getUTCFullYear()}`;
}

type Props = {
  frequency: DigestFrequency;
  sentAt: string;
  storyCount: number;
  firstName: string | null;
  /** Beside the dateline: the signed-in reader's Copy link (LAB-3398). */
  action?: ReactNode;
};

/**
 * The page's header (LAB-3287): the dateline ("Weekly digest · 9 November 2026 · 5 stories"), then the greeting as the
 * page title and one line on what the digest is. Left-aligned, with no logo: the LabOS navigation already says where you
 * are.
 */
export function DigestHeader({ frequency, sentAt, storyCount, firstName, action }: Props) {
  const date = formatDigestDate(sentAt, 'date');
  return (
    <header>
      <p className={s.issueLine}>
        {frequency === 'weekly' ? 'Weekly digest' : 'Daily digest'}
        {date && ` · ${date}`} · {storyCount} {storyCount === 1 ? 'story' : 'stories'}
        {action && <> {action}</>}
      </p>
      <div className={s.intro}>
        <h1 className={s.greeting}>Hi {firstName || 'there'},</h1>
        {/* LAB-3348 (LAB-3346, Polina's prototype of 2026-11-20): the line says what the digest is. How stories are
            picked is the "How personalization works" card's job, and the topics modal opens from "See all topics", so
            there is no "Picked for you…" line and no "Change topics" here. The email keeps its Change topics link. */}
        <p className={s.introText}>The week’s top stories from across the Protocol Labs network, in one place.</p>
      </div>
    </header>
  );
}
