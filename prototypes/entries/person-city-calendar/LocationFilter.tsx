'use client';

/**
 * The location facet, with a time dimension.
 *
 * Three patterns borrowed from travel products (via Mobbin):
 *  - Klook's "Today / Tomorrow / More dates" — presets as chips, calendar only
 *    when you actually need one. Beats a radio list: the common cases are one
 *    tap and the rare case still works.
 *  - Expedia's per-option counts — the city list itself reports where people
 *    will be, so widening the window visibly changes "Berlin (1)" to
 *    "Berlin (5)" without reading a word of explanation.
 *  - KAYAK's per-day density in the date picker — here, a week-by-week
 *    headcount strip for the selected city. Click a bar to set the window.
 *    This is the piece that makes the calendar data legible *as a filter*:
 *    you can see when a city is busy before choosing dates.
 *
 * The city list is production's `GenericCheckboxList`, fed by the mock store —
 * `FilterOption` already carries `count`, so counts are its own feature.
 */

import { useMemo } from 'react';
import clsx from 'clsx';
import { GenericCheckboxList } from '@/components/common/filters/GenericCheckboxList';
import { DateRangePicker } from '@/components/form/DateRangePicker';

import { useMockFilterStore, staticOptions } from './mockFilterStore';
import type { PersonCityMember, Trip } from './mocks';
import { addDays, eachDay, presenceOn, shortMonth, parseKey, type DateKey } from './presence';
import s from './Screens.module.scss';

export type When = 'home' | 'now' | 'month' | 'custom';

export const WHEN_PRESETS: { value: When; label: string }[] = [
  { value: 'home', label: 'Based here' },
  { value: 'now', label: 'Right now' },
  { value: 'month', label: 'Next 30 days' },
  { value: 'custom', label: 'Dates…' },
];

interface LocationFilterProps {
  people: PersonCityMember[];
  trips: Trip[];
  todayKey: DateKey;
  /** every window ticked in "Who's there"; empty means home cities only */
  when: When[];
  range: [Date, Date] | null;
  onRangeChange: (range: [Date, Date] | null) => void;
  /** the days the ticked windows resolve to — empty when only "Based here" is on */
  window: DateKey[];
  selectedCities: string[];
  onWeekPick: (start: DateKey, end: DateKey) => void;
}

export function LocationFilter(props: LocationFilterProps) {
  const { people, trips, todayKey, when, range, onRangeChange, window, selectedCities, onWeekPick } = props;

  /** City options, counted over whatever windows are ticked (union). */
  const cityOptions = useMemo(() => {
    const counts = new Map<string, Set<string>>();
    const add = (city: string, id: string) => {
      const set = counts.get(city) ?? new Set<string>();
      set.add(id);
      counts.set(city, set);
    };

    const countsHome = when.length === 0 || when.includes('home');

    people.forEach((person) => {
      if (countsHome) add(person.home.city, person.id);
      window.forEach((day) => add(presenceOn(person, trips, day).city, person.id));
    });

    return [...counts.entries()]
      .map(([city, ids]) => ({ value: city, label: city, count: ids.size }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [people, trips, when, window]);

  /** Weekly headcount for the one selected city, 12 weeks out. */
  const density = useMemo(() => {
    if (selectedCities.length !== 1) return null;
    const city = selectedCities[0];
    return Array.from({ length: 12 }, (_, index) => {
      const start = addDays(todayKey, index * 7);
      const end = addDays(start, 6);
      const days = eachDay(start, end);
      const present = new Set<string>();
      people.forEach((person) => {
        if (days.some((day) => presenceOn(person, trips, day).city === city)) present.add(person.id);
      });
      return { start, end, count: present.size };
    });
  }, [selectedCities, people, trips, todayKey]);

  const peak = density ? Math.max(...density.map((week) => week.count), 1) : 1;

  const peakIndex = density ? density.findIndex((week) => week.count === peak) : -1;

  return (
    <>
      {/* Where, then when, then the picture of it. "Based here" and "Right now"
          mean nothing until a city is named, and the chart is *about* the city —
          so the city list leads and both follow it. */}
      <div className={s.cityBlock}>
        {/* Production component; counts come from FilterOption.count. */}
        <GenericCheckboxList
          label="City"
          paramKey="city"
          filterStore={useMockFilterStore}
          placeholder="E.g. Berlin, Lisbon"
          defaultItemsToShow={6}
          useGetDataHook={staticOptions(cityOptions)}
        />
      </div>

      {/* Checkboxes, like every other facet in this rail. Nothing is ticked by
          default — with no window selected the City list matches declared home
          cities, which is exactly what /members does today, so the facet starts
          as a no-op. Labelled "When": the options are times, and the old
          "Who's there" asked a who-question of a list of whens. */}
      <div className={s.whenBlock}>
        <GenericCheckboxList
          label="When"
          paramKey="presence"
          filterStore={useMockFilterStore}
          useGetDataHook={staticOptions(WHEN_PRESETS.map((preset) => ({ value: preset.value, label: preset.label })))}
          defaultItemsToShow={WHEN_PRESETS.length}
          hideSearch
          disableSorting
        />

        {when.includes('custom') && (
          <div className={s.whenPicker}>
            <DateRangePicker label="Dates" value={range} onChange={onRangeChange} />
          </div>
        )}
      </div>

      {/* Week-by-week headcount for the selected city — click to set the window.
          An empty week is a tick on the baseline, not a short bar: a bar is a
          claim that someone is there. Weeks inside the ticked window are drawn
          solid, so the chart shows what the filter is currently asking. */}
      {density && (
        <div className={s.density}>
          <div className={s.densityHead}>
            <span className={s.densityTitle}>People in {selectedCities[0]}, by week</span>
          </div>
          <div className={s.densityBars}>
            {density.map((week, index) => {
              const inWindow = window.some((day) => day >= week.start && day <= week.end);
              return (
                <button
                  key={week.start}
                  type="button"
                  className={clsx(s.densityBar, {
                    [s.densityBarEmpty]: week.count === 0,
                    [s.densityBarOn]: inWindow && week.count > 0,
                  })}
                  style={{ ['--h' as string]: `${(week.count / peak) * 100}%` }}
                  aria-label={`${week.count} ${week.count === 1 ? 'person' : 'people'}, week of ${shortMonth(week.start)} ${parseKey(week.start).day}`}
                  title={`${week.count} ${week.count === 1 ? 'person' : 'people'} · week of ${shortMonth(week.start)} ${parseKey(week.start).day}`}
                  onClick={() => onWeekPick(week.start, week.end)}
                >
                  {index === peakIndex && week.count > 0 && <span className={s.densityCount}>{week.count}</span>}
                  <span className={s.densityFill} />
                </button>
              );
            })}
          </div>
          <div className={s.densityAxis}>
            <span>
              {shortMonth(density[0].start)} {parseKey(density[0].start).day}
            </span>
            <span>
              {shortMonth(density[density.length - 1].end)} {parseKey(density[density.length - 1].end).day}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
