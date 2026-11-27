'use client';

import clsx from 'clsx';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
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
  MONTH_PARAM,
  WHEN_PARAM,
  WHEN_PAST,
  YEAR_PARAM,
  allEventsEventHref,
  type FilterParam,
  countAppliedFilters,
  embedQuery,
  filterEvents,
  filterValues,
  isFilterParam,
  groupByDay,
  inYear,
  listDay,
  localIso,
  nearYou,
  pastCitySummary,
  sharedZone,
  pastYears,
  readFilters,
  readYear,
  sortPast,
  topCities,
} from '@/services/events/all-events.filters';
import type { AllEventsItem, AllEventsResult } from '@/services/events/all-events.types';
import { EventsQueryKeys } from '@/services/events/constants';
import { usePrefetchEventDetail } from '@/services/events/hooks/useEventDrawerQueries';
import { useMyPastEventUids } from '@/services/events/hooks/useMyPastEventUids';
import { useMyUpcomingEventUids } from '@/services/events/hooks/useMyUpcomingEventUids';
import { usePastEvents } from '@/services/events/hooks/usePastEvents';
import { useSeenEvents } from '@/services/events/hooks/useSeenEvents';
import { EVENTS_LIST_PATH } from '@/utils/constants';
import { HAS_EVENTS_MAP } from '@/utils/events-page';

import { AllEventsFilterRail, AppliedChips, appliedChips } from './AllEventsFilters';
import { EventsCalendar, type CalendarJump } from './calendar/EventsCalendar';
import { parseMonthKey, type CalMode } from './calendar/weeks';
import { AllEventsHeader } from './AllEventsHeader';
import { CityBand, CityHeader } from './CityBand';
import { EmbedModal, embedFrameTitle, embedScopeLine } from './EmbedModal';
import { EventsToolbar, VIEW_LABEL } from './EventsToolbar';
import { ListView } from './ListView';
import { EventsMap } from './map/EventsMap';
import { LocationDialog, type LocationDialogFrom } from './LocationDialog';
import { AddLocationRow, NearYou, NoNearbyEventsRow } from './NearYou';
import { EventsEmpty, EventsError, EventsSkeleton } from './states';
import type { AllEventsView } from './icons';
import type { EventsWhen } from './WhenSwitch';
import { YearPicker } from './YearPicker';
import { EVENTS_MINE_PATH } from '@/utils/events-submit';

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
  /** The server's clock (epoch ms), so the Live pills of the first render match the HTML; then the browser's own. */
  serverNow: number;
  /** The server's day, so the first render matches the HTML; the browser's own day replaces it after hydration. */
  serverTodayIso: string;
  submitHref: string;
  /** What the server read of a link to Past (`pastLandingQuery`); empty or absent for any other address. */
  initialQuery?: string;
  /** "Submit an event" opens the LabOS form (same tab), and a signed-in member gets "My Submissions". */
  submitInApp?: boolean;
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

/** `?month=` as the address has it now. */
const addressMonth = () =>
  typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get(MONTH_PARAM);

/** Takes the visitor to the top of the list, under the bars that stay in view, when they are past it. */
function backToTop(list: HTMLElement | null, toolbar: HTMLElement | null) {
  if (!list || !toolbar) return;
  // The toolbar stays in view from 640px, and can take two rows with the rail open.
  const bar = getComputedStyle(toolbar).position === 'sticky' ? toolbar.offsetHeight : 0;
  list.style.setProperty('--events-toolbar-height', `${bar}px`);
  const room = parseFloat(getComputedStyle(list).scrollMarginTop) || 0;
  // At once, for everyone: what is under the bars is another list, and a smooth run would load the photos on its way.
  if (list.getBoundingClientRect().top < room) list.scrollIntoView({ block: 'start', behavior: 'instant' });
}

/** How long a filter must stay still before its change is recorded (the store's former debounce). */
const FILTER_SETTLE_MS = 300;
const EMPTY_ITEMS: AllEventsItem[] = [];

/**
 * The native All Events page (LAB-3247), ported from `prototypes/entries/events-page-redesign`. Every live and upcoming
 * event comes in once from the server, every past one once after the page has loaded (LAB-3418); filters, the city
 * scope, the view and the open event live in the address through `useAllEventsFilterStore`, and everything below is
 * computed from them in the browser.
 */
