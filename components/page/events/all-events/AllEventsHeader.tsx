import clsx from 'clsx';
import Link from 'next/link';

import btn from '@/components/common/Button/Button.module.scss';

import s from './AllEventsPage.module.scss';

/**
 * The title, one line about the page, "My Submissions" for a signed-in member, and "Submit an event". The server
 * passes the links: with events submitted in LabOS, "Submit an event" opens the LabOS form in the same tab
 * (`submitInApp`); otherwise it opens the submission portal in a new tab.
 *
 * On phones (Polina, 2026-11-24) "Submit an event" sits in the title row, so the actions take no row of their own.
 * The page has no link to the PL events app (LAB-3420): the event data will move here soon.
 */
export function AllEventsHeader({
  submitHref,
  submitInApp = false,
  mySubmissionsHref,
  onSubmitClick,
}: {
  submitHref: string;
  /** The submit link stays in LabOS: same tab. */
  submitInApp?: boolean;
  /** The member's own submissions. Left out for a signed-out visitor and while events are not submitted in LabOS. */
  mySubmissionsHref?: string;
  onSubmitClick?: () => void;
}) {
  return (
    <header className={s.header}>
      <div className={s.headerText}>
        <h1 className={s.title}>Events</h1>
        <p className={s.lede}>Meetups and conferences across the Protocol Labs network.</p>
      </div>
      <div className={s.headerActions}>
        {mySubmissionsHref && (
          <Link href={mySubmissionsHref} className={s.textLink}>
            My Submissions
          </Link>
        )}
        {/* The DS Button's classes on the link itself: a <button> inside an <a> is two controls. */}
        <a
          href={submitHref}
          {...(submitInApp ? {} : { target: '_blank', rel: 'noreferrer' })}
          className={clsx(btn.root, btn.small, btn.border, btn.neutral, s.btn)}
          onClick={onSubmitClick}
        >
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M9 3.75V14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M3.75 9H14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Submit an event
        </a>
      </div>
    </header>
  );
}
