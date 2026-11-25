import clsx from 'clsx';
import type { ReactNode, Ref } from 'react';

import FilterCount from '@/components/ui/filter-count';

import { EmbedIcon, SlidersIcon, ViewIcon, type AllEventsView } from './icons';
import s from './AllEventsPage.module.scss';
import { WhenSwitch, type EventsWhen } from './WhenSwitch';

export const VIEW_LABEL: Record<AllEventsView, string> = { list: 'List', calendar: 'Calendar', map: 'Map' };

/**
 * The When switch (List and Map, LAB-3418) or "Coming up" with the count (Calendar, which shows past days itself), the
 * rail's door with the applied count, and the view switch. Sticky under the site header on desktop; under 1024px the
 * phone bar (MobileFilterWrapper) carries Filters and the view instead. The view switch only shows when more than one
 * view is available. Embed (LAB-3352) shows at every width, when `onShare` is given.
 */
export function EventsToolbar({
  ref,
  city,
  count,
  when,
  pastCount,
  onWhenChange,
  yearPicker,
  filterCount,
  railOpen,
  onToggleRail,
  views,
  view,
  onViewChange,
  onShare,
}: {
  ref?: Ref<HTMLDivElement>;
  city: string | null;
  /** The live and upcoming events under the filters. */
  count: number;
  when: EventsWhen;
  /** The past events under the filters; null while they load, or when they failed to. */
  pastCount: number | null;
  onWhenChange: (when: EventsWhen) => void;
  /** Past's year, beside the switch. */
  yearPicker?: ReactNode;
  filterCount: number;
  railOpen: boolean;
  onToggleRail: () => void;
  views: AllEventsView[];
  view: AllEventsView;
  onViewChange: (view: AllEventsView) => void;
  /** Opens the Embed dialog for this view and its filters (LAB-3365); absent in the embed itself. */
  onShare?: () => void;
}) {
  return (
    <div ref={ref} className={s.toolbar}>
      <div className={s.toolbarStart}>
        {view === 'calendar' ? (
          <div className={s.toolbarHeading}>
            <h2 className={s.toolbarTitle}>{city ? `Coming up in ${city}` : 'Coming up'}</h2>
            <span className={s.toolbarCount}>
              {count} {count === 1 ? 'event' : 'events'}
            </span>
          </div>
        ) : (
          <>
            <WhenSwitch when={when} counts={{ upcoming: count, past: pastCount }} onChange={onWhenChange} />
            {yearPicker}
          </>
        )}
      </div>
      <div className={s.toolbarActions}>
        <div className={s.toolbarEnd}>
          <button
            type="button"
            className={clsx(s.filtersBtn, railOpen && s.filtersBtnOpen)}
            aria-pressed={railOpen}
            aria-controls="events-filters"
            onClick={onToggleRail}
          >
            <SlidersIcon />
            Filters
            {filterCount > 0 && <FilterCount count={filterCount} />}
          </button>
          {views.length > 1 && (
            <div className={s.viewSwitch} role="tablist" aria-label="View">
              {views.map((v) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={view === v}
                  className={clsx(s.viewBtn, view === v && s.viewBtnActive)}
                  onClick={() => onViewChange(v)}
                >
                  <ViewIcon view={v} />
                  {VIEW_LABEL[v]}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* After the view switch, as in Polina's design: it embeds what the view and filters show. */}
        {onShare && (
          <button type="button" className={clsx(s.filtersBtn, s.shareBtn)} onClick={onShare}>
            <EmbedIcon />
            Embed
          </button>
        )}
      </div>
    </div>
  );
}
