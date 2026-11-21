'use client';

/**
 * REUSE MAP — events-page-redesign
 *
 * Mobbin references (2026-11-16):
 *   Luma Discover ........ "Explore local events" city tiles → Browse by city.
 *   Luma / Partiful grid . event cards with the picture on top → the Near you tiles (the Tiles view was dropped 2026-11-18).
 *   Luma calendar list ... day headers, card = time / title / host / place / facepile → List.
 *   Luma side peek ....... a row opens a drawer, the page stays behind → EventDrawer.
 *   Events app (pln-events) month grid → Calendar · Month (transcribed via event-drawer-redesign).
 *   LabWeek 2023 schedule (23.labweek.io/schedule) → Calendar · Schedule: a strip of days, one
 *                          day at a time, times in the event's local zone.
 *   Filters: the directory's left rail (Teams / Members): DashboardPagesLayout +
 *                          FiltersSidePanel + FilterSection + GenericCheckboxList /
 *                          GenericFilterToggle, holding the events app's own filters in full.
 *                          Phones: MobileFilterWrapper's Filters pill + sheet.
 *
 * Nov 16 design standup (Anuj, Polina), applied 2026-11-17:
 *   1. The rail is closed by default (desktop). The door is a "Filters" button in the results
 *      toolbar, always visible, with the applied count; while the rail is closed every applied
 *      filter shows as a removable chip under the toolbar, so filtering is never invisible (the
 *      events app's collapsed rail failed because its closed state said nothing). Open, it is the
 *      same FiltersSidePanel as Teams / Members, with "Hide" in its header. `?filters=open`.
 *   2. "Gatherings" is gone. The top band is "Browse by city": the main cities (most upcoming
 *      events first). A city scopes the page: a city header (back to all cities, name, count,
 *      dates, local time zone) replaces the band, and every view shows that city only. The rail's
 *      City filter is the same selection (`?city=Lisbon` lands scoped).
 *   3. Landing: `?event=<uid>` opens that event's drawer and marks its tile / row / bar /
 *      block in whichever view, scrolled into view; the calendar opens on its month / day.
 *      Opening any event writes `?event=` so the address is shareable. A plain landing leads
 *      with "Near <city>": the next events where the member lives (mock profile location,
 *      `?location=none` for a member without one: the slot asks for a location instead, with
 *      Add location → the profile editor; a review-band switch flips the two).
 *   4. Views: List (default) · Calendar · Map. Tiles was dropped 2026-11-18 (same events, same order, same facts as List).
 *   5. Calendar has two modes, Month (the events app's grid) and Schedule (LabWeek day).
 *   6. Contrast pass: meta text is secondary ink (#455468, 7.9:1), never tertiary (3:1).
 *
 * Imported, not forked:
 *   EventDrawer ............ event-drawer-redesign (do not edit there; imported only).
 *   Month grid classes ..... event-drawer-redesign/EventsCalendarPage.module.scss.
 *   Events + details + thumbs  event-drawer-redesign/mocks (one list).
 *   Going store ............ member-events-going/goingStore ('owner').
 *   DS: Button, Badge; icons; getDefaultAvatar facepile; FilterCount (the rail's own badge).
 *   Nav: PrototypeNavBar / PrototypeMobileNav; FollowToast for the "you're going" toast.
 *
 * Replaces on /events/all: the "Event Calendar" header with two ShadowButtons over an iframe
 * of the events app. Everything here is mocked.
 */

import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import btn from '@/components/common/Button/Button.module.scss';
import { getSubmitEventUrl } from '@/utils/irl-submit-url';
import { MobileFilterWrapper } from '@/components/common/filters/MobileFilterWrapper';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import FilterCount from '@/components/ui/filter-count';
import { ArrowBackIcon, ArrowUpRightIcon, CheckIcon, CloseIcon, GlobeIcon } from '@/components/icons';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import { useHeaderSearch } from '../home-ai-ask/useHeaderSearch';
import { FollowToast } from '../follow-shared/FollowToast';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';
import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';
import home from '../home-v2/HomeV2Prototype.module.scss';
import feed from '../newsfeed/Newsfeed.module.scss';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import { useGoing } from '../member-events-going/goingStore';
import { ATTENDEES } from '../member-events-going/mocks';
import going_s from '../member-events-going/MemberEventsGoing.module.scss';
import { EventDrawer, type EventNotice } from '../event-drawer-redesign/EventDrawer';
import { AccessIcon, ACCESS_FACT } from '../event-drawer-redesign/AccessIcon';
import { EventImage } from '../events-shared/EventImage';
import { GoingTag } from '../events-shared/GoingTag';
import { startTime, venueOf } from '../event-drawer-redesign/format';

