'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useState } from 'react';

import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import jobsCss from '@/components/page/jobs/TeamGroupCard/TeamGroupCard.module.scss';
import { ArrowIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';

import { FollowToast } from '../follow-shared/FollowToast';
import local from '../home-refactor/HomeRefactorPrototype.module.scss';
import feed from '../newsfeed/Newsfeed.module.scss';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';

import { EventRow, GoingMark } from './EventRow';
import { GatheringModal, type GatheringNotice, type GatheringTarget } from './GatheringModal';
import { useGoing } from './goingStore';
import { HOME_RAIL_EVENTS, TOTAL_UPCOMING_EVENTS } from './mocks';
import going_s from './MemberEventsGoing.module.scss';

/**
 * Home's Upcoming events (`home-refactor/EventsRail`), with each row opening
 * the gathering modal over Home. The row asks nothing itself: an "I'm going"
 * button here would only open a modal asking the same question.
 */
export function HomeEventsRail() {
  const going = useGoing('owner');
  const [target, setTarget] = useState<GatheringTarget | null>(null);
  const [notice, setNotice] = useState<GatheringNotice | null>(null);

  const onNotice = (next: GatheringNotice) => {
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
            onOpen={() => setTarget({ kind: 'event', eventUid: event.uid })}
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

      <a href="/events/all" className={clsx(jobsCss.expander, v0.viewAllExpander)}>
        See all {TOTAL_UPCOMING_EVENTS} events
      </a>

      <GatheringModal target={target} scope="owner" onClose={() => setTarget(null)} onNotice={onNotice} />

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
