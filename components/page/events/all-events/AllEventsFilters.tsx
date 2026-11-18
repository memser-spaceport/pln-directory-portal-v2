'use client';

import clsx from 'clsx';

import { CloseIcon } from '@/components/icons';
import { FilterSearchInput } from '@/components/common/filters/FilterSearchInput';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { GenericCheckboxList } from '@/components/common/filters/GenericCheckboxList';
import { GenericFilterToggle } from '@/components/common/filters/GenericFilterToggle';
import { createFilterGetter } from '@/services/teams/utils/createFilterGetter';
import { decodeFilterValues, encodeFilterValues } from '@/services/filters';
import { countAppliedFilters, facetOptions, readFilters, type FacetKey } from '@/services/events/all-events.filters';
import { useAllEventsFilterStore } from '@/services/events/all-events-filters.store';
import type { AllEventsItem } from '@/services/events/all-events.types';

import { SidebarIcon } from './icons';
import s from './AllEventsPage.module.scss';

const FACETS: { key: FacetKey; title: string }[] = [
  { key: 'mode', title: 'Mode' },
  { key: 'city', title: 'City' },
];

interface RailProps {
  /** Every upcoming event: the counts beside each option are over these. */
  events: AllEventsItem[];
  /** Signed in: "Events I'm going to" shows, with how many. Null signed out. */
  goingCount: number | null;
  /** Phones: the sheet's own close. */
  onClose?: () => void;
  /** Desktop: the rail is closed by default; its header carries the way to close it again. */
  onHide?: () => void;
  /** Clears the filters only, so the view and an open drawer stay. */
  onClear: () => void;
  /** The City filter now holds exactly this one city (for analytics). */
  onCityPicked?: (city: string) => void;
}

/**
 * The left rail, built as Teams and Members build theirs: a FiltersSidePanel ("Filters", applied count, Clear All)
 * with a title-less search, then one section per filter. Phase 1 has the filters the data can answer: search, "Events
 * I'm going to", Mode and City. A facet with fewer than two values in the events is left out, unless it is applied.
 * Host, Access, Focus area and Featured come back when events carry them (phase 2, LAB-3281).
 */
export function AllEventsFilterRail({ events, goingCount, onClose, onHide, onClear, onCityPicked }: RailProps) {
  const { params } = useAllEventsFilterStore();
  const applied = readFilters(params);

  return (
    <FiltersSidePanel
      onClose={onClose}
      clearParams={onClear}
      appliedFiltersCount={countAppliedFilters(params)}
      actionsSlot={
        onHide ? (
          <button type="button" className={s.hide} onClick={onHide} aria-label="Hide filters" title="Hide filters">
            <SidebarIcon />
          </button>
        ) : undefined
      }
    >
      <FilterSection>
        <FilterSearchInput
          filterStore={useAllEventsFilterStore}
          label="Search events"
          placeholder="Events, hosts, cities or topics"
        />
      </FilterSection>

      {goingCount !== null && (
        <FilterSection title="Show">
          <GenericFilterToggle
            label={goingCount ? `Events I'm going to (${goingCount})` : "Events I'm going to"}
            paramKey="going"
            filterStore={useAllEventsFilterStore}
          />
        </FilterSection>
      )}

      {FACETS.map(({ key, title }) => {
        const options = facetOptions(events, key);
        if (options.length < 2 && !applied[key].length) return null;
        return (
          <FilterSection key={key} title={title}>
            <GenericCheckboxList
              paramKey={key}
              hideSearch
              filterStore={useAllEventsFilterStore}
              useGetDataHook={createFilterGetter(options)}
              defaultItemsToShow={10}
              onChange={key === 'city' ? (_, values) => values.length === 1 && onCityPicked?.(values[0]) : undefined}
            />
          </FilterSection>
        );
      })}
    </FiltersSidePanel>
  );
}

interface Chip {
  key: string;
  /** The one value a chip removes from a multi-value filter; undefined removes the whole param. */
  value?: string;
  label: string;
}

/** Every applied filter as a chip. The city is left out when the city header already says it. */
export function appliedChips(params: URLSearchParams, scopedCity: string | null): Chip[] {
  const f = readFilters(params);
  const chips: Chip[] = [];
  if (f.search) chips.push({ key: 'search', label: `“${f.search}”` });
  if (f.going) chips.push({ key: 'going', label: "Events I'm going to" });
  f.mode.forEach((value) => chips.push({ key: 'mode', value, label: value }));
  if (!scopedCity) f.city.forEach((value) => chips.push({ key: 'city', value, label: value }));
  return chips;
}

/** While the rail is closed, applied filters show as removable chips, so filtering is never invisible. */
export function AppliedChips({
  scopedCity,
  railOpen,
  onClear,
}: {
  scopedCity: string | null;
  railOpen: boolean;
  onClear: () => void;
}) {
  const { params, setParam } = useAllEventsFilterStore();
  const chips = appliedChips(params, scopedCity);
  if (!chips.length) return null;

  const remove = (chip: Chip) => {
    if (chip.value === undefined) return setParam(chip.key, undefined);
    const rest = decodeFilterValues(params.get(chip.key)).filter((v) => v !== chip.value);
    setParam(chip.key, rest.length ? encodeFilterValues(rest) : undefined);
  };

  return (
    <div className={clsx(s.chips, railOpen && s.chipsRailOpen)} aria-label="Applied filters">
      {chips.map((chip) => (
        <button
          key={`${chip.key}:${chip.value ?? ''}`}
          type="button"
          className={s.chip}
          onClick={() => remove(chip)}
          aria-label={`Remove filter ${chip.label}`}
        >
          {chip.label}
          <CloseIcon width={12} height={12} className={s.chipX} />
        </button>
      ))}
      <button type="button" className={s.clear} onClick={onClear}>
        Clear all
      </button>
    </div>
  );
}
