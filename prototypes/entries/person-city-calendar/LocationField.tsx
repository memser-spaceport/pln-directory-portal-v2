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
 * byte-identical; everything new sits below it.
 *
 * `LocationSelect` itself is react-query bound (/v1/locations/autocomplete), so
 * `CityCombobox` stands in for it per the copy-simplify rule. The label and hint
 * classes are imported from production's own module so they can't drift.
 *
 * No calendar grid. It opened on the current month while the stays sat two
 * months out, so it was a blank page-height block whose only instruction was
 * "drag" — and the list above it already states every stay. Adding one is now
 * three inline fields, with the same `DateRangePicker` the members filter uses,
 * so the feature has one way to pick a range rather than two.
 */

import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { DateRangePicker } from '@/components/form/DateRangePicker';
import { getFormattedDateString } from '@/utils/irl.utils';

import loc from '@/components/page/member-details/ProfileDetails/components/ProfileLocationInput/ProfileLocationInput.module.scss';

import { MOCK_PEOPLE, type Trip } from './mocks';
import { companionsFor, dateToKey, keyToDate, nameList } from './presence';
import { CityCombobox } from './CityCombobox';
import { CalendarIcon, PlaneIcon, TrashIcon } from './icons';
import s from './LocationField.module.scss';

interface StayDraft {
  id?: string;
  city: string;
  country: string;
  range: [Date, Date] | null;
  note: string;
}

const EMPTY_DRAFT: StayDraft = { city: '', country: '', range: null, note: '' };

interface LocationFieldProps {
  home: { city: string; country: string };
  onHomeChange: (home: { city: string; country: string }) => void;
  /** this member's stays only, already filtered */
  stays: Trip[];
  onStaysChange: (next: Trip[]) => void;
  /** everyone's stays other people can see — what "who else is there" reads */
  networkTrips: Trip[];
  memberId: string;
  todayKey: string;
  /** open the add row on mount — the members-page hand-off lands here */
  autoOpen?: boolean;
}

