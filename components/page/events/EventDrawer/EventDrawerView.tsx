'use client';

import clsx from 'clsx';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Button } from '@/components/common/Button';
import btn from '@/components/common/Button/Button.module.scss';
import { Drawer } from '@/components/common/Drawer';
import { ArrowUpRightIcon, SuccessCircleIcon } from '@/components/icons';
import { Modal } from '@/components/common/Modal/Modal';
import { AdditionalDetailsSection } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/AdditionalDetailsSection';
import { DatePickerView } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/DatePickerView';
import { PlanningSection } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/PlanningSection';
import { TopicsPickerView } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/TopicsPickerView';
import { useIrlGatheringModal } from '@/components/core/UpdatesPanel/IrlGatheringModal/hooks/useIrlGatheringModal';
import m from '@/components/core/UpdatesPanel/IrlGatheringModal/IrlGatheringModal.module.scss';
import type { IrlGatheringFormData } from '@/components/core/UpdatesPanel/IrlGatheringModal/types';
import type { EventDetail, EventRoleName, MyGatheringPlans } from '@/services/events/event-drawer.types';
import { EVENT_STATUS_LABEL } from '@/services/events/event-form';
import { useEventEnded } from '@/services/events/hooks/useEventEnded';
import type { ITeam } from '@/types/teams.types';

import { AttendeesView, SubHead, type EventAttendeesState } from './AttendeesView';
import { DrawerToolbar } from './DrawerToolbar';
import { EndedCard } from './EndedCard';
import { EventSummary } from './EventSummary';
import e from './EventDrawer.module.scss';
import { RsvpCard, RsvpLink } from './RsvpCard';
import r from './RsvpCard.module.scss';

export type EventDrawerStatus = 'loading' | 'error' | 'not-found' | 'ready';
/**
 * `event`: the event with its going card. `plans`: the "Add your plans" sub-view (the owner's "Edit details").
 * `attendees`: who's going, or who went (a Past card's faces, LAB-3418 P1); signed out or in the embed, the event.
 */
export type EventDrawerStep = 'event' | 'plans' | 'attendees';

/** What the plans sub-view hands to Save (LAB-3234: this event's role, the stay, topics, and the details). */
export interface EventPlansValues {
  roles: EventRoleName[];
  topics: string[];
  reason: string;
  teamUid: string | null;
  telegramId: string;
  officeHours: string;
  dateRange: [Date, Date] | null;
}

export interface EventGoingNotice {
  eventName: string;
}

export interface EventDrawerViewProps {
  status: EventDrawerStatus;
  event: EventDetail | null;
  /** The event's edit page, for its submitter and a directory admin. Nobody else gets the "Edit" link. */
  editHref?: string;
  /** Signed in with `irlg.going.write` (or admin) and the event belongs to a gathering. */
  canMarkGoing: boolean;
  viewerUid: string | null;
  /** The viewer's rows at the gathering; required (non-null) for the ready state when `canMarkGoing`. */
  plans: MyGatheringPlans | null;
  /** The viewer's teams, Telegram and office hours, to prefill the additional details. */
  member: { teams: ITeam[]; telegramHandle: string | null; officeHours: string | null };
  attendees: EventAttendeesState;
  initialStep?: EventDrawerStep;
  saving: boolean;
  onClose: () => void;
  onRetry?: () => void;
  onAttendeesOpen?: () => void;
  /** "Yes, I'm going". Resolves `true` when saved; on `false` the card still asks. */
  onYes: () => Promise<boolean>;
  /** "Mark as not going": this event only. Resolves `true` when removed. */
  onNotGoing: () => Promise<boolean>;
  /** The plans sub-view's Save. Resolves `true` when saved; on `false` it stays open with the values. */
  onSave: (values: EventPlansValues) => Promise<boolean>;
  /** The drawer closed after the member said they are going (the host shows the toast). */
  onGoing?: (notice: EventGoingNotice) => void;
  /**
   * Signed out only (LAB-3271): "Yes, I'm going" and the people count start the sign-in flow instead.
   * Leave it out for a signed-in viewer.
   */
  onSignIn?: () => void;
  /**
   * The embed (LAB-3392), framed by another site: going happens on LabOS, so the card and its pinned bar offer
   * "RSVP on LabOS ↗" to this address in a new tab, and the going count opens nothing. Leave out everywhere else.
   */
  rsvpHref?: string;
  /** The list the drawer was opened from, in its order, for previous / next (LAB-3361). Leave out for none. */
  sequence?: string[];
  /** Previous / next pressed: the host opens that event. */
  onNavigate?: (uid: string, direction: 'previous' | 'next') => void;
  /** Show the drawer in place, without its entrance: the host stepped from one event to the next. */
  animateIn?: boolean;
  onLinkCopied?: () => void;
}

