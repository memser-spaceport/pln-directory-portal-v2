'use client';

import { useState } from 'react';

import { Button } from '@/components/common/Button';
import { DetailsSection, DetailsSectionHeader } from '@/components/common/profile/DetailsSection';
import { toast } from '@/components/core/ToastContainer';
import {
  EventCardGrid,
  EventCardsPanel,
  EventGroupLabel,
  GoingMark,
  PastEventCard,
  UpcomingEventCard,
} from '@/components/page/events/EventCards';
import { EventDrawer, eventGoingToastText } from '@/components/page/events/EventDrawer';
import { usePrefetchEventDetail } from '@/services/events/hooks/useEventDrawerQueries';
import type { TeamPastEvent, TeamProfileDemoDay, TeamProfileEvent } from '@/services/events/profile-events.types';

/** Cards per group before "Show all N", as on the member profile. */
export const VISIBLE_TEAM_EVENTS_PER_GROUP = 4;

export interface TeamEventsSectionProps {
  /** For the titles, group labels and card feet: "Lighthouse is going to", "3 from Lighthouse". */
  teamName: string;
  /** Soonest first. Always empty for a signed-out viewer. */
  upcoming: TeamProfileEvent[];
  upcomingTotal: number;
  /** Demo Days first, then the team's past events newest first. */
  past: (TeamProfileDemoDay | TeamPastEvent)[];
  pastTotal: number;
}

/**
 * The team profile's Events section (LAB-3219), in place of the Contributions tiles behind the event drawer flag.
 * Ported from `prototypes/entries/member-events-going/TeamEventsSection.tsx`, on the member profile's cards:
 *
 * - A team doesn't go anywhere; its members do. Upcoming is the events the team's current members are going to and
 *   show on their profiles, so it has no Add event, ⋯ menu or empty state, and with nobody going it isn't drawn.
 *   A card's foot names the team's people ("3 from Lighthouse") with their faces; the team's own roles sit after the
 *   city. Its title opens the event drawer.
 * - Past is the old Contributions as past cards: Demo Day first, with the gradient ring and pill, linking to that
 *   Demo Day's page; then the team's events newest first. Plain participation has no pill.
 */
export function TeamEventsSection({ teamName, upcoming, upcomingTotal, past, pastTotal }: TeamEventsSectionProps) {
  const [drawerEventUid, setDrawerEventUid] = useState<string | null>(null);
  const [allUpcoming, setAllUpcoming] = useState(false);
  const [allPast, setAllPast] = useState(false);
  const prefetchEvent = usePrefetchEventDetail();

  const hasUpcoming = upcoming.length > 0;
  const hasPast = past.length > 0;
  if (!hasUpcoming && !hasPast) return null;

  // Group labels only when both groups are in the section; one group is the section itself.
  const withLabels = hasUpcoming && hasPast;
  const goingTitle = `Events ${teamName} is going to`;
  const title = withLabels ? 'Events' : hasUpcoming ? goingTitle : 'Past events';

  const upcomingShown = allUpcoming ? upcoming : upcoming.slice(0, VISIBLE_TEAM_EVENTS_PER_GROUP);
  const pastShown = allPast ? past : past.slice(0, VISIBLE_TEAM_EVENTS_PER_GROUP);

  return (
    <DetailsSection>
      <DetailsSectionHeader title={title} />

      <EventCardsPanel withLabels={withLabels}>
        {hasUpcoming && withLabels && <EventGroupLabel>{teamName} is going to</EventGroupLabel>}
        {hasUpcoming && (
          <EventCardGrid label={goingTitle}>
            {upcomingShown.map((event) => (
              <UpcomingEventCard
                key={event.uid}
                name={event.name}
                startDate={event.startDate}
                endDate={event.endDate}
                city={event.city}
                roles={event.roles}
                faces={event.members}
                countLabel={`${event.memberCount} from ${teamName}`}
                onOpen={() => setDrawerEventUid(event.uid)}
                onIntent={() => prefetchEvent(event.uid)}
                badges={event.viewerGoing ? <GoingMark label="You're going too" /> : undefined}
              />
            ))}
          </EventCardGrid>
        )}

        {hasUpcoming &&
          !allUpcoming &&
          upcomingTotal > VISIBLE_TEAM_EVENTS_PER_GROUP &&
          upcoming.length > VISIBLE_TEAM_EVENTS_PER_GROUP && (
            <div>
              <Button style="link" variant="primary" underline={false} onClick={() => setAllUpcoming(true)}>
                Show all {upcomingTotal} upcoming events
              </Button>
            </div>
          )}

        {hasPast && withLabels && <EventGroupLabel after>Contributions</EventGroupLabel>}
        {hasPast && (
          <EventCardGrid label={withLabels ? 'Contributions' : title}>
            {pastShown.map((item) =>
              item.kind === 'demo-day' ? (
                <PastEventCard
                  key={`demo-day-${item.uid}`}
                  name={item.title}
                  startDate={item.startDate}
                  city={null}
                  roles={[]}
                  featured={{ label: 'Demo Day', href: `/demoday/${encodeURIComponent(item.slug)}` }}
                />
              ) : (
                <PastEventCard
                  key={`event-${item.uid}`}
                  name={item.name}
                  startDate={item.startDate}
                  city={item.city}
                  roles={item.roles}
                />
              ),
            )}
          </EventCardGrid>
        )}

        {hasPast &&
          !allPast &&
          pastTotal > VISIBLE_TEAM_EVENTS_PER_GROUP &&
          past.length > VISIBLE_TEAM_EVENTS_PER_GROUP && (
            <div>
              <Button style="link" variant="primary" underline={false} onClick={() => setAllPast(true)}>
                Show all {pastTotal} past events
              </Button>
            </div>
          )}
      </EventCardsPanel>

      <EventDrawer
        eventUid={drawerEventUid}
        source="team-profile"
        onClose={() => setDrawerEventUid(null)}
        onGoing={(notice) => toast.success(eventGoingToastText(notice))}
      />
    </DetailsSection>
  );
}
