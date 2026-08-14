'use client';

/**
 * Tab 3 — /members. Still the members directory: same shell, same cards, and
 * the *same filter rail* as dev.
 *
 * Every filter section production ships is here — Search, Office Hours +
 * Topics, Roles, Portfolio, Investors (type / check size / focus) — rendered by
 * the real components, driven by a mock store (see mockFilterStore.ts).
 *
 * The calendar's entire contribution to this page is one more FilterSection.
 * Nothing else changes: no new view mode, no new toolbar control. "Overlapping
 * with me" is a `GenericFilterToggle` inside that section, exactly like "Show
 * all members with office hours" — a filter belongs in the filter rail, and the
 * pattern for a boolean filter already exists.
 */

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import type { IMember } from '@/types/members.types';

import MemberGridView from '@/components/page/members/member-grid-view';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { GenericCheckboxList } from '@/components/common/filters/GenericCheckboxList';
import { GenericFilterToggle } from '@/components/common/filters/GenericFilterToggle';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { FilterCheckSizeInput } from '@/components/page/members/MembersFilter/FilterCheckSizeInput';
import { FilterDivider } from '@/components/page/members/MembersFilter/FilterDivider';
import { CalendarIcon as PlCalendarIcon, InfoCircleIcon } from '@/components/icons';

import shell from '@/app/members/(members-page)/@content/page.module.scss';
import grid from '@/components/page/members/MemberInfiniteList/MemberInfiniteList.module.scss';

import type { PersonCityMember, Trip } from './mocks';
import {
  addDays,
  buildPresenceIndex,
  dateToKey,
  eachDay,
  findOverlaps,
  keyToDate,
  presenceOn,
  type DateKey,
} from './presence';
import { MemberCardStatic } from './MemberCardStatic';
import { LocationFilter, type When } from './LocationFilter';
import { useMockFilterStore, useAppliedFilterCount, staticOptions, clearParams, setParam } from './mockFilterStore';
import { PlaneIcon } from './icons';
import s from './Screens.module.scss';

const SORT_OPTIONS = [
  { value: 'asc', label: 'A-Z (Ascending)' },
  { value: 'desc', label: 'Z-A (Descending)' },
  { value: 'soonest', label: 'Arriving soonest' },
];

const TOPICS = ['AI', 'Staking', 'Product', 'Cryptography', 'Fundraising', 'DevRel'].map((t) => ({
  value: t,
  label: t,
}));
const ROLES = ['Founder', 'Engineer', 'Investor', 'Designer', 'Researcher', 'Community'].map((r) => ({
  value: r,
  label: r,
}));
const INVESTOR_TYPES = [
  { value: 'angel', label: 'Angel' },
  { value: 'fund', label: 'Fund' },
];

interface MembersTabProps {
  me: PersonCityMember;
  people: PersonCityMember[];
  trips: Trip[];
  todayKey: string;
  /** hands off to the profile's Location field with the picker open */
  onAddDates: () => void;
}

