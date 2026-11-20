import clsx from 'clsx';

import FilterCount from '@/components/ui/filter-count';

import { EmbedIcon, SlidersIcon, ViewIcon, type AllEventsView } from './icons';
import s from './AllEventsPage.module.scss';

export const VIEW_LABEL: Record<AllEventsView, string> = { list: 'List', calendar: 'Calendar', map: 'Map' };

/**
 * "Coming up": the count, the rail's door with the applied count, and the view switch. Sticky under the site header on
 * desktop; under 1024px the phone bar (MobileFilterWrapper) carries Filters and the view instead. The switch only
 * shows when more than one view is available. Embed (LAB-3352) shows at every width, when `onShare` is given.
 */
export function EventsToolbar({
  city,
  count,
  filterCount,
  railOpen,
  onToggleRail,
  views,
  view,
  onViewChange,
  onShare,
}: {
  city: string | null;
  count: number;
  filterCount: number;
  railOpen: boolean;
  onToggleRail: () => void;
  views: AllEventsView[];
  view: AllEventsView;
  onViewChange: (view: AllEventsView) => void;
  /** Copies the embed link for this view and its filters; absent in the embed itself. */
  onShare?: () => void;
}) {
  return (
    <div className={s.toolbar}>
      <div className={s.toolbarStart}>
        <h2 className={s.toolbarTitle}>{city ? `Coming up in ${city}` : 'Coming up'}</h2>
        <span className={s.toolbarCount}>
          {count} {count === 1 ? 'event' : 'events'}
        </span>
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
