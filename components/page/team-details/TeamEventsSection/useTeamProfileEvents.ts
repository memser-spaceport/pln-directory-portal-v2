import { useMemo } from 'react';

import { useTeamEvents } from '@/services/events/hooks/useTeamEvents';
import { normalizeTeamEvents, type TeamEvents } from '@/services/events/profile-events.service';
import type { TeamPastEvent, TeamProfileDemoDay, TeamProfileEvent } from '@/services/events/profile-events.types';

export interface TeamProfileEventsView {
  /** Soonest first. Always empty for a signed-out viewer. */
  upcoming: TeamProfileEvent[];
  /** For "Show all N upcoming events". */
  upcomingTotal: number;
  /** Demo Days first, then the team's past events, each newest first. */
  past: (TeamProfileDemoDay | TeamPastEvent)[];
  pastTotal: number;
}

const startOf = (item: { startDate: string }) => Date.parse(item.startDate);

/** Demo Day leads (the spec's "Demo Day leads a team's Contributions"), then newest first within each kind. */
function pastOrder(a: TeamProfileDemoDay | TeamPastEvent, b: TeamProfileDemoDay | TeamPastEvent) {
  const demoDayFirst = Number(b.kind === 'demo-day') - Number(a.kind === 'demo-day');
  return demoDayFirst || startOf(b) - startOf(a);
}

/**
 * The team profile's Events data (LAB-3219, design D5). Signed in, it is the viewer's own read (`useTeamEvents`);
 * until that lands, or if it fails, it is the server's past list, which is all a signed-out visitor ever gets. The
 * server list is drawn directly rather than seeded as `initialData`, and it is what the server HTML holds, so
 * hydration matches and the HTML has no upcoming plans.
 */
export function useTeamProfileEvents({
  teamUid,
  serverEvents,
  isLoggedIn,
}: {
  teamUid: string;
  serverEvents?: TeamEvents | null;
  isLoggedIn: boolean;
}): TeamProfileEventsView {
  const { data } = useTeamEvents(teamUid);

  return useMemo(() => {
    const viewerEvents = isLoggedIn ? normalizeTeamEvents(data) : null;
    const source = viewerEvents ?? serverEvents ?? null;

    // Members' plans are for signed-in members only.
    const upcoming = isLoggedIn ? (source?.upcoming?.items ?? []) : [];
    const past = source?.past?.items ?? [];

    return {
      upcoming: [...upcoming].sort((a, b) => startOf(a) - startOf(b)),
      upcomingTotal: isLoggedIn ? Math.max(upcoming.length, source?.upcoming?.total ?? 0) : 0,
      past: [...past].sort(pastOrder),
      pastTotal: Math.max(past.length, source?.past?.total ?? 0),
    };
  }, [data, serverEvents, isLoggedIn]);
}
