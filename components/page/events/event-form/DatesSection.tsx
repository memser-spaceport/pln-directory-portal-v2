'use client';

import clsx from 'clsx';
import { useFormContext } from 'react-hook-form';

import {
  isEndTimeDisabled,
  isStartTimeDisabled,
  moveAgendaToTimezone,
  pickEndDay,
  pickStartDay,
  TIME_OPTIONS,
} from '@/services/events/event-form';
import type { EventFormValues } from '@/services/events/event-submission.types';

import { EventDayPicker } from './EventDayPicker';
import { useEventFormContext } from './EventFormContext';
import { EventSelect } from './EventSelect';
import { FieldError } from './FieldError';
import { TimeZonePicker } from './TimeZonePicker';
import s from './EventForm.module.scss';
import c from './DatesSection.module.scss';

type DateFields = Pick<EventFormValues, 'startDay' | 'startTime' | 'endDay' | 'endTime'>;

/**
 * "Start Date" and "End Date", each a day and a time in 15-minute steps, then the time zone. The values are what a
 * clock in the time zone shows; another time zone keeps them and moves the agenda's sessions with it.
 */
export function DatesSection() {
  const {
    watch,
    setValue,
    getValues,
    clearErrors,
    formState: { errors },
  } = useFormContext<EventFormValues>();
  const { busy } = useEventFormContext();

  const [startDay, startTime, endDay, endTime, timezone] = watch([
    'startDay',
    'startTime',
    'endDay',
    'endTime',
    'timezone',
  ]);
  const dates: DateFields = { startDay, startTime, endDay, endTime };
  const datesMessage = errors.startDay?.message;

  const writeDates = (next: Partial<DateFields>) => {
    (Object.keys(next) as (keyof DateFields)[]).forEach((name) => {
      setValue(name, next[name] ?? '', { shouldDirty: true });
    });
    clearErrors('startDay');
  };

  const changeTimezone = (zone: string) => {
    setValue('agenda', moveAgendaToTimezone(getValues('agenda'), timezone, zone), { shouldDirty: true });
    setValue('timezone', zone, { shouldDirty: true });
    clearErrors('timezone');
  };

  return (
    <section className={s.section} data-section="dates">
      <div className={s.row}>
        <div className={c.group} role="group" aria-labelledby="event-start-title">
          <h2 className={clsx(s.sectionTitle, s.required)} id="event-start-title">
            Start Date
          </h2>
          <div className={c.pair}>
            <EventDayPicker
              label="Start Date"
              value={startDay}
              maxDay={endDay}
              openAt={endDay}
              disabled={busy}
              invalid={!!datesMessage}
              onChange={(day) => writeDates(pickStartDay(dates, day))}
            />
            <EventSelect
              aria-label="Start time"
              value={startTime}
              disabled={busy}
              options={TIME_OPTIONS.map((option) => ({
                ...option,
                disabled: isStartTimeDisabled(dates, option.value),
              }))}
              onChange={(time) => writeDates({ startTime: time })}
            />
          </div>
        </div>
        <div className={c.group} role="group" aria-labelledby="event-end-title">
          <h2 className={clsx(s.sectionTitle, s.required)} id="event-end-title">
            End Date
          </h2>
          <div className={c.pair}>
            <EventDayPicker
              label="End Date"
              value={endDay}
              minDay={startDay}
              openAt={startDay}
              disabled={busy}
              invalid={!!datesMessage}
              onChange={(day) => writeDates(pickEndDay(dates, day))}
            />
            <EventSelect
              aria-label="End time"
              value={endTime}
              disabled={busy}
              options={TIME_OPTIONS.map((option) => ({ ...option, disabled: isEndTimeDisabled(dates, option.value) }))}
              onChange={(time) => writeDates({ endTime: time })}
            />
          </div>
        </div>
      </div>
      <FieldError message={datesMessage} />
      <TimeZonePicker value={timezone} disabled={busy} invalid={!!errors.timezone} onChange={changeTimezone} />
      <FieldError message={errors.timezone?.message} />
    </section>
  );
}
