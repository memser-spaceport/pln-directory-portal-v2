'use client';

import clsx from 'clsx';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { safeTimezone } from '@/services/events/event-dates';
import { EVENT_FORM_TEXT, moveAgendaToTimezone } from '@/services/events/event-form';
import { resolvePlace } from '@/services/events/event-submission.service';
import type { EventFormValues, ResolvedPlace } from '@/services/events/event-submission.types';
import { usePlaceSuggestions } from '@/services/events/hooks/useEventSubmission';

import { useEventFormContext } from './EventFormContext';
import { FieldError } from './FieldError';
import s from './EventForm.module.scss';
import v from './VenueField.module.scss';

const SUGGEST_DELAY_MS = 300;
const MAX_SUGGESTIONS = 5;
const LIST_ID = 'event-venue-suggestions';
const optionId = (index: number) => `event-venue-suggestion-${index}`;

/**
 * The venue location: only a place that Google knows counts, as on the member profile's Location. Places are
 * suggested while a person types. A picked suggestion, or Enter on the typed text or leaving the field with it, resolves
 * the place: the address, the place and its time zone go into the form. Text that resolves to no place says "Pick a
 * venue from the suggestions" and the form is not sent; editing a resolved address drops the place and its instruction.
 */
export function VenueField() {
  const {
    watch,
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext<EventFormValues>();
  const venueError = errors.venue?.message;
  const { busy } = useEventFormContext();
  const venue = watch('venue') ?? '';

  // The text the suggestions are asked for: the typed text, once typing has paused.
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Counts lookups and edits: an answer for anything but the latest is dropped.
  const latest = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const { data, isPlaceholderData } = usePlaceSuggestions(query);
  // Only the answer for the text in the field is listed, never one for an earlier text.
  const current = query !== '' && query === venue.trim() && !isPlaceholderData;
  const suggestions = current ? (data ?? []).slice(0, MAX_SUGGESTIONS) : [];
  const expanded = open && suggestions.length > 0;
  const activeIndex = expanded && active < suggestions.length ? active : -1;

  const edit = (text: string) => {
    latest.current += 1;
    setValue('venue', text, { shouldDirty: true });
    clearErrors('venue');
    if (getValues('place')) {
      setValue('place', null, { shouldDirty: true });
      setValue('instruction', '', { shouldDirty: true });
    }
    setOpen(true);
    setActive(-1);
    clearTimeout(timer.current);
    if (!text.trim()) {
      setQuery('');
      return;
    }
    timer.current = setTimeout(() => setQuery(text.trim()), SUGGEST_DELAY_MS);
  };

  const apply = (resolved: ResolvedPlace) => {
    setQuery('');
    setValue('venue', resolved.address, { shouldDirty: true });
    clearErrors('venue');
    setValue(
      'place',
      {
        city: resolved.city ?? null,
        state: resolved.state ?? null,
        country: resolved.country ?? null,
        latitude: resolved.latitude ?? null,
        longitude: resolved.longitude ?? null,
        locationUrl: resolved.locationUrl ?? null,
      },
      { shouldDirty: true },
    );
    // The event moves to the place's time zone; the typed dates and times, and each session, keep their clock values.
    const from = getValues('timezone');
    const to = resolved.timezone;
    if (to && to !== from && safeTimezone(to) === to) {
      setValue('agenda', moveAgendaToTimezone(getValues('agenda'), from, to), { shouldDirty: true });
      setValue('timezone', to, { shouldDirty: true });
      clearErrors('timezone');
    }
  };

  const resolve = async (place: { placeId: string } | { address: string }) => {
    const id = (latest.current += 1);
    clearTimeout(timer.current);
    setOpen(false);
    setActive(-1);
    let resolved: ResolvedPlace | null;
    try {
      resolved = await resolvePlace(place);
    } catch {
      if (id === latest.current) setError('venue', { type: 'manual', message: EVENT_FORM_TEXT.venueLookupFailed });
      return;
    }
    if (id !== latest.current) return;
    if (!resolved?.address?.trim()) {
      setError('venue', { type: 'manual', message: EVENT_FORM_TEXT.venueNotFound });
      return;
    }
    apply(resolved);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (suggestions.length === 0) return;
      event.preventDefault();
      setOpen(true);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      const from = activeIndex === -1 && step === -1 ? 0 : activeIndex;
      setActive((from + step + suggestions.length) % suggestions.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex >= 0) void resolve({ placeId: suggestions[activeIndex].placeId });
      else if (venue.trim()) void resolve({ address: venue.trim() });
    } else if (event.key === 'Escape' && expanded) {
      event.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <div className={v.field}>
      <label className={v.label} htmlFor="event-venue">
        Venue Location
      </label>
      <div className={v.box}>
        <input
          id="event-venue"
          type="text"
          className={clsx(s.input, venueError && s.inputInvalid)}
          aria-invalid={venueError ? true : undefined}
          data-invalid={venueError ? true : undefined}
          placeholder="Enter Venue Location"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={LIST_ID}
          aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
          value={venue}
          disabled={busy}
          onChange={(event) => edit(event.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            // Typed text that was not resolved is looked up when the person leaves the field.
            if (venue.trim() && !getValues('place')) void resolve({ address: venue.trim() });
          }}
        />
        <ul id={LIST_ID} className={v.list} role="listbox" aria-label="Venue suggestions" hidden={!expanded}>
          {expanded &&
            suggestions.map((suggestion, index) => (
              <li
                key={suggestion.placeId}
                id={optionId(index)}
                role="option"
                aria-selected={index === activeIndex}
                className={clsx(v.option, index === activeIndex && v.optionActive)}
                // Keeps the focus in the input, so the press lands before the list closes.
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => void resolve({ placeId: suggestion.placeId })}
              >
                {suggestion.text}
              </li>
            ))}
        </ul>
      </div>
      <FieldError message={venueError} />
    </div>
  );
}
