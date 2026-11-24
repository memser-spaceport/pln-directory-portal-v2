'use client';

import clsx from 'clsx';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useEventsAnalytics, type EmbedDetails } from '@/analytics/events.analytics';
import { ArrowUpRightIcon } from '@/components/icons';
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
  allEventsEventHref,
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
import { EVENTS_LIST_PATH } from '@/utils/constants';
import { HAS_EVENTS_MAP } from '@/utils/events-page';

import { AllEventsFilterRail, AppliedChips, appliedChips } from './AllEventsFilters';
import { EventsCalendar } from './calendar/EventsCalendar';
import type { CalMode } from './calendar/weeks';
import { AllEventsHeader } from './AllEventsHeader';
import { CityBand, CityHeader } from './CityBand';
import { EmbedModal, embedFrameTitle, embedScopeLine } from './EmbedModal';
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
   * The embed (LAB-3352, `/events/embed`), framed by another site: the view only, with the filters from its address,
   * and "All events on PL Directory ↗" under it. No page header, Near you, Browse by city, toolbar, filters or member
   * parts. An event opens its drawer in the embed, signed out (LAB-3392).
   */
  embed?: boolean;
  /** The embed's `details=labos` (LAB-3392): an event opens on LabOS in a new tab instead of in the embed's drawer. */
  detailsOnLabOs?: boolean;
}

