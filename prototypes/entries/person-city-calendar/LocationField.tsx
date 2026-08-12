'use client';

/**
 * Location — production's existing profile field, extended in time.
 *
 * The directory already asks this question exactly once, in Edit Profile Details:
 * `ProfileLocationInput` renders a "Location" label, a `LocationSelect`, and the
 * hint "Please share location details to receive invitations for relevant PL
 * events happening in your area." That field already exists to connect people to
 * what's near them — so travel belongs *inside* it, not in a second section
 * competing with it. This component drops into the same slot
 * (EditProfileForm.tsx:360-362) and keeps the label, the control and the hint
 * byte-identical; everything new sits below the divider.
 *
 * `LocationSelect` itself is react-query bound (/v1/locations/autocomplete), so
 * `CityCombobox` stands in for it per the copy-simplify rule. The label and hint
 * classes are imported from production's own module so they can't drift.
 */

import { useState } from 'react';
import { getFormattedDateString } from '@/utils/irl.utils';

import loc from '@/components/page/member-details/ProfileDetails/components/ProfileLocationInput/ProfileLocationInput.module.scss';

import type { Trip } from './mocks';
import { dateToKey, keyToDate } from './presence';
import { CityCombobox } from './CityCombobox';
import { TripCalendar } from './TripCalendar';
import { TripEditor, type TripDraft } from './TripEditor';
import { CalendarIcon, PlaneIcon, TrashIcon } from './icons';
import s from './LocationField.module.scss';

interface LocationFieldProps {
  home: { city: string; country: string };
  onHomeChange: (home: { city: string; country: string }) => void;
  /** this member's stays only, already filtered */
  stays: Trip[];
  onStaysChange: (next: Trip[]) => void;
  memberId: string;
  todayKey: string;
  /** open the picker on mount — the RSVP hand-off lands here */
  autoOpen?: boolean;
}

