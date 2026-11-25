'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { FormField } from '@/components/form/FormField';
import { EVENT_NAME_MAX } from '@/services/events/event-form';
import type { EventFormValues } from '@/services/events/event-submission.types';

import { useEventFormContext } from './EventFormContext';
import { FieldError } from './FieldError';
import { LogoTile } from './LogoTile';
import s from './EventForm.module.scss';
import p from './ProfileSection.module.scss';

/**
 * The event's logo with the Event Name field beside it. The name is a field like the others, with a counter; it
 * holds at most 100 characters and the rest is cut.
 */
export function ProfileSection() {
  const { setValue, clearErrors } = useFormContext<EventFormValues>();
  const { busy } = useEventFormContext();
  const [logoError, setLogoError] = useState<string | null>(null);

  return (
    <section className={s.section} data-section="profile">
      <div className={p.profile}>
        <LogoTile onIssue={setLogoError} />
        <div className={p.name}>
          <FormField
            name="name"
            label="Event Name"
            isRequired
            placeholder="Enter Event Name"
            maxLength={EVENT_NAME_MAX}
            max={EVENT_NAME_MAX}
            disabled={busy}
            rules={{
              onChange: (event: { target: { value: string } }) => {
                const value = event.target.value;
                if (value.length > EVENT_NAME_MAX) setValue('name', value.slice(0, EVENT_NAME_MAX));
                clearErrors('name');
              },
            }}
          />
        </div>
      </div>
      <FieldError message={logoError} />
    </section>
  );
}
