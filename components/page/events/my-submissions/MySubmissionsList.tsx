'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { useEventsAnalytics } from '@/analytics/events.analytics';
import { Button } from '@/components/common/Button';
import { toast } from '@/components/core/ToastContainer';
import { EVENT_FORM_TEXT } from '@/services/events/event-form';
import type { MyEventResponse } from '@/services/events/event-submission.types';
import { useDeleteEvent, useMyEvents } from '@/services/events/hooks/useEventSubmission';

import { DeleteEventDialog } from './DeleteEventDialog';
import { MySubmissionRow } from './MySubmissionRow';
import { MySubmissionsToolbar } from './MySubmissionsToolbar';
import { filterSubmissions, groupByMonth, type SubmissionsPeriod } from './mySubmissions';
import s from './MySubmissionsList.module.scss';

/** The signed-in member's events: search, the Upcoming / Past switch, rows under month headings, and delete. */
export function MySubmissionsList({ isAdmin }: { isAdmin: boolean }) {
  const analytics = useEventsAnalytics();
  const { data, isError, refetch } = useMyEvents();
  const deleteEvent = useDeleteEvent();

  const [searchText, setSearchText] = useState('');
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState<SubmissionsPeriod>('upcoming');
  const [toDelete, setToDelete] = useState<MyEventResponse | null>(null);

  const openedSent = useRef(false);
  useEffect(() => {
    if (openedSent.current) return;
    openedSent.current = true;
    analytics.onEventsMySubmissionsOpened();
  }, [analytics]);

  const months = useMemo(
    () => groupByMonth(filterSubmissions(data ?? [], period, query, new Date())),
    [data, period, query],
  );

  const clearSearch = () => {
    setSearchText('');
    setQuery('');
  };

  const onPeriodChange = (next: SubmissionsPeriod) => {
    if (next === period) return;
    setPeriod(next);
    clearSearch();
  };

  const onConfirmDelete = async () => {
    if (!toDelete) return;
    const eventUid = toDelete.uid;
    try {
      await deleteEvent.mutateAsync(eventUid);
    } catch {
      toast.error(EVENT_FORM_TEXT.failed);
      setToDelete(null);
      return;
    }
    toast.success(EVENT_FORM_TEXT.deleted);
    analytics.onEventsEventDeleted({ eventUid, from: 'my-submissions' });
    setToDelete(null);
  };

  let body: React.ReactNode;
  if (isError && !data) {
    body = (
      <div className={s.state} role="alert">
        <p className={s.stateText}>Your events couldn&apos;t load.</p>
        <Button style="border" variant="neutral" size="s" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  } else if (!data) {
    body = (
      <div role="status" aria-busy="true" aria-label="Loading your events" className={s.skeletons}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={s.skeleton} />
        ))}
      </div>
    );
  } else if (months.length === 0) {
    body = (
      <div className={s.state}>
        <p className={s.stateText}>No Events currently available</p>
      </div>
    );
  } else {
    body = months.map((month) => (
      <section key={month.key} className={s.month} aria-label={month.label || undefined}>
        {month.label && <h2 className={s.monthTitle}>{month.label}</h2>}
        <ul className={s.rows}>
          {month.events.map((event) => (
            <MySubmissionRow key={event.uid} event={event} isAdmin={isAdmin} onDelete={setToDelete} />
          ))}
        </ul>
      </section>
    ));
  }

  return (
    <>
      <MySubmissionsToolbar
        searchText={searchText}
        period={period}
        onSearchTextChange={setSearchText}
        onSearch={() => setQuery(searchText)}
        onClear={clearSearch}
        onPeriodChange={onPeriodChange}
      />
      <div className={s.body}>{body}</div>
      <DeleteEventDialog
        isOpen={!!toDelete}
        deleting={deleteEvent.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => void onConfirmDelete()}
      />
    </>
  );
}