export function LocationField({
  home,
  onHomeChange,
  stays,
  onStaysChange,
  memberId,
  todayKey,
  autoOpen = false,
}: LocationFieldProps) {
  const [picking, setPicking] = useState(autoOpen);
  const [draft, setDraft] = useState<TripDraft | null>(null);
  const [selection, setSelection] = useState<[Date, Date] | null>(null);
  const [activeStartDate, setActiveStartDate] = useState<Date>(() => {
    const today = keyToDate(todayKey);
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Removing an event-derived stay does not un-RSVP you — you are still on that
  // attendee list, so the dates are still a known fact about you and the offer
  // to put them back has to survive the delete. Kept here rather than as a
  // transient undo toast: the RSVP is durable, so the suggestion is too.
  const [removedFromRsvp, setRemovedFromRsvp] = useState<Trip[]>([]);

  const upcoming = stays.filter((stay) => stay.endDate >= todayKey);

  const removeStay = (stay: Trip) => {
    onStaysChange(stays.filter((candidate) => candidate.id !== stay.id));
    if (stay.source === 'event') {
      setRemovedFromRsvp((current) => (current.some((t) => t.id === stay.id) ? current : [...current, stay]));
    }
    if (draft?.id === stay.id) closeDraft();
  };

  const restoreStay = (stay: Trip) => {
    onStaysChange([...stays, stay]);
    setRemovedFromRsvp((current) => current.filter((candidate) => candidate.id !== stay.id));
  };

  const closeDraft = () => {
    setDraft(null);
    setSelection(null);
  };

  /** Cancel backs out of the whole thing, calendar included — leaving the grid
   *  open after a cancel makes it look like the form is still expecting input. */
  const cancelPicking = () => {
    closeDraft();
    setPicking(false);
  };

  const startFromSelection = (range: [Date, Date] | null) => {
    setSelection(range);
    if (!range) return;
    setDraft({ city: '', country: '', startDate: dateToKey(range[0]), endDate: dateToKey(range[1]), note: '' });
  };

  const openStay = (stay: Trip) => {
    setPicking(true);
    setSelection(null);
    setDraft({
      id: stay.id,
      city: stay.city,
      country: stay.country,
      startDate: stay.startDate,
      endDate: stay.endDate,
      note: stay.note ?? '',
      eventName: stay.eventName,
    });
    const start = keyToDate(stay.startDate);
    setActiveStartDate(new Date(start.getFullYear(), start.getMonth(), 1));
  };

  const saveDraft = () => {
    if (!draft) return;
    if (draft.id) {
      onStaysChange(
        stays.map((stay) =>
          stay.id === draft.id
            ? {
                ...stay,
                city: draft.city,
                country: draft.country,
                startDate: draft.startDate,
                endDate: draft.endDate,
                note: draft.note || undefined,
                // Editing an event-derived stay detaches it from the RSVP and
                // counts as confirmation — the one-way link rule.
                confirmed: true,
              }
            : stay,
        ),
      );
    } else {
      onStaysChange([
        ...stays,
        {
          id: `t-${draft.city.toLowerCase().replace(/\s+/g, '-')}-${draft.startDate}`,
          memberId,
          city: draft.city,
          country: draft.country,
          startDate: draft.startDate,
          endDate: draft.endDate,
          source: 'manual',
          note: draft.note || undefined,
          confirmed: true,
        },
      ]);
    }
    closeDraft();
  };

  return (
    <div className={loc.root}>
      {/* ---- unchanged from production ---- */}
      <div className={loc.header}>
        <span className={loc.label}>Location</span>
      </div>
      <CityCombobox value={home} onChange={onHomeChange} placeholder="Enter your location" />
      <p className={loc.hint}>
        Please share location details to receive invitations for relevant PL events happening in your area.
      </p>

      {/* ---- the extension: the same question, over time ----
          Hidden until a home city exists. "Where else you'll be" is an exception
          to a rule, and there is no rule yet — on a brand-new profile (the
          `+ Your Location` state) the field stays exactly as production ships
          it, one question, and the dates appear once it's answered. */}
      {!home.city ? (
        <p className={s.locked}>Add your city first — then you can add the dates you&apos;ll be somewhere else.</p>
      ) : (
        <div className={s.stays}>
          <div className={s.staysHead}>
            {/* A plain noun phrase, like every other field label on this form
                ("Location", "Professional skills", "Bio") — the sentence
                fragment read as instructions. It borrows the parent field's own
                word, so the two halves are tied lexically as well as spatially,
                and it makes no claim about tense: the list holds a stay already
                in progress as well as future ones, which "Upcoming locations"
                would get wrong. */}
            <span className={loc.label}>Other locations</span>
            <button
              type="button"
              className={s.addBtn}
              onClick={() => {
                setPicking(true);
                closeDraft();
              }}
            >
              + Add dates
            </button>
          </div>

          {/* No empty-state copy: "+ Add dates" already says what to do, and the
              calendar's own legend says the rest ("Unmarked days mean you're in
              Lisbon"). */}
          {(upcoming.length > 0 || removedFromRsvp.length > 0) && (
            <ul className={s.stayList}>
              {upcoming.map((stay) => (
                <li key={stay.id}>
                  <div className={`${s.stayRow} ${draft?.id === stay.id ? s.stayRowActive : ''}`}>
                    <button type="button" className={s.stayMain} onClick={() => openStay(stay)}>
                      <PlaneIcon fill={stay.confirmed ? '#1B4DFF' : '#8897AE'} />
                      <span className={s.stayCity}>{stay.city}</span>
                      <span className={s.stayDates}>
                        <CalendarIcon fill="#8897AE" />
                        {getFormattedDateString(stay.startDate, stay.endDate)}
                      </span>
                      {stay.note && <span className={s.stayNote}>{stay.note}</span>}
                      {/* Name only. The team page's badge carries a month under
                          the name because it stands alone there; here the row
                          states the exact dates two items to the left, so the
                          month was the same fact twice. */}
                      {stay.eventName && (
                        <span className={s.eventBadge} title={stay.eventName}>
                          <span className={s.eventBadgeTitle}>{stay.eventName}</span>
                        </span>
                      )}
                    </button>

                    {/* Confirm resolves to "Added" rather than disappearing.
                        A control that vanishes on click leaves you guessing
                        whether it worked, and the row reflows under the cursor.
                        Only event-derived stays get either state — a manual one
                        was never unconfirmed, so "Added" would be noise. */}
                    {stay.source === 'event' &&
                      (stay.confirmed ? (
                        <span className={s.addedTag}>
                          <img src="/icons/added.svg" alt="" width={14} height={14} />
                          Added
                        </span>
                      ) : (
                        <button
                          type="button"
                          className={s.confirmBtn}
                          onClick={() =>
                            onStaysChange(
                              stays.map((candidate) =>
                                candidate.id === stay.id ? { ...candidate, confirmed: true } : candidate,
                              ),
                            )
                          }
                        >
                          Confirm
                        </button>
                      ))}

                    <button
                      type="button"
                      className={s.removeBtn}
                      aria-label={`Remove ${stay.city}`}
                      onClick={() => removeStay(stay)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </li>
              ))}

              {/* Deleting an event-derived stay removes it from your profile,
                  not from the event — you are still on that attendee list. So
                  the offer to put it back stays here rather than vanishing with
                  an undo toast. */}
              {removedFromRsvp.map((stay) => (
                <li key={`removed-${stay.id}`}>
                  <div className={`${s.stayRow} ${s.stayRowRemoved}`}>
                    <span className={s.stayMain}>
                      <span className={s.stayCity}>{stay.city}</span>
                      <span className={s.stayDates}>
                        <CalendarIcon fill="#8897AE" />
                        {getFormattedDateString(stay.startDate, stay.endDate)}
                      </span>
                      <span className={s.stayNote}>Removed — you&apos;re still going to {stay.eventName}</span>
                    </span>
                    <button type="button" className={s.addBackBtn} onClick={() => restoreStay(stay)}>
                      Add back
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {picking && (
            <div className={s.picker}>
              <div className={s.pickerCol}>
                <TripCalendar
                  trips={stays}
                  activeStartDate={activeStartDate}
                  onActiveStartDateChange={setActiveStartDate}
                  selection={selection}
                  onSelect={startFromSelection}
                  todayKey={todayKey}
                  homeCity={home.city}
                />
              </div>

              <div className={s.pickerCol}>
                {draft ? (
                  <TripEditor
                    draft={draft}
                    onChange={setDraft}
                    onSave={saveDraft}
                    onCancel={cancelPicking}
                    onDelete={
                      draft.id
                        ? () => {
                            const target = stays.find((stay) => stay.id === draft.id);
                            if (target) removeStay(target);
                            closeDraft();
                          }
                        : undefined
                    }
                  />
                ) : (
                  <div className={s.pickerHint}>
                    <strong>Drag across the calendar</strong>{' '}
                    <span>to add the dates you&apos;ll be away, or pick one of the rows above to change it.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
