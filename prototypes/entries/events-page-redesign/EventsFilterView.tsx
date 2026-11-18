'use client';

import { createFilterGetter } from '@/services/teams/utils/createFilterGetter';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { GenericCheckboxList } from '@/components/common/filters/GenericCheckboxList';
import { GenericFilterToggle } from '@/components/common/filters/GenericFilterToggle';

import { EventsFilterSearch } from './EventsFilterSearch';
import { countAppliedFilters, useEventsFilterStore } from './eventsFilterStore';
import { FACETS, facetOptions, type CalEvent } from './mocks';
import local from './EventsPageRedesignPrototype.module.scss';

interface Props {
  /** Upcoming events: the counts beside each option are over these. */
  events: CalEvent[];
  /** How many upcoming events you're going to, shown beside the Going switch. */
  goingCount: number;
  onClose?: () => void;
  /** Desktop: the rail is closed by default; its header carries the way to close it again. */
  onHide?: () => void;
}

/**
 * The left filter rail, built the way Teams and Members build theirs: a FiltersSidePanel
 * ("Filters", applied count, Clear All) holding a title-less search section, then one
 * FilterSection per filter. The filters are the events app's own rail, kept in full:
 * Show featured events and Modes, Access Types, Focus Areas, Gatherings (kept as City, since IRL
 * gatherings are being hidden), Hosts. "Going" joins
 * the featured switch, since both are on/off views rather than lists of values.
 */
export function EventsFilterView({ events, goingCount, onClose, onHide }: Props) {
  const { params, clearParams } = useEventsFilterStore();

  return (
    <FiltersSidePanel
      onClose={onClose}
      clearParams={clearParams}
      appliedFiltersCount={countAppliedFilters(params)}
      actionsSlot={
        onHide ? (
          /* The sidebar mark (Linear, Notion) instead of the word "Hide" (2026-11-17). */
          <button type="button" className={local.hide} onClick={onHide} aria-label="Hide filters" title="Hide filters">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6 3v10" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        ) : undefined
      }
    >
      <FilterSection>
        <EventsFilterSearch label="Search events" placeholder="Events, hosts, cities or topics" />
      </FilterSection>

      <FilterSection title="Show">
        <GenericFilterToggle
          label={goingCount ? `Events I'm going to (${goingCount})` : "Events I'm going to"}
          paramKey="going"
          filterStore={useEventsFilterStore}
        />
        <GenericFilterToggle label="Featured events" paramKey="featured" filterStore={useEventsFilterStore} />
      </FilterSection>

      {FACETS.map((facet) => (
        <FilterSection key={facet.key} title={facet.title}>
          <GenericCheckboxList
            label={facet.label}
            paramKey={facet.key}
            placeholder={facet.placeholder}
            hideSearch={!facet.searchable}
            filterStore={useEventsFilterStore}
            useGetDataHook={createFilterGetter(facetOptions(events, facet.key))}
            defaultItemsToShow={facet.searchable ? 5 : 10}
            collapsible={facet.searchable}
          />
        </FilterSection>
      ))}
    </FiltersSidePanel>
  );
}
