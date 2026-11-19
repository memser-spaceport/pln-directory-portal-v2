'use client';

import clsx from 'clsx';
import { useFormContext } from 'react-hook-form';

import { ACCESS_OPTIONS } from '@/services/events/event-form';
import type { EventFormValues } from '@/services/events/event-submission.types';

import { useEventFormContext } from './EventFormContext';
import s from './EventForm.module.scss';

/** How people get in: one choice of "Free/Rsvp" (the default), "Paid" and "Invite Only". */
export function AccessSection() {
  const { watch, setValue } = useFormContext<EventFormValues>();
  const { busy } = useEventFormContext();
  const value = watch('accessOption');

  return (
    <section className={s.section} data-section="access">
      <h2 className={s.sectionTitle} id="event-access-title">
        Access
      </h2>
      <div className={s.choices} role="radiogroup" aria-labelledby="event-access-title">
        {ACCESS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            className={clsx(s.choice, value === option.value && s.choiceOn)}
            disabled={busy}
            onClick={() => setValue('accessOption', option.value, { shouldDirty: true })}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}
