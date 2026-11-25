'use client';

import clsx from 'clsx';

import { CalendarBlankIcon } from '@/components/icons';
// Production's glossy primary — Schedule Meeting's own press, which this one
// stands in for when there is no booking link.
import office from '@/components/page/member-details/OfficeHoursDetails/components/OfficeHoursView/OfficeHoursView.module.scss';
// The intro press's reset of that class and its text receipt: the two presses
// take turns in the same seat, so they measure alike.
import intro from '../../intro-shared/RequestIntroButton.module.scss';

import s from './RequestTime.module.scss';

/**
 * LAB-3400 "Request time": the Office hours option's press when the member has
 * no booking link. Same glossy press and calendar glyph as Schedule Meeting —
 * it is the same intent (a call with this person), only the route differs.
 * Sent: a text receipt, the intro's "Intro requested" pattern.
 */
export function RequestTimeButton({
  requested,
  onClick,
  name,
  size = 'xs',
  className,
}: {
  requested: boolean;
  onClick: () => void;
  name: string;
  size?: 'xs' | 's';
  className?: string;
}) {
  if (requested) {
    return (
      <span
        className={clsx(intro.sent, size === 's' && intro.sentS, className)}
        role="status"
        aria-label={`Time requested from ${name}`}
        title={`We emailed ${name.split(' ')[0]} your request`}
      >
        <CheckGlyph />
        <span>Time requested</span>
      </span>
    );
  }
  return (
    <button
      type="button"
      className={clsx(office.primaryButton, intro.primary, size === 's' && intro.primaryS, className)}
      aria-label={`Request time with ${name}`}
      onClick={onClick}
    >
      <CalendarBlankIcon className={s.glyph} aria-hidden="true" />
      <span>Request time</span>
    </button>
  );
}

// RequestIntroButton's check, so the two receipts match.
const CheckGlyph = () => (
  <svg width={14} height={14} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M13.25 4.75 6.5 11.5 2.75 7.75"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
