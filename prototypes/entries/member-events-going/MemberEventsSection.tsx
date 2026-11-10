'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { Menu } from '@base-ui-components/react/menu';

import { Button } from '@/components/common/Button';
import {
  DetailsSection,
  DetailsSectionGreyContentContainer,
  DetailsSectionHeader,
} from '@/components/common/profile/DetailsSection';
import { ConfirmDialog } from '@/components/core/ConfirmDialog';
import menu from '@/components/page/home/TeamNews/components/NewsShareMenu/NewsShareMenu.module.scss';

import { FollowToast } from '../follow-shared/FollowToast';
import memberProfile from '../member-profile/MemberProfile.module.scss';
import { PlTeamOnlyPill } from '../profile-shared/PlTeamOnlyPill';
import feed from '../newsfeed/Newsfeed.module.scss';
import tiles from '../team-profile/TeamContributions.module.scss';

import { EventRow } from './EventRow';
import { GatheringModal, type GatheringTarget } from './GatheringModal';
import { removeGoing, setShowOnProfile, useGoing } from './goingStore';
import { GOING_EVENTS, PAST_EVENTS, gatheringOf, type GoingEvent, type PastEvent } from './mocks';
import s from './MemberEventsGoing.module.scss';

export type ProfileViewer = 'owner' | 'member' | 'signed-out';

const VISIBLE_PAST = 4;

const MUTED_ROLE: Record<string, string> = {
  Host: tiles.roleTagMutedHost,
  Speaker: tiles.roleTagMutedSpeaker,
  Sponsor: tiles.roleTagMutedSponsor,
};

/** Upcoming rows this viewer may see. Plans are for signed-in members only. */
export function useVisibleUpcoming(viewer: ProfileViewer): GoingEvent[] {
  const going = useGoing('owner');
  if (viewer === 'signed-out') return [];
  return GOING_EVENTS.filter((e) => going[e.uid] && (viewer === 'owner' || going[e.uid].showOnProfile));
}

/**
 * Production's IRL Contributions, extended rather than joined by a sibling:
 * one Events section, plans on top, history below.
 *
 * The host moves this section up under Office Hours while there are plans, so a
 * trip someone could act on isn't below Experience and Repositories (see the
 * entry). Past events are one-line rows, so a long name isn't cropped by a
 * quarter-width tile, and don't link, because the page production links them to
 * is admin-only now. A role is only drawn when it isn't plain attendance.
 */
