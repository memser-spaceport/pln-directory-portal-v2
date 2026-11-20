'use client';

import clsx from 'clsx';
import { useFormContext } from 'react-hook-form';

import { FormField } from '@/components/form/FormField';
import { FORMAT_OPTIONS } from '@/services/events/event-form';
import type { EventFormat, EventFormValues } from '@/services/events/event-submission.types';
import { HAS_EVENTS_MAP } from '@/utils/events-page';

import { useEventFormContext } from './EventFormContext';
import { VenueField } from './VenueField';
import { VenueMap } from './VenueMap';
import s from './EventForm.module.scss';

/**
 * The format and the location fields it decides: In Person has the venue, Online the meeting link, Hybrid both.
 * A resolved venue shows a small map and the Instruction field. Changing the format empties the location fields.
 */
export function FormatSection() {
  const { watch, setValue } = useFormContext<EventFormValues>();
  const { busy } = useEventFormContext();
  const format = watch('format');
  const place = watch('place');
  const hasVenue = format !== 'VIRTUAL';
  const hasMeeting = format !== 'IN_PERSON';

  const pick = (value: EventFormat) => {
    if (value === format) return;
    setValue('format', value, { shouldDirty: true });
    setValue('venue', '', { shouldDirty: true });
    setValue('place', null, { shouldDirty: true });
    setValue('instruction', '', { shouldDirty: true });
    setValue('meetingUrl', '', { shouldDirty: true });
  };

  return (
    <section className={s.section} data-section="format">
      <h2 className={s.sectionTitle} id="event-format-title">
        Format
      </h2>
      <div className={s.choices} role="radiogroup" aria-labelledby="event-format-title">
        {FORMAT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={format === option.value}
            className={clsx(s.choice, format === option.value && s.choiceOn)}
            disabled={busy}
            onClick={() => pick(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {hasVenue && (
        <>
          <VenueField key={format} />
          {place && (
            <>
              {HAS_EVENTS_MAP && place.latitude != null && place.longitude != null && (
                <VenueMap latitude={place.latitude} longitude={place.longitude} />
              )}
              <FormField
                name="instruction"
                label="Instruction"
                placeholder="8th Floor, 2nd Building, etc."
                disabled={busy}
              />
            </>
          )}
        </>
      )}

      {hasMeeting && (
        <FormField name="meetingUrl" label="Meeting Link" placeholder="Enter Meeting Link" disabled={busy} />
      )}
    </section>
  );
}
