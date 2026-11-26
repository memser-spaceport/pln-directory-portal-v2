'use client';

import clsx from 'clsx';
import { useState, type ReactNode } from 'react';

import { Badge } from '@/components/common/Badge';
import { ArrowUpRightIcon, GlobeIcon } from '@/components/icons';
import { SafeHtml } from '@/components/ui/SafeHtml';
import type { EventAccess, EventAgendaDay, EventDetail } from '@/services/events/event-drawer.types';
import { ENDED_ACCESS_COPY } from '@/services/events/event-ended';
import { ACCESS_COPY } from '@/services/events/event-facts';
import { eventWhen } from '@/services/events/event-when';
import { focusAreaName } from '@/services/events/focus-areas';
import { plainSpaces } from '@/utils/html/plainSpaces';

import e from './EventDrawer.module.scss';

const HTML_TAG = /<\/?[a-z][\s\S]*>/i;

/** Plain text keeps its paragraphs; HTML goes through the sanitiser with plain spaces, so its lines wrap. */
function Description({ text }: { text: string }) {
  if (HTML_TAG.test(text)) {
    return <SafeHtml html={plainSpaces(text)} className={e.paragraph} />;
  }
  const paragraphs = text
    .split(/\n\s*\n|\r\n\s*\r\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i} className={e.paragraph}>
          {p}
        </p>
      ))}
    </>
  );
}

/**
 * A web address the drawer may open in a new tab: the event's own page (LAB-3271), shown without the scheme, e.g.
 * "lu.ma/abc", and the venue's map link (LAB-3324). Anything that is not `http` or `https` gives null.
 */
export function eventLink(url: string | null): { href: string; label: string } | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    const label = `${parsed.host.replace(/^www\./, '')}${parsed.pathname === '/' ? '' : parsed.pathname}`;
    return { href: parsed.href, label };
  } catch {
    return null;
  }
}

/** "Protocol Labs", "A and B", "A, B and C". */
function HostNames({ hosts }: { hosts: string[] }) {
  return (
    <>
      {hosts.map((host, i) => (
        <span key={host}>
          {i > 0 && (i === hosts.length - 1 ? ' and ' : ', ')}
          <span className={e.hostName}>{host}</span>
        </span>
      ))}
    </>
  );
}

/**
 * The event, as Polina's redesigned drawer draws it (LAB-3361, `prototypes/entries/event-drawer-redesign`, her
 * 1032bf25d): the picture as a thumbnail beside the title and "Hosted by", then the facts (a date tile with the day
 * and the time in the event's zone, the place, the event's own page, the access), then `card` (the going card), then
 * About with its focus areas (LAB-3404) and its topics at the end, then Agenda. Plain section titles over hairlines; a block with no data is left out.
 *
 * Deviations from the prototype: hosts are names, not links (the Directory has no team for an event host); the place
 * is one line, the event's venue address or else its gathering's location, never "Others" (LAB-3458); a row with the
 * event's own page sits among the facts (LAB-3271, LAB-3333, LAB-3334); no "Part of the <city> gathering" (LAB-3283).
 * LAB-3324: with a map link, the place and its arrow open the map in a new tab; an online event never links.
 * LAB-3426: for an event that has ended, nothing here asks the reader to register or RSVP. LAB-3418: its day line
 * carries a year other than the current one. LAB-3454: the venue's instruction sits in small text under the venue line.
 * LAB-3451: the event's social handles, as links, close the facts.
 */