const NOOP = () => {};
const NO_SEQUENCE: string[] = [];

/** The prototype's drawer width (560 → 640 on 2026-11-18); full width on narrow screens. */
const DRAWER_WIDTH = 640;

function drawerWidth() {
  return typeof window === 'undefined' ? DRAWER_WIDTH : Math.min(DRAWER_WIDTH, window.innerWidth);
}

const members = (n: number) => `${n} ${n === 1 ? 'member' : 'members'}`;

/**
 * The event drawer, presentational (LAB-3216): everything comes in as props, so Storybook needs no providers.
 * `EventDrawer` is the container that wires the hooks.
 */
export function EventDrawerView(props: EventDrawerViewProps) {
  const { status, event, canMarkGoing, plans, onClose, onRetry, animateIn = true } = props;
  const ready = status === 'ready' && !!event && (!canMarkGoing || !!plans);
  // The drawer's scroller: the going card's "away" check reads it, and a sub-view starts at its top.
  const scrollerRef = useRef<HTMLDivElement>(null);

  // One drawer for every state. Swapping the loading panel for the event must not mount a second drawer, or its
  // slide-in plays again. What Escape and the backdrop do depends on the state, so the flow registers its own handler.
  const closeRef = useRef<() => void>(onClose);
  useEffect(() => {
    if (!ready) closeRef.current = onClose;
  });
  const handleDrawerClose = useCallback(() => closeRef.current(), []);

  return (
    <Drawer isOpen onClose={handleDrawerClose} width={drawerWidth()} containerRef={scrollerRef} animateIn={animateIn}>
      {ready && event ? (
        <EventFlow
          key={event.uid}
          {...props}
          event={event}
          plans={plans}
          drawerCloseRef={closeRef}
          scrollerRef={scrollerRef}
        />
      ) : (
        <DrawerStates status={status} onClose={onClose} onRetry={onRetry} />
      )}
    </Drawer>
  );
}

/** Loading, missing and failed: the drawer's body before an event can show, under a toolbar with Close only. */
function DrawerStates({ status, onClose, onRetry }: Pick<EventDrawerViewProps, 'status' | 'onClose' | 'onRetry'>) {
  return (
    <div className={e.root}>
      <DrawerToolbar eventUid={null} prev={null} next={null} showStepper={false} onNavigate={NOOP} onClose={onClose} />
      {status === 'not-found' ? (
        <div className={e.state} role="status">
          <h2 className={e.stateTitle}>This event is no longer available</h2>
          <p className={e.stateText}>It may have been removed or cancelled.</p>
          <div className={e.stateActions}>
            <Button type="button" style="border" variant="neutral" size="s" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : status === 'error' ? (
        <div className={e.state} role="alert">
          <h2 className={e.stateTitle}>We couldn&apos;t load this event</h2>
          <p className={e.stateText}>Check your connection and try again.</p>
          <div className={e.stateActions}>
            <Button type="button" style="border" variant="neutral" size="s" onClick={onClose}>
              Close
            </Button>
            {onRetry && (
              <Button type="button" size="s" onClick={onRetry}>
                Try again
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className={e.state} aria-busy="true" aria-label="Loading the event">
          {/* Shaped like the event it becomes (thumbnail and title, the facts, the going card), so a slow load reads
              as loading rather than as an empty drawer. */}
          <div className={e.skeleton} data-testid="event-drawer-skeleton">
            <div className={e.skeletonRow}>
              <span className={clsx(e.skeletonBlock, e.skeletonThumb)} />
              <span className={e.skeletonLines}>
                <span className={clsx(e.skeletonBlock, e.skeletonTitle)} />
                <span className={clsx(e.skeletonBlock, e.skeletonLine)} />
              </span>
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className={e.skeletonRow}>
                <span className={clsx(e.skeletonBlock, e.skeletonTile)} />
                <span className={clsx(e.skeletonBlock, e.skeletonLine)} />
              </div>
            ))}
            <span className={clsx(e.skeletonBlock, e.skeletonCard)} />
          </div>
        </div>
      )}
    </div>
  );
}

