'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from '@/components/core/ToastContainer';

import { useEventsAnalytics } from '@/analytics/events.analytics';
import { Button } from '@/components/common/Button';
import { useLoginRedirect } from '@/components/core/login/utils/loginRedirect';
import { EventForm, type EventFormHandle } from '@/components/page/events/event-form/EventForm';
import { browserTimezone, defaultEventFormValues, EVENT_FORM_TEXT } from '@/services/events/event-form';
import { toPreviewEvent } from '@/services/events/event-form-view';
import { buildEventBody, resultOfStatus, statusOfError, submitFailureText } from '@/services/events/event-send';
import type { EventDetail } from '@/services/events/event-drawer.types';
import type { EventFormMode, EventFormValues } from '@/services/events/event-submission.types';
import { useSubmitEvent } from '@/services/events/hooks/useEventSubmission';
import { EVENTS_LIST_PATH } from '@/utils/constants';
import { eventEditPath } from '@/utils/events-submit';

import { ConfirmDialog } from './ConfirmDialog';
import { EventPreviewDialog } from './EventPreviewDialog';
import s from './SubmitEventPage.module.scss';

/**
 * `/events/submit`: the "Submit Event" form, for signed-in members. A signed-out visitor is asked to sign in and
 * comes back to this page. The backend decides the status; after a submit the member goes to the event's edit page,
 * which shows it.
 */
export function SubmitEventPage({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const goToLogin = useLoginRedirect();
  const analytics = useEventsAnalytics();
  const submit = useSubmitEvent();
  const form = useRef<EventFormHandle>(null);
  // The visitor's own time zone is known in the browser only; the server render starts in UTC.
  const [initialValues, setInitialValues] = useState<EventFormValues>(() => defaultEventFormValues('UTC'));
  const [formKey, setFormKey] = useState(0);
  const [clearing, setClearing] = useState(false);
  const [preview, setPreview] = useState<EventDetail | null>(null);

  const opened = useRef(false);
  useEffect(() => {
    setInitialValues(defaultEventFormValues(browserTimezone()));
    setFormKey((key) => key + 1);
    if (!signedIn || opened.current) return;
    opened.current = true;
    analytics.onEventsSubmitFormOpened();
    // Once, when the form opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSend = async (values: EventFormValues, mode: EventFormMode) => {
    const draft = mode === 'draft';
    try {
      const body = await buildEventBody(values);
      const result = await submit.mutateAsync(draft ? { ...body, draft: true } : body);
      analytics.onEventsSubmitFormSubmitted({ result: resultOfStatus(result.status) });
      toast.success(draft ? EVENT_FORM_TEXT.draftCreated : EVENT_FORM_TEXT.created);
      router.push(eventEditPath(result.uid));
    } catch (error) {
      analytics.onEventsSubmitFormFailed({ status: statusOfError(error) });
      toast.error(submitFailureText(error));
    }
  };

  const clearForm = () => {
    form.current?.reset(defaultEventFormValues(browserTimezone()));
    setClearing(false);
    toast.success(EVENT_FORM_TEXT.cleared);
  };

  const header = useMemo(
    () => (
      <header className={s.header}>
        <Link href={EVENTS_LIST_PATH} className={s.back}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to events
        </Link>
        <h1 className={s.title}>Submit Event</h1>
      </header>
    ),
    [],
  );

  return (
    <div className={s.page}>
      {header}
      {signedIn ? (
        <EventForm
          key={formKey}
          ref={form}
          variant="submit"
          initialValues={initialValues}
          onSend={onSend}
          renderActions={({ busy }) => (
            <>
              <Button
                type="button"
                style="link"
                variant="neutral"
                size="s"
                disabled={busy}
                onClick={() => setClearing(true)}
              >
                Clear form
              </Button>
              <Button
                type="button"
                style="border"
                variant="neutral"
                size="s"
                disabled={busy}
                onClick={() => form.current && setPreview(toPreviewEvent(form.current.getValues()))}
              >
                Preview
              </Button>
              <Button
                type="button"
                style="border"
                variant="primary"
                size="s"
                disabled={busy}
                onClick={() => form.current?.run('draft')}
              >
                Save as draft
              </Button>
              <Button
                type="button"
                variant="primary"
                size="s"
                disabled={busy}
                onClick={() => form.current?.run('submit')}
              >
                Submit Event
              </Button>
            </>
          )}
        />
      ) : (
        <div className={s.signIn}>
          <p className={s.signInText}>Sign in to submit an event.</p>
          <Button type="button" variant="primary" size="s" onClick={() => goToLogin()}>
            Sign in
          </Button>
        </div>
      )}

      <ConfirmDialog
        isOpen={clearing}
        title="Are you sure you want to clear this form?"
        text="Clicking confirm will remove all information you've entered in the event submission form"
        confirmLabel="Confirm"
        onConfirm={clearForm}
        onCancel={() => setClearing(false)}
      />
      <EventPreviewDialog event={preview} onBack={() => setPreview(null)} />
    </div>
  );
}
