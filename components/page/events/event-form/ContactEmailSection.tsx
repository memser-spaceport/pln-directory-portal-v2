'use client';

import { FormField } from '@/components/form/FormField';

import { useEventFormContext } from './EventFormContext';
import s from './EventForm.module.scss';

/** Signed-out submitters only: where the curators can reach the person who sent the event. */
export function ContactEmailSection() {
  const { busy } = useEventFormContext();
  return (
    <section className={s.section} data-section="contact-email">
      <FormField
        name="contactEmail"
        label="Your email"
        placeholder="Enter your email"
        description="We use it only to contact you about this event."
        inputMode="email"
        isRequired
        disabled={busy}
      />
    </section>
  );
}
