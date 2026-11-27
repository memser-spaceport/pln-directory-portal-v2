'use client';

import { EVENT_FORM_TEXT } from '@/services/events/event-form';

import { LinkField } from './LinkField';
import s from './EventForm.module.scss';

/** The registration link: where people sign up for the event. Optional. */
export function RegistrationSection() {
  return (
    <section className={s.section} data-section="registration">
      <LinkField
        name="registrationUrl"
        label="Registration Link"
        placeholder="Enter Registration Link"
        invalidMessage={EVENT_FORM_TEXT.registrationInvalid}
      />
    </section>
  );
}
