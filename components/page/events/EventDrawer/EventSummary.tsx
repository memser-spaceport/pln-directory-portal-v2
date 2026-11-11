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

/**
 * The event as the PL events app draws it, ported from `prototypes/entries/member-events-going/EventDetails.tsx`
 * (LAB-3216): "EVENT DETAILS" with mode and access on the right, a 64px thumbnail of the event's picture, the title,
 * date and address rows, tags, Host, Description, Agenda. A block whose data is empty is left out. Icons are that
 * app's own SVGs, inlined.
 *
 * Deviation from the prototype: no region line under the address. The Directory stores only the gathering's
 * location text, not the venue's address and region.
 */
export function EventSummary({ event }: { event: EventDetail }) {
  return (
    <>
      <div className={e.head}>
        <span className={e.kicker}>EVENT DETAILS</span>
        {(event.mode || event.access) && (
          <span className={e.badges}>
            {event.mode && (
              <span className={e.mode}>
                <InPersonIcon />
                {event.mode}
              </span>
            )}
            {event.access && <AccessBadge access={event.access} />}
          </span>
        )}
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
          {event.address && (
            <div className={e.factRow}>
              <LocationIcon />
              <span className={e.place}>
                <span className={e.fact}>
                  {event.address} <LinkIcon />
                </span>
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
export function Label({
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

function AccessBadge({ access }: { access: EventAccess }) {
  if (access === 'PAID') {
    return (
      <span className={e.paid}>
        <PaidIcon />
        PAID
      </span>
    );
  }
  return (
    <span className={e.access}>
      {access === 'INVITE ONLY' ? <InviteOnlyIcon /> : <FreeIcon />}
      {access}
    </span>
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

const InPersonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M0.875 2.33398V3.20898C0.875 5.62982 2.16417 7.74732 4.08333 8.92565V11.6673H12.8333V10.5007C12.8333 8.94898 9.72417 8.16732 8.16667 8.16732H8.02083C5.25 8.16732 2.91667 5.83398 2.91667 3.20898V2.33398M8.16667 2.33398C7.54783 2.33398 6.95434 2.57982 6.51675 3.0174C6.07917 3.45499 5.83333 4.04848 5.83333 4.66732C5.83333 5.28616 6.07917 5.87965 6.51675 6.31723C6.95434 6.75482 7.54783 7.00065 8.16667 7.00065C8.7855 7.00065 9.379 6.75482 9.81658 6.31723C10.2542 5.87965 10.5 5.28616 10.5 4.66732C10.5 4.04848 10.2542 3.45499 9.81658 3.0174C9.379 2.57982 8.7855 2.33398 8.16667 2.33398Z"
      fill="currentColor"
    />
  </svg>
);

const PaidIcon = () => (
  <svg width="14" height="15" viewBox="0 0 14 15" fill="none" aria-hidden="true">
    <path
      d="M6.31755 0.859375V2.60938H5.00505C3.81505 2.60938 2.81755 3.60688 2.81755 4.79688V5.67188C2.81755 6.86188 3.58755 7.84188 4.72505 8.13938L9.20505 9.29438C9.45005 9.36438 9.80005 9.80188 9.80005 10.0644V10.9394C9.80005 11.1844 9.60755 11.3769 9.36255 11.3769H4.98755C4.83555 11.3763 4.68577 11.3403 4.55005 11.2719V9.62688H2.80005V11.3769C2.80005 11.9719 3.15005 12.4794 3.57005 12.7419C3.97255 13.0219 4.48005 13.1269 4.98755 13.1269H6.30005V14.8769H8.05005V13.1269H9.36255C10.57 13.1269 11.55 12.1469 11.55 10.9394V10.0644C11.55 8.87438 10.78 7.89438 9.64255 7.59688L5.16255 6.44188C4.91755 6.37188 4.56755 5.93438 4.56755 5.67188V4.79688C4.56755 4.55188 4.76005 4.35938 5.00505 4.35938H9.38005C9.57255 4.35938 9.74755 4.42938 9.81755 4.46438V6.10938H11.5675V4.35938C11.5675 3.76438 11.2175 3.25688 10.7975 2.99438C10.395 2.71438 9.88755 2.60938 9.38005 2.60938H8.06755V0.859375H6.31755Z"
      fill="currentColor"
    />
  </svg>
);

/* The ticket glyph is the events app's magenta; it is drawn in that app's colour, as it is there. */
const FreeIcon = () => (
  <svg width="15" height="14" viewBox="0 0 15 14" fill="none" aria-hidden="true">
    <path
      d="M3.29175 4.66667L10.5834 1.75L11.7501 4.66667"
      stroke="#E42CBC"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M1.8335 4.66748H13.5002V6.41748C12.6252 6.41748 11.7502 7.00081 11.7502 8.02165C11.7502 9.04248 12.6252 9.91748 13.5002 9.91748V11.6675H1.8335V9.91748C2.7085 9.91748 3.5835 9.33415 3.5835 8.16748C3.5835 7.00081 2.7085 6.41748 1.8335 6.41748V4.66748Z"
      fill="#E42CBC"
      stroke="#E42CBC"
      strokeWidth="0.6"
      strokeLinejoin="round"
    />
    <path d="M5.62524 7.40479H7.37524M5.62524 9.15479H9.70858" stroke="white" strokeWidth="0.6" strokeLinecap="round" />
  </svg>
);

const InviteOnlyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 25 24" fill="none" aria-hidden="true">
    <rect x="1.22656" y="0.5" width="23" height="23" rx="11.5" fill="#F9F3E9" stroke="#F19100" />
    <path
      d="M9.11943 7.5H16.3342C16.4141 7.49999 16.4928 7.51789 16.564 7.55224C16.6351 7.58659 16.6967 7.63641 16.7437 7.69763L18.6782 10.2189C18.7126 10.2638 18.7295 10.3185 18.7261 10.3739C18.7227 10.4293 18.6992 10.4818 18.6595 10.5226L12.9126 16.4228C12.8889 16.4471 12.8601 16.4666 12.8281 16.4798C12.7961 16.4931 12.7615 16.5 12.7266 16.5C12.6916 16.5 12.657 16.4931 12.625 16.4798C12.593 16.4666 12.5642 16.4471 12.5405 16.4228L6.79364 10.523C6.75396 10.4823 6.73041 10.4297 6.72699 10.3744C6.72358 10.319 6.74051 10.2642 6.77491 10.2194L8.70995 7.69811C8.75691 7.63689 8.8185 7.58707 8.88966 7.55272C8.96083 7.51837 9.03957 7.49999 9.11943 7.5Z"
      fill="#F19100"
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

export const PinLabelIcon = LocationIcon;
