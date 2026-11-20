import s from './AllEventsPage.module.scss';

/* The page's own glyphs, transcribed from the prototype (events-page-redesign) at 16px / 1.5px stroke. */

export type AllEventsView = 'list' | 'calendar' | 'map';

export function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className={s.pin}>
      <path
        d="M8 14s4.5-4.1 4.5-7.5a4.5 4.5 0 1 0-9 0C3.5 9.9 8 14 8 14Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

/** The view switch's glyphs, drawn at the Filters mark's size and weight so the toolbar reads as one set. */
export function ViewIcon({ view }: { view: AllEventsView }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className={s.viewIcon}>
      <g
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        {view === 'list' && (
          <>
            <path d="M6 4h7.5M6 8h7.5M6 12h7.5" />
            <path d="M2.75 4h.01M2.75 8h.01M2.75 12h.01" strokeWidth="2" />
          </>
        )}
        {view === 'calendar' && (
          <>
            <rect x="2" y="3" width="12" height="11" rx="2" />
            <path d="M2 6.75h12M5.5 1.75v2.5M10.5 1.75v2.5" />
          </>
        )}
        {view === 'map' && (
          <>
            <path d="M2 4.25l4-1.5 4 1.5 4-1.5v9l-4 1.5-4-1.5-4 1.5z" />
            <path d="M6 2.75v9M10 4.25v9" />
          </>
        )}
      </g>
    </svg>
  );
}

/** A stroked sliders mark for the Filters door. */
export function SlidersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke">
        <path d="M2.5 4.5h6M11.5 4.5h2M2.5 11.5h2M7.5 11.5h6" />
        <circle cx="10" cy="4.5" r="1.5" />
        <circle cx="6" cy="11.5" r="1.5" />
      </g>
    </svg>
  );
}

/** The rail's close control: the sidebar mark (Linear, Notion) instead of the word "Hide". */
export function SidebarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 3v10" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** A lock for invite-only events, a ticket otherwise (as the drawer's access row). */
export function AccessIcon({ inviteOnly, size = 14 }: { inviteOnly: boolean; size?: number }) {
  return inviteOnly ? (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2 5.5A1.5 1.5 0 0 1 3.5 4h9A1.5 1.5 0 0 1 14 5.5V7a1 1 0 0 0 0 2v1.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 10.5V9a1 1 0 0 0 0-2z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M9.5 4.5v7" stroke="currentColor" strokeWidth="1.4" strokeDasharray="1.5 1.5" />
    </svg>
  );
}
