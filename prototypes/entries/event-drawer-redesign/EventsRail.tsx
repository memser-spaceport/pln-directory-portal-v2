'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import jobsCss from '@/components/page/jobs/TeamGroupCard/TeamGroupCard.module.scss';
import { ArrowIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';

import { FollowToast } from '../follow-shared/FollowToast';
import agentCss from '../home-v2-b/AgentPanel.module.scss';
import local from '../home-refactor/HomeRefactorPrototype.module.scss';
import feed from '../newsfeed/Newsfeed.module.scss';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import { EventRow, GoingMark } from '../member-events-going/EventRow';
import { useGoing } from '../member-events-going/goingStore';
import { HOME_RAIL_EVENTS, TOTAL_UPCOMING_EVENTS } from '../member-events-going/mocks';
import going_s from '../member-events-going/MemberEventsGoing.module.scss';

import { EventDrawer, type EventNotice } from './EventDrawer';

const RAIL_UIDS = HOME_RAIL_EVENTS.map((e) => e.uid);

/**
 * Home's Upcoming events (`member-events-going/HomeEventsRail`, row for row),
 * opening the redesigned drawer instead of the gathering modal. Previous / next
 * in the drawer walk these four rows. "See all" goes to this entry's Events page.
 */
export function EventsRail({ eventsHref }: { eventsHref: string }) {
  const going = useGoing('owner');
  const [openUid, setOpenUid] = useState<string | null>(null);
  const [notice, setNotice] = useState<EventNotice | null>(null);

  /* Home's floating Agent button sits above every overlay and would cover the
     drawer's pinned Save; it steps aside while an event is open. */
  useEffect(() => {
    const fabs = Array.from(document.querySelectorAll<HTMLElement>(`.${agentCss.fab}`));
    fabs.forEach((el) => (el.style.visibility = openUid ? 'hidden' : ''));
    return () => fabs.forEach((el) => (el.style.visibility = ''));
  }, [openUid]);

  const onNotice = (next: EventNotice) => {
    setNotice(next);
    setTimeout(() => setNotice(null), 6000);
  };

  return (
    <section className={clsx(s.card, v0.railCard)} aria-labelledby="home-events-title">
      <div className={local.railHead}>
        <h2 id="home-events-title" className={v0.railTitle}>
          Upcoming events
        </h2>
      </div>

      <ul className={feed.roleList}>
        {HOME_RAIL_EVENTS.map((event) => (
          <EventRow
            key={event.uid}
            event={event}
            onOpen={() => setOpenUid(event.uid)}
            trailing={
              going[event.uid] ? (
                <GoingMark />
              ) : (
                <span className={feed.roleArrow} aria-hidden>
                  <ArrowIcon />
                </span>
              )
            }
          />
        ))}
      </ul>

      <Link href={eventsHref} className={clsx(jobsCss.expander, v0.viewAllExpander)}>
        See all {TOTAL_UPCOMING_EVENTS} events
      </Link>

      <EventDrawer
        eventUid={openUid}
        sequence={RAIL_UIDS}
        onNavigate={setOpenUid}
        onClose={() => setOpenUid(null)}
        onNotice={onNotice}
      />

      {notice && (
        <FollowToast>
          {notice.onProfile ? (
            <>
              <strong>{notice.eventName}</strong> is on your profile.{' '}
              <Link href="/prototypes/member-events-going" className={going_s.toastLink}>
                View profile
              </Link>
            </>
          ) : (
            <>
              You&apos;re going to <strong>{notice.eventName}</strong>.
            </>
          )}
        </FollowToast>
      )}
    </section>
  );
}
