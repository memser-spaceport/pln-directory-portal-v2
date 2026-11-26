'use client';

import { EVENT_FORM_TEXT } from '@/services/events/event-form';

import { LinkField } from './LinkField';
import s from './EventForm.module.scss';

/** The event's own website on the submit and edit forms. */
export function WebsiteSection() {
  return (
    <section className={s.section} data-section="website">
      <LinkField
        name="websiteUrl"
        label="Website Link"
        placeholder="Enter Website Link"
        invalidMessage={EVENT_FORM_TEXT.websiteInvalid}
      />
    </section>
  );
}
