import clsx from 'clsx';

import { EVENT_STATUS_LABEL } from '@/services/events/event-form';
import type { EventStatus } from '@/services/events/event-submission.types';

import s from './EventStatusPill.module.scss';

/** An event's status as its submitter reads it: "Draft", "Submitted", "Approved" or "Rejected". */
export function EventStatusPill({ status, className }: { status: EventStatus; className?: string }) {
  return (
    <span className={clsx(s.pill, s[status.toLowerCase()], className)} data-status={status}>
      {EVENT_STATUS_LABEL[status]}
    </span>
  );
}
