'use client';

import clsx from 'clsx';
import Link from 'next/link';

import { Badge, type BadgeProps } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import btn from '@/components/common/Button/Button.module.scss';
import { EVENT_STATUS_LABEL } from '@/services/events/event-form';
import type { EventStatus, MyEventResponse } from '@/services/events/event-submission.types';
import { eventEditPath } from '@/utils/events-submit';

import { lastModified, submissionDates } from './mySubmissions';
import s from './MySubmissionRow.module.scss';

interface Props {
  event: MyEventResponse;
  /** A directory admin can also delete an approved event. */
  isAdmin: boolean;
  onDelete: (event: MyEventResponse) => void;
}

const STATUS_VARIANT: Record<EventStatus, BadgeProps['variant']> = {
  DRAFT: 'brand',
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
};

/** One event: its name, dates, status and "Last Modified", with the buttons its status allows. */
export function MySubmissionRow({ event, isAdmin, onDelete }: Props) {
  const dates = submissionDates(event);
  const modified = lastModified(event);
  const canDelete = event.status !== 'APPROVED' || isAdmin;
  const openLabel = event.status === 'REJECTED' ? 'View' : 'Modify';

  return (
    <li className={s.row}>
      <div className={s.main}>
        <h3 className={s.name}>{event.name}</h3>
        {dates && <p className={s.dates}>{dates}</p>}
        <Badge variant={STATUS_VARIANT[event.status] ?? 'default'} className={s.status}>
          {EVENT_STATUS_LABEL[event.status] ?? event.status}
        </Badge>
      </div>
      <div className={s.side}>
        <div className={s.actions}>
          {canDelete && (
            <Button
              style="link"
              variant="error"
              size="s"
              aria-label={`Delete ${event.name}`}
              onClick={() => onDelete(event)}
            >
              Delete
            </Button>
          )}
          <Link
            href={eventEditPath(event.uid)}
            className={clsx(btn.root, btn.small, btn.link, btn.primary)}
            aria-label={`${openLabel} ${event.name}`}
          >
            {openLabel}
          </Link>
        </div>
        {modified && <p className={s.modified}>Last Modified: {modified}</p>}
      </div>
    </li>
  );
}
