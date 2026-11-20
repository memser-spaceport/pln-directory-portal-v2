'use client';

import { FormField } from '@/components/form/FormField';

import { useEventFormContext } from './EventFormContext';
import s from './EventForm.module.scss';

/** The registration link: where people sign up for the event. Optional. */
export function RegistrationSection() {
  const { busy } = useEventFormContext();
  return (
    <section className={s.section} data-section="registration">
      <FormField
        name="registrationUrl"
        label="Registration Link"
        placeholder="Enter Registration Link"
        disabled={busy}
      />
    </section>
  );
}
