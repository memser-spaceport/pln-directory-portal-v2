'use client';

import { useFormContext } from 'react-hook-form';

import { FormField } from '@/components/form/FormField';
import type { EventFormValues } from '@/services/events/event-submission.types';

import { useEventFormContext } from './EventFormContext';
import s from './EventForm.module.scss';

/** Edit page only: the event's own website. */
export function WebsiteSection() {
  const { clearErrors } = useFormContext<EventFormValues>();
  const { busy } = useEventFormContext();
  return (
    <section className={s.section} data-section="website">
      <FormField
        name="websiteUrl"
        label="Website Link"
        placeholder="Enter Website Link"
        inputMode="url"
        disabled={busy}
        rules={{ onChange: () => clearErrors('websiteUrl') }}
      />
    </section>
  );
}
