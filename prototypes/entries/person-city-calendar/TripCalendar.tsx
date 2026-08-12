'use client';

/**
 * The month grid. Chrome comes from production — `s.calendarInline` in
 * components/form/DateRangePicker/DateRangePicker.module.scss carries the
 * navigation, weekday header, tile sizing and the whole range-selection
 * treatment, so drag-to-select already looks like the rest of the app.
 *
 * Trips are painted as a strip along the bottom of each tile rather than as a
 * tile background. Two reasons: the day number stays legible, and the strip
 * composes with react-calendar's own `--range` selection styling instead of
 * fighting it — a day can be inside a saved trip *and* inside a live selection
 * with no conflict.
 */

import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

import cal from '@/components/form/DateRangePicker/DateRangePicker.module.scss';
import type { Trip } from './mocks';
import { dateToKey, isWithin, weekdayOf } from './presence';
import s from './TripCalendar.module.scss';

interface TripCalendarProps {
  trips: Trip[];
  /** the month currently shown, as a Date (react-calendar's own unit) */
  activeStartDate: Date;
  onActiveStartDateChange: (date: Date) => void;
  /** live drag selection, or null */
  selection: [Date, Date] | null;
  onSelect: (range: [Date, Date] | null) => void;
  todayKey: string;
  homeCity: string;
}

interface BandInfo {
  trip: Trip;
  isStart: boolean;
  isEnd: boolean;
  /** first tile of this trip within its week row — where the city label hangs */
  isLabelAnchor: boolean;
}

function bandInfoFor(key: string, trips: Trip[]): BandInfo | null {
  const trip = trips.find((candidate) => isWithin(key, candidate.startDate, candidate.endDate));
  if (!trip) return null;
  const isStart = key === trip.startDate;
  return {
    trip,
    isStart,
    isEnd: key === trip.endDate,
    // Weeks start on Sunday in react-calendar's en-US locale, so a trip that
    // wraps a week boundary gets a second label on the new row.
    isLabelAnchor: isStart || weekdayOf(key) === 'Sun',
  };
}

export function TripCalendar(props: TripCalendarProps) {
  const { trips, activeStartDate, onActiveStartDateChange, selection, onSelect, todayKey, homeCity } = props;

  return (
    <div className={`${cal.calendarInline} ${s.grid}`}>
      <Calendar
        selectRange
        showFixedNumberOfWeeks
        value={selection}
        activeStartDate={activeStartDate}
        onActiveStartDateChange={({ activeStartDate: next }) => next && onActiveStartDateChange(next)}
        onChange={(value) => {
          if (Array.isArray(value) && value[0] && value[1]) {
            onSelect([value[0] as Date, value[1] as Date]);
          }
        }}
        tileClassName={({ date, view }) => {
          if (view !== 'month') return null;
          const key = dateToKey(date);
          const band = bandInfoFor(key, trips);
          if (!band) return key === todayKey ? s.todayTile : null;
          return [
            s.bandTile,
            band.isStart ? s.bandStart : '',
            band.isEnd ? s.bandEnd : '',
            key === todayKey ? s.todayTile : '',
          ]
            .filter(Boolean)
            .join(' ');
        }}
        tileContent={({ date, view }) => {
          if (view !== 'month') return null;
          const key = dateToKey(date);
          const band = bandInfoFor(key, trips);
          if (!band) return null;

          const { trip, isStart, isEnd, isLabelAnchor } = band;
          const barClass = [
            s.bar,
            isStart ? s.barStart : '',
            isEnd ? s.barEnd : '',
            trip.confirmed ? '' : s.barUnconfirmed,
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <span className={s.bandLayer}>
              <span className={barClass} />
              {isLabelAnchor && (
                /* Presentational only. react-calendar renders each tile as a
                   <button>, so anything interactive here would be a nested
                   button — invalid HTML. Editing a trip happens from the rail
                   beside the calendar, which lists every trip anyway; the grid's
                   jobs are reading the plan and drawing new ranges. */
                <span className={s.bandLabel} title={`${trip.city}${trip.eventName ? ` — ${trip.eventName}` : ''}`}>
                  {trip.city}
                </span>
              )}
            </span>
          );
        }}
      />

      <p className={s.legend}>
        Unmarked days mean you&apos;re in <strong>{homeCity}</strong>. Drag across the grid to add a trip.
      </p>
    </div>
  );
}