export function MembersTab({ me, people, trips, todayKey, onAddDates }: MembersTabProps) {
  const [sort, setSort] = useState('asc');
  const [range, setRange] = useState<[Date, Date] | null>(null);
  const [search, setSearch] = useState('');

  const { params } = useMockFilterStore();
  const cities = (params.get('city') ?? '').split(/[|,]/).filter(Boolean);
  // "Who's there" now lives in the store like every other facet, so it counts in
  // the applied-filters badge and clears with Clear All for free. Nothing is
  // ticked by default: an empty selection means "match declared home cities",
  // which is what /members does today.
  const when = (params.get('presence') ?? '').split(/[|,]/).filter(Boolean) as When[];
  const matchHome = when.length === 0 || when.includes('home');
  const overlapLens = params.get('overlappingWithMe') === 'true';
  const appliedCount = useAppliedFilterCount();

  /** Union of the days every ticked window resolves to. Empty for home-only. */
  const window: DateKey[] = useMemo(() => {
    const days = new Set<DateKey>();
    if (when.includes('now')) days.add(todayKey);
    if (when.includes('month')) eachDay(todayKey, addDays(todayKey, 29)).forEach((day) => days.add(day));
    if (when.includes('custom') && range) {
      eachDay(dateToKey(range[0]), dateToKey(range[1])).forEach((day) => days.add(day));
    }
    return [...days].sort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [when.join('|'), range, todayKey]);

  const overlapWindow = useMemo(() => eachDay(todayKey, addDays(todayKey, 119)), [todayKey]);

  const overlapsByMember = useMemo(() => {
    const index = buildPresenceIndex(people, trips, overlapWindow);
    const found = findOverlaps(me.id, people, index, overlapWindow).filter((o) => o.travelInvolved);
    const map = new Map<string, (typeof found)[number]>();
    found.forEach((overlap) => {
      if (!map.has(overlap.memberId)) map.set(overlap.memberId, overlap);
    });
    return map;
  }, [people, trips, overlapWindow, me.id]);

  const rows = useMemo(() => {
    // The lens ignores city/when — "wherever we both happen to be" is a
    // different question, not a narrower one.
    if (overlapLens) {
      return people
        .filter((person) => overlapsByMember.has(person.id))
        .map((person) => {
          const overlap = overlapsByMember.get(person.id)!;
          return { person, presence: presenceOn(person, trips, overlap.startDate), overlap };
        });
    }

    // A person matches if *any* ticked window puts them in a selected city.
    const matches = people.filter((person) => {
      if (cities.length === 0) return true;
      if (matchHome && cities.includes(person.home.city)) return true;
      return window.some((day) => cities.includes(presenceOn(person, trips, day).city));
    });

    return matches.map((person) => {
      // Show the presence that *caused* the match, not today's. Filtering for
      // "Berlin in the next 30 days" and then labelling the card "Paris" —
      // because that's where they are this morning — reads as a broken filter.
      const matchDay =
        cities.length > 0 ? window.find((day) => cities.includes(presenceOn(person, trips, day).city)) : undefined;
      // Falling back to today, never to window[0]: someone matched on their home
      // city who happens to be away right now still shows the travel badge,
      // because that is where they actually are.
      return {
        person,
        presence: presenceOn(person, trips, matchDay ?? todayKey),
        overlap: undefined,
      };
    });
  }, [overlapLens, overlapsByMember, people, trips, cities, matchHome, window, todayKey]);

  const sorted = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const copy = needle
      ? rows.filter(
          (row) => row.person.name.toLowerCase().includes(needle) || row.person.teamName.toLowerCase().includes(needle),
        )
      : [...rows];
    if (sort === 'desc') return copy.sort((a, b) => b.person.name.localeCompare(a.person.name));
    if (sort === 'soonest') {
      return copy.sort((a, b) => {
        const aStart = a.overlap?.startDate ?? a.presence.trip?.startDate ?? '9999';
        const bStart = b.overlap?.startDate ?? b.presence.trip?.startDate ?? '9999';
        return aStart.localeCompare(bStart);
      });
    }
    return copy.sort((a, b) => a.person.name.localeCompare(b.person.name));
  }, [rows, sort, search]);

  // Only with one city named (so the copy can say it), off the overlap lens, and
  // only if you aren't already in the result set — prompting someone who has
  // already added the city is noise.
  const promptCity =
    cities.length === 1 && !overlapLens && !sorted.some((row) => row.person.id === me.id) ? cities[0] : null;

  return (
    <div className={shell.members}>
      <aside className={clsx(shell.members__left, shell.members__left__filterweb)}>
        {/* Production side panel — header count, Clear All, sticky footer. */}
        <FiltersSidePanel
          appliedFiltersCount={appliedCount}
          clearParams={() => {
            clearParams();
            setRange(null);
          }}
          hideFooter
        >
          <FilterSection>
            <span className={s.whenLabel}>Search for a member</span>
            <SearchInput placeholder="E.g. John Smith" value={search} onChange={setSearch} />
          </FilterSection>

          <FilterSection
            title="Office Hours"
            titleIcon={<PlCalendarIcon color="#1B4DFF" />}
            description="OH are short 1:1 calls to connect about topics of interest or help others with your expertise."
          >
            <GenericFilterToggle
              label="Show all members with office hours"
              paramKey="hasOfficeHours"
              filterStore={useMockFilterStore}
            />
            <FilterDivider />
            <GenericCheckboxList
              label="Search topics"
              paramKey="topics"
              filterStore={useMockFilterStore}
              placeholder="E.g. AI, Staking, Product"
              defaultItemsToShow={0}
              useGetDataHook={staticOptions(TOPICS)}
            />
          </FilterSection>

          {/* The calendar's contribution: one more facet, sitting with the
              other "can I actually meet this person" filters. Structure copied
              from Office Hours above — toggle, divider, the rest. */}
          <FilterSection title="Location" titleIcon={<PlaneIcon />}>
            <GenericFilterToggle
              label="Overlapping with me"
              paramKey="overlappingWithMe"
              filterStore={useMockFilterStore}
            />
            <FilterDivider />
            <LocationFilter
              people={people}
              trips={trips}
              todayKey={todayKey}
              when={when}
              range={range}
              onRangeChange={setRange}
              window={window}
              selectedCities={cities}
              onWeekPick={(start, end) => {
                // Picking a bar ticks "Dates…" and fills the range.
                setParam('presence', 'custom');
                setRange([keyToDate(start), keyToDate(end)]);
              }}
            />
          </FilterSection>

          <FilterSection title="Roles">
            <GenericCheckboxList
              label="Search roles"
              paramKey="roles"
              filterStore={useMockFilterStore}
              placeholder="E.g. Founder, VP Marketing..."
              defaultItemsToShow={4}
              useGetDataHook={staticOptions(ROLES)}
            />
          </FilterSection>

          <FilterSection title="Portfolio">
            <GenericFilterToggle
              label="Show PortCo founders"
              paramKey="isPortCoFounder"
              filterStore={useMockFilterStore}
            />
          </FilterSection>

          <FilterSection title="Investors">
            <GenericFilterToggle label="Show all Investors" paramKey="isInvestor" filterStore={useMockFilterStore} />
            <GenericCheckboxList
              paramKey="investorType"
              filterStore={useMockFilterStore}
              useGetDataHook={staticOptions(INVESTOR_TYPES)}
              defaultItemsToShow={2}
              hideSearch
              disableSorting
            />
            <FilterDivider />
            <FilterCheckSizeInput
              label="Typical Check Size"
              minParamName="minTypicalCheckSize"
              maxParamName="maxTypicalCheckSize"
              filterStore={useMockFilterStore}
              allowedRange={{ min: 0, max: 5000000 }}
            />
          </FilterSection>
        </FiltersSidePanel>
      </aside>

      <div className={shell.members__right}>
        <div className={shell.members__right__content}>
          <div className={shell.members__right__toolbar}>
            {/* members-toolbar.tsx: title + count on the left, sort on the
                right, 40px tall. Nothing else — the calendar adds nothing to
                this bar. */}
            <div className={s.toolbarInner}>
              <div className={s.toolbarLeft}>
                <div className={s.title}>
                  <h1 className={s.titleText}>Members</h1>
                  <p className={s.titleCount}>({sorted.length})</p>
                </div>
              </div>

              <div className={s.toolbarRight}>
                <SortDropdown sortByLabel="Sort by:" options={SORT_OPTIONS} currentSort={sort} onSortChange={setSort} />
              </div>
            </div>
          </div>

          {/* Outside the toolbar: it is a fixed 40px bar, so an extra line in it
              pushes the sort control off-centre. */}
          {overlapLens && (
            <p className={s.lensNote}>
              Showing people whose travel crosses yours. City and date filters don&apos;t apply — the lens already
              answers &ldquo;wherever we both are&rdquo;.
            </p>
          )}

          <div className={shell.members__right__membersList} style={{ flex: 1 }}>
            {/* The demand-side entry point.
                Event RSVPs can only ever capture event travel, and event travel
                is already public on the attendee list — the trips worth knowing
                about (a fundraising swing, a month somewhere) have no moment
                where the product can ask for them. So the ask goes where demand
                is visible instead: you have just searched a city, which is the
                one moment the value of answering is self-evident. */}
            {promptCity && (
              <div className={s.contribute}>
                <span className={s.contributeIcon}>
                  <InfoCircleIcon width={16} height={16} />
                </span>
                <p className={s.contributeText}>
                  {`${sorted.length} ${sorted.length === 1 ? 'person is' : 'people are'} listed in ${promptCity}. Will you be there too?`}
                </p>
                <button type="button" className={s.contributeBtn} onClick={onAddDates}>
                  Add your dates
                </button>
              </div>
            )}

            {sorted.length === 0 ? (
              <div className={s.empty}>
                <span className={s.emptyTitle}>Nobody matches</span>
                <span className={s.emptyText}>
                  Try widening the dates — most people are only somewhere else for a few days at a time.
                </span>
              </div>
            ) : (
              <div className={grid.grid}>
                {sorted.map(({ person, presence }) => (
                  <div key={person.id} className={grid.member}>
                    {presence.trip ? (
                      <MemberCardStatic member={person} presence={presence} />
                    ) : (
                      /* Unchanged production card — at home, nothing differs. */
                      <MemberGridView isUserLoggedIn member={toIMember(person)} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Shape a mock into what the production member cards read. */
function toIMember(person: PersonCityMember): IMember {
  return {
    id: person.id,
    name: person.name,
    role: person.role,
    mainTeam: { name: person.teamName, role: person.role },
    teams: [{ name: person.teamName, role: person.role, mainTeam: true }],
    location: { city: person.home.city, country: person.home.country },
    teamLead: person.teamLead,
    openToWork: person.openToWork,
    officeHours: person.officeHours,
    ohStatus: person.officeHours ? 'OK' : null,
    scheduleMeetingCount: person.scheduleMeetingCount,
    skills: person.skills,
  } as unknown as IMember;
}
