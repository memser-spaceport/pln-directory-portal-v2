'use client';

import { useState, type ReactNode } from 'react';

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
import { EventDrawer, eventGoingToastText, type EventDrawerStep } from '@/components/page/events/EventDrawer';
import { usePrefetchEventDetail } from '@/services/events/hooks/useEventDrawerQueries';
import type { MemberProfileEvent } from '@/services/events/profile-events.types';

/** Cards per group before "Show all N". */
export const VISIBLE_EVENTS_PER_GROUP = 4;

export interface MemberEventsSectionProps {
  /** For the titles and group labels: "Ana is going to". */
  firstName: string;
  isOwner: boolean;
  /** Soonest first, already filtered for this viewer. */
  upcoming: MemberProfileEvent[];
  upcomingTotal: number;
  /** Newest first. */
  past: MemberProfileEvent[];
  pastTotal: number;
  /** The header's right side (the owner's "Add event", LAB-3218). */
  headerAction?: ReactNode;
  /** An upcoming card's ⋯ menu (LAB-3218). `openDrawer` opens the drawer on that event, e.g. at the plans step. */
  renderCardMenu?: (event: MemberProfileEvent, openDrawer: (step?: EventDrawerStep) => void) => ReactNode;
  /**
   * Drawn in place of the upcoming cards when there are none (the owner's empty state, LAB-3218). With it, the
   * upcoming group is shown even when empty.
   */
  upcomingEmpty?: ReactNode;
}

/**
 * The member profile's Events section (LAB-3217): where can I meet this person, and have they been part of the network.
 * Two groups stacked: what the member is going to, and Past events. The section is always "Events" and each group
 * present has its small label (LAB-3230); with neither group, there is no section. The cards sit in one column, each
 * the section's full width (LAB-3234). Ported from `prototypes/entries/member-events-going/MemberEventsSection.tsx`.
 *
 * An upcoming card's title opens the event drawer; the drawer's "I'm going" ends in the D8 toast here.
 */
export function MemberEventsSection({
  firstName,
  isOwner,
  upcoming,
  upcomingTotal,
  past,
  pastTotal,
  headerAction,
  renderCardMenu,
  upcomingEmpty,
}: MemberEventsSectionProps) {
  const [drawer, setDrawer] = useState<{ eventUid: string; step?: EventDrawerStep } | null>(null);
  const [allUpcoming, setAllUpcoming] = useState(false);
  const [allPast, setAllPast] = useState(false);
  const prefetchEvent = usePrefetchEventDetail();

  const hasUpcoming = upcoming.length > 0 || !!upcomingEmpty;
  const hasPast = past.length > 0;
  if (!hasUpcoming && !hasPast) return null;

  const goingLabel = isOwner ? "You're going to" : `${firstName} is going to`;

  const upcomingShown = allUpcoming ? upcoming : upcoming.slice(0, VISIBLE_EVENTS_PER_GROUP);
  const pastShown = allPast ? past : past.slice(0, VISIBLE_EVENTS_PER_GROUP);

  return (
    <DetailsSection>
      <DetailsSectionHeader title="Events">{headerAction}</DetailsSectionHeader>

      <EventCardsPanel withLabels>
        {hasUpcoming && <EventGroupLabel>{goingLabel}</EventGroupLabel>}
        {upcoming.length > 0 && (
          <EventCardGrid label={goingLabel} columns={1}>
            {upcomingShown.map((event) => {
              const openDrawer = (step?: EventDrawerStep) => setDrawer({ eventUid: event.uid, step });
              const badges = event.viewerGoing && !isOwner ? <GoingMark label="You're going too" /> : undefined;
              return (
                <UpcomingEventCard
                  key={event.uid}
                  name={event.name}
                  startDate={event.startDate}
                  endDate={event.endDate}
                  city={event.city}
                  roles={event.roles}
                  faces={event.faces}
                  countLabel={`${event.goingCount} going`}
                  onOpen={() => openDrawer()}
                  onIntent={() => prefetchEvent(event.uid)}
                  menu={renderCardMenu?.(event, openDrawer)}
                  badges={badges}
                />
              );
            })}
          </EventCardGrid>
        )}
        {upcoming.length === 0 && upcomingEmpty}

        {!allUpcoming && upcomingTotal > VISIBLE_EVENTS_PER_GROUP && upcoming.length > VISIBLE_EVENTS_PER_GROUP && (
          <div>
            <Button style="link" variant="primary" underline={false} onClick={() => setAllUpcoming(true)}>
              Show all {upcomingTotal} upcoming events
            </Button>
          </div>
        )}

        {hasPast && <EventGroupLabel after={hasUpcoming}>Past events</EventGroupLabel>}
        {hasPast && (
          <EventCardGrid label="Past events" columns={1}>
            {pastShown.map((event) => (
              <PastEventCard
                key={event.uid}
                name={event.name}
                startDate={event.startDate}
                city={event.city}
                roles={event.roles}
              />
            ))}
          </EventCardGrid>
        )}

        {hasPast && !allPast && pastTotal > VISIBLE_EVENTS_PER_GROUP && past.length > VISIBLE_EVENTS_PER_GROUP && (
          <div>
            <Button style="link" variant="primary" underline={false} onClick={() => setAllPast(true)}>
              Show all {pastTotal} past events
            </Button>
          </div>
        )}
      </EventCardsPanel>

      <EventDrawer
        eventUid={drawer?.eventUid ?? null}
        initialStep={drawer?.step}
        source="member-profile"
        onClose={() => setDrawer(null)}
        onGoing={(notice) => toast.success(eventGoingToastText(notice))}
      />
    </DetailsSection>
  );
}
