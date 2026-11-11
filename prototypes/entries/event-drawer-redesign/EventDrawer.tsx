'use client';

/**
 * The event drawer, redesigned (2026-11-11). One drawer for an event wherever it
 * opens: Home's Upcoming events rail and the Events calendar.
 *
 * What it replaces: `member-events-going/GatheringModal` (Home) and the PL events
 * app's own detail panel (/events/all), which it was transcribed from: an
 * uppercase "EVENT DETAILS" kicker, a 180px logo, coloured hash tags, Host as a
 * grey box, then the ask at the very bottom behind a step-swapped footer.
 *
 * References (Mobbin, 2026-11-11):
 *  - Luma's side peek over its Events list: toolbar (Copy link, Event page ↗,
 *    previous / next), then logo, title, date tile + place, a status card that
 *    says where you stand ("You're In" / "You're Not Going"), then About.
 *  - Luma's event page: "N Going" with a facepile, hosts named under the title.
 *  - Circle's event page: the date tile beside the date, a Going control in a
 *    card of its own.
 *  - Calendly's meeting panel: plain section titles over hairlines, no kickers.
 *
 * The anatomy, top to bottom:
 *  1. Toolbar, pinned: Copy link · Open in PL Events ↗ … ‹ › · ✕. Previous /
 *     next step through the list the drawer was opened from (the rail's rows,
 *     the calendar's events in date order), so browsing a month doesn't mean
 *     closing and reopening.
 *  2. Who and what: logo tile, mode + access as DS Badges, the title, "Hosted by".
 *  3. When and where: the date tile the rail row already wears, then the venue
 *     (a map link) over its city. Same two facts the app showed, without its icons.
 *  4. The ask, in one card, near the top: who's going (facepile, opens the list
 *     inside the drawer), "Show on my profile", "Yes, I'm going", and Register ↗
 *     for the event's own ticket. After yes the card turns into the receipt, on
 *     Luma's "You're In" model: "You're going" with people and Register ↗ beside
 *     it, the tick on one line, an "Add your plans for <city> ›" row, and
 *     "Can't make it? Mark as not going" at the foot.
 *     The old flow put the question under the description and agenda, so on a
 *     long event it sat below the fold.
 *  5. About, its tags at the end (no heading: they label themselves).
 *  6. Agenda, when there is one: day, then time beside title.
 *  7. Part of the <city> gathering: the gathering's other events as rows (each
 *     opens in this drawer), then its links. Production's GatheringDetails said
 *     the same in a grey box of icon rows.
 *
 * Sub-views replace the body and keep the toolbar: the people going (search,
 * then rows to profiles), and "Your plans in <city>" (production's
 * PlanningSection + AdditionalDetailsSection with Cancel / Save pinned under
 * them). Pickers stay production's modals above the drawer, and while one is
 * open Escape belongs to it.
 *
 * Colour: one brand press per state (Yes, I'm going / Add your plans); every
 * other control is the DS neutral border or text. Tags are neutral Badges, not
 * the app's six hues.
 */

import clsx from 'clsx';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import btn from '@/components/common/Button/Button.module.scss';
import { Checkbox } from '@/components/common/Checkbox';
import { Drawer } from '@/components/common/Drawer';
import { Modal } from '@/components/common/Modal/Modal';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import {
  ArrowBackIcon,
  ArrowUpRightIcon,
  CalendarBlankIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckIcon,
  CloseIcon,
  GlobeIcon,
  SuccessCircleIcon,
} from '@/components/icons';
import type { ITeam } from '@/types/teams.types';

import { AdditionalDetailsSection } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/AdditionalDetailsSection';
import { DatePickerView } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/DatePickerView';
import { EventsPickerView } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/EventsPickerView';
import { PlanningSection } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/PlanningSection';
import { TopicsPickerView } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/TopicsPickerView';
import { useIrlGatheringModal } from '@/components/core/UpdatesPanel/IrlGatheringModal/hooks/useIrlGatheringModal';
import type {
  EventData,
  EventRoleSelection,
  IrlGatheringFormData,
} from '@/components/core/UpdatesPanel/IrlGatheringModal/types';
import m from '@/components/core/UpdatesPanel/IrlGatheringModal/IrlGatheringModal.module.scss';

