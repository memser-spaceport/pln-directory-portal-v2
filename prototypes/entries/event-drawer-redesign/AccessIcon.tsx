import type { EventDetail } from '../member-events-going/mocks';

/**
 * The mark for how you get in (2026-11-17, badges rethink). Access used to be a grey
 * Badge beside the mode Badge, so "Invite only" looked like a tag. It is now a fact:
 * a row in the drawer (Luma's "Approval required" row) and a glyph + word on cards.
 * Lock = invite only, ticket = paid or free. 1.5px stroke, like the drawer's pin.
 */
export function AccessIcon({ access, size = 20 }: { access: EventDetail['access']; size?: number }) {
  if (access === 'INVITE ONLY') {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
        <rect
          x="4"
          y="9"
          width="12"
          height="8.5"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        <path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M3 6.5A1.5 1.5 0 014.5 5h11A1.5 1.5 0 0117 6.5V8a2 2 0 000 4v1.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 13.5V12a2 2 0 000-4V6.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M12 5.5v9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="1.5 2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** The access fact as words: what it is, and what it means for you (only where that adds something). */
export const ACCESS_FACT: Record<EventDetail['access'], { main: string; sub?: string }> = {
  'INVITE ONLY': { main: 'Invite only', sub: 'The hosts approve each guest' },
  PAID: { main: 'Paid', sub: "Tickets on the host's site" },
  'FREE w/ RSVP': { main: 'Free', sub: 'RSVP to save your spot' },
};
