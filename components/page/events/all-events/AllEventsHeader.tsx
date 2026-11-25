import clsx from 'clsx';

import btn from '@/components/common/Button/Button.module.scss';

import s from './AllEventsPage.module.scss';

/**
 * The title, one line about the page and "Submit an event". The submit link is production's `getSubmitEventUrl()`
 * (through the events portal's LabOS sign-in), passed in from the server.
 *
 * On phones (Polina, 2026-11-24) "Submit an event" sits in the title row, so the actions take no row of their own.
 * The page has no link to the PL events app (LAB-3420): the event data will move here soon.
 */
export function AllEventsHeader({ submitHref, onSubmitClick }: { submitHref: string; onSubmitClick?: () => void }) {
  return (
    <header className={s.header}>
      <div className={s.headerText}>
        <h1 className={s.title}>Events</h1>
        <p className={s.lede}>Meetups and conferences across the Protocol Labs network.</p>
      </div>
      <div className={s.headerActions}>
        {/* The DS Button's classes on the link itself: a <button> inside an <a> is two controls. */}
        <a
          href={submitHref}
          target="_blank"
          rel="noreferrer"
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
