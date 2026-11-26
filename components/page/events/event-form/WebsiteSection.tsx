'use client';

import { EVENT_FORM_TEXT } from '@/services/events/event-form';

import { LinkField } from './LinkField';
import s from './EventForm.module.scss';

/** Edit page only: the event's own website. */
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
