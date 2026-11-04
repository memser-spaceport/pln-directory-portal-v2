import type { ReactNode } from 'react';

import type { IHomeEvents, IHomeRoles } from '@/types/home.types';

import { EventsSection } from './EventsSection';
import { RolesSection } from './RolesSection';
import { ROLES_BESIDE_EVENTS, ROLES_WITHOUT_EVENTS } from './utils/flattenNewestRoles';
import s from './HomeV2.module.scss';

/**
 * One sidebar holding open roles and upcoming events, the sections the signed-in rail has too (2026-11-02 standup:
 * "match the sections"). Three roles beside events; with no events in the next 30 days the events section goes and
 * roles take the room (five). A source that failed is null and drops only its own section.
 */
export function HomeRail({
  roles,
  events,
  rolesNote,
  signedIn,
}: {
  roles: IHomeRoles | null;
  events: IHomeEvents | null;
  rolesNote?: ReactNode;
  signedIn: boolean;
}) {
  const hasEvents = Boolean(events && events.events.length > 0);
  const hasRoles = Boolean(roles && roles.roles.length > 0);
  if (!hasEvents && !hasRoles) return null;

  return (
    <aside className={s.rail}>
      <div className={s.sidebar}>
        {roles && hasRoles && (
          <RolesSection
            roles={roles.roles.slice(0, hasEvents ? ROLES_BESIDE_EVENTS : ROLES_WITHOUT_EVENTS)}
            total={roles.total}
            note={rolesNote}
            signedIn={signedIn}
          />
        )}
        {events && hasEvents && <EventsSection events={events.events} total={events.total} signedIn={signedIn} />}
      </div>
    </aside>
  );
}
