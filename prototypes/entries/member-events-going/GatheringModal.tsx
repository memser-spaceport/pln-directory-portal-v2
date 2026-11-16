'use client';

import { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';


import { Button } from '@/components/common/Button';
import { Drawer } from '@/components/common/Drawer';
import { Modal } from '@/components/common/Modal/Modal';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { ITeam } from '@/types/teams.types';

// Production's presentational parts, imported as they are. They render from props.
import { AdditionalDetailsSection } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/AdditionalDetailsSection';
import { DatePickerView } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/DatePickerView';
import { EventsPickerView } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/EventsPickerView';
import { GatheringDetails } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/GatheringDetails';
import { PlanningSection } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/PlanningSection';
import { TopicsPickerView } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/TopicsPickerView';
import { useIrlGatheringModal } from '@/components/core/UpdatesPanel/IrlGatheringModal/hooks/useIrlGatheringModal';
import { CloseIcon } from '@/components/core/UpdatesPanel/IrlGatheringModal/icons';
import type { EventRoleSelection, IrlGatheringFormData } from '@/components/core/UpdatesPanel/IrlGatheringModal/types';
import m from '@/components/core/UpdatesPanel/IrlGatheringModal/IrlGatheringModal.module.scss';

import { BackIcon, EventSummary, Label, PinLabelIcon } from './EventDetails';
import e from './EventDetails.module.scss';
import { EventRow, GoingMark } from './EventRow';
import { saveGathering, useGoing, type GoingScope } from './goingStore';
import { useHideAgentWhileOpen } from './useHideAgentWhileOpen';
import {
  ATTENDEES,
  EVENT_DETAILS,
  EVENT_THUMBS,
  eventsOf,
  gatheringOf,
  GOING_EVENTS,
  MAYA_TEAMS,
  toEventData,
  type GoingEvent,
} from './mocks';
import s from './MemberEventsGoing.module.scss';
import { RsvpCard } from '../event-drawer-redesign/RsvpCard';


/** What opened the modal: one event, or the owner's "Add event" list. */
export type GatheringTarget = { kind: 'event'; eventUid: string } | { kind: 'pick' };

export interface GatheringNotice {
  eventName: string;
  /** Whether the answer is on the member's profile. */
  onProfile: boolean;
}

/**
 * The members' replacement for /events/irl, which became admin-only on
 * 2026-11-05 (LAB-3117).
 *
 * A copy-simplify of production's `IrlGatheringModal`: same stylesheet, same
 * sections, same two steps, with the submit hooks swapped for `goingStore`.
 *
 * Deliberate deviations from production, so a later pass doesn't "restore" them:
 *  - Opens on an EVENT, not a city. The title is the event, and "Yes, I'm going"
 *    saves that event. Production saves `events: []` at this step.
 *  - "N People going" opens the list inside the modal. Production links to the
 *    page members can no longer open.
 *  - "Show on my profile", ticked by default, asked where the answer is given.
 *  - An "Add event" list for the owner's door on their profile.
 *  - The title drops "IRL Gatherings:", the name of the hidden page.
 *  - 2026-11-10: the event opens as the PL events app draws it (right-hand drawer,
 *    "EVENT DETAILS", logo, facts, tags, Host, Description, Agenda; see
 *    `EventDetails`), with the gathering links, Attendees and the ask below it.
 *    The date pickers and the people list stay modals above the drawer.
 */
export function GatheringModal({
  target,
  scope,
  onClose,
  onNotice,
}: {
  target: GatheringTarget | null;
  scope: GoingScope;
  onClose: () => void;
  onNotice?: (notice: GatheringNotice) => void;
}) {
  /* Home's floating Agent door would cover the drawer's footer; it steps aside while the drawer is open. */
  useHideAgentWhileOpen(!!target);
  if (!target) return null;
  return <Flow key={JSON.stringify(target)} target={target} scope={scope} onClose={onClose} onNotice={onNotice} />;
}

function Flow({
  target,
  scope,
  onClose,
  onNotice,
}: {
  target: GatheringTarget;
  scope: GoingScope;
  onClose: () => void;
  onNotice?: (notice: GatheringNotice) => void;
}) {
  const [eventUid, setEventUid] = useState<string | null>(target.kind === 'event' ? target.eventUid : null);
  const event = GOING_EVENTS.find((e) => e.uid === eventUid) ?? null;

  if (!event) {
    return <PickView scope={scope} onClose={onClose} onPick={setEventUid} />;
  }
  return <EventFlow key={event.uid} event={event} scope={scope} onClose={onClose} onNotice={onNotice} />;
}

function EventFlow({
  event,
  scope,
  onClose,
  onNotice,
}: {
  event: GoingEvent;
  scope: GoingScope;
  onClose: () => void;
  onNotice?: (notice: GatheringNotice) => void;
}) {
  const going = useGoing(scope);
  const gathering = gatheringOf(event);
  const siblings = useMemo(() => eventsOf(gathering), [gathering]);
  const entries = siblings.filter((e) => going[e.uid]);

  /* As the redesigned drawer (user, 2026-11-12: "the same state change and experience"): it always opens on
     the event; the RSVP card answers in place ("Are you going?" → "You're going"); "Add your plans" opens
     step 2 as a sub-view whose Back, Cancel and Save all return to the event; the "you're going" toast waits
     for the drawer to close. */
  const [step, setStep] = useState<1 | 2>(1);
  const showOnProfile = going[event.uid]?.showOnProfile ?? true;
  const [lastMarked, setLastMarked] = useState<GatheringNotice | null>(null);
  const [showAttendees, setShowAttendees] = useState(false);

  const initialRoles: EventRoleSelection[] = entries.map((e) => ({ eventUid: e.uid, roles: going[e.uid].roles }));
  const methods = useForm<IrlGatheringFormData>({
    defaultValues: {
      topics: [],
      selectedEventUids: entries.map((e) => e.uid),
      eventRoles: initialRoles,
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
    .filter((e): e is (typeof eventData)[number] => !!e)
    .map((e) => ({ uid: e.uid, name: e.name }));

  const planningQuestion = `What are you planning for ${gathering.city}?`;
  const attending = !!going[event.uid];
  const count = event.attendeeCount + (attending ? 1 : 0);

  const finish = () => {
    onClose();
    if (lastMarked) onNotice?.(lastMarked);
  };

  /* The plans form starts from what the store says now (it may have changed on the card since mount),
     as the redesigned drawer's PlansView builds its form when it opens. */
  const openPlans = () => {
    const now = siblings.filter((e) => going[e.uid]);
    methods.reset({
      topics: [],
      selectedEventUids: now.map((e) => e.uid),
      eventRoles: now.map((e) => ({ eventUid: e.uid, roles: going[e.uid].roles })),
      additionalDetails: '',
      telegramHandle: '@mayaokonkwo',
      officeHours: '',
    });
    setStep(2);
  };
  const backToEvent = () => setStep(1);

  const onSave = methods.handleSubmit((data) => {
    saveGathering(
      scope,
      siblings.map((e) => e.uid),
      data.selectedEventUids,
      data.eventRoles,
      showOnProfile,
    );
    backToEvent();
  });

  const renderOverlay = () => {
    if (picker.currentView === 'datePicker') {
      return (
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
      );
    }

    if (showAttendees) {
      return (
        <AttendeesView
          eventName={event.name}
          total={count}
          you={attending}
          onBack={() => setShowAttendees(false)}
          onClose={finish}
        />
      );
    }
    return null;
  };
  const overlay = renderOverlay();
  const close = finish;
  /* Escape and the backdrop: a picker first (it owns them), then the plans sub-view, then the drawer. */
  const onDrawerClose = () => {
    if (overlay) return;
    if (step === 2) backToEvent();
    else close();
  };
  const detail = EVENT_DETAILS[event.uid];
  const drawerWidth = typeof window === 'undefined' ? 778 : Math.min(778, window.innerWidth);

  return (
    <>
      {/* While a picker or the people list is open above it, Escape and the backdrop belong to that. */}
      <Drawer isOpen onClose={onDrawerClose} width={drawerWidth}>
        <FormProvider {...methods}>
          <form onSubmit={onSave} className={e.root} onKeyDown={(ev) => ev.key === 'Enter' && ev.preventDefault()}>
            <div className={e.backBar}>
              {/* On the plans sub-view Back returns to the event, as the redesigned drawer's SubHead does. */}
              <button type="button" className={e.back} onClick={step === 2 ? backToEvent : close}>
                <BackIcon />
                {step === 2 ? 'Back to event' : 'Back'}
              </button>
            </div>

            <div className={e.body}>
              {step === 1 && (
                <>
                  <EventSummary
                    name={event.name}
                    detail={detail}
                    image={EVENT_THUMBS[event.uid]}
                    beforeAgenda={
                      /* The redesigned drawer's own RSVP card (event-drawer-redesign/RsvpCard), shared, above
                         the Agenda (user, 2026-11-12). It answers in place: "Are you going?" → "You're going",
                         with Show on my profile, Add your plans for <city> and Mark as not going. */
                      <RsvpCard
                        event={event}
                        gathering={gathering}
                        scope={scope}
                        onOpenAttendees={() => setShowAttendees(true)}
                        onOpenPlans={openPlans}
                        onMarked={(onProfile) => setLastMarked({ eventName: event.name, onProfile })}
                        onUnmarked={() => setLastMarked(null)}
                      />
                    }
                  />

                  <div className={`${e.block} ${e.gatheringBlock}`}>
                    <Label icon={<PinLabelIcon />}>{gathering.city} gathering</Label>
                    <div className={e.gatheringLinks}>
                      <GatheringDetails
                        dateRange={event.range}
                        location={gathering.city}
                        eventsLink={gathering.scheduleLink}
                        eventsCount={siblings.length}
                        resources={gathering.resources}
                      />
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className={e.plansTitle}>Your plans for {gathering.city}</h2>
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
                </>
              )}
            </div>

            {/* The directory's own DS buttons, as on the profile's Cancel/Save
                (EditFormControls). Step one has no footer: its presses are in the card.
                Cancel and Save both return to the event (the redesigned drawer's PlansView). */}
            {step === 2 && (
              <div key="details" className={e.footer}>
                <Button type="button" style="border" variant="neutral" size="s" className={e.footerBtn} onClick={backToEvent}>
                  Cancel
                </Button>
                <Button type="submit" size="s" className={e.footerBtn}>
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

function Header({ title, onBack, onClose }: { title: string; onBack?: () => void; onClose: () => void }) {
  return (
    <div className={m.header}>
      <div className={m.headerContent}>
        {onBack ? (
          <button type="button" className={s.backButton} onClick={onBack} aria-label="Back">
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M10 3.5L5.5 8L10 12.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : (
          <div className={m.iconWrapper}>
            <img src="/images/irl/defaultCity.svg" alt="" width={40} height={40} />
          </div>
        )}
        <div className={m.headerText}>
          <h2 className={m.title}>{title}</h2>
        </div>
      </div>
      <button className={m.closeButton} onClick={onClose} aria-label="Close" type="button">
        <CloseIcon />
      </button>
    </div>
  );
}

/** "N People going", the job of the old page's attendee table, in place. */
function AttendeesView({
  eventName,
  total,
  you,
  onBack,
  onClose,
}: {
  eventName: string;
  total: number;
  you: boolean;
  onBack: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const others = ATTENDEES.slice(0, total - (you ? 1 : 0));
  const rows = others.filter((a) => `${a.name} ${a.team}`.toLowerCase().includes(needle));

  return (
    <Modal isOpen onClose={onClose} overlayClassname={m.modalOverlay}>
      <div className={m.modal}>
        <Header title={`${total} going to ${eventName}`} onBack={onBack} onClose={onClose} />
        <div className={s.searchWrap}>
          <input
            className={s.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or team"
            aria-label="Search people going"
          />
        </div>
        <ul className={s.attendees}>
          {you && !needle && (
            <li className={s.attendee}>
              <img className={s.attendeeImg} src={getDefaultAvatar('Maya Okonkwo')} alt="" />
              <span className={s.attendeeText}>
                <span className={s.attendeeName}>You</span>
              </span>
            </li>
          )}
          {rows.map((a) => (
            <li key={a.uid}>
              <a className={s.attendee} href="/prototypes/member-profile" target="_blank" rel="noreferrer">
                <img className={s.attendeeImg} src={getDefaultAvatar(a.name)} alt="" />
                <span className={s.attendeeText}>
                  <span className={s.attendeeName}>{a.name}</span>
                  <span className={s.attendeeMeta}>
                    {a.role} · {a.team}
                  </span>
                </span>
                {a.tag && <span className={s.attendeeTag}>{a.tag}</span>}
              </a>
            </li>
          ))}
          {rows.length === 0 && <li className={s.noResults}>Nobody going matches that search.</li>}
        </ul>
      </div>
    </Modal>
  );
}

/** The owner's "Add event": choose one, and it opens the same modal as everywhere else. */
function PickView({
  scope,
  onClose,
  onPick,
}: {
  scope: GoingScope;
  onClose: () => void;
  onPick: (eventUid: string) => void;
}) {
  const going = useGoing(scope);
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const rows = GOING_EVENTS.filter((e) => `${e.name} ${gatheringOf(e).city}`.toLowerCase().includes(needle));

  return (
    <Modal isOpen onClose={onClose} overlayClassname={m.modalOverlay}>
      <div className={m.modal}>
        <Header title="Add an event you're going to" onClose={onClose} />
        <div className={s.searchWrap}>
          <input
            className={s.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by event or city"
            aria-label="Search upcoming events"
          />
        </div>
        <ul className={s.pickList}>
          {rows.map((event) => (
            <EventRow
              key={event.uid}
              event={event}
              onOpen={() => onPick(event.uid)}
              trailing={going[event.uid] ? <GoingMark /> : undefined}
            />
          ))}
          {rows.length === 0 && <li className={s.noResults}>No upcoming events match that search.</li>}
        </ul>
      </div>
    </Modal>
  );
}
