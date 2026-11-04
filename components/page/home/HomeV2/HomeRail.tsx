import type { ReactNode, Ref } from 'react';

import type { IHomeEvents, IHomeRoles } from '@/types/home.types';

import { EventsSection } from './EventsSection';
import { RolesSection } from './RolesSection';
import { ROLES_BESIDE_EVENTS, ROLES_WITHOUT_EVENTS } from './utils/flattenNewestRoles';
import s from './HomeV2.module.scss';

/**
 * One sidebar holding open roles and upcoming events, the sections the signed-in rail has too (2026-11-02 standup:
 * "match the sections"). Three roles beside events; with no events in the next 30 days the events section goes and
 * roles take the room (five). A source that failed is null and drops only its own section.
 *
 * Signed in (LAB-3125), the rail's other sections follow as `children`, in order: Teams to follow, deals, Popular this
 * week. Each renders nothing when it has nothing, so the hairlines only fall between sections that are there.
 * `railRef` is the stream's measure: its cut lands where the rail ends.
 */
export function HomeRail({
  roles,
  events,
  rolesNote,
  signedIn,
  railRef,
  children,
}: {
  roles: IHomeRoles | null;
  events: IHomeEvents | null;
  rolesNote?: ReactNode;
  signedIn: boolean;
  railRef?: Ref<HTMLElement>;
  children?: ReactNode;
}) {
  const hasEvents = Boolean(events && events.events.length > 0);
  const hasRoles = Boolean(roles && roles.roles.length > 0);
  if (!hasEvents && !hasRoles && !children) return null;

  return (
    <aside ref={railRef} className={s.rail}>
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
        {children}
      </div>
    </aside>
  );
}
