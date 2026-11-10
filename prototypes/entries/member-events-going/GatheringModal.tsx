'use client';

import { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Checkbox } from '@/components/common/Checkbox';
import { Modal } from '@/components/common/Modal/Modal';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { ITeam } from '@/types/teams.types';

// Production's presentational parts, imported as they are. They render from props.
import { AboutSection } from '@/components/core/UpdatesPanel/IrlGatheringModal/components/AboutSection';
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

import { EventRow, GoingMark } from './EventRow';
import { markGoing, saveGathering, useGoing, type GoingScope } from './goingStore';
import { ATTENDEES, eventsOf, gatheringOf, GOING_EVENTS, MAYA_TEAMS, toEventData, type GoingEvent } from './mocks';
import s from './MemberEventsGoing.module.scss';

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

  const [step, setStep] = useState<1 | 2>(going[event.uid] ? 2 : 1);
  const [showOnProfile, setShow] = useState(going[event.uid]?.showOnProfile ?? true);
  const [justMarked, setJustMarked] = useState(false);
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
  const attending = !!going[event.uid] || justMarked;
  const count = event.attendeeCount + (attending ? 1 : 0);

  const finish = (onProfile: boolean) => {
    onClose();
    if (justMarked) onNotice?.({ eventName: event.name, onProfile });
  };

  const onYes = () => {
    markGoing(scope, event.uid, showOnProfile);
    // Added to anything else they already said yes to in this city.
    methods.setValue('selectedEventUids', [...selectedEventUids, event.uid]);
    methods.setValue('eventRoles', [...eventRoles, { eventUid: event.uid, roles: ['Attendee'] }]);
    setJustMarked(true);
    setStep(2);
  };

  const onSave = methods.handleSubmit((data) => {
    saveGathering(
      scope,
      siblings.map((e) => e.uid),
      data.selectedEventUids,
      data.eventRoles,
      showOnProfile,
    );
    finish(showOnProfile);
  });

  if (picker.currentView === 'datePicker') {
    return (
      <Modal isOpen onClose={onClose} overlayClassname={m.modalOverlay}>
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
      <Modal isOpen onClose={onClose} overlayClassname={m.modalOverlay}>
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
      <Modal isOpen onClose={onClose} overlayClassname={m.modalOverlay}>
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
        onClose={() => finish(showOnProfile)}
      />
    );
  }

  const consent = (
    <label className={s.consent}>
      <Checkbox checked={showOnProfile} onChange={setShow} aria-labelledby="going-consent-label" />
      <span className={s.consentText}>
        <span id="going-consent-label" className={s.consentLabel}>
          Show on my profile
        </span>
        <span className={s.consentHint}>Signed-in members will see {event.name} on your profile.</span>
      </span>
    </label>
  );

  return (
    <Modal isOpen onClose={() => finish(showOnProfile)} overlayClassname={m.modalOverlay}>
      <FormProvider {...methods}>
        <form onSubmit={onSave} className={m.modal} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}>
          <Header title={event.name} onClose={() => finish(showOnProfile)} />

          <div className={m.content}>
            <AboutSection description={gathering.about} />

            <GatheringDetails
              dateRange={event.range}
              location={gathering.city}
              eventsLink={gathering.scheduleLink}
              eventsCount={siblings.length}
              resources={gathering.resources}
            />

            <div className={m.section}>
              <h3 className={m.sectionTitle}>Attendees</h3>
              <div className={m.attendeesRow}>
                <div className={m.avatarGroup}>
                  {ATTENDEES.slice(0, 3).map((a) => (
                    <div key={a.uid} className={m.avatar}>
                      <img src={getDefaultAvatar(a.name)} alt="" width={24} height={24} />
                    </div>
                  ))}
                </div>
                <button type="button" className={m.linkButton} onClick={() => setShowAttendees(true)}>
                  {count} People going
                </button>
              </div>
            </div>

            {step === 1 && (
              <div className={s.askBlock}>
                <div>
                  <div className={m.step1Title}>Are you going to {event.name}?</div>
                  <div className={m.step1Subtitle}>Let others know if you are attending.</div>
                </div>
                {consent}
              </div>
            )}

            {step === 2 && (
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
                  teams={MAYA_TEAMS as unknown as ITeam[]}
                  telegramHandle="@mayaokonkwo"
                  officeHours=""
                  defaultExpanded={false}
                />
                {consent}
              </>
            )}
          </div>

          {/* Keyed per step. Without it React reuses the "Yes" button as "Save",
              and its type turns to submit in the middle of the click. */}
          {step === 1 ? (
            <div key="ask" className={m.footer}>
              <button type="button" className={m.cancelButton} onClick={onClose}>
                No
              </button>
              <button type="button" className={m.goingButton} onClick={onYes}>
                Yes, I&apos;m going
              </button>
            </div>
          ) : (
            <div key="details" className={m.footer}>
              {/* Step two is optional detail: the answer was saved by "Yes", so
                  this leaves rather than cancels. */}
              <button type="button" className={m.cancelButton} onClick={() => finish(showOnProfile)}>
                {justMarked ? 'Skip' : 'Cancel'}
              </button>
              <button type="submit" className={m.goingButton}>
                Save
              </button>
            </div>
          )}
        </form>
      </FormProvider>
    </Modal>
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