export function LocationField({
  home,
  onHomeChange,
  stays,
  onStaysChange,
  networkTrips,
  memberId,
  todayKey,
  autoOpen = false,
}: LocationFieldProps) {
  const [draft, setDraft] = useState<StayDraft | null>(autoOpen ? EMPTY_DRAFT : null);

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
    if (draft?.id === stay.id) setDraft(null);
  };

  const restoreStay = (stay: Trip) => {
    onStaysChange([...stays, stay]);
    setRemovedFromRsvp((current) => current.filter((candidate) => candidate.id !== stay.id));
  };

  const openStay = (stay: Trip) =>
    setDraft({
      id: stay.id,
      city: stay.city,
      country: stay.country,
      range: [keyToDate(stay.startDate), keyToDate(stay.endDate)],
      note: stay.note ?? '',
    });

  const draftStart = draft?.range ? dateToKey(draft.range[0]) : '';
  const draftEnd = draft?.range ? dateToKey(draft.range[1]) : '';

  // You can only be in one place. Say which stay is in the way rather than
  // letting the second one silently lose.
  const clash =
    draft?.range &&
    stays.find((stay) => stay.id !== draft.id && stay.startDate <= draftEnd && stay.endDate >= draftStart);

  const canSave = Boolean(draft?.city && draft.range && !clash);

  const saveDraft = () => {
    if (!draft || !draft.range || !canSave) return;
    if (draft.id) {
      onStaysChange(
        stays.map((stay) =>
          stay.id === draft.id
            ? {
                ...stay,
                city: draft.city,
                country: draft.country,
                startDate: draftStart,
                endDate: draftEnd,
                note: draft.note || undefined,
                // Editing a suggested stay is accepting it.
                confirmed: true,
              }
            : stay,
        ),
      );
    } else {
      onStaysChange([
        ...stays,
        {
          id: `t-${draft.city.toLowerCase().replace(/\s+/g, '-')}-${draftStart}`,
          memberId,
          city: draft.city,
          country: draft.country,
          startDate: draftStart,
          endDate: draftEnd,
          source: 'manual',
          note: draft.note || undefined,
          confirmed: true,
        },
      ]);
    }
    setDraft(null);
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
            {/* "Other locations" is the one noun for this everywhere — here, on
                the header chip's list and in the members prompt. It borrows the
                parent field's own word and makes no claim about tense: the list
                holds a stay already in progress as well as future ones. */}
            <span className={loc.label}>Other locations</span>
            {!draft && (
              <button type="button" className={s.addBtn} onClick={() => setDraft(EMPTY_DRAFT)}>
                + Add dates
              </button>
            )}
          </div>

          {(upcoming.length > 0 || removedFromRsvp.length > 0) && (
            <ul className={s.stayList}>
              {upcoming.map((stay) => {
                // The reward for the row existing: who it puts you next to.
                const companions = companionsFor(
                  stay.city,
                  stay.startDate,
                  stay.endDate,
                  MOCK_PEOPLE,
                  networkTrips,
                  memberId,
                );
                const suggested = stay.source === 'event' && !stay.confirmed;

                return (
                  <li key={stay.id}>
                    <div
                      className={`${s.stayRow} ${draft?.id === stay.id ? s.stayRowActive : ''} ${suggested ? s.stayRowSuggested : ''}`}
                    >
                      <button type="button" className={s.stayMain} onClick={() => openStay(stay)}>
                        <span className={s.stayLine}>
                          <PlaneIcon fill={suggested ? '#8897AE' : '#1B4DFF'} />
                          <span className={s.stayCity}>{stay.city}</span>
                          <span className={s.stayDates}>
                            <CalendarIcon fill="#8897AE" />
                            {getFormattedDateString(stay.startDate, stay.endDate)}
                          </span>
                          {stay.note && <span className={s.stayNote}>{stay.note}</span>}
                          {/* Name only. The team page's badge carries a month
                              under the name because it stands alone there; here
                              the row states the exact dates beside it. */}
                          {stay.eventName && (
                            <span className={s.eventBadge} title={stay.eventName}>
                              <span className={s.eventBadgeTitle}>{stay.eventName}</span>
                            </span>
                          )}
                        </span>

                        {/* A suggestion says what accepting it does; an accepted
                            stay says what it bought you. Never both. */}
                        {suggested ? (
                          <span className={s.stayMeta}>
                            From your RSVP — not on your profile until you add it.
                          </span>
                        ) : (
                          companions.length > 0 && (
                            <span className={s.stayMeta}>
                              {nameList(companions.map((c) => c.member.name))}{' '}
                              {companions.length === 1 ? 'is' : 'are'} there then.
                            </span>
                          )
                        )}
                      </button>

                      {/* Only a stay the product guessed needs accepting — one
                          you ticked the box for at RSVP arrives accepted. Quiet
                          and bordered: the form's primary is Save, and a filled
                          brand button in a row competes with it. It resolves to
                          "Added" rather than vanishing, so the press visibly
                          worked and the row doesn't reflow under the cursor. */}
                      {stay.source === 'event' &&
                        (suggested ? (
                          <Button
                            size="xs"
                            style="border"
                            variant="neutral"
                            onClick={() =>
                              onStaysChange(
                                stays.map((candidate) =>
                                  candidate.id === stay.id ? { ...candidate, confirmed: true } : candidate,
                                ),
                              )
                            }
                          >
                            Add
                          </Button>
                        ) : (
                          <span className={s.addedTag}>
                            <img src="/icons/added.svg" alt="" width={14} height={14} />
                            Added
                          </span>
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
                );
              })}

              {/* Deleting an event-derived stay removes it from your profile,
                  not from the event — you are still on that attendee list. So
                  the offer to put it back stays here rather than vanishing with
                  an undo toast. */}
              {removedFromRsvp.map((stay) => (
                <li key={`removed-${stay.id}`}>
                  <div className={`${s.stayRow} ${s.stayRowRemoved}`}>
                    <span className={s.stayMain}>
                      <span className={s.stayLine}>
                        <span className={s.stayCity}>{stay.city}</span>
                        <span className={s.stayDates}>
                          <CalendarIcon fill="#8897AE" />
                          {getFormattedDateString(stay.startDate, stay.endDate)}
                        </span>
                        <span className={s.stayNote}>Removed — you&apos;re still going to {stay.eventName}</span>
                      </span>
                    </span>
                    <button type="button" className={s.addBackBtn} onClick={() => restoreStay(stay)}>
                      Add back
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {draft && (
            <div className={s.editor}>
              <div className={s.editorFields}>
                <div className={`${s.editorField} ${s.editorCity}`}>
                  <span className={s.editorLabel}>City</span>
                  <CityCombobox
                    value={draft.city ? { city: draft.city, country: draft.country } : null}
                    onChange={(option) => setDraft({ ...draft, city: option.city, country: option.country })}
                  />
                </div>
                <div className={s.editorField}>
                  <DateRangePicker
                    label="Dates"
                    placeholder="When will you be there?"
                    value={draft.range}
                    onChange={(range) => setDraft({ ...draft, range })}
                    minDate={keyToDate(todayKey)}
                  />
                </div>
              </div>

              <div className={s.editorField}>
                <label className={s.editorLabel} htmlFor="stay-note">
                  Note <span className={s.editorOptional}>(Optional)</span>
                </label>
                <input
                  id="stay-note"
                  className={s.editorInput}
                  placeholder="Open for coffee, here for LabWeek…"
                  value={draft.note}
                  onChange={(event) => setDraft({ ...draft, note: event.target.value })}
                />
              </div>

              {clash && (
                <p className={s.editorError}>
                  You&apos;re already in {clash.city} {getFormattedDateString(clash.startDate, clash.endDate)}. Pick
                  other dates or change that one.
                </p>
              )}

              <div className={s.editorActions}>
                <Button size="xs" style="border" variant="neutral" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
                <Button size="xs" disabled={!canSave} onClick={saveDraft}>
                  {draft.id ? 'Update' : 'Add'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
