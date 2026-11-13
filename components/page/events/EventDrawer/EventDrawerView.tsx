'use client';

import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Button } from '@/components/common/Button';
import { Drawer } from '@/components/common/Drawer';
import { Modal } from '@/components/common/Modal/Modal';
import { AdditionalDetailsSection } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/AdditionalDetailsSection';
import { DatePickerView } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/DatePickerView';
import { GatheringDetails } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/GatheringDetails';
import { PlanningSection } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/PlanningSection';
import { TopicsPickerView } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/TopicsPickerView';
import { buildEventsLink } from '@/components/core/UpdatesPanel/IrlGatheringModal/helpers';
import { useIrlGatheringModal } from '@/components/core/UpdatesPanel/IrlGatheringModal/hooks/useIrlGatheringModal';
import m from '@/components/core/UpdatesPanel/IrlGatheringModal/IrlGatheringModal.module.scss';
import type { IrlGatheringFormData } from '@/components/core/UpdatesPanel/IrlGatheringModal/types';
import type { EventDetail, EventRoleName, MyGatheringPlans } from '@/services/events/event-drawer.types';
import type { ITeam } from '@/types/teams.types';

import { AttendeesModal, type EventAttendeesState } from './AttendeesModal';
import { BackIcon, EventSummary, Label, PinLabelIcon } from './EventSummary';
import e from './EventDrawer.module.scss';
import { RsvpCard } from './RsvpCard';
import r from './RsvpCard.module.scss';

export type EventDrawerStatus = 'loading' | 'error' | 'not-found' | 'ready';
/** `event`: the event with its going card. `plans`: the "Add your plans" sub-view (the owner's "Edit details"). */
export type EventDrawerStep = 'event' | 'plans';

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
}

/** The prototype's drawer width; full width on narrow screens. */
const NOOP = () => {};

function drawerWidth() {
  return typeof window === 'undefined' ? 778 : Math.min(778, window.innerWidth);
}

/**
 * The event drawer, presentational (LAB-3216): everything comes in as props, so Storybook needs no providers.
 * `EventDrawer` is the container that wires the hooks.
 */
export function EventDrawerView(props: EventDrawerViewProps) {
  const { status, event, canMarkGoing, plans, onClose, onRetry } = props;
  const ready = status === 'ready' && !!event && (!canMarkGoing || !!plans);

  // One drawer for every state. Swapping the loading panel for the event must not mount a second drawer, or its
  // slide-in plays again. What Escape and the backdrop do depends on the state, so the flow registers its own handler.
  const closeRef = useRef<() => void>(onClose);
  useEffect(() => {
    if (!ready) closeRef.current = onClose;
  });
  const handleDrawerClose = useCallback(() => closeRef.current(), []);

  return (
    <Drawer isOpen onClose={handleDrawerClose} width={drawerWidth()}>
      {ready && event ? (
        <EventFlow key={event.uid} {...props} event={event} plans={plans} drawerCloseRef={closeRef} />
      ) : (
        <DrawerStates status={status} onClose={onClose} onRetry={onRetry} />
      )}
    </Drawer>
  );
}

