'use client';

import clsx from 'clsx';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useEventsAnalytics } from '@/analytics/events.analytics';
import { FilterStoreUrlSync } from '@/components/common/filters/FilterStoreUrlSync';
import { MobileFilterWrapper } from '@/components/common/filters/MobileFilterWrapper';
import { toast } from '@/components/core/ToastContainer';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import type { EventGoingNotice } from '@/components/page/events/EventDrawer/EventDrawerView';
import { eventGoingToastText } from '@/components/page/events/EventDrawer/toast';
import { encodeFilterValues } from '@/services/filters';
import { useIsBelowTabletLandscape } from '@/hooks/useIsBelowTabletLandscape';
import { useAllEventsFilterStore } from '@/services/events/all-events-filters.store';
import {
  EVENTS_EMBED_PATH,
  FILTER_PARAMS,
  type FilterParam,
  countAppliedFilters,
  embedQuery,
  filterEvents,
  filterValues,
  isFilterParam,
  groupByDay,
  listDay,
  localIso,
  nearYou,
  readFilters,
  topCities,
} from '@/services/events/all-events.filters';
import type { AllEventsItem, AllEventsResult } from '@/services/events/all-events.types';
import { EventsQueryKeys } from '@/services/events/constants';
import { usePrefetchEventDetail } from '@/services/events/hooks/useEventDrawerQueries';
import { useMyUpcomingEventUids } from '@/services/events/hooks/useMyUpcomingEventUids';
import { HAS_EVENTS_MAP } from '@/utils/events-page';

import { AllEventsFilterRail, AppliedChips } from './AllEventsFilters';
import { EventsCalendar } from './calendar/EventsCalendar';
import type { CalMode } from './calendar/weeks';
import { AllEventsHeader } from './AllEventsHeader';
import { CityBand, CityHeader } from './CityBand';
import { EventsToolbar, VIEW_LABEL } from './EventsToolbar';
import { ListView } from './ListView';
import { EventsMap } from './map/EventsMap';
import { AddLocationRow, NearYou } from './NearYou';
import { EventsEmpty, EventsError } from './states';
import type { AllEventsView } from './icons';
import s from './AllEventsPage.module.scss';

/** Loaded on the first press (or the hover before it), so the page doesn't ship the drawer to everyone up front. */
const loadEventDrawer = () => import('@/components/page/events/EventDrawer/EventDrawer');
const EventDrawer = dynamic(() => loadEventDrawer().then((m) => m.EventDrawer), { ssr: false });

/** The views this build offers, in switch order. Map only with a Maps key (LAB-3321); without one `?view=map` opens the List. */
export const AVAILABLE_VIEWS: AllEventsView[] = HAS_EVENTS_MAP ? ['list', 'calendar', 'map'] : ['list', 'calendar'];

export interface AllEventsPageProps {
  result: AllEventsResult;
  signedIn: boolean;
  viewerUid: string | null;
  /** The signed-in member's profile city; null when their profile has none; undefined signed out or unknown. */
  memberCity: string | null | undefined;
  /** The server's day, so the first render matches the HTML; the browser's own day replaces it after hydration. */
  serverTodayIso: string;
  submitHref: string;
  eventsAppHref: string;
  /**
   * The embed (LAB-3352, `/events/embed`), framed by another site: the toolbar and the view only. No page header
   * (Submit an event, the events app), no Share / embed, no member parts, no drawer: an event opens on LabOS in a new
   * tab, since a framed page often can't use the LabOS sign-in.
   */
  embed?: boolean;
}

/** Where an event opens from the embed: the All Events page with its drawer, in a new tab. */
export const embedEventHref = (uid: string) => `/events/all?event=${encodeURIComponent(uid)}`;

const noopSubscribe = () => () => {};
/** How long a filter must stay still before its change is recorded (the store's former debounce). */
const FILTER_SETTLE_MS = 300;
const EMPTY_ITEMS: AllEventsItem[] = [];

/**
 * The native All Events page (LAB-3247), ported from `prototypes/entries/events-page-redesign`. Every event comes in
 * once from the server; filters, the city scope, the view and the open event live in the address through
 * `useAllEventsFilterStore`, and everything below is computed from them in the browser.
 */
