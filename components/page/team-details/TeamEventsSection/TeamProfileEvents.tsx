'use client';

import type { TeamEvents } from '@/services/events/profile-events.service';

import { TeamEventsSection } from './TeamEventsSection';
import { useTeamProfileEvents } from './useTeamProfileEvents';

/**
 * The team page's Events section with its data (LAB-3219): the server's past list (design D5) until the signed-in
 * viewer's own read lands. Nothing at all when the team has no events, or when neither read could be loaded.
 */
export function TeamProfileEvents({
  teamUid,
  teamName,
  serverEvents,
  isLoggedIn,
}: {
  teamUid: string;
  teamName: string;
  serverEvents?: TeamEvents | null;
  isLoggedIn: boolean;
}) {
  const events = useTeamProfileEvents({ teamUid, serverEvents, isLoggedIn });
  return <TeamEventsSection teamName={teamName} {...events} />;
}