/** Loading, missing and failed: the drawer's body before an event can show. */
function DrawerStates({ status, onClose, onRetry }: Pick<EventDrawerViewProps, 'status' | 'onClose' | 'onRetry'>) {
  return (
    <div className={e.root}>
      <div className={e.backBar}>
        <button type="button" className={e.back} onClick={onClose}>
          <BackIcon />
          <span>Back</span>
        </button>
      </div>
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
          {/* Shaped like the panel it becomes (kicker, title, date, place, tags, Host, gathering), so a slow load
                reads as loading rather than as an empty drawer. */}
          <div className={e.skeleton}>
            <span className={e.kicker}>EVENT DETAILS</span>
            <span className={clsx(e.skeletonBlock, e.skeletonTitle)} />
            <span className={clsx(e.skeletonBlock, e.skeletonFact)} />
            <span className={clsx(e.skeletonBlock, e.skeletonPlace)} />
            <span className={e.skeletonChips}>
              <span className={clsx(e.skeletonBlock, e.skeletonChip)} />
              <span className={clsx(e.skeletonBlock, e.skeletonChip)} />
            </span>
            <span className={clsx(e.skeletonBlock, e.skeletonLabel)} />
            <span className={clsx(e.skeletonBlock, e.skeletonPanel)} />
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

/**
 * One event per drawer (LAB-3234, the Nov 12 standup). The going card answers in place ("Are you going?" →
 * "You're going"); "Add your plans" opens a sub-view for this event's role, the stay and topics, whose Back, Cancel
 * and Save all return to the event (Polina's 2026-11-12 prototype). There is no event picker and no "Show on my
 * profile": going is always visible to signed-in members. The "is on your profile" toast waits for the drawer to close.
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
  onClose,
  onAttendeesOpen,
  onYes,
  onNotGoing,
  onSave,
  onGoing,
  drawerCloseRef,
}: EventDrawerViewProps & { event: EventDetail; drawerCloseRef: MutableRefObject<() => void> }) {
  const gathering = event.gathering;
  const wasGoing = !!event.viewer;
  const [going, setGoing] = useState(wasGoing);
  const [justMarked, setJustMarked] = useState(false);
  const [step, setStep] = useState<EventDrawerStep>(
    canMarkGoing && wasGoing && initialStep === 'plans' ? 'plans' : 'event',
  );
  const [showAttendees, setShowAttendees] = useState(false);
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
    isOpen: step === 'plans',
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

  const openPlans = () => {
    methods.reset(formDefaults());
    setRoles(rolesFor(event, plans));
    setStep('plans');
  };
  const backToEvent = () => setStep('event');

  const handleYes = async () => {
    if (saving) return;
    if (!(await onYes())) return;
    setGoing(true);
    setJustMarked(true);
  };

  const handleNotGoing = async () => {
    if (saving) return;
    if (!(await onNotGoing())) return;
    setGoing(false);
    setJustMarked(false);
  };

  const toggleRole = (role: EventRoleName) =>
    setRoles((current) => (current.includes(role) ? current.filter((r) => r !== role) : [...current, role]));

  const handleSave = methods.handleSubmit(async (data) => {
    if (saving) return;
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
    setShowAttendees(true);
    onAttendeesOpen?.();
  };

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

    if (showAttendees) {
      return (
        <AttendeesModal
          eventName={event.name}
          total={count}
          viewerUid={viewerUid}
          attendees={attendees}
          onBack={() => setShowAttendees(false)}
        />
      );
    }
    return null;
  };
  const overlay = renderOverlay();

  // Escape and the backdrop: a picker or the people list first (design D7), then the plans sub-view, then the drawer.
  useEffect(() => {
    drawerCloseRef.current = overlay ? NOOP : step === 'plans' ? backToEvent : close;
  });

  return (
    <>
      <FormProvider {...methods}>
        <form onSubmit={handleSave} className={e.root} onKeyDown={(ev) => ev.key === 'Enter' && ev.preventDefault()}>
          <div className={e.backBar}>
            <button type="button" className={e.back} onClick={step === 'plans' ? backToEvent : close}>
              <BackIcon />
              <span>{step === 'plans' ? 'Back to event' : 'Back'}</span>
            </button>
          </div>

          <div className={e.body}>
            {step === 'event' && (
              <>
                <EventSummary
                  event={event}
                  beforeAgenda={
                    <RsvpCard
                      count={count}
                      faces={event.faces}
                      going={going}
                      canMarkGoing={canMarkGoing}
                      city={gathering?.city ?? null}
                      registerUrl={event.websiteUrl}
                      saving={saving}
                      onOpenAttendees={openAttendees}
                      onYes={handleYes}
                      onNotGoing={handleNotGoing}
                      onOpenPlans={openPlans}
                    />
                  }
                />

                {gathering && (
                  <div className={e.block}>
                    <Label icon={<PinLabelIcon />}>{city} gathering</Label>
                    <div className={e.gatheringLinks}>
                      <GatheringDetails
                        dateRange={event.dateLine}
                        location={city}
                        eventsLink={buildEventsLink(gathering.location, event.startDate)}
                        eventsCount={gathering.events.length}
                        resources={gathering.resources}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {step === 'plans' && (
              <>
                <h2 className={r.plansHeading}>{city ? `Your plans for ${city}` : 'Your plans'}</h2>
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
              </>
            )}
          </div>

          {/* The event step has no footer: its presses are in the card. Cancel and Save return to the event. */}
          {step === 'plans' && (
            <div key="plans" className={e.footer}>
              <Button
                type="button"
                style="border"
                variant="neutral"
                size="s"
                className={e.footerBtn}
                onClick={backToEvent}
              >
                Cancel
              </Button>
              <Button type="submit" size="s" className={e.footerBtn} disabled={saving}>
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
