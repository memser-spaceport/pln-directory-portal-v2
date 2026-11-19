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
import { SubmissionReceived } from './SubmissionReceived';
import s from './SubmitEventPage.module.scss';

/**
 * `/events/submit`: the "Submit Event" form for signed-in members and signed-out visitors. A signed-out visitor adds
 * a contact email, has "Sign in" and no "Save as draft". The backend decides the status; the page shows what it got:
 * a member goes to the event's edit page, a signed-out visitor sees that the event was received.
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
  const [received, setReceived] = useState(false);

  const opened = useRef(false);
  useEffect(() => {
    setInitialValues(defaultEventFormValues(browserTimezone()));
    setFormKey((key) => key + 1);
    if (opened.current) return;
    opened.current = true;
    analytics.onEventsSubmitFormOpened();
    // Once, when the form opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSend = async (values: EventFormValues, mode: EventFormMode) => {
    const draft = mode === 'draft';
    try {
      const body = await buildEventBody(values);
      const result = await submit.mutateAsync({
        body: {
          ...body,
          ...(draft ? { draft: true } : {}),
          ...(signedIn ? {} : { contactEmail: values.contactEmail.trim() }),
        },
        withAuth: signedIn,
      });
      analytics.onEventsSubmitFormSubmitted({ result: resultOfStatus(result.status), signedIn });
      if (!signedIn) {
        setReceived(true);
        return;
      }
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

  const startAnother = () => {
    setReceived(false);
    setFormKey((key) => key + 1);
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
      {received ? (
        <SubmissionReceived onAnother={startAnother} />
      ) : (
        <>
          {!signedIn && (
            <p className={s.signIn}>
              You are submitting as a guest. Your event will wait for approval.{' '}
              <button type="button" className={s.signInLink} onClick={() => goToLogin()}>
                Sign in
              </button>{' '}
              to save drafts and manage your events.
            </p>
          )}
          <EventForm
            key={formKey}
            ref={form}
            variant="submit"
            signedIn={signedIn}
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
                {signedIn && (
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
                )}
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
        </>
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
