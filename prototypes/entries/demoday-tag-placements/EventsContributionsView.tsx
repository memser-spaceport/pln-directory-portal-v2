'use client';

import Link from 'next/link';

import { Tooltip } from '@/components/core/tooltip/tooltip';
import { DetailsSection, DetailsSectionHeader } from '@/components/common/profile/DetailsSection';

import type { DemoDayContribution, EventRoleGroup } from './mocks';
import s from './EventsContributionsView.module.scss';

/** How the Demo Day contribution renders inside the Contributions block. */
export type DemoDayContribVariant = 'native' | 'feature' | 'banner';

interface Props {
  groups: EventRoleGroup[];
  /** When set, Demo Day participation is folded into the Contributions block. */
  demoDay?: DemoDayContribution | null;
  /** Which of the 3 Demo Day treatments to render. Default: 'native' — Demo Day
   *  as a normal event, the treatment used on the live team page. */
  variant?: DemoDayContribVariant;
}

/**
 * COPY-SIMPLIFY of production `TeamIrlContributions` (the "Contributions (N)"
 * Events block). Production styles via `<style jsx>` and pulls the auth store +
 * analytics + a modal; here it's a plain prop-driven view with those dropped.
 * Structure mirrors production 1:1: a "Contributions (N)" header over a single
 * bordered card whose rows are roles (icon + label) beside a wrap of event chips
 * (name + "MMM yyyy" date). Upcoming events get production's blue→teal accent.
 *
 * Demo Day participation is treated as a contribution here. The default ('native')
 * renders it as a normal event — same role-row + chip as Host/Sponsor — which is
 * what ships on the team page. 'feature' and 'banner' are louder alternates kept
 * in the placements sandbox for comparison.
 */
export function EventsContributionsView({ groups, demoDay, variant = 'native' }: Props) {
  const total = groups.reduce((n, g) => n + g.events.length, 0) + (demoDay ? 1 : 0);
  const showBanner = !!demoDay && variant === 'banner';
  const showFeatureRow = !!demoDay && variant === 'feature';
  const showNativeRow = !!demoDay && variant === 'native';

  return (
    <DetailsSection>
      <DetailsSectionHeader title={`Events (${total})`} />

      {/* Banner variant: a distinct gradient strip ABOVE the events table — reads
          as a program milestone adjacent to (not mixed into) the IRL events. */}
      {showBanner && <DemoDayBanner demoDay={demoDay} />}

      <div className={s.card}>
        {/* Feature variant: a highlighted full-width row pinned to the top of the
            same card, so it sits among the contributions but clearly leads them. */}
        {showFeatureRow && <DemoDayFeatureRow demoDay={demoDay} />}

        {groups.map((group) => (
          <div key={group.role} className={s.row}>
            <div className={s.roleCol}>
              <img src={`/icons/${group.icon}.svg`} alt="" aria-hidden="true" width={20} height={20} />
              <span>{group.role}</span>
            </div>
            <div className={s.eventArea}>
              {group.events.map((event) => (
                <Tooltip
                  key={event.uid}
                  asChild
                  align="start"
                  side="top"
                  content={event.name}
                  trigger={
                    <div className={`${s.eventChip} ${event.upcoming ? s.eventChipActive : ''}`}>
                      <div className={s.eventName}>{event.name}</div>
                      <div className={s.eventDate}>{event.date}</div>
                    </div>
                  }
                />
              ))}
            </div>
          </div>
        ))}

        {/* Native variant (default, ships on the team page): Demo Day as a normal
            event — a "Participant" role row (neutral rocket glyph) with one plain
            Demo Day chip, identical in weight to the Host/Sponsor chips. It links
            to the Demo Day; that's its only distinction, carried by hover, not colour. */}
        {showNativeRow && (
          <div className={`${s.row} ${s.rowLast}`}>
            <div className={s.roleCol}>
              <DemoDayRoleIcon />
              <span>{demoDay.role}</span>
            </div>
            <div className={s.eventArea}>
              <Tooltip
                asChild
                align="start"
                side="top"
                content={`Participated in ${demoDay.title}`}
                trigger={
                  <Link
                    href={`/demoday/${demoDay.slug}`}
                    className={`${s.eventChip} ${s.demoDayChip}`}
                    aria-label={`Participated in ${demoDay.title} — view demo day`}
                  >
                    <div className={s.eventName}>{demoDay.title}</div>
                    <div className={s.eventDate}>{demoDay.date}</div>
                  </Link>
                }
              />
            </div>
          </div>
        )}
      </div>
    </DetailsSection>
  );
}

