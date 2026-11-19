import type { FieldPath, UseFormClearErrors, UseFormSetError } from 'react-hook-form';

import type { EventFormErrors, EventFormValues } from '@/services/events/event-submission.types';

type Name = FieldPath<EventFormValues>;

/** Where each check's message shows: the form field that carries it. */
export function toFieldErrors(errors: EventFormErrors): [Name, string][] {
  const out: [Name, string][] = [];
  const add = (name: Name, message?: string) => {
    if (message) out.push([name, message]);
  };
  add('registrationUrl', errors.registrationUrl);
  add('name', errors.name);
  add('startDay', errors.dates);
  add('timezone', errors.timezone);
  add('agenda', errors.agenda);
  add('tags', errors.tags);
  add('hostName', errors.hostName);
  errors.coHosts?.forEach((row, index) => {
    add(`coHosts.${index}.name`, row?.name);
    add(`coHosts.${index}.email`, row?.email);
  });
  add('websiteUrl', errors.websiteUrl);
  errors.socialHandles?.forEach((message, index) => add(`socialHandles.${index}.handle`, message));
  add('contactEmail', errors.contactEmail);
  return out;
}

/** Replaces the form's messages with the ones of this check. */
export function showEventFormErrors(
  errors: EventFormErrors,
  setError: UseFormSetError<EventFormValues>,
  clearErrors: UseFormClearErrors<EventFormValues>,
) {
  clearErrors();
  toFieldErrors(errors).forEach(([name, message]) => setError(name, { type: 'manual', message }));
}