import { markGoing, removeGoing, saveGathering, setShowOnProfile, useGoing } from '../member-events-going/goingStore';
import { ATTENDEES, MAYA_TEAMS, type EventDetail, type Gathering } from '../member-events-going/mocks';

import {
  ACCESS_LABEL,
  MODE_LABEL,
  dayLine,
  dayOfMonth,
  mapsHref,
  monthShort,
  regionLine,
  timeLine,
  venueOf,
} from './format';
import {
  DETAILS,
  eventByUid,
  eventsAppHref,
  gatheringFor,
  registerHref,
  siblingsOf,
  THUMBS,
  type CalEvent,
} from './mocks';
import d from './EventDrawer.module.scss';

const SCOPE = 'owner' as const;
const DRAWER_WIDTH = 560;

export interface EventNotice {
  eventName: string;
  onProfile: boolean;
}

type View = 'event' | 'attendees' | 'plans';

export function EventDrawer({
  eventUid,
  sequence,
  onNavigate,
  onClose,
  onNotice,
}: {
  eventUid: string | null;
  /** The list the drawer was opened from, for previous / next. */
  sequence: string[];
  onNavigate: (uid: string) => void;
  onClose: () => void;
  /** Called on close when the member said yes during this visit. */
  onNotice?: (notice: EventNotice) => void;
}) {
  /* Keep drawing the last event while the drawer slides out. */
  const [shownUid, setShownUid] = useState(eventUid);
  useEffect(() => {
    if (eventUid) setShownUid(eventUid);
  }, [eventUid]);

  const [view, setView] = useState<View>('event');
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [lastMarked, setLastMarked] = useState<EventNotice | null>(null);
  const [width, setWidth] = useState(DRAWER_WIDTH);
  useEffect(() => {
    const fit = () => setWidth(Math.min(DRAWER_WIDTH, window.innerWidth));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  /* A new event opens on its overview. */
  useEffect(() => {
    setView('event');
    setOverlayOpen(false);
  }, [eventUid]);

  const event = shownUid ? eventByUid(shownUid) : null;

  const close = () => {
    onClose();
    if (lastMarked) onNotice?.(lastMarked);
    setLastMarked(null);
  };

  /* Escape: a picker first, then a sub-view, then the drawer. */
  const onDrawerClose = () => {
    if (overlayOpen) return;
    if (view !== 'event') setView('event');
    else close();
  };

  const index = shownUid ? sequence.indexOf(shownUid) : -1;
  const prev = index > 0 ? sequence[index - 1] : null;
  const next = index >= 0 && index < sequence.length - 1 ? sequence[index + 1] : null;

  return (
    <Drawer isOpen={!!eventUid} onClose={onDrawerClose} width={width}>
      {event && (
        <div className={d.root}>
          <Toolbar
            uid={event.uid}
            prev={view === 'event' ? prev : null}
            next={view === 'event' ? next : null}
            showStepper={view === 'event' && sequence.length > 1}
            onNavigate={onNavigate}
            onClose={close}
          />
          {view === 'event' && (
            <EventView
              key={event.uid}
              event={event}
              onOpenAttendees={() => setView('attendees')}
              onOpenPlans={() => setView('plans')}
              onNavigate={onNavigate}
              onMarked={(onProfile) => setLastMarked({ eventName: event.name, onProfile })}
              onUnmarked={() => setLastMarked((n) => (n?.eventName === event.name ? null : n))}
            />
          )}
          {view === 'attendees' && <AttendeesView event={event} onBack={() => setView('event')} />}
          {view === 'plans' && gatheringFor(event) && (
            <PlansView
              event={event}
              gathering={gatheringFor(event)!}
              onBack={() => setView('event')}
              onOverlayChange={setOverlayOpen}
            />
          )}
        </div>
      )}
    </Drawer>
  );
}

/* ---------- Toolbar ---------- */

function Toolbar({
  uid,
  prev,
  next,
  showStepper,
  onNavigate,
  onClose,
}: {
  uid: string;
  prev: string | null;
  next: string | null;
  showStepper: boolean;
  onNavigate: (uid: string) => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => setCopied(false), [uid]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/events/all?event=${uid}`);
    } catch {
      // Clipboard can be refused (insecure origin, permissions); the label still confirms the press.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={d.toolbar}>
      <div className={d.toolbarGroup}>
        <Button
          style="border"
          variant="neutral"
          size="xs"
          className={d.btn}
          onClick={copy}
          aria-label={copied ? 'Link copied' : 'Copy link'}
        >
          {copied ? <CheckIcon width={14} height={14} /> : <LinkIcon />}
          {/* Icon-only on phones, where the toolbar also carries the stepper and close. */}
          <span className={d.btnLabelWide}>{copied ? 'Copied' : 'Copy link'}</span>
        </Button>
        <a
          href={eventsAppHref(uid)}
          target="_blank"
          rel="noreferrer"
          className={clsx(btn.root, btn.xs, btn.border, btn.neutral, d.btn)}
        >
          Open in PL Events
          <ArrowUpRightIcon width={14} height={14} />
        </a>
      </div>
      <div className={d.toolbarGroup}>
        {showStepper && (
          <>
            <button
              type="button"
              className={d.iconBtn}
              onClick={() => prev && onNavigate(prev)}
              disabled={!prev}
              aria-label="Previous event"
            >
              <CaretLeftIcon width={16} height={16} />
            </button>
            <button
              type="button"
              className={d.iconBtn}
              onClick={() => next && onNavigate(next)}
              disabled={!next}
              aria-label="Next event"
            >
              <CaretRightIcon width={16} height={16} />
            </button>
            <span className={d.toolbarRule} aria-hidden />
          </>
        )}
        <button type="button" className={d.iconBtn} onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

/* ---------- The event ---------- */

function EventView({
  event,
  onOpenAttendees,
  onOpenPlans,
  onNavigate,
  onMarked,
  onUnmarked,
}: {
  event: CalEvent;
  onOpenAttendees: () => void;
  onOpenPlans: () => void;
  onNavigate: (uid: string) => void;
  onMarked: (onProfile: boolean) => void;
  onUnmarked: () => void;
}) {
  const detail = DETAILS[event.uid];
  const gathering = gatheringFor(event);
  const { venue } = venueOf(detail);
  const online = detail.mode === 'Virtual';

  return (
    <div className={d.body}>
      <section className={d.hero}>
        <div className={d.badges}>
          <Badge>{MODE_LABEL[detail.mode]}</Badge>
          <Badge>{ACCESS_LABEL[detail.access]}</Badge>
        </div>
        {/* The event's own picture as a small thumbnail beside the title and hosts
            (2026-11-11). The calendar-glyph tile it replaced was a placeholder; with
            no picture there is no tile and the title starts at the edge. */}
        <div className={d.titleRow}>
          {THUMBS[event.uid] && <img className={d.logo} src={THUMBS[event.uid]} alt="" width={56} height={56} />}
          <div className={d.titleText}>
            <h2 className={d.title}>{event.name}</h2>
            <p className={d.hosts}>
              Hosted by{' '}
              {detail.hosts.map((host, i) => (
                <span key={host}>
                  {i > 0 && (i === detail.hosts.length - 1 ? ' and ' : ', ')}
                  <a className={d.hostLink} href="/prototypes/team-profile" target="_blank" rel="noreferrer">
                    {host}
                  </a>
                </span>
              ))}
            </p>
          </div>
        </div>
      </section>

      <ul className={d.facts}>
        <li className={d.fact}>
          <span className={d.dateTile} aria-hidden>
            <span className={d.dateMonth}>{monthShort(event.startDate)}</span>
            <span className={d.dateDay}>{dayOfMonth(event.startDate)}</span>
          </span>
          <span className={d.factText}>
            <span className={d.factMain}>{dayLine(event)}</span>
            <span className={d.factSub}>{timeLine(detail)}</span>
          </span>
        </li>
        <li className={d.fact}>
          <span className={d.factIcon} aria-hidden>
            {online ? <GlobeIcon width={20} height={20} /> : <PinIcon />}
          </span>
          <span className={d.factText}>
            {online ? (
              <span className={d.factMain}>{venue}</span>
            ) : (
              <a className={clsx(d.factMain, d.factLink)} href={mapsHref(detail)} target="_blank" rel="noreferrer">
                {venue}
                <ArrowUpRightIcon width={14} height={14} />
              </a>
            )}
            <span className={d.factSub}>{online ? 'Link sent after you register' : regionLine(detail)}</span>
          </span>
        </li>
      </ul>

      <RsvpCard
        event={event}
        gathering={gathering}
        onOpenAttendees={onOpenAttendees}
        onOpenPlans={onOpenPlans}
        onMarked={onMarked}
        onUnmarked={onUnmarked}
      />

      <Section title="About">
        {detail.description.map((p) => (
          <p key={p.slice(0, 24)} className={d.paragraph}>
            {p}
          </p>
        ))}
        {detail.tags.length > 0 && (
          <div className={d.tags}>
            {detail.tags.map((tag) => (
              <Badge key={tag.name} className={d.tag}>
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </Section>

      {detail.agenda.length > 0 && <Agenda agenda={detail.agenda} />}

      {gathering && <GatheringBlock event={event} gathering={gathering} onNavigate={onNavigate} />}
    </div>
  );
}

function Section({ title, aside, children }: { title: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className={d.section}>
      <div className={d.sectionHead}>
        <h3 className={d.sectionTitle}>{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

/* ---------- The ask ---------- */

function Facepile({ count }: { count: number }) {
  return (
    <span className={d.facepile} aria-hidden>
      {ATTENDEES.slice(0, Math.min(3, count)).map((a) => (
        <img key={a.uid} src={getDefaultAvatar(a.name)} alt="" width={24} height={24} />
      ))}
    </span>
  );
}

function RsvpCard({
  event,
  gathering,
  onOpenAttendees,
  onOpenPlans,
  onMarked,
  onUnmarked,
}: {
  event: CalEvent;
  gathering: Gathering | null;
  onOpenAttendees: () => void;
  onOpenPlans: () => void;
  onMarked: (onProfile: boolean) => void;
  onUnmarked: () => void;
}) {
  const going = useGoing(SCOPE);
  const entry = going[event.uid];
  const [show, setShow] = useState(entry?.showOnProfile ?? true);
  const others = event.attendeeCount;

  const register = (
    <a
      href={registerHref(event.uid)}
      target="_blank"
      rel="noreferrer"
      className={clsx(btn.root, btn.small, btn.border, btn.neutral, d.btn)}
    >
      Register
      <ArrowUpRightIcon width={14} height={14} />
    </a>
  );

  const consent = (
    <label className={d.consent}>
      <Checkbox
        checked={entry ? entry.showOnProfile : show}
        onChange={(v: boolean) => (entry ? setShowOnProfile(SCOPE, event.uid, v) : setShow(v))}
        aria-labelledby={`consent-${event.uid}`}
      />
      <span className={d.consentText}>
        <span id={`consent-${event.uid}`} className={d.consentLabel}>
          Show on my profile
        </span>
        <span className={d.consentHint}>Signed-in members see it in your Events.</span>
      </span>
    </label>
  );

  if (!entry) {
    return (
      <div className={d.card}>
        <div className={d.cardHead}>
          <p className={d.cardTitle}>Are you going?</p>
          <button type="button" className={d.goingLink} onClick={onOpenAttendees}>
            <Facepile count={others} />
            {others} members going
          </button>
        </div>
        {consent}
        <div className={d.cardActions}>
          <Button
            size="s"
            onClick={() => {
              markGoing(SCOPE, event.uid, show);
              onMarked(show);
            }}
          >
            Yes, I&apos;m going
          </Button>
          {register}
        </div>
      </div>
    );
  }

  /*
   * Going, after Luma's "You're In" card in its event side peek (Mobbin, 2026-11-11):
   * a neutral card, the state as a plain dark title with one green mark, the
   * people under it, one row that leads on to the next thing to do ("Get ready
   * for the event ›" there, "Add your plans" here), and leaving as a quiet
   * sentence at the foot instead of a third press in the action row. The green
   * wash went: a tint says "the system is reporting", and nothing else on the
   * card needed to compete with the plans row.
   */
  return (
    <div className={d.card}>
      <div className={d.goingTop}>
        <div className={d.goingText}>
          <p className={clsx(d.cardTitle, d.cardTitleGoing)}>
            <SuccessCircleIcon width={20} height={20} />
            You&apos;re going
          </p>
          <button type="button" className={d.goingLink} onClick={onOpenAttendees}>
            <Facepile count={others} />
            You and {others} members
          </button>
        </div>
        {register}
      </div>

      <label className={d.consentInline}>
        <Checkbox
          checked={entry.showOnProfile}
          onChange={(v: boolean) => setShowOnProfile(SCOPE, event.uid, v)}
          aria-labelledby={`consent-${event.uid}`}
        />
        <span id={`consent-${event.uid}`} className={d.consentLabel}>
          Show on my profile <span className={d.consentQualifier}>· signed-in members see it</span>
        </span>
      </label>

      {gathering && (
        <button type="button" className={d.plansRow} onClick={onOpenPlans}>
          <span className={d.plansIcon} aria-hidden>
            <CalendarBlankIcon width={18} height={18} />
          </span>
          <span className={d.plansText}>
            <span className={d.plansTitle}>Add your plans for {gathering.city}</span>
            <span className={d.plansHint}>Dates, topics and the events you&apos;ll be at</span>
          </span>
          <CaretRightIcon width={16} height={16} className={d.plansArrow} />
        </button>
      )}

      <p className={d.leaveLine}>
        Can&apos;t make it?{' '}
        <button
          type="button"
          className={d.notGoing}
          onClick={() => {
            removeGoing(SCOPE, event.uid);
            onUnmarked();
          }}
        >
          Mark as not going
        </button>
      </p>
    </div>
  );
}

/* ---------- Agenda ---------- */

function Agenda({ agenda }: { agenda: EventDetail['agenda'] }) {
  /* "Day 1 - 1st Dec Tue" → "Tue, 1st Dec" over the day's rows. */
  const dayTitle = (day: string) => {
    const [, rest] = day.split(' - ');
    if (!rest) return day;
    const parts = rest.split(' ');
    return `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`;
  };
  return (
    <Section title="Agenda">
      {agenda.map((day) => (
        <div key={day.day} className={d.agendaDay}>
          {agenda.length > 1 && <p className={d.agendaDayTitle}>{dayTitle(day.day)}</p>}
          <ul className={d.agendaList}>
            {day.items.map((item) => (
              <li key={item.time + item.title} className={d.agendaRow}>
                <span className={d.agendaTime}>{item.time.replace(' - ', ' – ')}</span>
                <span className={d.agendaText}>
                  <span className={d.agendaTitle}>{item.title}</span>
                  {item.about && <span className={d.agendaAbout}>{item.about}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Section>
  );
}

/* ---------- The gathering ---------- */

function GatheringBlock({
  event,
  gathering,
  onNavigate,
}: {
  event: CalEvent;
  gathering: Gathering;
  onNavigate: (uid: string) => void;
}) {
  const going = useGoing(SCOPE);
  const others = siblingsOf(event).filter((e) => e.uid !== event.uid);

  return (
    <Section title={`Part of the ${gathering.city} gathering`}>
      <p className={d.paragraph}>{gathering.about}</p>
      {others.length > 0 && (
        <ul className={d.siblings}>
          {others.map((e) => (
            <li key={e.uid}>
              <button type="button" className={d.sibling} onClick={() => onNavigate(e.uid)}>
                <span className={clsx(d.dateTile, d.dateTileSmall)} aria-hidden>
                  <span className={d.dateMonth}>{monthShort(e.startDate)}</span>
                  <span className={d.dateDay}>{dayOfMonth(e.startDate)}</span>
                </span>
                <span className={d.siblingText}>
                  <span className={d.siblingName}>{e.name}</span>
                  <span className={d.siblingMeta}>
                    {e.range} · {e.attendeeCount} going
                  </span>
                </span>
                {going[e.uid] ? (
                  <span className={d.goingMark}>
                    <CheckIcon width={14} height={14} />
                    Going
                  </span>
                ) : (
                  <CaretRightIcon width={16} height={16} className={d.siblingArrow} />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={d.links}>
        <a
          href={gathering.scheduleLink}
          target="_blank"
          rel="noreferrer"
          className={clsx(btn.root, btn.xs, btn.border, btn.neutral, d.btn)}
        >
          Full {gathering.city} schedule
          <ArrowUpRightIcon width={14} height={14} />
        </a>
        {gathering.resources.map((r) => (
          <a
            key={r.name}
            href={r.link}
            target="_blank"
            rel="noreferrer"
            className={clsx(btn.root, btn.xs, btn.border, btn.neutral, d.btn)}
          >
            {r.name}
            <ArrowUpRightIcon width={14} height={14} />
          </a>
        ))}
      </div>
    </Section>
  );
}

/* ---------- Sub-view: who's going ---------- */

function SubHead({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className={d.subHead}>
      <button type="button" className={d.back} onClick={onBack}>
        <ArrowBackIcon width={16} height={16} />
        Back to event
      </button>
      <h2 className={d.subTitle}>{title}</h2>
    </div>
  );
}

function AttendeesView({ event, onBack }: { event: CalEvent; onBack: () => void }) {
  const going = useGoing(SCOPE);
  const you = !!going[event.uid];
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const rows = ATTENDEES.slice(0, event.attendeeCount).filter((a) =>
    `${a.name} ${a.team} ${a.role}`.toLowerCase().includes(needle),
  );
  const total = event.attendeeCount + (you ? 1 : 0);

  return (
    <div className={d.body}>
      <SubHead title={`${total} going to ${event.name}`} onBack={onBack} />
      <SearchInput value={query} onChange={setQuery} placeholder="Search by name, role or team" />
      <ul className={d.people}>
        {you && !needle && (
          <li className={d.person}>
            <img className={d.personImg} src={getDefaultAvatar('Maya Okonkwo')} alt="" />
            <span className={d.personText}>
              <span className={d.personName}>You</span>
              <span className={d.personMeta}>Founder · Lattice Compute</span>
            </span>
          </li>
        )}
        {rows.map((a) => (
          <li key={a.uid}>
            <a className={d.person} href="/prototypes/member-profile" target="_blank" rel="noreferrer">
              <img className={d.personImg} src={getDefaultAvatar(a.name)} alt="" />
              <span className={d.personText}>
                <span className={d.personName}>{a.name}</span>
                <span className={d.personMeta}>
                  {a.role} · {a.team}
                </span>
              </span>
              {a.tag && <Badge variant="brand">{a.tag}</Badge>}
            </a>
          </li>
        ))}
        {rows.length === 0 && <li className={d.empty}>Nobody going matches “{query.trim()}”.</li>}
      </ul>
    </div>
  );
}

/* ---------- Sub-view: your plans ---------- */

const toEventData = (e: CalEvent): EventData => ({
  uid: e.uid,
  name: e.name,
  slug: e.uid,
  startDate: `${e.startDate}T09:00:00.000Z`,
  endDate: `${e.endDate}T18:00:00.000Z`,
  logoUrl: null,
  attendeeCount: e.attendeeCount,
  websiteUrl: null,
});

/**
 * Step two of the old flow, now a page of the drawer you choose to open:
 * production's PlanningSection + AdditionalDetailsSection, Save pinned under
 * them. Same pickers, same store, so what's saved here is what the profile reads.
 */
function PlansView({
  event,
  gathering,
  onBack,
  onOverlayChange,
}: {
  event: CalEvent;
  gathering: Gathering;
  onBack: () => void;
  onOverlayChange: (open: boolean) => void;
}) {
  const going = useGoing(SCOPE);
  const siblings = useMemo(() => siblingsOf(event), [event]);
  const entries = siblings.filter((e) => going[e.uid]);
  const showOnProfile = going[event.uid]?.showOnProfile ?? true;

  const methods = useForm<IrlGatheringFormData>({
    defaultValues: {
      topics: [],
      selectedEventUids: entries.map((e) => e.uid),
      eventRoles: entries.map((e) => ({ eventUid: e.uid, roles: going[e.uid].roles })) as EventRoleSelection[],
      additionalDetails: '',
      telegramHandle: '@mayaokonkwo',
      officeHours: '',
    },
  });
  const picker = useIrlGatheringModal({ initialDateRange: null, initialTopics: undefined, isOpen: true });

  const selectedEventUids = methods.watch('selectedEventUids') || [];
  const eventRoles = methods.watch('eventRoles') || [];
  const eventData = siblings.map(toEventData);
  const selectedEvents = selectedEventUids
    .map((uid) => eventData.find((e) => e.uid === uid))
    .filter((e): e is EventData => !!e)
    .map((e) => ({ uid: e.uid, name: e.name }));
  const planningQuestion = `What are you planning for ${gathering.city}?`;

  const overlayOpen = picker.currentView !== 'main';
  useEffect(() => onOverlayChange(overlayOpen), [overlayOpen, onOverlayChange]);

  const onSave = methods.handleSubmit((data) => {
    saveGathering(
      SCOPE,
      siblings.map((e) => e.uid),
      data.selectedEventUids,
      data.eventRoles,
      showOnProfile,
    );
    onBack();
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSave} className={d.planForm} onKeyDown={(ev) => ev.key === 'Enter' && ev.preventDefault()}>
        <div className={d.body}>
          <SubHead title={`Your plans for ${gathering.city}`} onBack={onBack} />
          <PlanningSection
            planningQuestion={planningQuestion}
            selectedDateRange={picker.selectedDateRange}
            selectedTopics={picker.selectedTopics}
            selectedEvents={selectedEvents}
            events={eventData}
            onDateInputClick={picker.handleOpenDatePicker}
            onTopicsInputClick={picker.handleOpenTopicsPicker}
            onEventsInputClick={picker.handleOpenEventsPicker}
            isLoggedIn
          />
          <AdditionalDetailsSection
            teams={MAYA_TEAMS as unknown as ITeam[]}
            telegramHandle="@mayaokonkwo"
            officeHours=""
            defaultExpanded={false}
          />
        </div>
        <div className={d.footer}>
          <Button style="border" variant="neutral" size="s" onClick={onBack}>
            Cancel
          </Button>
          <Button type="submit" size="s">
            Save
          </Button>
        </div>
      </form>

      {picker.currentView === 'datePicker' && (
        <Modal isOpen onClose={picker.handleDatePickerCancel} overlayClassname={m.modalOverlay}>
          <DatePickerView
            planningQuestion={planningQuestion}
            initialRange={picker.selectedDateRange}
            onCancel={picker.handleDatePickerCancel}
            onApply={picker.handleDatePickerApply}
            gatheringDateRange={{ start: event.startDate, end: event.endDate }}
            onClear={() => {}}
          />
        </Modal>
      )}
      {picker.currentView === 'topicsPicker' && (
        <Modal isOpen onClose={picker.handleTopicsPickerCancel} overlayClassname={m.modalOverlay}>
          <TopicsPickerView
            planningQuestion={planningQuestion}
            initialTopics={picker.selectedTopics}
            onCancel={picker.handleTopicsPickerCancel}
            onApply={(topics) => picker.handleTopicsPickerApply(topics, (t) => methods.setValue('topics', t))}
          />
        </Modal>
      )}
      {picker.currentView === 'eventsPicker' && (
        <Modal isOpen onClose={picker.handleEventsPickerCancel} overlayClassname={m.modalOverlay}>
          <EventsPickerView
            planningQuestion={planningQuestion}
            locationName={gathering.city}
            timezone={gathering.timezone}
            events={eventData}
            initialSelectedEventUids={selectedEventUids}
            initialEventRoles={eventRoles}
            onCancel={picker.handleEventsPickerCancel}
            onApply={(uids, roles) =>
              picker.handleEventsPickerApply(
                uids,
                roles,
                (u) => methods.setValue('selectedEventUids', u),
                (r) => methods.setValue('eventRoles', r),
              )
            }
          />
        </Modal>
      )}
    </FormProvider>
  );
}

/* ---------- Glyphs the DS set doesn't have (stroked, 1.5px, like CloseIcon) ---------- */

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
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
