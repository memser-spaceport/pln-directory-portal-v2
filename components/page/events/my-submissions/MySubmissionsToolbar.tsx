'use client';

import clsx from 'clsx';
import type { FormEvent } from 'react';

import type { SubmissionsPeriod } from './mySubmissions';
import s from './MySubmissionsToolbar.module.scss';

interface Props {
  /** The text in the box; it applies when the form is sent (Enter). */
  searchText: string;
  period: SubmissionsPeriod;
  onSearchTextChange: (text: string) => void;
  onSearch: () => void;
  onClear: () => void;
  onPeriodChange: (period: SubmissionsPeriod) => void;
}

const PERIODS: { value: SubmissionsPeriod; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
];

/** The search box, which applies on Enter, and the Upcoming / Past switch. */
export function MySubmissionsToolbar(props: Props) {
  const { searchText, period, onSearchTextChange, onSearch, onClear, onPeriodChange } = props;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className={s.root}>
      <form role="search" className={s.search} onSubmit={onSubmit}>
        <svg className={s.searchIcon} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          enterKeyHint="search"
          className={s.input}
          value={searchText}
          placeholder="Search by event name"
          aria-label="Search by event name"
          onChange={(e) => onSearchTextChange(e.target.value)}
        />
        {searchText && (
          <button type="button" className={s.clear} aria-label="Clear search" onClick={onClear}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </form>
      <div role="group" aria-label="Events to show" className={s.switch}>
        {PERIODS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={clsx(s.option, period === value && s.optionActive)}
            aria-pressed={period === value}
            onClick={() => onPeriodChange(value)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
