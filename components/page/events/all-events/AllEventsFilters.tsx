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
import {
  countAppliedFilters,
  FACET_KEYS,
  facetLabel,
  facetOptions,
  readFilters,
  type FacetKey,
} from '@/services/events/all-events.filters';
import { useAllEventsFilterStore } from '@/services/events/all-events-filters.store';
import type { AllEventsItem } from '@/services/events/all-events.types';

import { SidebarIcon } from './icons';
import s from './AllEventsPage.module.scss';

/** Topic and Host can hold many values, so they get a search box and show 5 at first; there are 4 focus areas. */
const FACETS: Record<FacetKey, { title: string; label?: string; placeholder?: string; searchable?: boolean }> = {
  mode: { title: 'Mode' },
  access: { title: 'Access type' },
  focus: { title: 'Focus area' },
  topic: { title: 'Topic', label: 'Search or select a topic', placeholder: 'E.g. AI', searchable: true },
  city: { title: 'City' },
  host: { title: 'Host', label: 'Search or select a host', placeholder: 'E.g. Protocol Labs', searchable: true },
};

interface RailProps {
  /** Every live and upcoming event, or every past one on Past (LAB-3418): each option's count is over these. */
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
 * with a title-less search, then one section per filter: search, "Events I'm going to", Mode, Access type, Focus area,
 * Topic, City and Host. A facet with fewer than two values in the events is left out, unless it is applied: before the events
 * service has synced the events' details, Access, Focus area, Topic and Host have none and stay hidden. Featured waits for
 * the backend to send it (phase 2, LAB-3281).
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

      {FACET_KEYS.map((key) => {
        const options = facetOptions(events, key);
        if (options.length < 2 && !applied[key].length) return null;
        // An applied value that no event has any more still shows ticked; here so a focus area shows its name, not its code.
        const gone = applied[key].filter((value) => !options.some((o) => o.value === value));
        const listed = [...options, ...gone.map((value) => ({ value, disabled: false }))];
        const { title, label, placeholder, searchable } = FACETS[key];
        return (
          <FilterSection key={key} title={title}>
            <GenericCheckboxList
              label={label}
              paramKey={key}
              placeholder={placeholder}
              hideSearch={!searchable}
              filterStore={useAllEventsFilterStore}
              useGetDataHook={createFilterGetter(listed, { formatLabel: (o) => facetLabel(key, o.value) })}
              defaultItemsToShow={searchable ? 5 : 10}
              collapsible={searchable}
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
  FACET_KEYS.forEach((key) => {
    if (key === 'city' && scopedCity) return;
    f[key].forEach((value) => chips.push({ key, value, label: facetLabel(key, value) }));
  });
  return chips;
}

/** While the rail is closed, applied filters show as removable chips, so filtering is never invisible. */
export function AppliedChips({
  params,
  scopedCity,
  railOpen,
  onClear,
}: {
  /** The page's state, as the page itself has it. */
  params: URLSearchParams;
  scopedCity: string | null;
  railOpen: boolean;
  onClear: () => void;
}) {
  const { setParam } = useAllEventsFilterStore();
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