function parseDay(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const ROLE_OPTIONS: EventRoleName[] = ['Host', 'Speaker', 'Sponsor'];

/** This event's roles from the viewer's rows, without plain attendance. */
function rolesFor(event: EventDetail, plans: MyGatheringPlans | null): EventRoleName[] {
  const fromRows = plans?.eventRoles.find((r) => r.eventUid === event.uid)?.roles;
  const roles = (fromRows ?? event.viewer?.roles ?? []) as string[];
  return ROLE_OPTIONS.filter((role) => roles.includes(role));
}

type View = 'event' | 'attendees' | 'plans';

/**
 * One event per drawer (LAB-3234, the Nov 12 standup), drawn as Polina's redesigned drawer (LAB-3361): the toolbar,
 * the event, and the going card right after the facts. The card answers in place ("Are you going?" → "You're going").
 * Two sub-views replace the body and keep the toolbar: who's going, and "Add your plans" (this event's role, the stay
 * and topics, with Cancel / Save pinned). Back, Cancel and Save all return to the event. There is no event picker and
 * no "Show on my profile": going is always visible to signed-in members. The "is on your profile" toast waits for the
 * drawer to close.
 */
function EventFlow({
  event,
  canMarkGoing,
  viewerUid,
  plans,
  member,
  attendees,
  initialStep = 'event',
  saving,
  editHref,
  onClose,
  onAttendeesOpen,
  onYes,
  onNotGoing,
  onSave,
  onGoing,
  onSignIn,
  rsvpHref,
  sequence = NO_SEQUENCE,
  onNavigate,
  onLinkCopied,
  drawerCloseRef,
  scrollerRef,
}: EventDrawerViewProps & {
  event: EventDetail;
  drawerCloseRef: MutableRefObject<() => void>;
  scrollerRef: RefObject<HTMLDivElement | null>;
}) {
  const gathering = event.gathering;
  // An event that is not approved shows its status to its submitter and a directory admin, and has no "I'm going".
  const unpublishedStatus = event.status && event.status !== 'APPROVED' ? event.status : null;
  const wasGoing = !!event.viewer;
  const [going, setGoing] = useState(wasGoing);
  const [justMarked, setJustMarked] = useState(false);
  const { ended, checkEnded } = useEventEnded(event.endDate, event.allDay, event.timezone);
  const [view, setView] = useState<View>(() =>
    canMarkGoing && wasGoing && initialStep === 'plans'
      ? 'plans'
      : initialStep === 'attendees' && !onSignIn && !rsvpHref
        ? 'attendees'
        : 'event',
  );
  // Opened on who's going: its list loads, and the opening is recorded, as a press on the count would.
  const openedOnAttendees = useRef(view === 'attendees');
  useEffect(() => {
    if (!openedOnAttendees.current) return;
    openedOnAttendees.current = false;
    onAttendeesOpen?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // An event that has ended takes no plans: the sub-view gives way to the event, for good, also when it was open at the
  // end.
  if (ended && view === 'plans') setView('event');
  const [roles, setRoles] = useState<EventRoleName[]>(() => rolesFor(event, plans));

  const formDefaults = (): IrlGatheringFormData => ({
    topics: plans?.topics ?? [],
    selectedEventUids: [],
    eventRoles: [],
    additionalDetails: plans?.reason ?? '',
    telegramHandle: plans?.telegramId ?? '',
    officeHours: plans?.officeHours ?? '',
  });
  const methods = useForm<IrlGatheringFormData>({ defaultValues: formDefaults() });

  const initialDateRange = useMemo<[Date, Date] | null>(() => {
    const start = parseDay(plans?.checkInDate ?? null);
    const end = parseDay(plans?.checkOutDate ?? null);
    return start && end ? [start, end] : null;
  }, [plans]);
  const picker = useIrlGatheringModal({
    initialDateRange,
    initialTopics: plans?.topics,
    isOpen: view === 'plans',
  });

  const city = gathering?.city ?? '';
  const planningQuestion = `What are you planning for ${city}?`;
  // The count is the server's until a refetch lands: add or take away the viewer's own answer from this drawer.
  const count = Math.max(0, event.goingCount + (going && !wasGoing ? 1 : 0) - (!going && wasGoing ? 1 : 0));
  const gatheringRange = useMemo(() => {
    const list = gathering?.events.length ? gathering.events : [event];
    const starts = list.map((ev) => ev.startDate).sort();
    const ends = list.map((ev) => ev.endDate).sort();
    return { start: starts[0], end: ends[ends.length - 1] };
  }, [gathering, event]);

  // Teams for the additional details. The team of the member's existing rows is preselected: the section picks
  // the one flagged `mainTeam`.
  const teams = useMemo(() => {
    if (!plans?.teamUid || !member.teams.some((t) => t.id === plans.teamUid)) return member.teams;
    return member.teams.map((t) => ({ ...t, mainTeam: t.id === plans.teamUid }));
  }, [member.teams, plans]);

  const close = () => {
    onClose();
    if (justMarked && going) onGoing?.({ eventName: event.name });
  };
  // Stepping to another event leaves this one like a close does, so "<event> is on your profile." still shows.
  const step = (uid: string, direction: 'previous' | 'next') => {
    onNavigate?.(uid, direction);
    if (justMarked && going) onGoing?.({ eventName: event.name });
  };

  // A sub-view, and the event again, start at the top of the drawer.
  const show = (next: View) => {
    if (next !== 'event') resetCardAway();
    setView(next);
  };
  useLayoutEffect(() => {
    scrollerRef.current?.scrollTo?.({ top: 0 });
  }, [view, scrollerRef]);
  const openPlans = () => {
    methods.reset(formDefaults());
    setRoles(rolesFor(event, plans));
    show('plans');
  };
  const backToEvent = () => show('event');

  const handleYes = async () => {
    if (saving || checkEnded()) return;
    if (!(await onYes())) return;
    setGoing(true);
    setJustMarked(true);
  };

  const handleNotGoing = async () => {
    if (saving || checkEnded()) return;
    if (!(await onNotGoing())) return;
    setGoing(false);
    setJustMarked(false);
  };

  const toggleRole = (role: EventRoleName) =>
    setRoles((current) => (current.includes(role) ? current.filter((r) => r !== role) : [...current, role]));

  const handleSave = methods.handleSubmit(async (data) => {
    if (saving || checkEnded()) return;
    const saved = await onSave({
      roles,
      topics: data.topics ?? [],
      reason: data.additionalDetails ?? '',
      teamUid: data.selectedTeam?.value || null,
      telegramId: data.telegramHandle ?? '',
      officeHours: data.officeHours ?? '',
      dateRange: picker.selectedDateRange,
    });
    if (saved) backToEvent();
  });

  const openAttendees = () => {
    if (onSignIn) {
      onSignIn();
      return;
    }
    show('attendees');
    onAttendeesOpen?.();
  };

  // Signed out, "Yes, I'm going" starts sign-in (LAB-3271); in the embed it is a link to LabOS (LAB-3392).
  const asks = !unpublishedStatus && (canMarkGoing || !!onSignIn || !!rsvpHref);
  const signInToGo = () => {
    if (!checkEnded()) onSignIn?.();
  };
  const pressYes = canMarkGoing ? handleYes : signInToGo;

  const index = sequence.indexOf(event.uid);
  const prev = index > 0 ? sequence[index - 1] : null;
  const next = index >= 0 && index < sequence.length - 1 ? sequence[index + 1] : null;

  // The pinned bar stands in for the going card once less than half of it is on screen (the prototype's RsvpBar).
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardAway, resetCardAway] = useAwayFromView(cardRef, scrollerRef, view === 'event' && asks && !ended);

  const renderOverlay = () => {
    if (picker.currentView === 'datePicker') {
      return (
        <Modal isOpen onClose={picker.handleDatePickerCancel} overlayClassname={m.modalOverlay}>
          <DatePickerView
            planningQuestion={planningQuestion}
            initialRange={picker.selectedDateRange}
            onCancel={picker.handleDatePickerCancel}
            onApply={picker.handleDatePickerApply}
            gatheringDateRange={gatheringRange}
            onClear={() => {}}
          />
        </Modal>
      );
    }

    if (picker.currentView === 'topicsPicker') {
      return (
        <Modal isOpen onClose={picker.handleTopicsPickerCancel} overlayClassname={m.modalOverlay}>
          <TopicsPickerView
            planningQuestion={planningQuestion}
            initialTopics={picker.selectedTopics}
            onCancel={picker.handleTopicsPickerCancel}
            onApply={(topics) => picker.handleTopicsPickerApply(topics, (t) => methods.setValue('topics', t))}
          />
        </Modal>
      );
    }

    return null;
  };
  const overlay = view === 'plans' ? renderOverlay() : null;

  // Escape and the backdrop: a picker first (design D7), then a sub-view (who's going, the plans), then the drawer.
  useEffect(() => {
    drawerCloseRef.current = overlay ? NOOP : view !== 'event' ? backToEvent : close;
  });

  const register = event.eventUrl ? (
    <a
      href={event.eventUrl}
      target="_blank"
      rel="noreferrer"
      className={clsx(btn.root, btn.small, btn.border, btn.neutral, r.btn)}
    >
      Register
      <ArrowUpRightIcon width={14} height={14} />
    </a>
  ) : null;

  return (
    <>
      <FormProvider {...methods}>
        <form onSubmit={handleSave} className={e.root} onKeyDown={(ev) => ev.key === 'Enter' && ev.preventDefault()}>
          <DrawerToolbar
            eventUid={event.uid}
            editHref={view === 'event' ? editHref : undefined}
            prev={prev}
            next={next}
            showStepper={view === 'event' && !!onNavigate && index >= 0 && sequence.length > 1}
            onNavigate={step}
            onClose={close}
            onCopied={onLinkCopied}
          />

          {view === 'event' && (
            <div className={e.body}>
              {unpublishedStatus && (
                <p className={e.statusLine} role="status">
                  Status: <strong>{EVENT_STATUS_LABEL[unpublishedStatus]}</strong>. Only you and directory admins see
                  this event.
                </p>
              )}
              <EventSummary
                event={event}
                ended={ended}
                card={
                  unpublishedStatus ? undefined : ended ? (
                    <EndedCard
                      count={count}
                      faces={event.faces}
                      went={going}
                      attendanceHidden={!viewerUid && event.inviteOnly}
                      onOpenAttendees={rsvpHref ? undefined : openAttendees}
                    />
                  ) : (
                    <div ref={cardRef}>
                      <RsvpCard
                        count={count}
                        faces={event.faces}
                        going={going}
                        asks={asks}
                        city={gathering?.city ?? null}
                        registerUrl={event.eventUrl}
                        saving={saving}
                        rsvpHref={rsvpHref}
                        onYes={pressYes}
                        onOpenAttendees={openAttendees}
                        onNotGoing={handleNotGoing}
                        onOpenPlans={openPlans}
                      />
                    </div>
                  )
                }
              />
            </div>
          )}

          {view === 'attendees' && (
            <AttendeesView
              eventName={event.name}
              ended={ended}
              total={count}
              viewerUid={viewerUid}
              attendees={attendees}
              onBack={backToEvent}
            />
          )}

          {view === 'plans' && (
            <div className={e.body}>
              <SubHead title={city ? `Your plans for ${city}` : 'Your plans'} onBack={backToEvent} />
              <fieldset className={r.roleField}>
                <legend className={r.roleLabel}>Your role at {event.name}</legend>
                <span className={r.roleHint}>Leave empty if you&apos;re attending.</span>
                <div className={r.roleChips}>
                  {ROLE_OPTIONS.map((role) => (
                    <button
                      key={role}
                      type="button"
                      className={r.roleChip}
                      aria-pressed={roles.includes(role)}
                      onClick={() => toggleRole(role)}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </fieldset>
              <PlanningSection
                planningQuestion={planningQuestion}
                selectedDateRange={picker.selectedDateRange}
                selectedTopics={picker.selectedTopics}
                selectedEvents={[]}
                events={[]}
                onDateInputClick={picker.handleOpenDatePicker}
                onTopicsInputClick={picker.handleOpenTopicsPicker}
                onEventsInputClick={NOOP}
                isLoggedIn
              />
              <AdditionalDetailsSection
                teams={teams}
                telegramHandle={plans?.telegramId || member.telegramHandle}
                officeHours={plans?.officeHours || member.officeHours}
                defaultExpanded={false}
              />
            </div>
          )}

          {/* The going card's ask, pinned while the card is scrolled away (the prototype's RsvpBar, 2026-11-16). */}
          {view === 'event' && asks && cardAway && (
            <div key="rsvp-bar" className={clsx(e.footer, e.rsvpBar)} data-testid="rsvp-bar">
              {going ? (
                <p className={clsx(r.cardTitle, r.cardTitleGoing, e.rsvpBarText, e.rsvpBarGoing)}>
                  <SuccessCircleIcon width={20} height={20} />
                  You&apos;re going
                </p>
              ) : (
                <p className={e.rsvpBarText}>
                  <span className={e.rsvpBarTitle}>Are you going?</span>
                  <span className={e.rsvpBarMeta}>
                    {count > 0 ? `${members(count)} going` : 'Nobody has said they are going yet.'}
                  </span>
                </p>
              )}
              <div className={e.rsvpBarActions}>
                {register}
                {!going &&
                  (rsvpHref ? (
                    <RsvpLink href={rsvpHref} />
                  ) : (
                    <Button type="button" size="s" onClick={pressYes} disabled={saving}>
                      Yes, I&apos;m going
                    </Button>
                  ))}
              </div>
            </div>
          )}

          {/* Cancel and Save return to the event. */}
          {view === 'plans' && (
            <div key="plans" className={e.footer}>
              <Button type="button" style="border" variant="neutral" size="s" onClick={backToEvent}>
                Cancel
              </Button>
              <Button type="submit" size="s" disabled={saving}>
                Save
              </Button>
            </div>
          )}
        </form>
      </FormProvider>
      {overlay}
    </>
  );
}

/**
 * Whether less than half of `target` is on screen in the drawer's scroller, the sticky toolbar's 56px not counting
 * (the prototype's check, vertical only: an IntersectionObserver would also read the drawer's slide-in as "away").
 */
function useAwayFromView(
  target: RefObject<HTMLElement | null>,
  scroller: RefObject<HTMLElement | null>,
  enabled: boolean,
): [away: boolean, reset: () => void] {
  const [away, setAway] = useState(false);
  // A plain effect: the drawer's animated container attaches its ref after a child's layout effects have run.
  useEffect(() => {
    const el = target.current;
    const box = scroller.current;
    if (!enabled || !el || !box) return;
    const check = () => {
      const r = el.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      const visible = Math.max(0, Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top + 56));
      setAway(r.height > 0 && visible < r.height / 2);
    };
    check();
    box.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      box.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [target, scroller, enabled]);
  // `reset` is for leaving the event, so coming back never flashes the bar from where the member had scrolled.
  return [enabled && away, () => setAway(false)];
}
