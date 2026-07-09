'use client';

import { DetailsSection, DetailsSectionHeader } from '@/components/common/profile/DetailsSection';

import { DemoDayLinkBadge, type DemoDayParticipation } from '../team-profile/TeamDetailsView';
import tp from '../team-profile/TeamProfile.module.scss';
import type { EventRoleGroup } from './mocks';
import s from './EventsContributionsView.module.scss';

interface Props {
  groups: EventRoleGroup[];
  /** When set, adds a "Demo Day" role row with the participation badge (placement option 4). */
  demoDay?: DemoDayParticipation | null;
}

/**
 * COPY-SIMPLIFY of production `TeamIrlContributions` (the "Contributions (N)" /
 * Events block). Production pulls in the auth store + analytics and styles via
 * `<style jsx>`; here it's a plain prop-driven view. Structure mirrors production:
 * a "Contributions (N)" header and role rows (Host / Sponsor) of event cards.
 */
export function EventsContributionsView({ groups, demoDay }: Props) {
  const total = groups.reduce((n, g) => n + g.events.length, 0) + (demoDay ? 1 : 0);

  return (
    <DetailsSection>
      <DetailsSectionHeader title={`Contributions (${total})`} />
      <div className={s.rows}>
        {groups.map((group) => (
          <div key={group.role} className={s.row}>
            <div className={s.roleLabel}>{group.role}</div>
            <div className={s.events}>
              {group.events.map((event) => (
                <div key={event.uid} className={s.eventCard}>
                  <div className={s.eventName}>{event.name}</div>
                  <div className={s.eventDate}>{event.date}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {demoDay && (
          <div className={s.row}>
            <div className={s.roleLabel}>Demo Day</div>
            <div className={s.events}>
              <DemoDayLinkBadge participation={demoDay} className={tp.demoDayPill} />
            </div>
          </div>
        )}
      </div>
    </DetailsSection>
  );
}
