import {
  addDays,
  byStart,
  minutesOf,
  mondayOf,
  monthLabel,
  monthWeeks,
  safeColor,
  spanColumns,
  stepMonth,
  weekLabel,
} from '@/components/page/events/all-events/calendar/weeks';
import { allEventsItem as item } from '@/services/events/all-events.fixtures';

/* LAB-3320 (task 6.1): the Calendar's week and month maths, on each event's own days. */

describe('weeks', () => {
  it('starts weeks on Monday and steps over month, year and daylight-saving edges', () => {
    expect(mondayOf('2030-12-01')).toBe('2030-11-25'); // a Sunday
    expect(mondayOf('2030-12-02')).toBe('2030-12-02');
    expect(addDays('2030-12-30', 3)).toBe('2031-01-02');
    expect(addDays('2030-03-30', 2)).toBe('2030-04-01');
    expect(addDays('2030-10-26', 2)).toBe('2030-10-28');
  });

  it('labels a week and a month', () => {
    expect(weekLabel('2030-12-30')).toBe('Dec 30 – Jan 5, 2031');
    expect(monthLabel({ year: 2030, month: 11 })).toBe('December 2030');
    expect(stepMonth({ year: 2030, month: 11 }, 1)).toEqual({ year: 2031, month: 0 });
    expect(stepMonth({ year: 2031, month: 0 }, -1)).toEqual({ year: 2030, month: 11 });
  });

  it('covers a month with whole Monday-first weeks', () => {
    const weeks = monthWeeks({ year: 2030, month: 11 });
    expect(weeks).toHaveLength(6);
    expect(weeks[0][0]).toBe('2030-11-25');
    expect(weeks[5][6]).toBe('2031-01-05');
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(monthWeeks({ year: 2031, month: 1 })).toHaveLength(5); // Sat Feb 1 to Fri Feb 28
    expect(monthWeeks({ year: 2027, month: 1 })).toHaveLength(4); // Mon Feb 1 to Sun Feb 28
  });
});

describe('spanColumns', () => {
  const monday = '2030-12-02';

  it('covers Monday to Wednesday for a Monday–Wednesday event', () => {
    expect(spanColumns(item({ startDay: '2030-12-02', endDay: '2030-12-04' }), monday)).toEqual({ start: 0, end: 2 });
  });

  it('clips an event that started the week before or ends the week after', () => {
    expect(spanColumns(item({ startDay: '2030-11-29', endDay: '2030-12-03' }), monday)).toEqual({ start: 0, end: 1 });
    expect(spanColumns(item({ startDay: '2030-12-07', endDay: '2030-12-12' }), monday)).toEqual({ start: 5, end: 6 });
    expect(spanColumns(item({ startDay: '2030-11-20', endDay: '2031-01-10' }), monday)).toEqual({ start: 0, end: 6 });
  });
});

describe('order and anchor', () => {
  it('reads 12-hour times and sorts by day, local time, then name', () => {
    expect(minutesOf('12:00 AM')).toBe(0);
    expect(minutesOf('12:30 PM')).toBe(750);
    expect(minutesOf('9:05 PM')).toBe(1265);
    const late = item({ uid: 'late', startTime: '6:00 PM' });
    const early = item({ uid: 'early', startTime: '9:00 AM' });
    const nextDay = item({ uid: 'next', startDay: '2030-12-04', startTime: '7:00 AM' });
    expect([nextDay, late, early].sort(byStart).map((e) => e.uid)).toEqual(['early', 'late', 'next']);
  });

  it('only lets a plain hex colour into a style', () => {
    expect(safeColor('#ff8800')).toBe('#ff8800');
    expect(safeColor('red; background: url(x)')).toBe('#1E88E5');
    expect(safeColor(null)).toBe('#1E88E5');
  });
});
