import { toEventBody } from './event-form';
import { EventRequestError, uploadEventLogo } from './event-submission.service';
import type { EventBodyFields, EventFormLogo, EventFormValues, EventStatus } from './event-submission.types';
import { EVENT_FORM_TEXT } from './event-form';

/*
 * What sending the event form means on both pages: the logo is uploaded first (only now, never while the person
 * picks it), then the body is built once from the form values.
 */

/** The logo's stored id: a new file is uploaded, a stored logo keeps its id, no logo is null. */
export async function logoUidOf(logo: EventFormLogo): Promise<string | null> {
  if (!logo) return null;
  if (logo.kind === 'file') return uploadEventLogo(logo.file);
  return logo.uid;
}

/** The request body for the values, after the logo upload. Throws `EventRequestError` when the upload fails. */
export async function buildEventBody(values: EventFormValues): Promise<EventBodyFields> {
  return toEventBody(values, await logoUidOf(values.logo));
}

/** The status a write got, as analytics names it. */
export function resultOfStatus(status: EventStatus): 'approved' | 'submitted' | 'draft' {
  if (status === 'DRAFT') return 'draft';
  return status === 'APPROVED' ? 'approved' : 'submitted';
}

/** The message for a failed submit: "try again later" for too many submissions, else the general one. */
export function submitFailureText(error: unknown): string {
  return error instanceof EventRequestError && error.status === 429 ? EVENT_FORM_TEXT.tooMany : EVENT_FORM_TEXT.failed;
}

export const statusOfError = (error: unknown): number | null =>
  error instanceof EventRequestError ? error.status : null;