import {
  CAL_EVENTS,
  DETAILS,
  FACETS,
  MAIN_CITY_COUNT,
  MEMBER_LOCATION,
  at,
  dayHeading,
  dayOfSpan,
  eventByUid,
  isUpcoming,
  iso,
  listDay,
  matchesFilters,
  matchesQuery,
  spanLabel,
  upcomingCities,
  zoneOf,
  type CalEvent,
  type CitySummary,
  type EventFilters,
} from './mocks';
import { EventsCalendar, type CalMode } from './EventsCalendar';
import { EventsFilterView } from './EventsFilterView';
import { EmbedModal } from './EmbedModal';
import bannerStyles from '@/prototypes/components/PrototypeBanner/PrototypeBanner.module.scss';
import { CITY_COORDS, EventsMap } from './EventsMap';
import {
  COUNTED_PARAMS,
  countAppliedFilters,
  decodeMulti,
  encodeMulti,
  useEventsFilterStore,
} from './eventsFilterStore';
import s from './EventsPageRedesignPrototype.module.scss';

/* Three views (2026-11-18): Tiles was dropped. It showed the same events in the same order with
   the same facts as List, only with a bigger picture; List also answers "when" with its date column.
   The tile card lives on where pictures help browsing: Near you. */
type View = 'list' | 'calendar' | 'map';

const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: 'list', label: 'List' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'map', label: 'Map' },
];

/* Production's own builder: through the events portal's LabOS sign-in, so a signed-in member isn't
   asked to log in again. IRL_SUBMIT_FORM_URL isn't readable client-side, so its value is passed in. */
const SUBMIT_HREF = getSubmitEventUrl('https://irl.os.pl.xyz/events');
const EVENTS_APP_HREF = 'https://events.plnetwork.io/calendar';

type OpenOn = 'event' | 'attendees';
type OpenEvent = (uid: string, from: CalEvent[], on?: OpenOn) => void;