/** Same-origin frames can read their parent's address; another site's frame throws. */
function framedByLabOs(): boolean {
  try {
    return window.parent !== window && window.parent.location.origin === window.location.origin;
  } catch {
    return false;
  }
}

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
  detailsOnLabOs = false,
}: AllEventsPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const analytics = useEventsAnalytics();
  // The embed reads events signed out, as its drawer does (LAB-3392).
  const prefetchEvent = usePrefetchEventDetail({ anonymous: embed });
  // An embed that sends events to LabOS opens no drawer of its own.
  const embedDrawer = embed && !detailsOnLabOs;
  const todayIso = useSyncExternalStore(
    noopSubscribe,
    () => localIso(new Date()),
    () => serverTodayIso,
  );

  const { params, setParam, setAllParams } = useAllEventsFilterStore();
  const filters = useMemo(() => readFilters(params), [params]);
  const filterCount = countAppliedFilters(params);

  const { data: goingData } = useMyUpcomingEventUids(signedIn);
  const goingUids = useMemo(() => new Set(Array.isArray(goingData) ? goingData : []), [goingData]);

  // The list and its going counts are one cached copy for everyone (five minutes), so a member's own "Yes, I'm going"
  // or "Not going" here would not show on the cards. Each count moves by the viewer's change since the page loaded.
  const [goingAtLoad, setGoingAtLoad] = useState<Set<string> | null>(null);
  if (goingAtLoad === null && Array.isArray(goingData)) setGoingAtLoad(new Set(goingData));
  const items = useMemo(() => {
    const loaded = result.ok ? result.items : EMPTY_ITEMS;
    if (!goingAtLoad) return loaded;
    return loaded.map((item) => {
      const delta = (goingUids.has(item.uid) ? 1 : 0) - (goingAtLoad.has(item.uid) ? 1 : 0);
      return delta && item.goingCount !== null ? { ...item, goingCount: Math.max(0, item.goingCount + delta) } : item;
    });
  }, [result, goingUids, goingAtLoad]);

  const [railOpen, setRailOpen] = useState(false);

  const viewParam = params.get('view') as AllEventsView | null;
  const view: AllEventsView = viewParam && AVAILABLE_VIEWS.includes(viewParam) ? viewParam : 'list';
  // Month from 960px, Week below (LAB-3353; seven Month columns are too narrow under 960). `cal` in the address wins.
  // The server and the first render take Month; a phone switches to Week once mounted.
  const belowMonthWidth = useIsBelowTabletLandscape();
  const calParam = params.get('cal');
  const calMode: CalMode = calParam === 'month' || calParam === 'week' ? calParam : belowMonthWidth ? 'week' : 'month';

  // The open event lives in the address, so a link to an event lands with its drawer open. The linked event stays
  // marked after its drawer closes, until the member opens another one. The embed keeps it to itself (LAB-3392): its
  // address belongs to another site's page, whose Back button must not step through our drawer, and an embed link
  // never carries an event.
  const [embedOpenUid, setEmbedOpenUid] = useState<string | null>(null);
  const openUid = embed ? embedOpenUid : params.get('event');
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

  // List view's own top (Polina's prototype, 2026-11-20; LAB-3374, LAB-3375): Calendar and Map lead with the view
  // itself. In List, a chosen city shows its header; otherwise Near you or the Add location row, for a signed-in member
  // on the plain landing (nothing filtered), then Browse by city and the dated list's heading.
  const listTop = view === 'list';
  const plainLanding = listTop && filterCount === 0;
  const near = signedIn && plainLanding ? nearYou(items, memberCity) : null;
  const askLocation = signedIn && plainLanding && memberCity === null && !!viewerUid;

  // The calendar opens on the linked event's day, else the chosen city's first event, else today.
  const landed = landedUid ? items.find((item) => item.uid === landedUid) : undefined;
  const anchorIso = landed
    ? listDay(landed, todayIso)
    : scopedCity && visible[0]
      ? listDay(visible[0], todayIso)
      : todayIso;

  const prepare = (uid: string) => {
    if (embed && !embedDrawer) return;
    void loadEventDrawer();
    prefetchEvent(uid);
  };
  const open = (uid: string) => {
    if (embed && !embedDrawer) {
      window.open(allEventsEventHref(uid), '_blank', 'noopener,noreferrer');
      return;
    }
    setTouched(true);
    setKeptUid(null);
    if (embed) setEmbedOpenUid(uid);
    else setParam('event', uid);
  };
  // LAB-3361: the drawer's previous / next walk the events on show in the List's order (by list day, then start, so
  // an event under way counts from today); the neighbours load ahead.
  const sequence = useMemo(
    () => groupByDay(visible, todayIso).flatMap((day) => day.events.map((item) => item.uid)),
    [visible, todayIso],
  );
  useEffect(() => {
    if (!openUid) return;
    const at = sequence.indexOf(openUid);
    if (at < 0) return;
    [sequence[at - 1], sequence[at + 1]].forEach((uid) => uid && prefetchEvent(uid));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openUid, sequence]);
  const closeDrawer = () => {
    if (!touched) setKeptUid(openUid);
    setTouched(true);
    if (embed) setEmbedOpenUid(null);
    else setParam('event', undefined);
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

  // Embed (LAB-3365): the dialog with a preview, the iframe code, Copy link and Copy code. It embeds what the page
  // shows: the view, the calendar mode in use (also when the address has none) and the filters the link carries.
  const [embedOpen, setEmbedOpen] = useState(false);
  const embedParams = new URLSearchParams(params);
  if (view === 'list') embedParams.delete('view');
  else embedParams.set('view', view);
  if (view === 'calendar') embedParams.set('cal', calMode);
  else embedParams.delete('cal');
  const embedLinkQuery = embedQuery(embedParams);
  const embedPath = `${EVENTS_EMBED_PATH}${embedLinkQuery ? `?${embedLinkQuery}` : ''}`;
  // Every applied value but "Events I'm going to", which the link does not carry; a scoped city counts too.
  const embedLabels = appliedChips(embedParams, null)
    .filter((chip) => chip.key !== 'going')
    .map((chip) => chip.label);
  const onEmbedCopied = (what: 'link' | 'code', details: EmbedDetails) => {
    const props = { view, filters_count: countAppliedFilters(new URLSearchParams(embedLinkQuery)), details };
    if (what === 'code') analytics.onEventsEmbedCodeCopied(props);
    else analytics.onEventsEmbedLinkCopied(props);
  };

  // One load of the embed, with the host of the site that framed it (its origin comes as the Referer).
  const viewed = useRef(false);
  useEffect(() => {
    if (!embed || viewed.current) return;
    viewed.current = true;
    // The Embed dialog's preview is LabOS framing itself, not a site showing the embed.
    if (framedByLabOs()) return;
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
      details: detailsOnLabOs ? 'labos' : 'embed',
    });
    // Once per load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const viewOptions = AVAILABLE_VIEWS.map((v) => ({ value: v, label: VIEW_LABEL[v] }));

  // The view itself: the page puts it under its toolbar, the embed shows it alone.
  const viewBody =
    view === 'map' ? (
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
    );

  const listBands = !listTop ? null : scopedCity ? (
    <div className={s.listBands}>
      <CityHeader
        city={scopedCity}
        summary={visibleCities.find((c) => c.city.toLowerCase() === scopedCity.toLowerCase())}
        eventCount={visible.length}
        onBack={() => setCity(null, 'tile')}
      />
    </div>
  ) : near || askLocation || cities.length > 0 ? (
    <div className={s.listBands}>
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
      <h3 className={clsx(s.sectionTitle, s.listHeading)}>{filterCount ? 'Matching events' : 'All upcoming'}</h3>
    </div>
  ) : null;

  const content = (
    <div className={s.page}>
      <div className={s.container}>
        <AllEventsHeader
          submitHref={submitHref}
          eventsAppHref={eventsAppHref}
          onSubmitClick={() => analytics.onSubmitEventButtonClicked()}
          onEventsAppClick={() => analytics.onGoToEventsButtonClicked()}
        />

        {!result.ok ? (
          <div className={s.layout}>
            <EventsError onRetry={() => router.refresh()} />
          </div>
        ) : (
          <>
            {/* The toolbar sits right under the header (Polina, 2026-11-20): the city bands belong to List view, so a view
                switch changes only what is under it and the switch never moves under the pointer. */}
            <EventsToolbar
              city={scopedCity}
              count={visible.length}
              filterCount={filterCount}
              railOpen={railOpen}
              onToggleRail={() => setRailOpen((v) => !v)}
              views={AVAILABLE_VIEWS}
              view={view}
              onViewChange={setView}
              onShare={() => setEmbedOpen(true)}
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

            {/* A chosen city is a chip in Calendar and Map, where List's city header doesn't show. */}
            <AppliedChips scopedCity={listTop ? scopedCity : null} railOpen={railOpen} onClear={clearFilters} />

            <div className={s.layout}>
              <div className={s.main}>
                {listBands}
                {viewBody}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // The embed (LAB-3352, Polina's design): the view alone, then "All events on PL Directory ↗" to the same view and
  // filters on the full page, in a new tab. No header, Near you, Browse by city, toolbar or filters: the person
  // embedding it chose the view and filters. An event opens its drawer here, signed out (LAB-3392), or with
  // `details=labos` opens LabOS in a new tab.
  if (embed) {
    const query = embedQuery(params);
    return (
      <>
        <FilterStoreUrlSync store={useAllEventsFilterStore} strategy="history" />
        <div className={s.embedPage}>
          {result.ok ? viewBody : <EventsError onRetry={() => router.refresh()} />}
          <a
            className={clsx(s.textLink, s.embedFoot)}
            href={`${EVENTS_LIST_PATH}${query ? `?${query}` : ''}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            All events on PL Directory <ArrowUpRightIcon width={14} height={14} />
          </a>
        </div>
        {embedDrawer && (
          <EventDrawer
            embed
            eventUid={openUid}
            source="embed"
            onClose={closeDrawer}
            sequence={sequence}
            onNavigate={open}
          />
        )}
      </>
    );
  }

  return (
    <>
      <FilterStoreUrlSync store={useAllEventsFilterStore} strategy="history" />
      <div className={s.shell}>
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
      <EventDrawer
        eventUid={openUid}
        source="all-events"
        onClose={closeDrawer}
        onGoing={openUid ? onGoing(openUid) : undefined}
        sequence={sequence}
        onNavigate={open}
      />
      <EmbedModal
        isOpen={embedOpen}
        onClose={() => setEmbedOpen(false)}
        link={typeof window === 'undefined' ? embedPath : `${window.location.origin}${embedPath}`}
        previewSrc={embedPath}
        scope={embedScopeLine(view, calMode, embedLabels)}
        frameTitle={embedFrameTitle(embedLabels)}
        onCopied={onEmbedCopied}
      />
    </>
  );
}
