'use client';

import { useState } from 'react';

import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { Drawer } from '@/components/common/Drawer';
import { CheckIcon } from '@/components/icons';

import { day, initials, month, type Attendee, type UpcomingEvent } from './mocks';
import s from './GoingEvents.module.scss';

const VISIBLE_ATTENDEES = 6;

/**
 * The current event drawer, kept as it is (the refactor is out of scope), with
 * two additions from the Nov 10 review: an "I'm going" button and the list of
 * people going.
 *
 * Production has no event drawer in this repo (Home links events to the
 * pln-events calendar), so the shell is production's `Drawer` and the body is
 * the plain event facts. Only the two additions are the design proposal.
 */
export function EventDrawer({
  event,
  going,
  showOnProfile,
  you,
  onClose,
  onGoing,
  onNotGoing,
  onShowOnProfile,
}: {
  event: UpcomingEvent | null;
  going: boolean;
  showOnProfile: boolean;
  you: Attendee;
  onClose: () => void;
  onGoing: () => void;
  onNotGoing: () => void;
  onShowOnProfile: (value: boolean) => void;
}) {
  const [allPeople, setAllPeople] = useState(false);
  if (!event) return null;

  const people = going ? [you, ...event.attendees] : event.attendees;
  const shown = allPeople ? people : people.slice(0, VISIBLE_ATTENDEES);
  const rest = people.length - shown.length;

  return (
    <Drawer isOpen onClose={onClose} width={480}>
      <div className={s.drawer}>
        <div className={s.drawerHeader}>
          <span className={s.dateTile} aria-hidden>
            <span className={s.dateMonth}>{month(event.startDate)}</span>
            <span className={s.dateDay}>{day(event.startDate)}</span>
          </span>
          <div className={s.drawerTitleBox}>
            <h2 className={s.drawerTitle}>{event.name}</h2>
            <span className={s.drawerMeta}>
              {event.range} · {event.city}
            </span>
          </div>
          <button type="button" className={s.iconButton} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <p className={s.drawerAbout}>{event.about}</p>

        {/* Addition 1: the answer, at the top, where the reader decides. */}
        <div className={s.goingBox}>
          {going ? (
            <>
              <div className={s.goingRow}>
                <span className={s.goingMark}>
                  <CheckIcon aria-hidden="true" />
                  You&apos;re going
                </span>
                <Button size="xs" style="link" variant="neutral" underline={false} onClick={onNotGoing}>
                  I&apos;m not going
                </Button>
              </div>
              <label className={s.consent}>
                <Checkbox checked={showOnProfile} onChange={onShowOnProfile} aria-label="Show on my profile" />
                <span>Show on my profile</span>
              </label>
            </>
          ) : (
            <div className={s.goingRow}>
              <span className={s.goingPrompt}>Are you going to this event?</span>
              <Button size="s" style="fill" variant="primary" onClick={onGoing}>
                I&apos;m going
              </Button>
            </div>
          )}
        </div>

        {/* Addition 2: who else is going. */}
        <section className={s.attendees} aria-labelledby="lab3206-attendees">
          <h3 id="lab3206-attendees" className={s.groupLabel}>
            {people.length} {people.length === 1 ? 'person' : 'people'} going
          </h3>
          <ul className={s.peopleList}>
            {shown.map((person) => (
              <li key={person.uid} className={s.person}>
                <span className={s.avatar} aria-hidden>
                  {initials(person.name)}
                </span>
                <span className={s.personText}>
                  <span className={s.personName}>{person.name}</span>
                  <span className={s.personTeam}>{person.team}</span>
                </span>
              </li>
            ))}
          </ul>
          {rest > 0 && (
            <div>
              <Button size="xs" style="link" variant="primary" underline={false} onClick={() => setAllPeople(true)}>
                Show all {people.length}
              </Button>
            </div>
          )}
        </section>
      </div>
    </Drawer>
  );
}

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
