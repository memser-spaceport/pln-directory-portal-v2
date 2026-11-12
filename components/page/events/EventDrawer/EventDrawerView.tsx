'use client';

import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { Drawer } from '@/components/common/Drawer';
import { Modal } from '@/components/common/Modal/Modal';
import { AdditionalDetailsSection } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/AdditionalDetailsSection';
import { DatePickerView } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/DatePickerView';
import { EventsPickerView } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/EventsPickerView';
import { GatheringDetails } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/GatheringDetails';
import { PlanningSection } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/PlanningSection';
import { TopicsPickerView } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/TopicsPickerView';
import { buildEventsLink } from '@/components/core/UpdatesPanel/IrlGatheringModal/helpers';
import { useIrlGatheringModal } from '@/components/core/UpdatesPanel/IrlGatheringModal/hooks/useIrlGatheringModal';
import m from '@/components/core/UpdatesPanel/IrlGatheringModal/IrlGatheringModal.module.scss';
import type {
  EventData,
  EventRoleSelection,
  IrlGatheringFormData,
} from '@/components/core/UpdatesPanel/IrlGatheringModal/types';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { EventDetail, MyGatheringPlans } from '@/services/events/event-drawer.types';
import type { ITeam } from '@/types/teams.types';

import { AttendeesModal, type EventAttendeesState } from './AttendeesModal';
import { BackIcon, EventSummary, HostIcon, Label, PinLabelIcon } from './EventSummary';
import e from './EventDrawer.module.scss';

export type EventDrawerStatus = 'loading' | 'error' | 'not-found' | 'ready';
export type EventDrawerStep = 'ask' | 'plans';

/** What the plans step hands to Save. */
export interface EventPlansValues {
  selectedEventUids: string[];
  eventRoles: EventRoleSelection[];
  topics: string[];
  reason: string;
  teamUid: string | null;
  telegramId: string;
  officeHours: string;
  dateRange: [Date, Date] | null;
  showOnProfile: boolean;
}

export interface EventGoingNotice {
  eventName: string;
  showOnProfile: boolean;
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
  /** "Yes, I'm going". Resolves `true` when saved; on `false` the drawer stays on the question. */
  onYes: (showOnProfile: boolean) => Promise<boolean>;
  /** The plans step's Save. Resolves `true` when saved; on `false` the drawer stays open with the values. */
  onSave: (values: EventPlansValues) => Promise<boolean>;
  /** The drawer closed after the member said they are going (the host shows the toast). */
  onGoing?: (notice: EventGoingNotice) => void;
}

/** The prototype's drawer width; full width on narrow screens. */
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

  if (ready && event) {
    return <EventFlow key={event.uid} {...props} event={event} plans={plans} />;
  }

  return (
    <Drawer isOpen onClose={onClose} width={drawerWidth()}>
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
    </Drawer>
  );
}

function toEventData(event: { uid: string; name: string; startDate: string; endDate: string }): EventData {
  return {
    uid: event.uid,
    name: event.name,
    slug: '',
    startDate: event.startDate,
    endDate: event.endDate,
    logoUrl: null,
    attendeeCount: 0,
    websiteUrl: null,
  };
}

