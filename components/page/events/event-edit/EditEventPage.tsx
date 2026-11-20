'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { toast } from '@/components/core/ToastContainer';

import { useEventsAnalytics } from '@/analytics/events.analytics';
import { Button } from '@/components/common/Button';
import { useLoginRedirect } from '@/components/core/login/utils/loginRedirect';
import { EventSummary } from '@/components/page/events/EventDrawer/EventSummary';
import { EventForm, type EventFormHandle } from '@/components/page/events/event-form/EventForm';
import { ConfirmDialog } from '@/components/page/events/event-submit/ConfirmDialog';
import { EventPreviewDialog } from '@/components/page/events/event-submit/EventPreviewDialog';
import type { EventDetail } from '@/services/events/event-drawer.types';
import { browserTimezone, defaultEventFormValues, EVENT_FORM_TEXT } from '@/services/events/event-form';
import { toEditableEvent, toPreviewEvent, type EventEditResponse } from '@/services/events/event-form-view';
import { buildEventBody } from '@/services/events/event-send';
import type { EventFormMode, EventFormValues } from '@/services/events/event-submission.types';
import {
  useDeleteEvent,
  useEventForEdit,
  useMyEvents,
  useUpdateEvent,
} from '@/services/events/hooks/useEventSubmission';
import { EVENTS_MINE_PATH } from '@/utils/events-submit';

import { EventStatusPill } from './EventStatusPill';
import { EventUnavailable } from './EventUnavailable';
import s from './EditEventPage.module.scss';

interface EditEventPageProps {
  eventUid: string;
  signedIn: boolean;
  /** A directory admin may open, edit and delete any event. */
  isAdmin: boolean;
}

/**
 * `/events/edit/<uid>`: open to the event's submitter and to a directory admin. It opens as a read-only view of the
 * event with its status; "Edit" unlocks the form. A draft has "Save as draft" and "Submit"; any other event has "Save
 * Changes", which keeps its status. A rejected event stays read-only for its submitter.
 */
export function EditEventPage({ eventUid, signedIn, isAdmin }: EditEventPageProps) {
  const router = useRouter();
  const goToLogin = useLoginRedirect();
  const analytics = useEventsAnalytics();
  const eventQuery = useEventForEdit(signedIn ? eventUid : '');
  const mine = useMyEvents(signedIn && !isAdmin);
  const update = useUpdateEvent();
  const remove = useDeleteEvent();
  const form = useRef<EventFormHandle>(null);
  const [editing, setEditing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<EventDetail | null>(null);

  const event = useMemo(
    () => (eventQuery.data ? toEditableEvent(eventQuery.data as EventEditResponse) : null),
    [eventQuery.data],
  );

  if (!signedIn) {
    return (
      <div className={s.page}>
        <div className={s.state}>
          <p className={s.stateText}>Sign in to manage your events.</p>
          <Button type="button" variant="primary" size="s" onClick={() => goToLogin()}>
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  const ownershipPending = !isAdmin && mine.isLoading;
  if (eventQuery.isLoading || ownershipPending) {
    return (
      <div className={s.page}>
        <p className={s.loading} role="status">
          Loading event…
        </p>
      </div>
    );
  }

  if (eventQuery.isError) {
    return (
      <div className={s.page}>
        <div className={s.state} role="alert">
          <p className={s.stateText}>We couldn&apos;t load this event.</p>
          <Button type="button" style="border" variant="neutral" size="s" onClick={() => eventQuery.refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // The backend returns an event that is not approved to its submitter and a directory admin only. An approved event
  // is public, so the page checks that it is one of the member's own submissions.
  const isSubmitter = !!mine.data?.some((item) => item.uid === eventUid);
  const mayOpen = !!event && (isAdmin || isSubmitter || event.status !== 'APPROVED');
  if (!event || !mayOpen) {
    return (
      <div className={s.page}>
        <EventUnavailable />
      </div>
    );
  }

  const { status, values } = event;
  const isDraft = status === 'DRAFT';
  const canEdit = status !== 'REJECTED' || isAdmin;
  const canDelete = status !== 'APPROVED' || isAdmin;

  const onSend = async (next: EventFormValues, mode: EventFormMode) => {
    const submitting = isDraft && mode === 'submit';
    try {
      const body = await buildEventBody(next);
      await update.mutateAsync({ uid: eventUid, body: submitting ? { ...body, submit: true } : body });
      analytics.onEventsEventEdited({
        eventUid,
        action: submitting ? 'submitted' : isDraft ? 'draft-saved' : 'updated',
      });
      toast.success(submitting ? EVENT_FORM_TEXT.submitted : EVENT_FORM_TEXT.updated);
      await eventQuery.refetch();
      setEditing(false);
    } catch {
      toast.error(EVENT_FORM_TEXT.updateFailed);
    }
  };

  const clearForm = () => {
    // Only the fields are reset: the event itself stays, so the next save updates it.
    form.current?.reset(defaultEventFormValues(browserTimezone()));
    setClearing(false);
    toast.success(EVENT_FORM_TEXT.cleared);
  };

  const deleteEvent = async () => {
    try {
      await remove.mutateAsync(eventUid);
      analytics.onEventsEventDeleted({ eventUid, from: 'edit-page' });
      toast.success(EVENT_FORM_TEXT.deleted);
      router.push(EVENTS_MINE_PATH);
    } catch {
      setDeleting(false);
      toast.error(EVENT_FORM_TEXT.failed);
    }
  };

  return (
    <div className={s.page}>
      <header className={s.header}>
        <Link href={EVENTS_MINE_PATH} className={s.back}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to my events
        </Link>
        <div className={s.titleRow}>
          <h1 className={s.title}>{editing ? 'Edit Event' : 'Event'}</h1>
          <EventStatusPill status={status} />
          {!editing && canEdit && (
            <Button type="button" variant="primary" size="s" className={s.edit} onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </div>
      </header>

      {editing ? (
        <EventForm
          ref={form}
          variant="edit"
          initialValues={values}
          onSend={onSend}
          renderActions={({ busy }) => (
            <>
              {canDelete && (
                <Button
                  type="button"
                  style="link"
                  variant="error"
                  size="s"
                  disabled={busy}
                  className={s.delete}
                  onClick={() => setDeleting(true)}
                >
                  Delete Event
                </Button>
              )}
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
                onClick={() => form.current && setPreview(toPreviewEvent(form.current.getValues(), eventUid))}
              >
                Preview
              </Button>
              <Button
                type="button"
                style="border"
                variant="neutral"
                size="s"
                disabled={busy}
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              {isDraft ? (
                <>
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
                    Submit
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="s"
                  disabled={busy}
                  onClick={() => form.current?.run('submit')}
                >
                  Save Changes
                </Button>
              )}
            </>
          )}
        />
      ) : (
        <>
          <div className={s.view}>
            <EventSummary event={toPreviewEvent(values, eventUid)} />
          </div>
          {canDelete && (
            <div className={s.viewActions}>
              <Button type="button" style="link" variant="error" size="s" onClick={() => setDeleting(true)}>
                Delete Event
              </Button>
            </div>
          )}
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
      <ConfirmDialog
        isOpen={deleting}
        title="Are you sure you want to delete?"
        text="Clicking delete will remove the event from the list."
        confirmLabel="Delete"
        danger
        busy={remove.isPending}
        onConfirm={deleteEvent}
        onCancel={() => setDeleting(false)}
      />
      <EventPreviewDialog event={preview} onBack={() => setPreview(null)} />
    </div>
  );
}
