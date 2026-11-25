'use client';

import type { ReactNode } from 'react';

import { Button } from '@/components/common/Button';
import { CalendarBlankIcon } from '@/components/icons';
import {
  DetailsSection,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
} from '@/components/common/profile/DetailsSection';

import { EnvelopeGlyph } from '../intro-shared/EnvelopeGlyph';
import { RequestIntroButton } from '../intro-shared/RequestIntroButton';
import s from './ActionsArea.module.scss';

/**
 * LAB-3383 "One actions area" (2026-11-24) — shared by the member and team
 * profiles so the two pages draw one object.
 *
 * The ways to reach this person or team, in one card under the header: the
 * meeting flow and the intro flow as two separate options, each with the
 * sentence that says what it is next to its press. Decisions from the
 * 2026-11-23 standup:
 *   - Ask AI leaves the profile header (the LabOS Agent opens with the page
 *     as context, LAB-3302).
 *   - The Office Hours context stays beside Schedule Meeting: the option IS
 *     the Office Hours card's body (who it's with, what they can help with,
 *     past bookings), so a newcomer reads what the call is before the press.
 *   - Schedule Meeting and Request an intro are two flows: a meeting when you
 *     have something to discuss, an intro routed by PL staff when you want a
 *     warm introduction first.
 *
 * Chrome is production's: `DetailsSection` + `DetailsSectionHeader`, each
 * option in the grey inset (`DetailsSectionGreyContentContainer`) every
 * section's content sits in. Two grey boxes in one card are what make the
 * flows read as two choices rather than one block of text.
 *
 * Paint: exactly one brand fill in the card (design-thinking lessons 20, 25).
 * With office hours the booking press is the primary and the intro, when
 * shown, is the DS bordered neutral; alone, the intro is production's glossy
 * press, as it has been on the header since 2026-09-28.
 */
export function ActionsAreaCard({
  title,
  rootClassName,
  children,
}: {
  title: string;
  /** The host page's white-card class (member-profile's 20px sides). */
  rootClassName?: string;
  children: ReactNode;
}) {
  return (
    <DetailsSection classes={{ root: rootClassName }}>
      <DetailsSectionHeader title={title} />
      <div className={s.options}>{children}</div>
    </DetailsSection>
  );
}

/** One flow: a title, the line that says what it is, its press on the right (full width on a phone), and any detail under them. */
export function ActionsAreaOption({
  title,
  lede,
  press,
  children,
}: {
  title: string;
  lede: ReactNode;
  press?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <DetailsSectionGreyContentContainer>
      <div className={s.option}>
        <div className={s.optionHead}>
          <div className={s.optionText}>
            <p className={s.optionTitle}>{title}</p>
            <p className={s.optionLede}>{lede}</p>
          </div>
          {press && <div className={s.optionPress}>{press}</div>}
        </div>
        {children}
      </div>
    </DetailsSectionGreyContentContainer>
  );
}

/**
 * The intro flow. `primary`: the only option in the card, so production's
 * glossy press. Otherwise the DS bordered neutral beside a booking primary.
 * Sent: intro-shared's text receipt in both cases.
 */
export function IntroOption({
  lede,
  name,
  requested,
  onRequest,
  primary,
  size,
}: {
  lede: ReactNode;
  name: string;
  requested: boolean;
  onRequest: () => void;
  primary: boolean;
  size: 'xs' | 's';
}) {
  const press =
    primary || requested ? (
      <RequestIntroButton requested={requested} onClick={onRequest} name={name} size={size} className={s.fullOnPhone} />
    ) : (
      <Button
        style="border"
        variant="neutral"
        size={size}
        className={s.secondaryPress}
        aria-label={`Request an intro to ${name}`}
        onClick={onRequest}
      >
        <EnvelopeGlyph size={16} />
        <span>Request an intro</span>
      </Button>
    );
  return <ActionsAreaOption title="Intro via the PL team" lede={lede} press={press} />;
}

/** People on a team who take office hours: one row each, the booking press on the row (it books that person). */
export function OfficeHoursPeople({
  people,
  size,
}: {
  people: { name: string; role: string; helpWith: string; onBook: () => void }[];
  size: 'xs' | 's';
}) {
  return (
    <ul className={s.people}>
      {people.map((p) => (
        <li key={p.name} className={s.person}>
          <div className={s.personText}>
            <p className={s.personName}>
              {p.name} <span className={s.personRole}>· {p.role}</span>
            </p>
            <p className={s.personHelp}>Can help with {p.helpWith}</p>
          </div>
          <Button
            style="border"
            variant="primary"
            size={size}
            className={s.secondaryPress}
            aria-label={`Schedule a meeting with ${p.name}`}
            onClick={p.onBook}
          >
            {/* The DS calendar glyph Schedule Meeting wears on the member page. */}
            <CalendarBlankIcon className={s.pressGlyph} aria-hidden="true" />
            <span>Schedule Meeting</span>
          </Button>
        </li>
      ))}
    </ul>
  );
}
