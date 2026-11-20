import { atNoon as at, localIso, shortDate } from '@/services/events/all-events.filters';
import type { AllEventsItem } from '@/services/events/all-events.types';

/*
 * The Calendar view's date maths (LAB-3320, task 6.1). Every event already carries its first and last day in its own
 * time zone (`startDay`, `endDay`), so the calendar only counts ISO days: a Lisbon event sits on its Lisbon day
 * wherever the visitor is. Weeks start on Monday, as in the events app.
 */

export type CalMode = 'week' | 'month';

export const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export function addDays(isoDay: string, days: number): string {
  const d = at(isoDay);
  d.setDate(d.getDate() + days);
  return localIso(d);
}

/** 0 for Monday … 6 for Sunday. */
export const weekdayIndex = (isoDay: string) => (at(isoDay).getDay() + 6) % 7;

export const mondayOf = (isoDay: string) => addDays(isoDay, -weekdayIndex(isoDay));

/** The seven days of the week starting on `monday`. */
export const weekDays = (monday: string) => Array.from({ length: 7 }, (_, i) => addDays(monday, i));

export interface MonthRef {
  year: number;
  /** 0–11. */
  month: number;
}

export const monthOf = (isoDay: string): MonthRef => ({ year: at(isoDay).getFullYear(), month: at(isoDay).getMonth() });

export function stepMonth({ year, month }: MonthRef, delta: number): MonthRef {
  const d = new Date(year, month + delta, 1, 12);
  return { year: d.getFullYear(), month: d.getMonth() };
}

/** The Monday-first weeks that cover the month, each as seven ISO days. */
export function monthWeeks({ year, month }: MonthRef): string[][] {
  const last = localIso(new Date(year, month + 1, 0, 12));
  const weeks: string[][] = [];
  for (let monday = mondayOf(localIso(new Date(year, month, 1, 12))); monday <= last; monday = addDays(monday, 7)) {
    weeks.push(weekDays(monday));
  }
  return weeks;
}

/** Events on any day from `from` to `to`, both included. */
export const eventsBetween = (items: AllEventsItem[], from: string, to: string) =>
  items.filter((e) => e.startDay <= to && e.endDay >= from);

export const isMultiDay = (e: AllEventsItem) => e.startDay !== e.endDay;

/** The columns (0 Monday … 6 Sunday) an event covers in the week from `monday`, clipped to that week. */
export function spanColumns(e: AllEventsItem, monday: string): { start: number; end: number } {
  const sunday = addDays(monday, 6);
  return {
    start: e.startDay < monday ? 0 : weekdayIndex(e.startDay),
    end: e.endDay > sunday ? 6 : weekdayIndex(e.endDay),
  };
}

/** "9:00 AM" → 540; anything else sorts first. */
export function minutesOf(time: string): number {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time.trim());
  if (!m) return 0;
  const hours = (Number(m[1]) % 12) + (m[3].toUpperCase() === 'PM' ? 12 : 0);
  return hours * 60 + Number(m[2]);
}

/** Earliest first: by day, then by the local start time, then by name. */
export const byStart = (a: AllEventsItem, b: AllEventsItem) =>
  a.startDay.localeCompare(b.startDay) ||
  minutesOf(a.startTime) - minutesOf(b.startTime) ||
  a.name.localeCompare(b.name);

/**
 * The day the Week board opens on: the anchor, or the first day from there that has an event on it, so a landing on
 * a quiet week moves to the next busy one. The anchor itself when nothing is coming.
 */
export function firstBusyDay(items: AllEventsItem[], anchor: string): string {
  const days = items.filter((e) => e.endDay >= anchor).map((e) => (e.startDay < anchor ? anchor : e.startDay));
  return days.sort()[0] ?? anchor;
}

/** "Dec 1 – Dec 7, 2030". */
export const weekLabel = (monday: string) =>
  `${shortDate(monday)} – ${at(addDays(monday, 6)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

/** "December 2030". */
export const monthLabel = ({ year, month }: MonthRef) =>
  new Date(year, month, 1, 12).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export const dayNumber = (isoDay: string) => at(isoDay).getDate();

export const weekdayName = (isoDay: string, width: 'short' | 'long') =>
  at(isoDay).toLocaleDateString('en-US', { weekday: width });

/** "Wednesday, December 10" for a day number's label. */
export const longDay = (isoDay: string) =>
  at(isoDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