function parseDay(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function EventFlow({
  event,
  canMarkGoing,
  viewerUid,
  plans,
  member,
  attendees,
  initialStep = 'ask',
  saving,
  onClose,
  onAttendeesOpen,
  onYes,
  onSave,
  onGoing,
}: EventDrawerViewProps & { event: EventDetail }) {
  const gathering = event.gathering;
  const wasGoing = !!event.viewer;
  const [step, setStep] = useState<EventDrawerStep>(
    canMarkGoing && (wasGoing || initialStep === 'plans') ? 'plans' : 'ask',
  );
  const [showOnProfile, setShowOnProfile] = useState(event.viewer?.showOnProfile ?? true);
  const [justMarked, setJustMarked] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);

  // The gathering's events a member can still pick: the ones not over yet, and always this one.
  const pickable = useMemo(() => {
    const now = Date.now();
    const list = (gathering?.events ?? []).filter(
      (ev) => ev.uid === event.uid || new Date(ev.endDate).getTime() >= now,
    );
    return list.some((ev) => ev.uid === event.uid) ? list : [event, ...list];
  }, [gathering, event]);
  const eventData = useMemo(() => pickable.map(toEventData), [pickable]);

  const formDefaults = (withCurrent: boolean): IrlGatheringFormData => {
    const uids = plans?.eventUids ?? [];
    const roles = plans?.eventRoles ?? [];
    const addCurrent = withCurrent && !uids.includes(event.uid);
    return {
      topics: plans?.topics ?? [],
      selectedEventUids: addCurrent ? [...uids, event.uid] : uids,
      eventRoles: addCurrent ? [...roles, { eventUid: event.uid, roles: ['Attendee'] }] : roles,
      additionalDetails: plans?.reason ?? '',
      telegramHandle: plans?.telegramId ?? '',
      officeHours: plans?.officeHours ?? '',
    };
  };

  const methods = useForm<IrlGatheringFormData>({ defaultValues: formDefaults(wasGoing) });

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

  const selectedEventUids = methods.watch('selectedEventUids') || [];
  const eventRoles = methods.watch('eventRoles') || [];
  const selectedEvents = selectedEventUids
    .map((uid) => eventData.find((ev) => ev.uid === uid))
    .filter((ev): ev is EventData => !!ev)
    .map((ev) => ({ uid: ev.uid, name: ev.name }));

  const city = gathering?.city ?? '';
  const planningQuestion = `What are you planning for ${city}?`;
  const count = event.goingCount + (justMarked && !event.viewer ? 1 : 0);
  const gatheringRange = useMemo(() => {
    const starts = pickable.map((ev) => ev.startDate).sort();
    const ends = pickable.map((ev) => ev.endDate).sort();
    return { start: starts[0], end: ends[ends.length - 1] };
  }, [pickable]);

  // Teams for the additional details. The team of the member's existing rows is preselected: the section picks
  // the one flagged `mainTeam`.
  const teams = useMemo(() => {
    if (!plans?.teamUid || !member.teams.some((t) => t.id === plans.teamUid)) return member.teams;
    return member.teams.map((t) => ({ ...t, mainTeam: t.id === plans.teamUid }));
  }, [member.teams, plans]);

  const finish = (notice: EventGoingNotice | null) => {
    onClose();
    if (notice) onGoing?.(notice);
  };
  const close = () => finish(justMarked ? { eventName: event.name, showOnProfile } : null);

  const handleYes = async () => {
    if (saving) return;
    const saved = await onYes(showOnProfile);
    if (!saved) return;
    methods.reset(formDefaults(true));
    setJustMarked(true);
    setStep('plans');
  };

  const handleSave = methods.handleSubmit(async (data) => {
    if (saving) return;
    const values: EventPlansValues = {
      selectedEventUids: data.selectedEventUids ?? [],
      eventRoles: data.eventRoles ?? [],
      topics: data.topics ?? [],
      reason: data.additionalDetails ?? '',
      teamUid: data.selectedTeam?.value || null,
      telegramId: data.telegramHandle ?? '',
      officeHours: data.officeHours ?? '',
      dateRange: picker.selectedDateRange,
      showOnProfile,
    };
    const saved = await onSave(values);
    if (!saved) return;
    const goingNow = values.selectedEventUids.includes(event.uid);
    finish((justMarked || !wasGoing) && goingNow ? { eventName: event.name, showOnProfile } : null);
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

    if (picker.currentView === 'eventsPicker') {
      return (
        <Modal isOpen onClose={picker.handleEventsPickerCancel} overlayClassname={m.modalOverlay}>
          <EventsPickerView
            planningQuestion={planningQuestion}
            locationName={city}
            timezone={event.timezone}
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

  const consent = (
    <label className={e.consent}>
      <Checkbox checked={showOnProfile} onChange={setShowOnProfile} aria-labelledby="going-consent-label" />
      <span className={e.consentText}>
        <span id="going-consent-label" className={e.consentLabel}>
          Show on my profile
        </span>
        <span className={e.consentHint}>Signed-in members will see {event.name} on your profile.</span>
      </span>
    </label>
  );

  return (
    <>
      {/* While a picker or the people list is open above it, Escape and the backdrop belong to that (design D7). */}
      <Drawer isOpen onClose={overlay ? () => {} : close} width={drawerWidth()}>
        <FormProvider {...methods}>
          <form onSubmit={handleSave} className={e.root} onKeyDown={(ev) => ev.key === 'Enter' && ev.preventDefault()}>
            <div className={e.backBar}>
              <button type="button" className={e.back} onClick={close}>
                <BackIcon />
                <span>Back</span>
              </button>
            </div>

            <div className={e.body}>
              <EventSummary event={event} />

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

              <div className={e.block}>
                <Label icon={<HostIcon />}>Attendees</Label>
                {count > 0 ? (
                  <div className={m.attendeesRow}>
                    {event.faces.length > 0 && (
                      <div className={m.avatarGroup}>
                        {event.faces.slice(0, 3).map((face) => (
                          <div key={face.uid} className={m.avatar}>
                            <img src={face.image || getDefaultAvatar(face.name)} alt="" width={24} height={24} />
                          </div>
                        ))}
                      </div>
                    )}
                    <button type="button" className={m.linkButton} onClick={openAttendees}>
                      {count} {count === 1 ? 'Person' : 'People'} going
                    </button>
                  </div>
                ) : (
                  <p className={e.emptyNote}>Nobody has said they are going yet.</p>
                )}
              </div>

              {canMarkGoing && step === 'ask' && (
                <div className={e.askBlock}>
                  <div>
                    <div className={m.step1Title}>Are you going to {event.name}?</div>
                    <div className={m.step1Subtitle}>Let others know if you are attending.</div>
                  </div>
                  {consent}
                </div>
              )}

              {canMarkGoing && step === 'plans' && (
                <>
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
                    teams={teams}
                    telegramHandle={plans?.telegramId || member.telegramHandle}
                    officeHours={plans?.officeHours || member.officeHours}
                    defaultExpanded={false}
                  />
                  {consent}
                </>
              )}
            </div>

            {/* Keyed per step: without it React reuses the "Yes" button as "Save", and its type turns to submit
                in the middle of the click (prototype note). */}
            {canMarkGoing && step === 'ask' && (
              <div key="ask" className={e.footer}>
                <Button
                  type="button"
                  style="border"
                  variant="neutral"
                  size="s"
                  className={e.footerBtn}
                  onClick={onClose}
                >
                  No
                </Button>
                <Button type="button" size="s" className={e.footerBtn} onClick={handleYes} disabled={saving}>
                  Yes, I&apos;m going
                </Button>
              </div>
            )}
            {canMarkGoing && step === 'plans' && (
              <div key="details" className={e.footer}>
                {/* The answer was saved by "Yes", so right after it this leaves rather than cancels. */}
                <Button type="button" style="border" variant="neutral" size="s" className={e.footerBtn} onClick={close}>
                  {justMarked ? 'Skip' : 'Cancel'}
                </Button>
                <Button type="submit" size="s" className={e.footerBtn} disabled={saving}>
                  Save
                </Button>
              </div>
            )}
          </form>
        </FormProvider>
      </Drawer>
      {overlay}
    </>
  );
}