export default function EventsPageRedesignPrototype() {
  const [today, setToday] = useState<Date | null>(null);
  // Desktop and tablet-landscape open the calendar on Month; phones on Week (7 columns don't fit).
  const [wide, setWide] = useState(false);
  useEffect(() => {
    setWide(window.matchMedia('(min-width: 960px)').matches);
    setToday(new Date());
  }, []);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /** One writer for the page's own URL params (view, cal, filters, event). */
  const setUrl = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => (value === null ? params.delete(key) : params.set(key, value)));
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const viewParam = searchParams.get('view');
  // List is the default (old ?view=tiles links land on it too).
  const view: View = viewParam === 'calendar' || viewParam === 'map' ? viewParam : 'list';
  const setView = (next: View) => setUrl({ view: next === 'list' ? null : next });
  // Month is the default on desktop (2026-11-20), Week on phones; `?cal=` overrides either way.
  const calParam = searchParams.get('cal');
  const calMode: CalMode = calParam === 'month' || calParam === 'week' ? calParam : wide ? 'month' : 'week';
  const setCalMode = (next: CalMode) => setUrl({ cal: next });
  // `?embed=1`: the view alone, for an iframe on another site (the Embed button builds the link).
  const embed = searchParams.get('embed') === '1';
  const [embedOpen, setEmbedOpen] = useState(false);
  const [drawerOn, setDrawerOn] = useState<OpenOn>('event');
  const railOpen = searchParams.get('filters') === 'open';
  const setRailOpen = (open: boolean) => setUrl({ filters: open ? 'open' : null });

  // The open event lives in the URL, so a link to an event lands with its drawer open.
  const openUid = searchParams.get('event');
  const [landedUid] = useState(() => searchParams.get('event'));
  // The linked event stays marked after its drawer closes, until you open another one.
  const [touched, setTouched] = useState(false);
  const highlightUid = openUid ?? (touched ? null : landedUid);

  const locationParam = searchParams.get('location');
  const memberCity = locationParam === 'none' ? null : (locationParam ?? MEMBER_LOCATION);

  const navExtras = useHeaderSearch(true);
  const going = useGoing('owner');
  const goingUids = useMemo(() => new Set(Object.keys(going)), [going]);

  // Filters live in the rail's store (a URLSearchParams mirror, as on Teams); the page reads them.
  const { params, setParam, setAllParams, clearParams } = useEventsFilterStore();

  // A link can carry filters (`?city=Lisbon`): seed the store once on landing.
  useEffect(() => {
    const seeded = new URLSearchParams();
    COUNTED_PARAMS.forEach((key) => {
      const value = searchParams.get(key);
      if (value) seeded.set(key, value);
    });
    if (seeded.toString()) setAllParams(seeded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filters: EventFilters = useMemo(
    () => ({
      going: params.get('going') === 'true',
      featured: params.get('featured') === 'true',
      mode: decodeMulti(params.get('mode')),
      access: decodeMulti(params.get('access')),
      focus: decodeMulti(params.get('focus')),
      city: decodeMulti(params.get('city')),
      host: decodeMulti(params.get('host')),
    }),
    [params],
  );
  const query = params.get('search') ?? '';
  // One city chosen (by a tile or in the rail) scopes the page to it.
  const city = filters.city.length === 1 ? filters.city[0] : null;
  const setCity = (name: string | null) => setParam('city', name ? encodeMulti([name]) : undefined);

  const [sequence, setSequence] = useState<string[]>([]);
  const [notice, setNotice] = useState<EventNotice | null>(null);

  const todayIso = today ? iso(today) : '';

  const visible = useMemo(
    () => CAL_EVENTS.filter((e) => matchesFilters(e, filters, goingUids) && matchesQuery(e, query)),
    [filters, goingUids, query],
  );
  const upcoming = useMemo(
    () =>
      visible
        .filter((e) => isUpcoming(e, todayIso))
        .sort((a, b) => listDay(a, todayIso).localeCompare(listDay(b, todayIso))),
    [visible, todayIso],
  );

  // Arriving from a link to one event: bring its tile / row / bar into view.
  useEffect(() => {
    if (!today || !landedUid) return;
    const id = window.setTimeout(() => {
      document
        .querySelector(`[data-event-uid="${landedUid}"]`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 300);
    return () => window.clearTimeout(id);
  }, [today, landedUid]);

  // In an embed the prototype banner is the host page's business, not the embedding site's.
  useEffect(() => {
    if (!embed) return;
    const el = document.querySelector<HTMLElement>(`.${CSS.escape(bannerStyles.banner)}`);
    if (el) el.style.display = 'none';
    return () => {
      if (el) el.style.display = '';
    };
  }, [embed]);

  if (!today) return <div className={s.mountShell} />;

  const open: OpenEvent = (uid, from, on = 'event') => {
    setDrawerOn(on);
    setSequence(from.map((e) => e.uid));
    if (uid !== landedUid) setTouched(true);
    setUrl({ event: uid });
  };
  const closeDrawer = () => setUrl({ event: null });
  const onNotice = (next: EventNotice) => {
    setNotice(next);
    setTimeout(() => setNotice(null), 6000);
  };

  const filterCount = countAppliedFilters(params);
  const allUpcoming = CAL_EVENTS.filter((e) => isUpcoming(e, todayIso));
  const plans = CAL_EVENTS.filter((e) => goingUids.has(e.uid) && isUpcoming(e, todayIso));
  const cities = upcomingCities(todayIso);
  const citySummary = city ? cities.find((c) => c.city === city) : undefined;
  // The drawer steps through the list it was opened from; a link lands on the upcoming list.
  const drawerSequence = sequence.length ? sequence : upcoming.map((e) => e.uid);

  // Near you: a plain landing only (the default List view, nothing filtered), from the member's
  // profile location. Switching to Calendar / Map is a choice of view, so the band steps aside.
  const plainLanding = filterCount === 0 && view === 'list';
  const nearYou =
    memberCity && plainLanding
      ? allUpcoming.filter((e) => e.city === memberCity && DETAILS[e.uid].mode !== 'Virtual').slice(0, 3)
      : null;
  // No location on the profile: the same slot asks for one (2026-11-17), on the same plain landing.
  const askLocation = !memberCity && plainLanding;

  // The calendar opens on the linked event, else the chosen city's first event, else today.
  const landed = landedUid ? eventByUid(landedUid) : null;
  const anchorIso = landed?.startDate ?? (city && upcoming[0] ? listDay(upcoming[0], todayIso) : todayIso);

  // Calendar and Map lead with the view itself (Eventbrite, Airtable, Tripadvisor): Near you and
  // Browse by city / the city header are List-only, and a chosen city becomes a removable chip.
  const showTopBands = view === 'list';
  const chips = appliedChips(params, showTopBands ? city : null);

  // The embed link: this view and every applied filter, without the page around it.
  const embedQuery = () => {
    const p = new URLSearchParams();
    if (view !== 'list') p.set('view', view);
    if (view === 'calendar') p.set('cal', calMode);
    COUNTED_PARAMS.forEach((key) => {
      const value = params.get(key);
      if (value) p.set(key, value);
    });
    return p;
  };
  const pageHref = () => {
    const q = embedQuery().toString();
    return `${window.location.origin}${pathname}${q ? `?${q}` : ''}`;
  };
  const embedSrc = () => {
    const p = embedQuery();
    p.set('embed', '1');
    return `${window.location.origin}${pathname}?${p.toString()}`;
  };
  const viewLabel = VIEW_OPTIONS.find((o) => o.value === view)!.label;
  const embedFilters = appliedChips(params, null).map((c) => c.label);
  const embedScope = [
    view === 'calendar' ? `${calMode === 'month' ? 'Month' : 'Week'} calendar` : `${viewLabel} view`,
    ...embedFilters,
  ];
  const embedScopeLine =
    embedScope.length > 1 ? `${embedScope.join(' · ')}` : `${embedScope[0]} · All upcoming events`;

  const drawer = (
    <EventDrawer
      eventUid={openUid}
      sequence={drawerSequence}
      onNavigate={(uid) => setUrl({ event: uid })}
      onClose={closeDrawer}
      onNotice={onNotice}
      openOn={drawerOn}
    />
  );

  const viewBody =
    view === 'list' ? (
      <ListView
        events={upcoming}
        todayIso={todayIso}
        goingUids={goingUids}
        highlightUid={highlightUid}
        onOpen={open}
        onClear={clearParams}
      />
    ) : view === 'map' ? (
      <EventsMap events={upcoming} goingUids={goingUids} onOpen={open} highlightUid={highlightUid} />
    ) : (
      <EventsCalendar
        key={`${anchorIso}:${city ?? ''}`}
        events={visible}
        todayIso={todayIso}
        anchorIso={anchorIso}
        mode={calMode}
        onModeChange={setCalMode}
        goingUids={goingUids}
        highlightUid={highlightUid}
        city={city}
        onOpen={open}
      />
    );

  if (embed) {
    return (
      <div className={s.embed}>
        {viewBody}
        <a href={pageHref()} target="_blank" rel="noreferrer" className={clsx(s.textLink, s.embedFoot)}>
          All events on PL Directory <ArrowUpRightIcon width={14} height={14} />
        </a>
        {drawer}
      </div>
    );
  }
  const removeChip = (chip: Chip) => {
    if (chip.value === undefined) setParam(chip.key, undefined);
    else {
      const rest = decodeMulti(params.get(chip.key)).filter((v) => v !== chip.value);
      setParam(chip.key, rest.length ? encodeMulti(rest) : undefined);
    }
  };

  // List view's own top: a city header when scoped, else Near you / Add location and Browse by
  // city, then a heading that hands over to the dated list (it now sits under the bands, not the toolbar).
  const hasDiscovery = !!nearYou || askLocation || cities.length > 0;
  const listBands = !showTopBands ? null : city ? (
    <div className={s.listBands}>
      <CityHeader city={city} summary={citySummary} events={upcoming} onBack={() => setCity(null)} />
    </div>
  ) : hasDiscovery ? (
    <div className={s.listBands}>
      {nearYou && (
        <NearYou
          city={memberCity!}
          events={nearYou}
          todayIso={todayIso}
          goingUids={goingUids}
          onOpen={open}
          onSeeAll={() => setCity(memberCity)}
        />
      )}
      {askLocation && <AddLocation />}
      {cities.length > 0 && <CityBand cities={cities} selected={filters.city} onPick={setCity} />}
      <h3 className={clsx(s.sectionTitle, s.listHeading)}>{filterCount ? 'Matching events' : 'All upcoming'}</h3>
    </div>
  ) : null;

  const content = (
    <div className={s.page}>
      <div className={s.container}>
        <header className={s.header}>
          <div className={s.headerText}>
            <h1 className={s.title}>Events</h1>
            <p className={s.lede}>Meetups, conferences and office hours across the Protocol Labs network.</p>
          </div>
          <div className={s.headerActions}>
            <a href={EVENTS_APP_HREF} target="_blank" rel="noreferrer" className={s.textLink}>
              Open PL Events <ArrowUpRightIcon width={14} height={14} />
            </a>
            {/* The DS Button's classes on the link itself (a <button> inside an <a> is two controls),
              with Submit a Deal's bare plus, not PlusIcon's circled one (2026-11-17). */}
            <a
              href={SUBMIT_HREF}
              target="_blank"
              rel="noreferrer"
              className={clsx(btn.root, btn.small, btn.border, btn.neutral, s.btn)}
            >
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path d="M9 3.75V14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M3.75 9H14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Submit an event
            </a>
          </div>
        </header>

        {/* The toolbar sits right under the header (2026-11-20): the city bands below it belong to
            List view, so switching views changes only what is under the switch and the switch never
            moves under the pointer (it used to sit below the bands and jump ~490px up). */}
        <div className={s.toolbar}>
          <div className={s.toolbarStart}>
            <h2 className={s.toolbarTitle}>{city ? `Coming up in ${city}` : 'Coming up'}</h2>
            <span className={s.toolbarCount}>
              {upcoming.length} {upcoming.length === 1 ? 'event' : 'events'}
            </span>
          </div>
          <div className={s.toolbarEnd}>
            {/* The rail's door. Desktop only: phones have MobileFilterWrapper's pill below. */}
            <button
              type="button"
              className={clsx(s.filtersBtn, railOpen && s.filtersBtnOpen)}
              aria-pressed={railOpen}
              aria-controls="events-filters"
              onClick={() => setRailOpen(!railOpen)}
            >
              <SlidersIcon />
              Filters
              {filterCount > 0 && <FilterCount count={filterCount} />}
            </button>
            <div className={s.viewSwitch} role="tablist" aria-label="View">
              {VIEW_OPTIONS.map(({ value: v, label }) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={view === v}
                  className={clsx(s.viewBtn, view === v && s.viewBtnActive)}
                  onClick={() => setView(v)}
                >
                  <ViewIcon view={v} />
                  {label}
                </button>
              ))}
            </div>
            {/* Embeds what you're looking at: this view with these filters (Luma's calendar embed). */}
            <button type="button" className={s.filtersBtn} onClick={() => setEmbedOpen(true)}>
              <EmbedGlyph />
              Embed
            </button>
          </div>
        </div>

        {/* Phones and tablets: the directory's "Filters" pill and bottom sheet (the wrapper hides
              itself at 1024px and up). Its right-hand menu is the view switch. */}
        <div className={s.mobileFilters}>
          {/* display: contents, so the bar stays sticky to the page; only its ground is overridden. */}
          <div className={s.mobileBar}>
            <MobileFilterWrapper
              filterCount={filterCount}
              currentSort={view}
              sortOptions={VIEW_OPTIONS}
              sortByLabel="View:"
              onSortChange={(v) => setView(v as View)}
              onClearFilters={clearParams}
              renderFilter={(onClose) => (
                <EventsFilterView events={allUpcoming} goingCount={plans.length} onClose={onClose} />
              )}
            />
          </div>
        </div>

        {chips.length > 0 && (
          <div className={clsx(s.chips, railOpen && s.chipsRailOpen)} aria-label="Applied filters">
            {chips.map((chip) => (
              <button
                key={`${chip.key}:${chip.value ?? ''}`}
                type="button"
                className={s.chip}
                onClick={() => removeChip(chip)}
                aria-label={`Remove filter ${chip.label}`}
              >
                {chip.label}
                <CloseIcon width={12} height={12} className={s.chipX} />
              </button>
            ))}
            <button type="button" className={s.clear} onClick={clearParams}>
              Clear all
            </button>
          </div>
        )}

        <div className={s.layout}>
          <div className={s.main}>
            {listBands}
            {viewBody}
          </div>
          {/* The Your plans rail was removed 2026-11-17; your events are the Going filter and your profile. */}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <PrototypeNavBar hasUnreadNews={false} active isLoggedIn onSignIn={() => {}} onSignUp={() => {}} {...navExtras} />
      <PrototypeMobileNav hasUnreadNews={false} active />

      {/* Review band (event-drawer-redesign's): the member's profile location, set or not. */}
      <div className={feed.reviewBand}>
        <div className={feed.reviewRow}>
          <div className={v0.switchBar}>
            <span className={v0.switchLabel}>Location</span>
            <div className={clsx(v0.switch, home.reviewSwitch)} role="tablist" aria-label="Location">
              {[
                { value: 'set', label: `Set (${MEMBER_LOCATION})` },
                { value: 'none', label: 'Not set' },
              ].map((o) => {
                const active = (o.value === 'none') === !memberCity;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={clsx(v0.switchBtn, active && v0.switchBtnActive)}
                    onClick={() => setUrl({ location: o.value === 'none' ? 'none' : null })}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
            <span className={clsx(v0.switchNote, feed.reviewNote)}>
              {memberCity
                ? `Near you shows the next events in ${memberCity}.`
                : 'No location on the profile: the Near you slot asks for one.'}
            </span>
          </div>
        </div>
      </div>

      {/* The directory's page frame. The rail is empty (so the frame hides it) until opened. */}
      <main className={s.shell}>
        <DashboardPagesLayout
          filters={
            railOpen ? (
              <div id="events-filters" className={s.railWrap}>
                <EventsFilterView events={allUpcoming} goingCount={plans.length} onHide={() => setRailOpen(false)} />
              </div>
            ) : null
          }
          content={content}
        />
      </main>

      {drawer}

      {embedOpen && (
        <EmbedModal isOpen onClose={() => setEmbedOpen(false)} src={embedSrc()} scope={embedScopeLine} filterLabels={embedFilters} />
      )}

      {notice && (
        <FollowToast>
          {notice.onProfile ? (
            <>
              <strong>{notice.eventName}</strong> is on your profile.{' '}
              <Link href="/prototypes/member-events-going" className={going_s.toastLink}>
                View profile
              </Link>
            </>
          ) : (
            <>
              You&apos;re going to <strong>{notice.eventName}</strong>.
            </>
          )}
        </FollowToast>
      )}
    </>
  );
}

/* ---------- Applied-filter chips ---------- */

interface Chip {
  key: string;
  /** The single value a chip removes from a multi-value filter; undefined removes the whole param. */
  value?: string;
  label: string;
}

/** Every applied filter as a chip. The city is left out when the city header already says it. */
function appliedChips(params: URLSearchParams, scopedCity: string | null): Chip[] {
  const chips: Chip[] = [];
  const search = params.get('search');
  if (search) chips.push({ key: 'search', label: `“${search}”` });
  if (params.get('going') === 'true') chips.push({ key: 'going', label: "Events I'm going to" });
  if (params.get('featured') === 'true') chips.push({ key: 'featured', label: 'Featured' });
  FACETS.forEach(({ key }) => {
    if (key === 'city' && scopedCity) return;
    decodeMulti(params.get(key)).forEach((value) => chips.push({ key, value, label: value }));
  });
  return chips;
}

/* ---------- Cities ---------- */

/** A map tile around the city (OpenStreetMap, the Map view's own tiles), for the city tile. */
function cityTile(city: string) {
  const coords = CITY_COORDS[city];
  if (!coords) return null;
  const [lat, lng] = coords;
  const z = 10;
  const n = 2 ** z;
  const r = (lat * Math.PI) / 180;
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n);
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
}

function CityBand({
  cities,
  selected,
  onPick,
}: {
  cities: CitySummary[];
  selected: string[];
  onPick: (city: string) => void;
}) {
  // The main cities first; past five, the header opens the rest in place (one press, the page
  // stays put). The rail's City filter is the other way to the full list.
  const [showAll, setShowAll] = useState(false);
  const more = cities.length > MAIN_CITY_COUNT;
  const shown = showAll ? cities : cities.slice(0, MAIN_CITY_COUNT);
  return (
    <section className={s.section} aria-labelledby="cities-title">
      <div className={s.sectionHead}>
        <h2 id="cities-title" className={s.sectionTitle}>
          Browse by city
        </h2>
        {more && (
          <button type="button" className={s.sectionLink} aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Show fewer' : `All ${cities.length} cities`}
          </button>
        )}
      </div>
      <div className={s.cityRow}>
        {shown.map(({ city, eventCount }) => {
          const tile = cityTile(city);
          const active = selected.includes(city);
          return (
            <button
              key={city}
              type="button"
              aria-pressed={active}
              className={clsx(s.cityCard, active && s.cityCardActive)}
              onClick={() => onPick(city)}
            >
              <span className={s.cityThumb} aria-hidden>
                {tile && <img src={tile} alt="" width={48} height={48} />}
              </span>
              <span className={s.cityText}>
                <span className={s.cityName}>{city}</span>
                <span className={s.cityMeta}>
                  {eventCount} {eventCount === 1 ? 'event' : 'events'}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** What a city click turns the top of the page into: where you are, and the way back. */
function CityHeader({
  city,
  summary,
  events,
  onBack,
}: {
  city: string;
  summary?: CitySummary;
  events: CalEvent[];
  onBack: () => void;
}) {
  const tile = cityTile(city);
  const zone = summary?.zone ?? (events[0] ? zoneOf(DETAILS[events[0].uid]) : '');
  const first = events[0]?.startDate;
  const last = events.reduce((m, e) => (e.endDate > m ? e.endDate : m), first ?? '');
  return (
    <section className={s.cityHeader} aria-labelledby="city-title">
      <button type="button" className={s.back} onClick={onBack}>
        <ArrowBackIcon width={16} height={16} />
        All cities
      </button>
      <div className={s.cityHeaderRow}>
        <span className={clsx(s.cityThumb, s.cityThumbLarge)} aria-hidden>
          {tile && <img src={tile} alt="" width={64} height={64} />}
        </span>
        <div>
          <h2 id="city-title" className={s.cityHeaderTitle}>
            {city}
          </h2>
          <p className={s.cityHeaderMeta}>
            {events.length} upcoming {events.length === 1 ? 'event' : 'events'}
            {first && ` · ${spanLabel(first, last)}`}
            {zone && ` · Times in ${city} time (${zone})`}
          </p>
        </div>
      </div>
    </section>
  );
}

function NearYou({
  city,
  events,
  todayIso,
  goingUids,
  onOpen,
  onSeeAll,
}: {
  city: string;
  events: CalEvent[];
  todayIso: string;
  goingUids: Set<string>;
  onOpen: OpenEvent;
  onSeeAll: () => void;
}) {
  return (
    <section className={s.section} aria-labelledby="near-title">
      <div className={s.sectionHead}>
        <h2 id="near-title" className={s.sectionTitle}>
          Near you in {city}
        </h2>
        {events.length > 0 && (
          <button type="button" className={s.sectionLink} onClick={onSeeAll}>
            All {city} events
          </button>
        )}
      </div>
      {events.length ? (
        <div className={clsx(s.tiles, s.nearTiles)}>
          {events.map((e) => (
            <EventTile
              key={e.uid}
              event={e}
              todayIso={todayIso}
              going={goingUids.has(e.uid)}
              highlighted={false}
              onOpen={() => onOpen(e.uid, events)}
              onOpenPeople={() => onOpen(e.uid, events, 'attendees')}
            />
          ))}
        </div>
      ) : (
        <p className={s.sectionEmpty}>Nothing coming up in {city} yet.</p>
      )}
    </section>
  );
}

/**
 * No location on the profile: one line where Near you would be, asking for the field the profile
 * already has (Location, whose own hint is about "PL events happening in your area"), not a new
 * setting. The button opens the profile editor; Browse by city below still works without it.
 */
function AddLocation() {
  return (
    <section className={clsx(s.section, s.askLocation)} aria-label="Events near you">
      <span className={s.askLocationIcon} aria-hidden>
        <PinIcon />
      </span>
      <p className={s.askLocationText}>
        <strong>See events near you.</strong> Add your location to your profile and we&apos;ll show what&apos;s coming
        up where you are.
      </p>
      <Link
        href="/prototypes/member-profile-edit"
        className={clsx(btn.root, btn.small, btn.border, btn.neutral, s.btn, s.askLocationBtn)}
      >
        Add location
      </Link>
    </section>
  );
}

/* ---------- Event tile (Near you) ---------- */

/** "Thu, Nov 19 · 6:00 PM"; a multi-day event reads its span ("Tue, Dec 1 – 5"). */
function whenLine(event: CalEvent, todayIso: string) {
  const detail = DETAILS[event.uid];
  const day = (d: string) => at(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  if (event.startDate !== event.endDate) {
    if (event.startDate < todayIso) return `Today · ${dayOfSpan(event, todayIso)}`;
    return `${day(event.startDate).split(',')[0]}, ${spanLabel(event.startDate, event.endDate)}`;
  }
  return [event.startDate === todayIso ? 'Today' : day(event.startDate), startTime(detail)].filter(Boolean).join(' · ');
}

function EventTile({
  event,
  todayIso,
  going,
  highlighted,
  onOpen,
  onOpenPeople,
}: {
  event: CalEvent;
  todayIso: string;
  going: boolean;
  highlighted: boolean;
  onOpen: () => void;
  onOpenPeople: () => void;
}) {
  const detail = DETAILS[event.uid];
  const { venue } = venueOf(detail);
  const online = detail.mode === 'Virtual';

  return (
    <button
      type="button"
      data-event-uid={event.uid}
      className={clsx(s.tile, highlighted && s.highlight)}
      onClick={onOpen}
    >
      <span className={s.tileImage}>
        <EventImage uid={event.uid} wide className={s.tileFill} />
        {going && <GoingTag onImage />}
      </span>
      <span className={s.tileBody}>
        <span className={s.tileWhen}>{whenLine(event, todayIso)}</span>
        <span className={s.tileTitle}>{event.name}</span>
        <span className={s.tileMeta}>
          {online ? <GlobeIcon width={14} height={14} className={s.pin} /> : <PinIcon />}
          <span className={s.ellipsis}>{placeText(event, venue)}</span>
        </span>
        <EventFoot event={event} going={false} onOpenPeople={onOpenPeople} />
      </span>
    </button>
  );
}

/** Where, with the mode folded in: "Online" (globe, no platform name) or "Hybrid · venue, city" (2026-11-18). */
function placeText(event: CalEvent, venue: string) {
  const mode = DETAILS[event.uid].mode;
  if (mode === 'Virtual') return 'Online';
  return mode === 'Hybrid' ? `Hybrid · ${venue}, ${event.city}` : `${venue}, ${event.city}`;
}

/**
 * Going badge or facepile + count, then how you get in when it isn't the usual free RSVP.
 * 2026-11-17: the mode and access Badges are gone. Mode moved into the place line; access is
 * a glyph + word in the meta ink (Eventbrite's "Free", Luma's "Approval required"), because a
 * grey chip read as a tag, the same lineage as the topic tags.
 */
function EventFoot({
  event,
  going,
  onOpenPeople,
}: {
  event: CalEvent;
  going: boolean;
  /** Facepile + "N going" open the drawer on who's going (2026-11-20, Luma's "N Going"). */
  onOpenPeople: () => void;
}) {
  const detail = DETAILS[event.uid];
  const seed = (event.attendeeCount * 3) % 40;
  // The card is itself a button, so this is a role="button" span rather than a nested <button>.
  const press = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onOpenPeople();
  };
  return (
    <span className={s.cardFoot}>
      {going && <GoingTag />}
      <span
        role="button"
        tabIndex={0}
        className={s.goingLink}
        aria-label={`See who's going: ${event.attendeeCount} people`}
        onClick={press}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') press(e);
        }}
      >
        <span className={s.facepile} aria-hidden>
          {ATTENDEES.slice(seed, seed + 3).map((a) => (
            <img key={a.uid} src={getDefaultAvatar(a.name)} alt="" width={20} height={20} />
          ))}
        </span>
        <span className={s.cardCount}>{event.attendeeCount} going</span>
      </span>
      {detail.access !== 'FREE w/ RSVP' && (
        <span className={s.cardAccess}>
          <span aria-hidden>·</span>
          <AccessIcon access={detail.access} size={14} />
          {ACCESS_FACT[detail.access].main}
        </span>
      )}
    </span>
  );
}

function Empty({ onClear }: { onClear: () => void }) {
  return (
    <div className={s.empty}>
      <p className={s.emptyTitle}>No upcoming events match</p>
      <p className={s.emptyText}>Try another search or filter, or see everything coming up.</p>
      <Button style="border" variant="neutral" size="s" onClick={onClear}>
        Show all events
      </Button>
    </div>
  );
}

/* ---------- List ---------- */

function ListView({
  events,
  todayIso,
  goingUids,
  highlightUid,
  onOpen,
  onClear,
}: {
  events: CalEvent[];
  todayIso: string;
  goingUids: Set<string>;
  highlightUid: string | null;
  onOpen: OpenEvent;
  onClear: () => void;
}) {
  if (!events.length) return <Empty onClear={onClear} />;

  const days = events.reduce<{ day: string; events: CalEvent[] }[]>((acc, e) => {
    const day = listDay(e, todayIso);
    const last = acc[acc.length - 1];
    if (last?.day === day) last.events.push(e);
    else acc.push({ day, events: [e] });
    return acc;
  }, []);

  return (
    <ol className={s.timeline}>
      {days.map(({ day, events: dayEvents }) => {
        const { label, weekday } = dayHeading(day, todayIso);
        return (
          <li key={day} className={s.day}>
            {/* Luma's date column: the day over its weekday, held in view while its events scroll. */}
            <h3 className={s.dayHeading}>
              {label}
              <span className={s.dayWeekday}>{weekday}</span>
            </h3>
            <ul className={s.dayEvents}>
              {dayEvents.map((e) => (
                <li key={e.uid}>
                  <EventCard
                    event={e}
                    day={day}
                    going={goingUids.has(e.uid)}
                    highlighted={e.uid === highlightUid}
                    onOpen={() => onOpen(e.uid, events)}
                    onOpenPeople={() => onOpen(e.uid, events, 'attendees')}
                  />
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}

function EventCard({
  event,
  day,
  going,
  highlighted,
  onOpen,
  onOpenPeople,
}: {
  event: CalEvent;
  day: string;
  going: boolean;
  highlighted: boolean;
  onOpen: () => void;
  onOpenPeople: () => void;
}) {
  const detail = DETAILS[event.uid];
  const { venue } = venueOf(detail);
  const span = dayOfSpan(event, day);
  const zone = zoneOf(detail);
  const when = [[startTime(detail), zone].filter(Boolean).join(' '), span].filter(Boolean).join(' · ');
  const online = detail.mode === 'Virtual';

  return (
    <button
      type="button"
      data-event-uid={event.uid}
      className={clsx(s.card, highlighted && s.highlight)}
      onClick={onOpen}
    >
      <span className={s.cardBody}>
        <span className={s.cardWhen}>{when}</span>
        <span className={s.cardTitle}>{event.name}</span>
        <span className={s.cardMeta}>
          <span className={s.hostFaces} aria-hidden>
            {detail.hosts.slice(0, 2).map((h) => (
              <img key={h} src={getDefaultAvatar(h)} alt="" width={16} height={16} />
            ))}
          </span>
          By {detail.hosts.join(' & ')}
        </span>
        <span className={s.cardMeta}>
          {online ? <GlobeIcon width={14} height={14} className={s.pin} /> : <PinIcon />}
          {placeText(event, venue)}
        </span>
        <EventFoot event={event} going={going} onOpenPeople={onOpenPeople} />
      </span>
      <EventImage uid={event.uid} className={s.thumb} />
    </button>
  );
}

/* ---------- Small parts ---------- */

/** "</>" at the toolbar set's size and weight (16px, 1.5px stroke), like ViewIcon and the Filters mark. */
function EmbedGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5M9 3l-2 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className={s.pin}>
      <path
        d="M8 14s4.5-4.1 4.5-7.5a4.5 4.5 0 1 0-9 0C3.5 9.9 8 14 8 14Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

/**
 * The view switch's glyphs (2026-11-18): drawn at the Filters mark's size and weight (16px, 1.5px
 * stroke) so the toolbar's icons read as one set; the DS CalendarIcon is a filled, heavier glyph.
 */
function ViewIcon({ view }: { view: View }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className={s.viewIcon}>
      <g
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        {view === 'list' && (
          <>
            <path d="M6 4h7.5M6 8h7.5M6 12h7.5" />
            <path d="M2.75 4h.01M2.75 8h.01M2.75 12h.01" strokeWidth="2" />
          </>
        )}
        {view === 'calendar' && (
          <>
            <rect x="2" y="3" width="12" height="11" rx="2" />
            <path d="M2 6.75h12M5.5 1.75v2.5M10.5 1.75v2.5" />
          </>
        )}
        {view === 'map' && (
          <>
            <path d="M2 4.25l4-1.5 4 1.5 4-1.5v9l-4 1.5-4-1.5-4 1.5z" />
            <path d="M6 2.75v9M10 4.25v9" />
          </>
        )}
      </g>
    </svg>
  );
}

/** A stroked sliders mark for the Filters door (1.5px, as the navbar's glyphs). */
function SlidersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke">
        <path d="M2.5 4.5h6M11.5 4.5h2M2.5 11.5h2M7.5 11.5h6" />
        <circle cx="10" cy="4.5" r="1.5" />
        <circle cx="6" cy="11.5" r="1.5" />
      </g>
    </svg>
  );
}
