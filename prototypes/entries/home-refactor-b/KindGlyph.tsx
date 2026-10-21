import { CalendarBlankIcon, CommentIcon, DocumentIcon } from '@/components/icons';

import type { WeekKind } from './mocks';

/**
 * One 16px glyph per content type, all existing ones:
 *  - news: DS `DocumentIcon`; forum: DS `CommentIcon`; event: DS `CalendarBlankIcon`
 *  - job: `/icons/briefcase.svg` (the job board's glyph), path verbatim, in currentColor
 *  - repo: `/icons/repos.svg` (project details' "Repos" stat), path verbatim, in currentColor
 * Nothing was drawn for this page.
 */
export function KindGlyph({ kind }: { kind: WeekKind }) {
  switch (kind) {
    case 'news':
      return <DocumentIcon width={16} height={16} aria-hidden />;
    case 'forum':
      return (
        <span aria-hidden style={{ display: 'inline-flex' }}>
          <CommentIcon />
        </span>
      );
    case 'event':
      return <CalendarBlankIcon width={16} height={16} aria-hidden />;
    case 'job':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M2 6.5C2 5.94772 2.44772 5.5 3 5.5H13C13.5523 5.5 14 5.94772 14 6.5V12.5C14 13.0523 13.5523 13.5 13 13.5H3C2.44772 13.5 2 13.0523 2 12.5V6.5Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M5.5 5.5V4C5.5 3.44772 5.94772 3 6.5 3H9.5C10.0523 3 10.5 3.44772 10.5 4V5.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M2 9H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'repo':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M2.66675 12V4M13.3334 8V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path
            d="M8.00008 6.66667C10.9454 6.66667 13.3334 5.47333 13.3334 4C13.3334 2.52667 10.9454 1.33333 8.00008 1.33333C5.05475 1.33333 2.66675 2.52667 2.66675 4C2.66675 5.47333 5.05475 6.66667 8.00008 6.66667Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M13.3334 8C13.3334 9.47333 10.9454 10.6667 8.00008 10.6667C5.05475 10.6667 2.66675 9.47333 2.66675 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M13.3334 12C13.3334 13.4733 10.9454 14.6667 8.00008 14.6667C5.05475 14.6667 2.66675 13.4733 2.66675 12"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      );
  }
}
