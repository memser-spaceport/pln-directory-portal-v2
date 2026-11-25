import { SortDropdown } from '@/components/common/filters/SortDropdown';

import s from './AllEventsPage.module.scss';

const ALL_YEARS = 'all';
const ALL_YEARS_LABEL = 'All years';

/**
 * Past's year (LAB-3418, the prototype's year pill beside the When switch): "All years", then each year with a past
 * event, newest first. Only when there is a choice to make. A year in the address that has no past event is listed too,
 * so the control never reads "All years" over an empty list.
 */
export function YearPicker({
  years,
  year,
  onChange,
}: {
  /** Every year with a past event, whatever the filters, newest first. */
  years: string[];
  year: string | null;
  /** Null for every year. */
  onChange: (year: string | null) => void;
}) {
  const listed = year && !years.includes(year) ? [...years, year].sort().reverse() : years;
  if (listed.length < 2) return null;
  return (
    <SortDropdown
      options={[{ value: ALL_YEARS, label: ALL_YEARS_LABEL }, ...listed.map((y) => ({ value: y, label: y }))]}
      currentSort={year ?? ALL_YEARS}
      onSortChange={(next) => onChange(next === ALL_YEARS ? null : next)}
      className={s.yearPicker}
      ariaLabel={`Year: ${year ?? ALL_YEARS_LABEL}`}
    />
  );
}