export function AllEventsPage({
  result,
  signedIn,
  viewerUid,
  memberCity,
  serverTodayIso,
  submitHref,
  eventsAppHref,
  embed = false,
}: AllEventsPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const analytics = useEventsAnalytics();
  const prefetchEvent = usePrefetchEventDetail();
  const todayIso = useSyncExternalStore(
    noopSubscribe,
    () => localIso(new Date()),
    () => serverTodayIso,
  );

  const items = result.ok ? result.items : EMPTY_ITEMS;
  const { params, setParam, setAllParams } = useAllEventsFilterStore();
  const filters = useMemo(() => readFilters(params), [params]);
  const filterCount = countAppliedFilters(params);

  const { data: goingData } = useMyUpcomingEventUids(signedIn);
  const goingUids = useMemo(() => new Set(Array.isArray(goingData) ? goingData : []), [goingData]);

  const [railOpen, setRailOpen] = useState(false);

  const viewParam = params.get('view') as AllEventsView | null;
  const view: AllEventsView = viewParam && AVAILABLE_VIEWS.includes(viewParam) ? viewParam : 'list';
  // Month from 960px, Week below (LAB-3353; seven Month columns are too narrow under 960). `cal` in the address wins.
  // The server and the first render take Month; a phone switches to Week once mounted.
  const belowMonthWidth = useIsBelowTabletLandscape();
  const calParam = params.get('cal');
  const calMode: CalMode = calParam === 'month' || calParam === 'week' ? calParam : belowMonthWidth ? 'week' : 'month';

  // The open event lives in the address, so a link to an event lands with its drawer open. The linked event stays
  // marked after its drawer closes, until the member opens another one.
  const openUid = params.get('event');
  const [touched, setTouched] = useState(false);
  const [keptUid, setKeptUid] = useState<string | null>(null);
  const highlightUid = openUid ?? keptUid;
  // The event a link landed on, kept for the page's life: the calendar opens on its week, even after its drawer closes.
  const [landedUid, setLandedUid] = useState<string | null>(null);
  if (!touched && openUid && openUid !== landedUid) setLandedUid(openUid);

  // A filter change made by the member (never the address being read on landing) is recorded once that filter has
  // settled for 300ms, each filter on its own timer, so typing a search, a view switch or an opened event never
  // swallows another filter's change. On leaving, pending changes are dropped and the store gets a no-op.
  const analyticsRef = useRef(analytics);
  useEffect(() => {
    analyticsRef.current = analytics;
  });
  const filterTimers = useRef(new Map<FilterParam, number>());
  useEffect(() => {
    const timers = filterTimers.current;
    const store = useAllEventsFilterStore as unknown as {
      setAnalyticsCallback: (cb: (key: string, value: string | undefined) => void) => void;
    };
    store.setAnalyticsCallback((key, value) => {
      if (!isFilterParam(key)) return;
      window.clearTimeout(timers.get(key));
      timers.set(
        key,
        window.setTimeout(() => {
          timers.delete(key);
          analyticsRef.current.onEventsFiltersApplied({ key, values: filterValues(key, value) });
        }, FILTER_SETTLE_MS),
      );
    });
    return () => {
      store.setAnalyticsCallback(() => {});
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
    };
  }, []);

  // Landing on `?event=`: bring its card into view once.
  const scrolled = useRef(false);
  useEffect(() => {
    if (scrolled.current || !openUid || touched) return;
    scrolled.current = true;
    const id = window.setTimeout(() => {
      // The Week board renders its cards twice (columns, and the phone stack); scroll to the one that shows.
      Array.from(document.querySelectorAll<HTMLElement>(`[data-event-uid="${CSS.escape(openUid)}"]`))
        .find((el) => el.offsetParent !== null)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 300);
    return () => window.clearTimeout(id);
  }, [openUid, touched]);

  const visible = useMemo(() => filterEvents(items, filters, goingUids), [items, filters, goingUids]);
  const cities = useMemo(() => topCities(items), [items]);
  // The city header's dates and zone follow the same filtered events as its count.
  const visibleCities = useMemo(() => topCities(visible), [visible]);
  const scopedCity = filters.city.length === 1 ? filters.city[0] : null;
  const goingCount = signedIn ? items.filter((item) => goingUids.has(item.uid)).length : null;

  // Near you and the Add location row, for a signed-in member: in every view and with any filter (2026-11-19: the
  // section stays put instead of jumping in and out). Only a chosen city replaces it, with its own header (below).
  const near = signedIn ? nearYou(items, memberCity) : null;
  const askLocation = signedIn && memberCity === null && !!viewerUid;

  // The calendar opens on the linked event's day, else the chosen city's first event, else today.
  const landed = landedUid ? items.find((item) => item.uid === landedUid) : undefined;
  const anchorIso = landed
    ? listDay(landed, todayIso)
    : scopedCity && visible[0]
      ? listDay(visible[0], todayIso)
      : todayIso;

  const prepare = (uid: string) => {
    if (embed) return;
    void loadEventDrawer();
    prefetchEvent(uid);
  };
  const open = (uid: string) => {
    if (embed) {
      window.open(embedEventHref(uid), '_blank', 'noopener,noreferrer');
      return;
    }
    setTouched(true);
    setKeptUid(null);
    setParam('event', uid);
  };
  // LAB-3361: the drawer's previous / next walk the events on show in the List's order (by list day, then start, so
  // an event under way counts from today); the neighbours load ahead.
  const sequence = useMemo(
    () => groupByDay(visible, todayIso).flatMap((day) => day.events.map((item) => item.uid)),
    [visible, todayIso],
  );
  useEffect(() => {
    // The embed never opens the drawer, so it loads no neighbours either.
    if (embed || !openUid) return;
    const at = sequence.indexOf(openUid);
    if (at < 0) return;
    [sequence[at - 1], sequence[at + 1]].forEach((uid) => uid && prefetchEvent(uid));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embed, openUid, sequence]);
  const closeDrawer = () => {
    if (!touched) setKeptUid(openUid);
    setTouched(true);
    setParam('event', undefined);
  };
  const onGoing = (eventUid: string) => (notice: EventGoingNotice) => {
    if (viewerUid) {
      queryClient.setQueryData<string[]>([EventsQueryKeys.MY_UPCOMING_EVENT_UIDS, viewerUid], (old) =>
        Array.from(new Set([...(Array.isArray(old) ? old : []), eventUid])),
      );
    }
    toast.success(
      <>
        {eventGoingToastText(notice)}
        {viewerUid && (
          <>
            {' '}
            <Link href={`/members/${viewerUid}`} className={s.toastLink}>
              View profile
            </Link>
          </>
        )}
      </>,
    );
  };

  const setView = (next: AllEventsView) => {
    if (next === view) return;
    setParam('view', next === 'list' ? undefined : next);
    analytics.onEventsViewChanged(next === 'calendar' ? { view: next, mode: calMode } : { view: next });
  };
  const setCalMode = (mode: CalMode) => {
    if (mode === calMode) return;
    setParam('cal', mode);
    analytics.onEventsViewChanged({ view: 'calendar', mode });
  };
  const setCity = (city: string | null, from: 'tile' | 'near-you') => {
    setParam('city', city ? encodeFilterValues([city]) : undefined);
    if (city) analytics.onEventsCitySelected({ city, from });
  };
  const onCityPicked = (city: string) => analytics.onEventsCitySelected({ city, from: 'filter' });
  /** Clears the filters only: the view and an open drawer stay. Each filter that was set is recorded as emptied. */
  const clearFilters = () => {
    const cleared = FILTER_PARAMS.filter((key) => params.has(key));
    const next = new URLSearchParams(params);
    FILTER_PARAMS.forEach((key) => next.delete(key));
    setAllParams(next);
    cleared.forEach((key) => {
      window.clearTimeout(filterTimers.current.get(key));
      filterTimers.current.delete(key);
      analytics.onEventsFiltersApplied({ key, values: [] });
    });
  };

  // Copies the embed link for this view and its filters (LAB-3352). The clipboard can be blocked (an insecure page,
  // a denied permission): then the toast says so instead.
  const shareEmbed = async () => {
    const query = embedQuery(params);
    const link = `${window.location.origin}${EVENTS_EMBED_PATH}${query ? `?${query}` : ''}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      toast.error('Could not copy the link');
      return;
    }
    toast.success('Link copied');
    analytics.onEventsEmbedLinkCopied({ view, filters_count: countAppliedFilters(new URLSearchParams(query)) });
  };

  // One load of the embed, with the host of the site that framed it (its origin comes as the Referer).
  const viewed = useRef(false);
  useEffect(() => {
    if (!embed || viewed.current) return;
    viewed.current = true;
    let referrerHost: string | null = null;
    try {
      referrerHost = document.referrer ? new URL(document.referrer).host : null;
    } catch {
      referrerHost = null;
    }
    // From the address: the store only takes it in after the first render.
    const opened = new URLSearchParams(window.location.search).get('view') as AllEventsView | null;
    analytics.onEventsEmbedViewed({
      view: opened && AVAILABLE_VIEWS.includes(opened) ? opened : 'list',
      referrer_host: referrerHost,
    });
    // Once per load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const viewOptions = AVAILABLE_VIEWS.map((v) => ({ value: v, label: VIEW_LABEL[v] }));

  const content = (
    <div className={s.page}>
      <div className={s.container}>
        {!embed && (
          <AllEventsHeader
            submitHref={submitHref}
            eventsAppHref={eventsAppHref}
            onSubmitClick={() => analytics.onSubmitEventButtonClicked()}
            onEventsAppClick={() => analytics.onGoToEventsButtonClicked()}
          />
        )}

        {!result.ok ? (
          <div className={s.layout}>
            <EventsError onRetry={() => router.refresh()} />
          </div>
        ) : (
          <>
            {scopedCity ? (
              <CityHeader
                city={scopedCity}
                summary={visibleCities.find((c) => c.city.toLowerCase() === scopedCity.toLowerCase())}
                eventCount={visible.length}
                onBack={() => setCity(null, 'tile')}
              />
            ) : (
              <>
                {near && (
                  <NearYou
                    city={near.city}
                    events={near.events}
                    todayIso={todayIso}
                    goingUids={goingUids}
                    onOpen={open}
                    onPrepare={prepare}
                    onSeeAll={() => setCity(near.city, 'near-you')}
                  />
                )}
                {askLocation && <AddLocationRow profileHref={`/members/${viewerUid}`} />}
                {cities.length > 0 && (
                  <CityBand cities={cities} selected={filters.city} onPick={(city) => setCity(city, 'tile')} />
                )}
              </>
            )}

            <EventsToolbar
              city={scopedCity}
              count={visible.length}
              filterCount={filterCount}
              railOpen={railOpen}
              onToggleRail={() => setRailOpen((v) => !v)}
              views={AVAILABLE_VIEWS}
              view={view}
              onViewChange={setView}
              onShare={embed ? undefined : () => void shareEmbed()}
            />

            {/* Phones and tablets: the directory's Filters pill and bottom sheet (it hides itself from 1024px). */}
            <div className={s.mobileFilters}>
              <div className={s.mobileBar}>
                <MobileFilterWrapper
                  filterCount={filterCount}
                  currentSort={view}
                  sortOptions={viewOptions}
                  sortByLabel="View:"
                  onSortChange={(v) => setView(v as AllEventsView)}
                  onClearFilters={clearFilters}
                  renderFilter={(onClose) => (
                    <AllEventsFilterRail
                      events={items}
                      goingCount={goingCount}
                      onClose={onClose}
                      onClear={clearFilters}
                      onCityPicked={onCityPicked}
                    />
                  )}
                />
              </div>
            </div>

            <AppliedChips scopedCity={scopedCity} railOpen={railOpen} onClear={clearFilters} />

            <div className={s.layout}>
              <div className={s.main}>
                {view === 'map' ? (
                  visible.length === 0 ? (
                    <EventsEmpty onClear={clearFilters} />
                  ) : (
                    <EventsMap
                      events={visible}
                      goingUids={goingUids}
                      highlightUid={highlightUid}
                      onOpen={open}
                      onPrepare={prepare}
                    />
                  )
                ) : view === 'calendar' ? (
                  visible.length === 0 ? (
                    <EventsEmpty onClear={clearFilters} />
                  ) : (
                    <EventsCalendar
                      key={`${anchorIso}:${scopedCity ?? ''}`}
                      events={visible}
                      todayIso={todayIso}
                      anchorIso={anchorIso}
                      mode={calMode}
                      onModeChange={setCalMode}
                      goingUids={goingUids}
                      highlightUid={highlightUid}
                      onOpen={open}
                      onPrepare={prepare}
                    />
                  )
                ) : (
                  <ListView
                    events={visible}
                    todayIso={todayIso}
                    goingUids={goingUids}
                    highlightUid={highlightUid}
                    onOpen={open}
                    onPrepare={prepare}
                    onClear={clearFilters}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <FilterStoreUrlSync store={useAllEventsFilterStore} strategy="history" />
      <div className={clsx(s.shell, embed && s.embed)}>
        <DashboardPagesLayout
          filters={
            railOpen && result.ok ? (
              <div id="events-filters" className={s.railWrap}>
                <AllEventsFilterRail
                  events={items}
                  goingCount={goingCount}
                  onHide={() => setRailOpen(false)}
                  onClear={clearFilters}
                  onCityPicked={onCityPicked}
                />
              </div>
            ) : null
          }
          content={content}
        />
      </div>
      {!embed && (
        <EventDrawer
          eventUid={openUid}
          source="all-events"
          onClose={closeDrawer}
          onGoing={openUid ? onGoing(openUid) : undefined}
          sequence={sequence}
          onNavigate={open}
        />
      )}
    </>
  );
}