export function AllEventsPage({
  result,
  signedIn,
  viewerUid,
  memberCity,
  serverNow,
  serverTodayIso,
  submitHref,
  initialQuery = '',
  submitInApp = false,
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

  const { params: storeParams, setParam, setAllParams } = useAllEventsFilterStore();
  // The store takes in the address before the first paint of a page the browser renders. The server's HTML is painted
  // well before that, so it, and the render that hydrates it, go by what the server read: a link to Past is Past at once.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const params = useMemo(
    () => (hydrated ? storeParams : new URLSearchParams(initialQuery)),
    [hydrated, storeParams, initialQuery],
  );
  const filters = useMemo(() => readFilters(params), [params]);
  const filterCount = countAppliedFilters(params);

  const { data: goingData } = useMyUpcomingEventUids(signedIn);
  const goingUids = useMemo(() => new Set(Array.isArray(goingData) ? goingData : []), [goingData]);

  // The list and its going counts are one cached copy for everyone (five minutes), so a member's own "Yes, I'm going"
  // or "Not going" here would not show on the cards. Each count moves by the viewer's change since the page loaded.
  const [goingAtLoad, setGoingAtLoad] = useState<Set<string> | null>(null);
  if (goingAtLoad === null && Array.isArray(goingData)) setGoingAtLoad(new Set(goingData));
  const [railOpen, setRailOpen] = useState(false);

  const viewParam = params.get('view') as AllEventsView | null;
  const view: AllEventsView = viewParam && AVAILABLE_VIEWS.includes(viewParam) ? viewParam : 'list';
  // Month from 960px, Week below (LAB-3353; seven Month columns are too narrow under 960). `cal` in the address wins.
  // The server and the first render take Month; a phone switches to Week once mounted.
  const belowMonthWidth = useIsBelowTabletLandscape();
  const calParam = params.get('cal');
  const calMode: CalMode = calParam === 'month' || calParam === 'week' ? calParam : belowMonthWidth ? 'week' : 'month';

  // Past (LAB-3418): List and Map show one or the other. Calendar shows both, and `when` means nothing there: its tab
  // follows the month or week on show, and a press on a tab moves the calendar (LAB-3460).
  const past = params.get(WHEN_PARAM) === WHEN_PAST && view !== 'calendar';
  const [calPast, setCalPast] = useState(false);
  const [calJump, setCalJump] = useState<CalendarJump | null>(null);
  // The calendar's month (`?month=2026-03`, LAB-3460): the address's, until the visitor moves the calendar. Written with
  // replaceState, as in the prototype, so stepping through months adds no Back steps; Back and Forward read it again.
  // Read off the address itself, not the store, which can still hold a previous visit's on the first render. The
  // server's HTML is never the Calendar, so it never reads this. '' is "no month": dropped when the city changes, so the
  // calendar opens on the city's first event, as before LAB-3460.
  const [calMonth, setCalMonth] = useState<string | null>(null);
  const monthParam = view === 'calendar' ? (calMonth !== null ? calMonth || null : addressMonth()) : null;
  const onCalMonthChange = useCallback((key: string) => {
    setCalMonth(key);
    // After the address sync's own write (its timer is set first): a move that also pushes an entry (Week | Month)
    // writes its month on the new entry, and the one before keeps the month it showed, for Back.
    window.setTimeout(() => {
      const url = new URL(window.location.href);
      if (url.searchParams.get(MONTH_PARAM) === key) return;
      url.searchParams.set(MONTH_PARAM, key);
      // `null`, never history.state: Next ignores the address of a write that carries its own state.
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }, 0);
  }, []);
  // An embed asks for past events only when its link says Past.
  const pastQuery = usePastEvents(result.ok && (!embed || past));
  // The events of both lists, each in one tab: in Past from its end, on this page's own clock, else in Live & upcoming.
  const { seen, fromPage, liveUids, endedUids } = useSeenEvents(
    result.ok ? result.items : EMPTY_ITEMS,
    Array.isArray(pastQuery.data) ? pastQuery.data : EMPTY_ITEMS,
    serverNow,
  );
  const liveItems = useMemo(() => {
    const open = seen.filter((item) => !endedUids.has(item.uid));
    if (!goingAtLoad) return open;
    return open.map((item) => {
      const delta = (goingUids.has(item.uid) ? 1 : 0) - (goingAtLoad.has(item.uid) ? 1 : 0);
      return delta && item.goingCount !== null ? { ...item, goingCount: Math.max(0, item.goingCount + delta) } : item;
    });
  }, [seen, endedUids, goingUids, goingAtLoad]);
  const pastItems = useMemo(() => sortPast(seen.filter((item) => endedUids.has(item.uid))), [seen, endedUids]);
  const pastUids = useMemo(() => new Set(pastItems.map((item) => item.uid)), [pastItems]);
  // "Went": the viewer's past events, and those they were going to that have just ended. Asked for once Past is shown,
  // or "Events I'm going to" is on, which Past's count and the Calendar's past days follow.
  const wentQuery = useMyPastEventUids(signedIn && (past || filters.going));
  const wentData = wentQuery.data;
  const wentUids = useMemo(
    () => new Set([...goingUids, ...(Array.isArray(wentData) ? wentData : [])]),
    [goingUids, wentData],
  );

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
      setAnalyticsCallback: (cb: (key: string, value: string | undefined, next: URLSearchParams) => void) => void;
    };
    store.setAnalyticsCallback((key, value, next) => {
      if (!isFilterParam(key)) return;
      if (key === 'city') dropMonthOnCityChangeRef.current(next);
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

  // A city chosen, changed or cleared by the visitor drops the calendar's month (LAB-3460): the calendar opens on the
  // city's first event, else today, as the spec has it. Then the month leaves the address, once the address sync has
  // written the new entry (its timer runs first), so the entry before it keeps its month for Back.
  const scopedCity = filters.city.length === 1 ? filters.city[0] : null;
  const dropMonthOnCityChangeRef = useRef((next: URLSearchParams) => void next);
  useEffect(() => {
    dropMonthOnCityChangeRef.current = (next: URLSearchParams) => {
      const city = readFilters(next).city;
      if ((city.length === 1 ? city[0] : null) !== scopedCity) setCalMonth('');
    };
  });
  useEffect(() => {
    if (calMonth !== '') return;
    const id = window.setTimeout(() => {
      const url = new URL(window.location.href);
      if (!url.searchParams.has(MONTH_PARAM)) return;
      url.searchParams.delete(MONTH_PARAM);
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }, 0);
    return () => window.clearTimeout(id);
  }, [calMonth]);

  // Back and Forward start the address sync afresh: it doesn't write the address it wrote last, so after Past and Back,
  // Past again would leave the address without `when=past`.
  const [popCount, setPopCount] = useState(0);
  useEffect(() => {
    const onPopState = () => {
      setPopCount((n) => n + 1);
      setCalMonth(null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Landing on `?event=`: bring its card into view once.
  const scrolled = useRef(false);
  const cardsReady = (!past && view !== 'calendar') || !!pastQuery.data || seen.some((item) => item.uid === openUid);
  useEffect(() => {
    if (scrolled.current || !openUid || touched || !cardsReady) return;
    scrolled.current = true;
    const id = window.setTimeout(() => {
      // The Week board renders its cards twice (columns, and the phone stack); scroll to the one that shows.
      Array.from(document.querySelectorAll<HTMLElement>(`[data-event-uid="${CSS.escape(openUid)}"]`))
        .find((el) => el.offsetParent !== null)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 300);
    return () => window.clearTimeout(id);
  }, [openUid, touched, cardsReady]);

  const visibleLive = useMemo(() => filterEvents(liveItems, filters, goingUids), [liveItems, filters, goingUids]);
  // Past's year: kept in the address on the other tab and in Calendar, where it means nothing.
  const year = past ? readYear(params) : null;
  const years = useMemo(() => pastYears(pastItems), [pastItems]);
  const visiblePast = useMemo(
    () => filterEvents(inYear(pastItems, year), filters, wentUids),
    [pastItems, year, filters, wentUids],
  );
  const visible = past ? visiblePast : visibleLive;
  // Calendar's past days come from the same events, oldest first.
  const visibleCalendar = useMemo(() => [...[...visiblePast].reverse(), ...visibleLive], [visiblePast, visibleLive]);
  // Filtered to the events the viewer went to, Past needs to know which they are.
  const wentQueries = signedIn && filters.going ? [pastQuery, wentQuery] : [pastQuery];
  // A query that is switched off has nothing to wait for.
  const pastLoaded = wentQueries.every(
    (query) => query.data !== undefined || (query.fetchStatus === 'idle' && !query.isError),
  );
  const pastFailed = !pastLoaded && wentQueries.some((query) => query.isError && !query.isFetching);
  const pastLoading = !pastLoaded && !pastFailed;
  // Calendar shows the empty state only when nothing matches and nothing is still coming.
  const calendarShown = view === 'calendar' && (visibleCalendar.length > 0 || pastLoading);
  const retryPast = () => wentQueries.filter((query) => query.isError).forEach((query) => void query.refetch());

  const cities = useMemo(() => topCities(liveItems), [liveItems]);
  // The city header's dates and zone follow the same filtered events as its count.
  const visibleCities = useMemo(() => topCities(visibleLive), [visibleLive]);
  // The rail's options, and its "Events I'm going to" count, come from the events in scope.
  const railEvents = past ? inYear(pastItems, year) : liveItems;
  const railGoingUids = past ? wentUids : goingUids;
  const goingCount = signedIn ? railEvents.filter((item) => railGoingUids.has(item.uid)).length : null;

  // List view's own top (Polina's prototype, 2026-11-20; LAB-3374, LAB-3375): Calendar and Map lead with the view
  // itself. In List, a chosen city shows its header; otherwise Near you or the Add location row, for a signed-in member
  // on the plain landing (nothing filtered), then Browse by city and the dated list's heading.
  const listTop = view === 'list';
  const plainLanding = listTop && filterCount === 0;
  const near = signedIn && plainLanding ? nearYou(liveItems, memberCity) : null;
  const askLocation = signedIn && plainLanding && memberCity === null && !!viewerUid;
  // A place with no upcoming event: a row to change it, where Near you would be (LAB-3394).
  const noNearby = signedIn && plainLanding && !near && typeof memberCity === 'string' && !!viewerUid;
  // The location dialog (LAB-3394), and which row opened it.
  const [locationFrom, setLocationFrom] = useState<LocationDialogFrom | null>(null);
  const openLocation = (from: LocationDialogFrom) => {
    setLocationFrom(from);
    analytics.onEventsLocationDialogOpened({ from });
  };

  // The calendar opens on the linked event's day, else the chosen city's first event, else today.
  // Read off the page's own events, ended or not, so one that ends while the calendar is open doesn't move it.
  const landed = landedUid ? fromPage.find((item) => item.uid === landedUid) : undefined;
  const cityFirst = scopedCity ? filterEvents(fromPage, filters, goingUids)[0] : undefined;
  const pageAnchorIso = landed ? listDay(landed, todayIso) : cityFirst ? listDay(cityFirst, todayIso) : todayIso;
  // A linked event that comes with past events, after the calendar has opened.
  const landedLate = landedUid && !landed ? seen.find((item) => item.uid === landedUid) : undefined;
  const anchorIso = !landedLate
    ? pageAnchorIso
    : pastUids.has(landedLate.uid)
      ? landedLate.startDay
      : listDay(landedLate, todayIso);

  const prepare = (uid: string) => {
    if (embed && !embedDrawer) return;
    void loadEventDrawer();
    prefetchEvent(uid);
  };
  // Where the drawer opens (P1): on the event, or on who went from a Past card's faces. Not in the address: Back to an
  // event opens it on the event.
  const [drawerOn, setDrawerOn] = useState<'event' | 'attendees'>('event');
  const open = (uid: string, on: 'event' | 'attendees' = 'event') => {
    if (embed && !embedDrawer) {
      window.open(allEventsEventHref(uid), '_blank', 'noopener,noreferrer');
      return;
    }
    setDrawerOn(on);
    setTouched(true);
    setKeptUid(null);
    if (embed) setEmbedOpenUid(uid);
    else setParam('event', uid);
  };
  // LAB-3361: the drawer's previous / next walk the events on show in the List's order (by list day, then start, so
  // an event under way counts from today); the neighbours load ahead. On Past in its own order, newest first; in
  // Calendar the past events, oldest first, then the List's (LAB-3418).
  const sequence = useMemo(() => {
    if (past) return visiblePast.map((item) => item.uid);
    const live = groupByDay(visibleLive, todayIso).flatMap((day) => day.events.map((item) => item.uid));
    return view === 'calendar' ? [...visiblePast.map((item) => item.uid).reverse(), ...live] : live;
  }, [past, view, visiblePast, visibleLive, todayIso]);
  useEffect(() => {
    if (!openUid) return;
    const at = sequence.indexOf(openUid);
    if (at < 0) return;
    [sequence[at - 1], sequence[at + 1]].forEach((uid) => uid && prefetchEvent(uid));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openUid, sequence]);
  const closeDrawer = () => {
    setDrawerOn('event');
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
  const when: EventsWhen = (view === 'calendar' ? calPast : past) ? 'past' : 'upcoming';
  const setWhen = (next: EventsWhen) => {
    // In Calendar every press moves it, the tab on show too; only a switch is recorded. With no calendar on show (the
    // empty state) a press moves nothing and records nothing.
    if (view === 'calendar') {
      if (!calendarShown) return;
      setCalJump((j) => ({ to: next === 'past' ? 'past' : 'today', seq: (j?.seq ?? 0) + 1 }));
    }
    if (next === when) return;
    if (view !== 'calendar') setParam(WHEN_PARAM, next === 'past' ? WHEN_PAST : undefined);
    analytics.onEventsWhenChanged({ when: next, view });
  };
  const listRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const yearPicked = useRef(false);
  const setYear = (next: string | null) => {
    if (next === year) return;
    yearPicked.current = view === 'list';
    setParam(YEAR_PARAM, next ?? undefined);
    analytics.onEventsYearChanged({ year: next ?? 'all', view });
  };
  // Another year is another list: it opens at its top. Only a pick does that, not Back, Forward or the Map.
  useLayoutEffect(() => {
    if (!yearPicked.current) return;
    yearPicked.current = false;
    backToTop(listRef.current, toolbarRef.current);
  }, [year]);
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
  const clearFilters = () => clearFiltersAnd();
  const clearFiltersAnd = (...more: string[]) => {
    const cleared = FILTER_PARAMS.filter((key) => params.has(key));
    const next = new URLSearchParams(params);
    [...FILTER_PARAMS, ...more].forEach((key) => next.delete(key));
    if (cleared.includes('city')) dropMonthOnCityChangeRef.current(next);
    setAllParams(next);
    cleared.forEach((key) => {
      window.clearTimeout(filterTimers.current.get(key));
      filterTimers.current.delete(key);
      analytics.onEventsFiltersApplied({ key, values: [] });
    });
  };

  /** "Show all events" on Past: its year too, so the press always leads to a list. */
  const showAllPast = () => {
    clearFiltersAnd(YEAR_PARAM);
    if (year) analytics.onEventsYearChanged({ year: 'all', view });
  };

  // Embed (LAB-3365): the dialog with a preview, the iframe code, Copy link and Copy code. It embeds what the page
  // shows: the view, the calendar mode in use (also when the address has none) and the filters the link carries.
  const [embedOpen, setEmbedOpen] = useState(false);
  const embedParams = new URLSearchParams(params);
  if (view === 'list') embedParams.delete('view');
  else embedParams.set('view', view);
  if (view === 'calendar') embedParams.set('cal', calMode);
  else embedParams.delete('cal');
  if (!past) embedParams.delete(WHEN_PARAM);
  if (!year) embedParams.delete(YEAR_PARAM);
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
    past && pastFailed ? (
      <EventsError onRetry={retryPast} />
    ) : past && pastLoading ? (
      <EventsSkeleton />
    ) : view === 'map' ? (
      visible.length === 0 ? (
        <EventsEmpty past={past} onClear={past ? showAllPast : clearFilters} />
      ) : (
        <EventsMap
          events={visible}
          pastAsOf={past ? todayIso : undefined}
          goingUids={past ? wentUids : goingUids}
          highlightUid={highlightUid}
          onOpen={open}
          onPrepare={prepare}
        />
      )
    ) : view === 'calendar' ? (
      !calendarShown ? (
        <EventsEmpty onClear={clearFilters} />
      ) : (
        <EventsCalendar
          key={`${pageAnchorIso}:${scopedCity ?? ''}`}
          events={visibleCalendar}
          todayIso={todayIso}
          anchorIso={anchorIso}
          mode={calMode}
          onModeChange={setCalMode}
          goingUids={wentUids}
          pastUids={pastUids}
          highlightUid={highlightUid}
          onOpen={open}
          onPrepare={prepare}
          initialMonth={monthParam}
          onMonthChange={onCalMonthChange}
          jump={calJump}
          onPeriodChange={setCalPast}
        />
      )
    ) : (
      <ListView
        events={visible}
        past={past}
        todayIso={todayIso}
        goingUids={past ? wentUids : goingUids}
        liveUids={liveUids}
        highlightUid={highlightUid}
        onOpen={open}
        onPrepare={prepare}
        // Who went needs a signed-in member, and the embed never opens it (LAB-3392): there the faces stay the card's.
        onOpenPeople={past && signedIn && !embed ? (uid) => open(uid, 'attendees') : undefined}
        onClear={past ? showAllPast : clearFilters}
      />
    );

  // Past has no Near you, Browse by city or heading: they answer "what can I go to?". A chosen city keeps its header,
  // once its events are known.
  const listBands =
    !listTop || (past && (!scopedCity || !pastLoaded)) ? null : scopedCity ? (
      <div className={s.listBands}>
        <CityHeader
          city={scopedCity}
          summary={
            past
              ? pastCitySummary(scopedCity, visiblePast)
              : visibleCities.find((c) => c.city.toLowerCase() === scopedCity.toLowerCase())
          }
          eventCount={visible.length}
          zone={sharedZone(visible)}
          pastAsOf={past ? todayIso : undefined}
          onBack={() => setCity(null, 'tile')}
        />
      </div>
    ) : near || askLocation || noNearby || cities.length > 0 ? (
      <div className={s.listBands}>
        {near && (
          <NearYou
            city={near.city}
            events={near.events}
            todayIso={todayIso}
            goingUids={goingUids}
            liveUids={liveUids}
            onOpen={open}
            onPrepare={prepare}
            onSeeAll={() => setCity(near.city, 'near-you')}
            onChangeLocation={() => openLocation('change')}
          />
        )}
        {askLocation && <AddLocationRow onAdd={() => openLocation('add')} />}
        {noNearby && <NoNearbyEventsRow city={memberCity} onChange={() => openLocation('no-events')} />}
        {cities.length > 0 && (
          <CityBand cities={cities} selected={filters.city} onPick={(city) => setCity(city, 'tile')} />
        )}
        <h3 className={clsx(s.sectionTitle, s.listHeading)}>
          {filterCount ? 'Matching events' : 'All live & upcoming'}
        </h3>
      </div>
    ) : null;

  const content = (
    <div className={s.page}>
      <div className={s.container}>
        <AllEventsHeader
          submitHref={submitHref}
          submitInApp={submitInApp}
          mySubmissionsHref={submitInApp && signedIn ? EVENTS_MINE_PATH : undefined}
          onSubmitClick={() => analytics.onSubmitEventButtonClicked()}
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
              ref={toolbarRef}
              count={visibleLive.length}
              when={when}
              pastCount={pastLoaded ? visiblePast.length : null}
              onWhenChange={setWhen}
              yearPicker={past && pastQuery.data ? <YearPicker years={years} year={year} onChange={setYear} /> : null}
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
                      events={railEvents}
                      goingCount={goingCount}
                      past={past}
                      onClose={onClose}
                      onClear={clearFilters}
                      onCityPicked={onCityPicked}
                    />
                  )}
                />
              </div>
            </div>

            {/* A chosen city is a chip in Calendar and Map, where List's city header doesn't show. */}
            <AppliedChips
              params={params}
              scopedCity={listTop && !(past && pastFailed) ? scopedCity : null}
              railOpen={railOpen}
              past={past}
              onClear={clearFilters}
            />

            <div className={s.layout} ref={listRef}>
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
    // The full page opens on the same month as the embed's calendar, once its visitor has moved it.
    const footParams = new URLSearchParams(embedQuery(params));
    if (parseMonthKey(monthParam)) footParams.set(MONTH_PARAM, monthParam as string);
    const query = footParams.toString();
    return (
      <>
        <FilterStoreUrlSync key={popCount} store={useAllEventsFilterStore} strategy="history" />
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
      <FilterStoreUrlSync key={popCount} store={useAllEventsFilterStore} strategy="history" />
      <div className={s.shell}>
        <DashboardPagesLayout
          filters={
            railOpen && result.ok ? (
              <div id="events-filters" className={s.railWrap}>
                <AllEventsFilterRail
                  events={railEvents}
                  goingCount={goingCount}
                  past={past}
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
        initialStep={drawerOn === 'attendees' ? 'attendees' : undefined}
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
        scope={embedScopeLine(view, calMode, embedLabels, past)}
        frameTitle={embedFrameTitle(embedLabels)}
        onCopied={onEmbedCopied}
      />
      {locationFrom && viewerUid && (
        <LocationDialog
          viewerUid={viewerUid}
          from={locationFrom}
          onClose={() => setLocationFrom(null)}
          onSaved={(from) => analytics.onEventsLocationSaved({ from })}
        />
      )}
    </>
  );
}
