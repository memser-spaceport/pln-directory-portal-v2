import { useMemo } from 'react';

import { useMemberEvents } from '@/services/events/hooks/useMemberEvents';
import { normalizeMemberEvents, type MemberEvents } from '@/services/events/profile-events.service';
import type { MemberProfileEvent, ProfileEventsGroup } from '@/services/events/profile-events.types';

export interface MemberProfileEventsView {
  /** Soonest first. Always empty for a signed-out viewer. */
  upcoming: MemberProfileEvent[];
  /** For "Show all N upcoming events". */
  upcomingTotal: number;
  /** Newest first. */
  past: MemberProfileEvent[];
  pastTotal: number;
  /**
   * `high`: under Office Hours, for the owner and whenever the viewer sees an upcoming event. `low`: the old IRL
   * contributions slot, after Project Contributions (design D6). A signed-in viewer's section can move up once their
   * read resolves.
   */
  placement: 'high' | 'low';
}

const byStart = (a: MemberProfileEvent, b: MemberProfileEvent) => Date.parse(a.startDate) - Date.parse(b.startDate);

/** The group's items this viewer may see, and its total less any hidden rows the response shouldn't have carried. */
function visible(group: ProfileEventsGroup<MemberProfileEvent> | null | undefined, isOwner: boolean) {
  const items = group?.items ?? [];
  const shown = isOwner ? items : items.filter((event) => event.showOnProfile);
  const total = Math.max(shown.length, (group?.total ?? 0) - (items.length - shown.length));
  return { items: shown, total };
}

/**
 * The member profile's Events data (LAB-3217, design D5). Signed in, it is the viewer's own read (`useMemberEvents`);
 * until that lands, or if it fails, it is the server's past-only list, which is all a signed-out visitor ever gets.
 * The server list is drawn directly rather than seeded as `initialData`, and it is what the server HTML holds, so
 * hydration matches and the HTML has no upcoming plans.
 *
 * `isLoggedIn` is the page's viewer, which stays signed out while the server's public member stands in.
 */
export function useMemberProfileEvents({
  memberUid,
  serverEvents,
  isOwner,
  isLoggedIn,
}: {
  memberUid: string;
  serverEvents?: MemberEvents | null;
  isOwner: boolean;
  isLoggedIn: boolean;
}): MemberProfileEventsView {
  const { data } = useMemberEvents(memberUid);

  return useMemo(() => {
    const viewerEvents = isLoggedIn ? normalizeMemberEvents(data) : null;
    const source = viewerEvents ?? serverEvents ?? null;

    // Plans are for signed-in members only; an event the member hid is for their own eyes only.
    const upcoming = isLoggedIn ? visible(source?.upcoming, isOwner) : { items: [], total: 0 };
    const past = visible(source?.past, isOwner);

    return {
      upcoming: [...upcoming.items].sort(byStart),
      upcomingTotal: upcoming.total,
      past: [...past.items].sort((a, b) => byStart(b, a)),
      pastTotal: past.total,
      placement: isOwner || upcoming.items.length > 0 ? 'high' : 'low',
    };
  }, [data, serverEvents, isOwner, isLoggedIn]);
}