export function MemberEventsSection({ viewer, firstName }: { viewer: ProfileViewer; firstName: string }) {
  const going = useGoing('owner');
  const upcoming = useVisibleUpcoming(viewer);
  const isOwner = viewer === 'owner';

  const [target, setTarget] = useState<GatheringTarget | null>(null);
  const [removing, setRemoving] = useState<GoingEvent | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [allPast, setAllPast] = useState(false);

  const flash = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(null), 4000);
  };

  const hasPast = PAST_EVENTS.length > 0;
  if (!isOwner && upcoming.length === 0 && !hasPast) return null;

  const overflow = PAST_EVENTS.length - VISIBLE_PAST;
  const pastShown = allPast || overflow <= 0 ? PAST_EVENTS : PAST_EVENTS.slice(0, VISIBLE_PAST);

  return (
    <DetailsSection classes={{ root: memberProfile.card }}>
      <DetailsSectionHeader title="Events">
        {isOwner && upcoming.length > 0 && (
          <Button style="link" variant="primary" underline={false} onClick={() => setTarget({ kind: 'pick' })}>
            Add event
          </Button>
        )}
      </DetailsSectionHeader>

      <div className={s.groups}>
        {upcoming.length > 0 && (
          <div className={s.group}>
            <h3 className={s.groupLabel}>{isOwner ? "You're going to" : `${firstName} is going to`}</h3>
            <ul className={feed.roleList}>
              {upcoming.map((event) => {
                const entry = going[event.uid];
                const roles = entry.roles.filter((r) => r !== 'Attendee');
                return (
                  <EventRow
                    key={event.uid}
                    event={event}
                    onOpen={() => setTarget({ kind: 'event', eventUid: event.uid })}
                    meta={event.startDate === event.endDate ? gatheringOf(event).city : undefined}
                    badges={
                      roles.length > 0 || (isOwner && !entry.showOnProfile) ? (
                        <>
                          {isOwner && !entry.showOnProfile && <PlTeamOnlyPill />}
                          {roles.map((role) => (
                            <span key={role} className={clsx(tiles.roleTag, MUTED_ROLE[role])}>
                              {role}
                            </span>
                          ))}
                        </>
                      ) : undefined
                    }
                    trailing={
                      isOwner ? (
                        <RowMenu
                          event={event}
                          shown={entry.showOnProfile}
                          onEdit={() => setTarget({ kind: 'event', eventUid: event.uid })}
                          onToggle={() => setShowOnProfile('owner', event.uid, !entry.showOnProfile)}
                          onRemove={() => setRemoving(event)}
                        />
                      ) : undefined
                    }
                  />
                );
              })}
            </ul>
          </div>
        )}

        {upcoming.length === 0 && isOwner && (
          <DetailsSectionGreyContentContainer>
            <div className={s.empty}>
              <span className={s.emptyText}>No upcoming events on your profile yet.</span>
              <Button size="xs" style="border" variant="primary" onClick={() => setTarget({ kind: 'pick' })}>
                Add event
              </Button>
            </div>
          </DetailsSectionGreyContentContainer>
        )}

        {hasPast && (
          <div className={s.group}>
            <h3 className={s.groupLabel}>Past events</h3>
            <ul className={s.pastList}>
              {pastShown.map((event) => (
                <PastRow key={event.uid} event={event} />
              ))}
            </ul>
            {!allPast && overflow > 0 && (
              <div>
                <Button style="link" variant="primary" underline={false} onClick={() => setAllPast(true)}>
                  Show all {PAST_EVENTS.length} past events
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <GatheringModal
        target={target}
        scope={isOwner ? 'owner' : 'visitor'}
        onClose={() => setTarget(null)}
        onNotice={({ eventName, onProfile }) =>
          flash(onProfile && isOwner ? `${eventName} is on your profile.` : `You're going to ${eventName}.`)
        }
      />

      <ConfirmDialog
        isOpen={!!removing}
        title={`Remove ${removing?.name ?? 'this event'}?`}
        desc="You'll come off the list of people going, and it leaves your profile."
        confirmTitle="Remove"
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) {
            removeGoing('owner', removing.uid);
            flash(`Removed ${removing.name}.`);
          }
          setRemoving(null);
        }}
      />

      {notice && <FollowToast>{notice}</FollowToast>}
    </DetailsSection>
  );
}

/** Same reading order as an upcoming row (name, then the role at the end), one line because it's history. */
function PastRow({ event }: { event: PastEvent }) {
  return (
    <li className={s.pastRow}>
      <span className={s.pastName}>{event.name}</span>
      {event.roles.map((role) => (
        <span key={role} className={clsx(tiles.roleTag, MUTED_ROLE[role], s.pastRole)}>
          {role}
        </span>
      ))}
      <span className={s.pastDate}>{event.date}</span>
    </li>
  );
}

/** The owner's rare presses, behind one icon, in production's Edit / Remove order. */
function RowMenu({
  event,
  shown,
  onEdit,
  onToggle,
  onRemove,
}: {
  event: GoingEvent;
  shown: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger className={menu.iconTrigger} aria-label={`Actions for ${event.name}`}>
        <DotsIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={menu.positioner} side="bottom" align="end" sideOffset={6}>
          <Menu.Popup className={menu.popup}>
            <Menu.Item className={menu.item} onClick={onEdit}>
              Edit details
            </Menu.Item>
            <Menu.Item className={menu.item} onClick={onToggle}>
              {shown ? 'Hide from my profile' : 'Show on my profile'}
            </Menu.Item>
            <Menu.Item className={clsx(menu.item, s.menuDanger)} onClick={onRemove}>
              Remove
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

const DotsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="3" cy="8" r="1.5" fill="currentColor" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    <circle cx="13" cy="8" r="1.5" fill="currentColor" />
  </svg>
);
