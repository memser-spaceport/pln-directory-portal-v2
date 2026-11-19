'use client';

import clsx from 'clsx';
import Link from 'next/link';
import type { ReactNode } from 'react';

import grey from '@/components/common/profile/DetailsSection/components/DetailsSectionGreyContentContainer/DetailsSectionGreyContentContainer.module.scss';
import { CheckIcon } from '@/components/icons';
import { eventDay, eventMonth, eventRange } from '@/components/page/home/HomeV2/utils/upcomingEvents';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { ProfileEventPerson, ProfileEventRole } from '@/services/events/profile-events.types';

import s from './EventCards.module.scss';

/*
 * The cards of the profile Events sections (LAB-3211): the member profile's (LAB-3217, LAB-3218) and the team
 * profile's (LAB-3219). Ported from `prototypes/entries/member-events-going/MemberEventsSection.tsx`.
 *
 * Dates are drawn in UTC, as Home's rail draws them: the API's events carry no time zone.
 */

/** "Nov 3", for a one-day event's accessible name (UTC, like the tile). */
const SHORT_DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

const ROLE_CLASS: Record<ProfileEventRole, string> = {
  Host: s.roleTagHost,
  Speaker: s.roleTagSpeaker,
  Sponsor: s.roleTagSponsor,
};

/** A role that isn't plain attendance, as a muted pill. */
export function EventRoleTag({ role }: { role: ProfileEventRole }) {
  return <span className={clsx(s.roleTag, ROLE_CLASS[role])}>{role}</span>;
}

/** "You're going too": a fact in text, not a second button. */
export function GoingMark({ label = 'Going' }: { label?: string }) {
  return (
    <span className={s.goingMark}>
      <CheckIcon aria-hidden="true" />
      {label}
    </span>
  );
}

/**
 * A group's cards: two columns, one on mobile. `columns={1}` keeps one column everywhere, every card the full width
 * (the member profile, LAB-3234, and the team profile, LAB-3240: no half-empty row, all cards one length).
 */
export function EventCardGrid({
  label,
  columns = 2,
  children,
}: {
  label: string;
  columns?: 1 | 2;
  children: ReactNode;
}) {
  return (
    <ul className={clsx(s.cards, columns === 1 && s.cardsSingle)} aria-label={label}>
      {children}
    </ul>
  );
}

export interface UpcomingEventCardProps {
  name: string;
  /** ISO timestamps. */
  startDate: string;
  endDate: string;
  city: string | null;
  /** Only roles that aren't plain attendance. */
  roles: ProfileEventRole[];
  /** Up to three. */
  faces: ProfileEventPerson[];
  /** The foot's count: "12 going" on a member, "3 from Lighthouse" on a team. */
  countLabel: string;
  /** The title's press, which covers the card: opens the event drawer. */
  onOpen: () => void;
  /** Pointer over or focus on the press, before it happens: prefetch the event so the drawer opens filled. */
  onIntent?: () => void;
  /** Top right, above the card's press (the owner's ⋯ menu). */
  menu?: ReactNode;
  /** The foot's right side, above the card's press ("You're going too"). */
  badges?: ReactNode;
}

/**
 * One upcoming event: date tile, title, then "range · city" (the tile already says a single day) and roles, and a foot
 * with faces and the count. The title is the card's one press; `menu` and `badges` sit above it.
 */
export function UpcomingEventCard({
  name,
  startDate,
  endDate,
  city,
  roles,
  faces,
  countLabel,
  onOpen,
  onIntent,
  menu,
  badges,
}: UpcomingEventCardProps) {
  const range = eventRange(startDate, endDate);
  const when = range ?? SHORT_DATE.format(new Date(startDate));
  const meta = [range, city].filter(Boolean).join(' · ');

  return (
    <li className={clsx(grey.root, s.card)}>
      <span className={s.dateTile} aria-hidden>
        <span className={s.dateMonth}>{eventMonth(startDate)}</span>
        <span className={s.dateDay}>{eventDay(startDate)}</span>
      </span>

      <div className={s.cardBody}>
        <div className={s.cardHead}>
          <button
            type="button"
            className={s.cardTitle}
            onClick={onOpen}
            onPointerEnter={onIntent}
            onFocus={onIntent}
            aria-label={`${name}, ${when}`}
          >
            {name}
          </button>
          {menu && <span className={s.cardMenu}>{menu}</span>}
        </div>

        {(meta || roles.length > 0) && (
          <div className={s.cardMeta}>
            {meta && <span>{meta}</span>}
            {roles.map((role) => (
              <EventRoleTag key={role} role={role} />
            ))}
          </div>
        )}

        <div className={s.cardFoot}>
          <span className={s.people}>
            {faces.length > 0 && (
              <span className={s.faces} aria-hidden>
                {faces.slice(0, 3).map((person) => (
                  <img key={person.uid} className={s.face} src={person.image || getDefaultAvatar(person.name)} alt="" />
                ))}
              </span>
            )}
            {countLabel}
          </span>
          {badges && <span className={s.cardBadges}>{badges}</span>}
        </div>
      </div>
    </li>
  );
}

export interface PastEventCardProps {
  name: string;
  /** ISO timestamp; the tile shows its month and year. */
  startDate: string;
  city: string | null;
  /** Only roles that aren't plain attendance. */
  roles: ProfileEventRole[];
  /**
   * A highlighted contribution (a team's Demo Day): the PL gradient ring and a gradient pill naming it, and the whole
   * card links to its page. Plain past cards aren't links: the page production linked them to is admin-only.
   */
  featured?: { label: string; href: string };
}

/** One past event: month and year in the tile, then the name, the city and any role. */
export function PastEventCard({ name, startDate, city, roles, featured }: PastEventCardProps) {
  return (
    <li className={clsx(grey.root, s.card, s.pastCard, featured && s.pastFeatured)}>
      <span className={s.dateTile}>
        <span className={s.dateMonth}>{eventMonth(startDate)}</span>
        <span className={clsx(s.dateDay, s.dateYear)}>{new Date(startDate).getUTCFullYear()}</span>
      </span>

      <div className={s.cardBody}>
        {featured ? (
          <Link href={featured.href} className={clsx(s.pastName, s.pastLink)}>
            {name}
          </Link>
        ) : (
          <span className={s.pastName}>{name}</span>
        )}
        {(featured || city || roles.length > 0) && (
          <div className={s.cardMeta}>
            {featured && <span className={clsx(s.roleTag, s.roleTagDemo)}>{featured.label}</span>}
            {city && <span>{city}</span>}
            {roles.map((role) => (
              <EventRoleTag key={role} role={role} />
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

/** The section body: the groups' stack. Without group labels it starts right under the section title. */
export function EventCardsPanel({ withLabels, children }: { withLabels: boolean; children: ReactNode }) {
  return <div className={clsx(s.panel, !withLabels && s.panelNoLabels)}>{children}</div>;
}

/** A group's small label ("Ana is going to", "Contributions"). `after` for the second group. */
export function EventGroupLabel({ after, children }: { after?: boolean; children: ReactNode }) {
  return <h3 className={clsx(s.groupLabel, after && s.groupLabelAfter)}>{children}</h3>;
}
