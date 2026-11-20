'use client';

import clsx from 'clsx';
import { useCallback, useRef, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

import { CalendarBlankIcon } from '@/components/icons';

import { useDismiss } from './useDismiss';
import s from './EventDayPicker.module.scss';

interface Props {
  /** Names the control: "Start Date". */
  label: string;
  /** "2026-12-03", empty while nothing is picked. */
  value: string;
  /** The earliest and the latest day that can be picked. */
  minDay?: string;
  maxDay?: string;
  /** The month the calendar opens on while nothing is picked. */
  openAt?: string;
  disabled?: boolean;
  invalid?: boolean;
  onChange: (day: string) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

function toDate(day?: string): Date | undefined {
  const [year, month, date] = (day ?? '').split('-').map(Number);
  return year && month && date ? new Date(year, month - 1, date) : undefined;
}

const toDay = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** One day, picked from a calendar that opens under its button. Days are plain "YYYY-MM-DD" values with no zone. */
export function EventDayPicker({ label, value, minDay, maxDay, openAt, disabled, invalid, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(rootRef, open, close);

  const selected = toDate(value);
  const text = selected?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className={s.root} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={clsx(s.trigger, invalid && s.invalid, !text && s.empty)}
        aria-label={`${label}: ${text ?? 'Select date'}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => setOpen((was) => !was)}
      >
        <CalendarBlankIcon className={s.icon} aria-hidden />
        <span className={s.text}>{text ?? 'Select date'}</span>
      </button>
      {open && (
        <div className={s.popover} role="dialog" aria-label={label}>
          <Calendar
            locale="en-US"
            value={selected ?? null}
            defaultActiveStartDate={selected ?? toDate(openAt)}
            minDate={toDate(minDay)}
            maxDate={toDate(maxDay)}
            minDetail="year"
            showFixedNumberOfWeeks
            onChange={(picked) => {
              const date = Array.isArray(picked) ? picked[0] : picked;
              if (!date) return;
              onChange(toDay(date));
              setOpen(false);
              triggerRef.current?.focus();
            }}
          />
        </div>
      )}
    </div>
  );
}
