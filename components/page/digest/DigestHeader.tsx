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
  /** Opens the topics modal (LAB-3289). Left out, the intro has no "Change topics". */
  onChangeTopics?: () => void;
};

/**
 * The page's header (LAB-3287): the dateline ("Weekly digest · 9 November 2026 · 5 stories"), then the greeting as the
 * page title and the intro line. Left-aligned, with no logo: the LabOS navigation already says where you are.
 */
export function DigestHeader({ frequency, sentAt, storyCount, firstName, onChangeTopics }: Props) {
  const date = formatDigestDate(sentAt, 'date');
  return (
    <header>
      <p className={s.issueLine}>
        {frequency === 'weekly' ? 'Weekly digest' : 'Daily digest'}
        {date && ` · ${date}`} · {storyCount} {storyCount === 1 ? 'story' : 'stories'}
      </p>
      <div className={s.intro}>
        <h1 className={s.greeting}>Hi {firstName || 'there'},</h1>
        <p className={s.introText}>
          Picked for you from subscribed tags and the teams you follow.
          {onChangeTopics && (
            <>
              {' '}
              {/* Opens the topics modal, so the issue stays where it was. The email's link lands with ?topics=open. */}
              <button type="button" className={s.introLink} onClick={onChangeTopics}>
                Change topics
              </button>
            </>
          )}
        </p>
      </div>
    </header>
  );
}