export function EventSummary({
  event,
  ended = false,
  card,
}: {
  event: EventDetail;
  ended?: boolean;
  card?: ReactNode;
}) {
  // One reading of the clock, so the line never changes while the drawer is open.
  const [now] = useState(() => Date.now());
  const when = eventWhen(event.startDate, event.endDate, event.timezone, event.allDay, ended ? now : undefined);
  const page = eventLink(event.eventUrl);
  const mapLink = eventLink(event.locationUrl);
  const online = event.mode === 'Virtual' || (event.mode === 'Hybrid' && !event.address);
  const accessCopy = event.access && (ended ? ENDED_ACCESS_COPY : ACCESS_COPY)[event.access];
  const access = event.access && accessCopy ? { kind: event.access, ...accessCopy } : null;
  const hasAbout = !!event.description || event.focusAreas.length > 0 || event.tags.length > 0;

  return (
    <>
      <section className={e.hero}>
        <div className={e.titleRow}>
          {event.image && <img className={e.logo} src={event.image} alt="" width={56} height={56} />}
          <div className={e.titleText}>
            <h2 className={e.title}>{event.name}</h2>
            {event.hosts.length > 0 && (
              <p className={e.hosts}>
                Hosted by <HostNames hosts={event.hosts} />
              </p>
            )}
          </div>
        </div>
      </section>

      <ul className={e.facts}>
        <li className={e.fact} data-testid="event-when">
          {when ? (
            <span className={e.dateTile} aria-hidden>
              <span className={e.dateMonth}>{when.month}</span>
              <span className={e.dateDay}>{when.day}</span>
            </span>
          ) : (
            <span className={e.factIcon} aria-hidden>
              <CalendarIcon />
            </span>
          )}
          <span className={e.factText}>
            <span className={e.factMain}>{when ? when.dayLine : event.dateLine}</span>
            {when && <span className={e.factSub}>{when.timeLine}</span>}
          </span>
        </li>

        {(online || event.address) && (
          <li className={e.fact} data-testid="event-place">
            <span className={e.factIcon} aria-hidden>
              {online ? <GlobeIcon width={20} height={20} /> : <PinIcon />}
            </span>
            <span className={e.factText}>
              {online ? (
                <span className={e.factMain}>Online</span>
              ) : mapLink ? (
                <a
                  className={clsx(e.factMain, e.factLink)}
                  href={mapLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {event.address}
                  <ArrowUpRightIcon width={14} height={14} />
                </a>
              ) : (
                <span className={e.factMain}>{event.address}</span>
              )}
              {online ? (
                <span className={e.factSub}>{ended ? 'Online event' : 'Link sent after you register'}</span>
              ) : (
                event.mode === 'Hybrid' && <span className={e.factSub}>Hybrid, also online</span>
              )}
              {!online && event.locationInstructions && (
                <span className={clsx(e.factSub, e.factNote)} data-testid="event-place-instruction">
                  {event.locationInstructions}
                </span>
              )}
            </span>
          </li>
        )}

        {page && (
          <li className={e.fact} data-testid="event-link-row">
            <span className={e.factIcon} aria-hidden>
              <ChainIcon />
            </span>
            <span className={e.factText}>
              <a
                className={clsx(e.factMain, e.factLink, e.factLinkText)}
                href={page.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {page.label}
              </a>
            </span>
          </li>
        )}

        {access && (
          <li className={e.fact} data-testid="event-access">
            <span className={e.factIcon} aria-hidden>
              <AccessIcon access={access.kind} />
            </span>
            <span className={e.factText}>
              <span className={e.factMain}>{access.main}</span>
              {access.sub && <span className={e.factSub}>{access.sub}</span>}
            </span>
          </li>
        )}

        {event.socials.length > 0 && (
          <li className={e.fact} data-testid="event-socials">
            <span className={e.factIcon} aria-hidden>
              <AtIcon />
            </span>
            <span className={e.factText}>
              <span className={e.factMain}>Social</span>
              <ul className={e.socialList}>
                {event.socials.map((social) => (
                  <li key={social.href} className={e.socialItem}>
                    <span className={e.factSub}>{`${social.platform}:`}</span>
                    <a
                      className={clsx(e.factSub, e.factLink, e.factLinkText)}
                      href={social.href}
                      {...(social.href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </span>
          </li>
        )}
      </ul>

      {card}

      {hasAbout && (
        <Section title="About">
          {event.description && <Description text={event.description} />}
          {event.focusAreas.length > 0 && (
            <TagGroup label="Focus areas" names={event.focusAreas.map(focusAreaName)} testId="event-focus-areas" />
          )}
          {event.tags.length > 0 && (
            <TagGroup
              label={event.focusAreas.length > 0 ? 'Topics' : undefined}
              names={event.tags.map((tag) => tag.name)}
              testId="event-tags"
            />
          )}
        </Section>
      )}

      {event.agenda.length > 0 && <Agenda agenda={event.agenda} />}
    </>
  );
}

/** Badges under a small label. Topics on their own have no label, as the prototype draws them. */
function TagGroup({ label, names, testId }: { label?: string; names: string[]; testId: string }) {
  return (
    <div className={e.tagGroup} data-testid={testId}>
      {label && <p className={e.tagGroupLabel}>{label}</p>}
      <div className={e.tags}>
        {names.map((name) => (
          <Badge key={name} className={e.tag}>
            {name}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function Section({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className={e.section}>
      <div className={e.sectionHead}>
        <h3 className={e.sectionTitle}>{title}</h3>
      </div>
      {children}
    </section>
  );
}

/** "Day 1 - 1st Dec Tue" → "Tue, 1st Dec" over the day's rows, as the prototype prints it. */
export function agendaDayTitle(day: string): string {
  const [, rest] = day.split(' - ');
  if (!rest) return day;
  const parts = rest.split(' ');
  return `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`;
}

function Agenda({ agenda }: { agenda: EventAgendaDay[] }) {
  return (
    <Section title="Agenda">
      {agenda.map((day) => (
        <div key={day.day} className={e.agendaDay}>
          {agenda.length > 1 && <p className={e.agendaDayTitle}>{agendaDayTitle(day.day)}</p>}
          <ul className={e.agendaList}>
            {day.items.map((item, i) => (
              <li key={`${item.time}-${i}`} className={e.agendaRow}>
                <span className={e.agendaTime}>{item.time.replace(' - ', ' – ')}</span>
                <span className={e.agendaText}>
                  <span className={e.agendaTitle}>{item.title}</span>
                  {item.about && <span className={e.agendaAbout}>{item.about}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Section>
  );
}

/* ---------- Glyphs the DS set doesn't have (stroked, 1.5px, as in the prototype) ---------- */

/** Lock for invite only, ticket for paid or RSVP (the prototype's `AccessIcon`). */
function AccessIcon({ access }: { access: EventAccess }) {
  if (access === 'INVITE ONLY') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <rect x="4" y="9" width="12" height="8.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M3 6.5A1.5 1.5 0 014.5 5h11A1.5 1.5 0 0117 6.5V8a2 2 0 000 4v1.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 13.5V12a2 2 0 000-4V6.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 5.5v9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1.5 2" />
    </svg>
  );
}

/** LAB-3451: the social handles' glyph. */
function AtIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M13 10v1.25a2.25 2.25 0 004.5 0V10A7.5 7.5 0 1014 16.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 17.5s5.5-4.6 5.5-9.25a5.5 5.5 0 10-11 0C4.5 12.9 10 17.5 10 17.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="8.25" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** The prototype toolbar's link glyph, at the facts' 20px. */
export function ChainIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M6.5 9.5l3-3M7 4.5l1.2-1.2a2.6 2.6 0 013.6 3.6L10.6 8.1M9 11.5l-1.2 1.2a2.6 2.6 0 01-3.6-3.6L5.4 7.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Only when the dates can't be read: the events app's own date line beside a calendar glyph. */
function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="3" y="4.5" width="14" height="12.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 8.5h14M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
