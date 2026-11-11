'use client';

import { useMemo, useState } from 'react';

import { useEventsAnalytics } from '@/analytics/events.analytics';
import { Button } from '@/components/common/Button';
import { DetailsSectionGreyContentContainer } from '@/components/common/profile/DetailsSection';
import { ConfirmDialog } from '@/components/core/ConfirmDialog';
import { toast } from '@/components/core/ToastContainer';
import { EventDrawer, eventGoingToastText } from '@/components/page/events/EventDrawer';
import { useIrlGoingAccess } from '@/services/access-control/hooks/useIrlGoingAccess';
import { useRemoveGoing, useSetShowOnProfile } from '@/services/events/hooks/useEventDrawerMutations';
import { useMyUpcomingEventUids } from '@/services/events/hooks/useMyUpcomingEventUids';
import type { MemberProfileEvent } from '@/services/events/profile-events.types';

import { AddEventPicker } from './AddEventPicker';
import { EventCardMenu } from './EventCardMenu';
import { MemberEventsSection, type MemberEventsSectionProps } from './MemberEventsSection';
import { OnlyVisibleToYouPill } from './OnlyVisibleToYouPill';
import s from './OwnerControls.module.scss';

export type OwnerMemberEventsSectionProps = Omit<
  MemberEventsSectionProps,
  'isOwner' | 'headerAction' | 'renderCardMenu' | 'renderCardBadges' | 'upcomingEmpty'
> & {
  /** The owner's uid: removing attendance names the member. */
  memberUid: string;
};

/**
 * The member Events section on the member's own profile (LAB-3218): the viewer section (LAB-3217) plus the owner's
 * controls, ported from `prototypes/entries/member-events-going/MemberEventsSection.tsx`.
 *
 * - "Add event" (with the write permission) sits in the header when there are upcoming events, else in the upcoming
 *   group's empty state. It opens "Add an event you're going to"; a chosen event opens the drawer (`add-event`).
 * - Each upcoming card has a ⋯ menu: Edit details (the drawer's plans step), Hide / Show (no confirm), Remove (confirm,
 *   then "Removed <event>.").
 * - A hidden event carries "Only visible to you".
 *
 * Nothing is optimistic: a card changes once the profile's read comes back, and a failed write says so in a toast and
 * leaves the card as it was.
 */
export function OwnerMemberEventsSection({ memberUid, upcoming, ...rest }: OwnerMemberEventsSectionProps) {
  const analytics = useEventsAnalytics();
  const { canWrite } = useIrlGoingAccess();
  const setShowOnProfile = useSetShowOnProfile();
  const removeGoing = useRemoveGoing();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [addingUid, setAddingUid] = useState<string | null>(null);
  const [removing, setRemoving] = useState<MemberProfileEvent | null>(null);

  // Events the owner already has, hidden ones too: the profile's list, and the viewer's full upcoming list in case the
  // profile's is cut short. The picker leaves them out.
  const { data: myUpcomingUids } = useMyUpcomingEventUids(pickerOpen);
  const ownedUids = useMemo(
    () => new Set([...upcoming.map((event) => event.uid), ...(Array.isArray(myUpcomingUids) ? myUpcomingUids : [])]),
    [upcoming, myUpcomingUids],
  );

  const openPicker = (from: 'header' | 'empty-state') => {
    analytics.onProfileEventAddClicked({ from });
    setPickerOpen(true);
  };

  const toggleShown = (event: MemberProfileEvent) => {
    const showOnProfile = !event.showOnProfile;
    analytics.onEventShowOnProfileToggled({ eventUid: event.uid, showOnProfile, from: 'profile-menu' });
    setShowOnProfile.mutate(
      { eventUid: event.uid, showOnProfile },
      {
        onError: () =>
          toast.error(
            showOnProfile
              ? `We couldn't show ${event.name} on your profile. Try again.`
              : `We couldn't hide ${event.name} from your profile. Try again.`,
          ),
      },
    );
  };

  const confirmRemove = () => {
    const event = removing;
    if (!event) return;
    if (!event.locationUid) {
      setRemoving(null);
      toast.error(`We couldn't remove ${event.name}. Try again.`);
      return;
    }
    removeGoing.mutate(
      { locationUid: event.locationUid, memberUid, eventUids: [event.uid] },
      {
        onSuccess: () => {
          analytics.onProfileEventRemoved({ eventUid: event.uid });
          toast.success(`Removed ${event.name}.`);
        },
        onError: () => toast.error(`We couldn't remove ${event.name}. Try again.`),
        onSettled: () => setRemoving(null),
      },
    );
  };

  const headerAction =
    canWrite && upcoming.length > 0 ? (
      <Button style="link" variant="primary" underline={false} onClick={() => openPicker('header')}>
        Add event
      </Button>
    ) : undefined;

  const upcomingEmpty = canWrite ? (
    <DetailsSectionGreyContentContainer>
      <div className={s.empty}>
        <span className={s.emptyText}>No upcoming events on your profile yet.</span>
        <Button size="xs" style="border" variant="primary" onClick={() => openPicker('empty-state')}>
          Add event
        </Button>
      </div>
    </DetailsSectionGreyContentContainer>
  ) : undefined;

  return (
    <>
      <MemberEventsSection
        {...rest}
        isOwner
        upcoming={upcoming}
        headerAction={headerAction}
        upcomingEmpty={upcomingEmpty}
        renderCardBadges={(event) => (event.showOnProfile ? null : <OnlyVisibleToYouPill />)}
        renderCardMenu={(event, openDrawer) => (
          <EventCardMenu
            eventName={event.name}
            shown={event.showOnProfile}
            canWrite={canWrite}
            onEdit={() => openDrawer('plans')}
            onToggle={() => toggleShown(event)}
            onRemove={() => setRemoving(event)}
          />
        )}
      />

      <AddEventPicker
        isOpen={pickerOpen}
        excludeUids={ownedUids}
        onClose={() => setPickerOpen(false)}
        onPick={(eventUid) => {
          setPickerOpen(false);
          setAddingUid(eventUid);
        }}
      />

      <EventDrawer
        eventUid={addingUid}
        source="add-event"
        onClose={() => setAddingUid(null)}
        onGoing={(notice) => toast.success(eventGoingToastText(notice))}
      />

      <ConfirmDialog
        isOpen={!!removing}
        title={`Remove ${removing?.name ?? 'this event'}?`}
        desc="You'll come off the list of people going, and it leaves your profile."
        confirmTitle="Remove"
        disabled={removeGoing.isPending}
        onClose={() => {
          if (!removeGoing.isPending) setRemoving(null);
        }}
        onConfirm={confirmRemove}
      />
    </>
  );
}