/**
 * FEATURE ROW — the recommended treatment. A full-width highlighted row at the
 * top of the contributions card: rocket emblem, the Demo Day title + a
 * "role · cohort" line, and a trailing arrow signalling it deep-links. Uses a
 * faint gradient wash + gradient left rule so it reads as special without shouting.
 */
function DemoDayFeatureRow({ demoDay }: { demoDay: DemoDayContribution }) {
  return (
    <Link
      href={`/demoday/${demoDay.slug}`}
      className={s.featureRow}
      aria-label={`Participated in ${demoDay.title} — view demo day`}
    >
      <span className={s.featureEmblem} aria-hidden="true">
        <RocketGlyph />
      </span>
      <span className={s.featureText}>
        <span className={s.featureTitle}>{demoDay.title}</span>
        <span className={s.featureMeta}>
          {demoDay.role} · {demoDay.cohort}
        </span>
      </span>
      <span className={s.featureArrow} aria-hidden="true">
        <ArrowGlyph />
      </span>
    </Link>
  );
}

/**
 * BANNER — a distinct gradient strip sitting ABOVE the events table. Best for the
 * empty case (a team whose only contribution is Demo Day): no empty Host/Sponsor
 * table, just the banner. Reads as a program milestone rather than an IRL event.
 */
function DemoDayBanner({ demoDay }: { demoDay: DemoDayContribution }) {
  return (
    <Link
      href={`/demoday/${demoDay.slug}`}
      className={s.banner}
      aria-label={`Participated in ${demoDay.title} — view demo day`}
    >
      <span className={s.bannerEmblem} aria-hidden="true">
        <RocketGlyph />
      </span>
      <span className={s.bannerText}>
        <span className={s.bannerTitle}>Participated in {demoDay.title}</span>
        <span className={s.bannerMeta}>{demoDay.cohort}</span>
      </span>
      <span className={s.bannerCta}>
        View demo day
        <ArrowGlyph />
      </span>
    </Link>
  );
}

/**
 * Participant role icon — built in the EXACT construction of the production
 * Host / Sponsor / Attendee role icons (`public/icons/*_icon.svg`): a 20×20
 * rounded gradient tile, a white inner hairline (`stroke-opacity 0.4`), and a
 * white glyph. Uses the Demo Day blue→green gradient so it belongs to the same
 * icon family while staying recognisable — the same way Host (purple) and
 * Sponsor (orange) are told apart. The glyph is the Demo Day rocket, scaled to
 * sit at the family's glyph size inside the tile.
 */
const DemoDayRoleIcon = () => (
  <svg
    className={s.roleIcon}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect width="20" height="20" rx="4" fill="url(#ddRoleGrad)" />
    <rect x="0.5" y="0.5" width="19" height="19" rx="3.5" stroke="white" strokeOpacity="0.4" />
    <g
      transform="translate(3 3) scale(0.583)"
      stroke="white"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
      <path d="M12 15 9 12a11 11 0 0 1 2.5-6.5C13.4 3.1 16.5 2.9 19.6 3c.36 0 .66.3.66.66.1 3.1-.1 6.2-2.51 8.1A11 11 0 0 1 12 15Z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </g>
    <defs>
      <linearGradient id="ddRoleGrad" x1="1.4" y1="0" x2="22.06" y2="2.6" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1b4dff" />
        <stop offset="1" stopColor="#4cee8c" />
      </linearGradient>
    </defs>
  </svg>
);

/** Rocket glyph for the Demo Day feature / banner emblems (no rocket exists in the icon set). */
const RocketGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 15 9 12a11 11 0 0 1 2.5-6.5C13.4 3.1 16.5 2.9 19.6 3c.36 0 .66.3.66.66.1 3.1-.1 6.2-2.51 8.1A11 11 0 0 1 12 15Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Chevron affordance signalling the row / banner links out. */
const ArrowGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
