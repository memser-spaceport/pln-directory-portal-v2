'use client';

import type { ReactNode } from 'react';

import { SafeHtml } from '@/components/ui/SafeHtml';
import type { EventAccess, EventDetail } from '@/services/events/event-drawer.types';

import e from './EventDrawer.module.scss';

const HTML_TAG = /<\/?[a-z][\s\S]*>/i;

/** Plain text keeps its paragraphs; HTML from the events sync goes through the sanitiser. */
function Description({ text }: { text: string }) {
  if (HTML_TAG.test(text)) {
    return <SafeHtml html={text} className={e.paragraph} />;
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

/** The event's own page (LAB-3271), when it is a web address. Shown without the scheme, e.g. "lu.ma/abc". */
function eventLink(url: string | null): { href: string; label: string } | null {
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

/**
 * The event as the PL events app draws it, ported from `prototypes/entries/member-events-going/EventDetails.tsx`
 * (LAB-3216): "EVENT DETAILS", a 64px thumbnail of the event's picture, the title, date and place rows, tags, Host,
 * Description, Agenda. A block whose data is empty is left out. Icons are that app's own SVGs, inlined.
 *
 * LAB-3283: mode and access are facts, not badges (Polina's `event-drawer-redesign`, 2026-11-17). The place row says
 * "Online" for an online event and adds "also online" for a hybrid one; an access row, when the access is known,
 * says what it is and what it means for the guest.
 *
 * Deviation from the prototype: no region line under the address. The Directory stores only the gathering's
 * location text, not the venue's address and region.
 *
 * `beforeAgenda` is drawn between Description and Agenda: the drawer's "Are you going?" card (LAB-3225), where the
 * prototype puts it.
 *
 * LAB-3271: under the date and the address, a row with the event's own page (for example its Luma page), which
 * opens in a new tab. No page, no row.
 */
export function EventSummary({ event, beforeAgenda }: { event: EventDetail; beforeAgenda?: ReactNode }) {
  const link = eventLink(event.websiteUrl);
  const place = placeFact(event);
  const access = event.access ? { kind: event.access, ...ACCESS_FACT[event.access] } : null;
  return (
    <>
      <div className={e.head}>
        <span className={e.kicker}>EVENT DETAILS</span>
      </div>

      <div className={e.hero}>
        {event.image && <img className={e.thumb} src={event.image} alt="" width={64} height={64} />}
        <div className={e.heroText}>
          <h2 className={e.title}>{event.name}</h2>
          {event.dateLine && (
            <div className={e.factRow}>
              <CalendarIcon />
              <span className={e.fact}>{event.dateLine}</span>
            </div>
          )}
          {place && (
            <div className={e.factRow}>
              {place.online ? <GlobeIcon /> : <LocationIcon />}
              <span className={e.fact}>{place.text}</span>
            </div>
          )}
          {link && (
            <div className={e.factRow}>
              <GlobeIcon />
              <a className={e.eventLink} href={link.href} target="_blank" rel="noopener noreferrer">
                <span className={e.fact}>{link.label}</span> <LinkIcon />
              </a>
            </div>
          )}
          {access && (
            <div className={e.factRow} data-testid="event-access">
              <AccessIcon access={access.kind} />
              <span className={e.factStack}>
                <span className={e.fact}>{access.main}</span>
                <span className={e.factSub}>{access.sub}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {event.tags.length > 0 && (
        <div className={e.tags} data-testid="event-tags">
          {event.tags.map((tag) => (
            <span key={tag.name} className={e.tag} style={{ background: tag.background }}>
              <span className={e.tagHash} style={{ background: tag.icon }}>
                <HashIcon />
              </span>
              <span className={e.tagName}>{tag.name}</span>
            </span>
          ))}
        </div>
      )}

      {event.hosts.length > 0 && (
        <div className={e.block}>
          <Label icon={<HostIcon />} weight="medium">
            Host
          </Label>
          <div className={e.hosts}>
            {event.hosts.map((host) => (
              <span key={host} className={e.hostChip}>
                {host}
              </span>
            ))}
          </div>
        </div>
      )}

      {event.description && (
        <div className={e.block}>
          <Label icon={<DescriptionIcon />}>Description</Label>
          <Description text={event.description} />
        </div>
      )}

      {beforeAgenda}

      {event.agenda.length > 0 && (
        <div className={e.block}>
          <Label icon={<AgendaIcon />}>Agenda</Label>
          <div className={e.agenda}>
            {event.agenda.map((d) => (
              <div key={d.day} className={e.agendaDay}>
                <span className={e.agendaDayLabel}>{d.day}</span>
                {d.items.map((item, i) => (
                  <div key={`${item.time}-${i}`} className={e.agendaItem}>
                    <span className={e.agendaHead}>
                      {item.time} • {item.title}
                    </span>
                    {item.about && <span className={e.agendaAbout}>{item.about}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/** The panel's section label: icon, then a 14px label (bold, or medium for Host). */
function Label({
  icon,
  children,
  weight = 'bold',
}: {
  icon: ReactNode;
  children: ReactNode;
  weight?: 'bold' | 'medium';
}) {
  return (
    <div className={weight === 'bold' ? e.label : e.labelMedium}>
      {icon}
      <span>{children}</span>
    </div>
  );
}

/** The access fact as words: what it is, and what it means for the guest (`event-drawer-redesign/AccessIcon.tsx`). */
const ACCESS_FACT: Record<EventAccess, { main: string; sub: string }> = {
  'INVITE ONLY': { main: 'Invite only', sub: 'The hosts approve each guest' },
  PAID: { main: 'Paid', sub: "Tickets on the host's site" },
  'FREE w/ RSVP': { main: 'Free', sub: 'RSVP to save your spot' },
};

/** Where the event is: "Online", the address, or the address "· also online" for a hybrid event. */
function placeFact(event: EventDetail): { text: string; online: boolean } | null {
  if (event.mode === 'Virtual') return { text: 'Online', online: true };
  if (event.mode === 'Hybrid') {
    return event.address ? { text: `${event.address} · also online`, online: false } : { text: 'Online', online: true };
  }
  return event.address ? { text: event.address, online: false } : null;
}

/** Lock for invite only, ticket for paid or free. 1.5px stroke, like the prototype. */
function AccessIcon({ access }: { access: EventAccess }) {
  if (access === 'INVITE ONLY') {
    return (
      <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={e.factIcon}>
        <rect x="4" y="9" width="12" height="8.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={e.factIcon}>
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

export const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M13.5 8H2.5M2.5 8L7 3.5M2.5 8L7 12.5"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={e.factIcon}>
    <path
      d="M12 2.66699H4.00004C2.52728 2.66699 1.33337 3.8609 1.33337 5.33366V12.0003C1.33337 13.4731 2.52728 14.667 4.00004 14.667H12C13.4728 14.667 14.6667 13.4731 14.6667 12.0003V5.33366C14.6667 3.8609 13.4728 2.66699 12 2.66699Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.33337 1.3335V4.00016M10.6667 1.3335V4.00016M1.33337 6.66683H14.6667"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LocationIcon = () => (
  <svg width="15" height="15" viewBox="0 0 12 14" fill="none" aria-hidden="true" className={e.pinIcon}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.04006 1.64029C3.09032 0.590029 4.51477 0 6.00006 0C7.48535 0 8.9098 0.590029 9.96006 1.64029C11.0103 2.69054 11.6003 4.115 11.6003 5.60029C11.6003 7.08557 11.0103 8.51003 9.96006 9.56029L6.00006 13.5203L2.04006 9.56029C1.51999 9.04027 1.10745 8.4229 0.825987 7.74344C0.544525 7.06398 0.399658 6.33574 0.399658 5.60029C0.399658 4.86483 0.544525 4.13659 0.825987 3.45713C1.10745 2.77767 1.51999 2.1603 2.04006 1.64029ZM6.00006 7.20028C6.42441 7.20028 6.83137 7.03171 7.13143 6.73166C7.43149 6.4316 7.60006 6.02463 7.60006 5.60029C7.60006 5.17594 7.43149 4.76897 7.13143 4.46891C6.83137 4.16886 6.42441 4.00029 6.00006 4.00029C5.57572 4.00029 5.16875 4.16886 4.86869 4.46891C4.56863 4.76897 4.40006 5.17594 4.40006 5.60029C4.40006 6.02463 4.56863 6.4316 4.86869 6.73166C5.16875 7.03171 5.57572 7.20028 6.00006 7.20028Z"
      fill="currentColor"
    />
  </svg>
);

const GlobeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={e.factIcon}>
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M1.5 8H14.5M8 1.5C9.7 3.3 10.6 5.6 10.6 8C10.6 10.4 9.7 12.7 8 14.5C6.3 12.7 5.4 10.4 5.4 8C5.4 5.6 6.3 3.3 8 1.5Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
);

const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className={e.linkIcon}>
    <path
      d="M4.08203 9.91146L9.91536 4.07812"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.08203 4.07812H9.91536V9.91146"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M6 2.5L4.5 13.5M11.5 2.5L10 13.5M2.5 6H14M2 10.5H13.5"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const HostIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M18.0407 16.5646C16.8508 14.5076 15.0172 13.0326 12.8774 12.3334C13.9358 11.7033 14.7582 10.7431 15.2182 9.6004C15.6781 8.45768 15.7503 7.19556 15.4235 6.00787C15.0968 4.82018 14.3892 3.77259 13.4094 3.02597C12.4296 2.27936 11.2318 1.875 10 1.875C8.76821 1.875 7.57044 2.27936 6.59067 3.02597C5.6109 3.77259 4.90331 4.82018 4.57654 6.00787C4.24978 7.19556 4.32193 8.45768 4.78189 9.6004C5.24186 10.7431 6.06422 11.7033 7.12268 12.3334C4.98284 13.0318 3.14925 14.5068 1.9594 16.5646C1.91577 16.6358 1.88683 16.7149 1.87429 16.7975C1.86174 16.88 1.86585 16.9642 1.88638 17.0451C1.9069 17.126 1.94341 17.2019 1.99377 17.2685C2.04413 17.335 2.10731 17.3908 2.17958 17.4326C2.25185 17.4743 2.33175 17.5012 2.41457 17.5115C2.49738 17.5219 2.58143 17.5156 2.66176 17.4929C2.74209 17.4703 2.81708 17.4318 2.88228 17.3797C2.94749 17.3276 3.00161 17.263 3.04143 17.1896C4.51331 14.6459 7.11487 13.1271 10 13.1271C12.8852 13.1271 15.4867 14.6459 16.9586 17.1896C16.9985 17.263 17.0526 17.3276 17.1178 17.3797C17.183 17.4318 17.258 17.4703 17.3383 17.4929C17.4186 17.5156 17.5027 17.5219 17.5855 17.5115C17.6683 17.5012 17.7482 17.4743 17.8205 17.4326C17.8927 17.3908 17.9559 17.335 18.0063 17.2685C18.0566 17.2019 18.0932 17.126 18.1137 17.0451C18.1342 16.9642 18.1383 16.88 18.1258 16.7975C18.1132 16.7149 18.0843 16.6358 18.0407 16.5646ZM5.62503 7.50213C5.62503 6.63683 5.88162 5.79097 6.36235 5.07151C6.84308 4.35204 7.52636 3.79129 8.32579 3.46015C9.12522 3.12902 10.0049 3.04238 10.8535 3.21119C11.7022 3.38 12.4818 3.79668 13.0936 4.40853C13.7055 5.02039 14.1222 5.79994 14.291 6.64861C14.4598 7.49727 14.3731 8.37694 14.042 9.17637C13.7109 9.97579 13.1501 10.6591 12.4306 11.1398C11.7112 11.6205 10.8653 11.8771 10 11.8771C8.84009 11.8759 7.72801 11.4146 6.90781 10.5943C6.0876 9.77415 5.62627 8.66207 5.62503 7.50213Z"
      fill="currentColor"
    />
  </svg>
);

const DescriptionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M16.875 3.125H3.125C2.433 3.125 1.875 3.683 1.875 4.375V15.625C1.875 16.317 2.433 16.875 3.125 16.875H16.875C17.567 16.875 18.125 16.317 18.125 15.625V4.375C18.125 3.683 17.567 3.125 16.875 3.125ZM16.875 15.625H3.125V4.375H16.875V15.625ZM14.375 7.5C14.375 7.845 14.095 8.125 13.75 8.125H6.25C5.905 8.125 5.625 7.845 5.625 7.5C5.625 7.155 5.905 6.875 6.25 6.875H13.75C14.095 6.875 14.375 7.155 14.375 7.5ZM14.375 10C14.375 10.345 14.095 10.625 13.75 10.625H6.25C5.905 10.625 5.625 10.345 5.625 10C5.625 9.655 5.905 9.375 6.25 9.375H13.75C14.095 9.375 14.375 9.655 14.375 10ZM14.375 12.5C14.375 12.845 14.095 13.125 13.75 13.125H6.25C5.905 13.125 5.625 12.845 5.625 12.5C5.625 12.155 5.905 11.875 6.25 11.875H13.75C14.095 11.875 14.375 12.155 14.375 12.5Z"
      fill="currentColor"
    />
  </svg>
);

const AgendaIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M16.25 2.5H14.375V1.875C14.375 1.53 14.095 1.25 13.75 1.25C13.405 1.25 13.125 1.53 13.125 1.875V2.5H6.875V1.875C6.875 1.53 6.595 1.25 6.25 1.25C5.905 1.25 5.625 1.53 5.625 1.875V2.5H3.75C3.06 2.5 2.5 3.06 2.5 3.75V16.25C2.5 16.94 3.06 17.5 3.75 17.5H16.25C16.94 17.5 17.5 16.94 17.5 16.25V3.75C17.5 3.06 16.94 2.5 16.25 2.5ZM5.625 3.75V4.375C5.625 4.72 5.905 5 6.25 5C6.595 5 6.875 4.72 6.875 4.375V3.75H13.125V4.375C13.125 4.72 13.405 5 13.75 5C14.095 5 14.375 4.72 14.375 4.375V3.75H16.25V6.25H3.75V3.75H5.625ZM16.25 16.25H3.75V7.5H16.25V16.25ZM13.2547 9.55781C13.4987 9.80188 13.4987 10.1981 13.2547 10.4422L9.50469 14.1922C9.26062 14.4363 8.86438 14.4363 8.62031 14.1922L6.74531 12.3172C6.50104 12.0729 6.50104 11.6771 6.74531 11.4328C6.98959 11.1885 7.38541 11.1885 7.62969 11.4328L9.0625 12.8664L12.3703 9.55781C12.6144 9.31374 13.0106 9.31374 13.2547 9.55781Z"
      fill="currentColor"
    />
  </svg>
);
