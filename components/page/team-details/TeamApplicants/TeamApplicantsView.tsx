'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import Select, { type StylesConfig } from 'react-select';

import { BackButton } from '@/components/ui/BackButton';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { Tabs } from '@/components/ui/tabs/Tabs';
import { DetailsSectionGreyContentContainer, NoDataBlock } from '@/components/common/profile/DetailsSection';
import { filterSelectStyles } from '@/components/common/filters/FilterSelect';
import { ArrowUpRightIcon } from '@/components/icons/ArrowUpRightIcon';
import { CaretLeftIcon } from '@/components/icons/CaretLeftIcon';
import type { Option } from '@/components/form/FormSelect/types';
import { useIsBelowTabletLandscape } from '@/hooks/useIsBelowTabletLandscape';
import type { TeamApplicant } from '@/schema/team-applicants';
import { SHOW_TEAM_APPLICANTS } from '@/services/jobs/constants';
import {
  useApplicantCounts,
  useMarkApplicantSeen,
  useRoleApplicants,
  useToggleApplicantReviewed,
} from '@/services/jobs/hooks/useTeamApplicants';
import type { IJobRole } from '@/types/jobs.types';
import { formatRelativeDays, getJobDate, seniorityDisplayLabel } from '@/utils/jobs.utils';

import { ApplicantPane } from './components/ApplicantPane';
import { ApplicantRow } from './components/ApplicantRow';
import { ScrollPageToTop } from './ScrollPageToTop';
import { ApplicantsPaneBar } from './components/ApplicantsPaneBar';
import s from './TeamApplicantsView.module.scss';

export const APPLIED_TAB = 'Applied';
export const INTERESTED_TAB = 'Interested';

interface Props {
  teamId: string;
  teamName: string;
  /** The team's open postings, from the jobs list the page fetched. */
  roles: IJobRole[];
  /** `?role=` — the role whose count line was pressed. */
  initialRoleUid: string | null;
  /**
   * The signed-in lead, handed down rather than read from the user store.
   *
   * The page is server-gated, so it has already resolved exactly this uid to
   * decide the viewer may be here — and the store hydrates a beat after first
   * paint, which would hold every query disabled through that beat and flash an
   * empty list at someone whose applicants are already known to exist.
   */
  viewerUid: string | undefined;
  /** Always true in practice — the gate requires it — but the profile sections
   *  below take it, and a literal here would be a second place to be wrong. */
  isLoggedIn: boolean;
}

type RoleOption = Option & { newCount: number };

/**
 * The team's applicants: the list on the left, the selected person beside it.
 *
 * **This is the only component here that imports the flag.** Everything below it
 * takes props. That is the rule `services/jobs/constants.ts` states, and it is
 * load-bearing rather than tidy: the queries are authenticated, and `customFetch`
 * answers a missing session by logging out and reloading the page. `enabled`
 * has to carry the gate, because an early `return null` in a host does not stop
 * a hook that already ran.
 */
export function TeamApplicantsView({ teamId, teamName, roles, initialRoleUid, viewerUid, isLoggedIn }: Props) {
  /* The tablet-landscape hook, not `useIsMobile`. `useIsMobile` switches at
     768px and this layout goes two-column at 960 — between the two the pane
     would render under the list with nothing to go back to. */
  const isNarrow = useIsBelowTabletLandscape();

  const [roleUid, setRoleUid] = useState(() => initialRoleUid ?? roles[0]?.uid ?? '');
  /**
   * `null` until someone picks one — the tab is DERIVED until then.
   *
   * Applied was a fixed default, and a role whose whole answer is interest
   * opened on an empty list saying "No one has applied to this role yet." while
   * the tab beside it read "Interested (2)". The people were one press away and
   * the first thing the page said was that there was nobody. Deriving it also
   * survives the list arriving late, which an effect-and-setState would have to
   * chase with a flag.
   */
  const [pickedTab, setPickedTab] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [paneOpen, setPaneOpen] = useState(false);

  const role = roles.find((r) => r.uid === roleUid) ?? roles[0] ?? null;

  const counts = useApplicantCounts({
    teamUid: teamId,
    viewerUid,
    enabled: SHOW_TEAM_APPLICANTS,
  });

  const lists = useRoleApplicants({
    teamUid: teamId,
    roleUid: role?.uid,
    viewerUid,
    enabled: SHOW_TEAM_APPLICANTS,
  });

  const markSeen = useMarkApplicantSeen({ teamUid: teamId, roleUid: role?.uid, viewerUid });
  const toggleReviewed = useToggleApplicantReviewed({ teamUid: teamId, roleUid: role?.uid, viewerUid });

  const roleOptions: RoleOption[] = useMemo(
    () =>
      roles.map((r) => {
        const count = counts.data?.find((c) => c.roleUid === r.uid);
        const total = (count?.applicantCount ?? 0) + (count?.interestCount ?? 0);
        return {
          value: r.uid,
          label: total > 0 ? `${r.roleTitle} (${total})` : r.roleTitle,
          newCount: count?.newCount ?? 0,
        };
      }),
    [roles, counts.data],
  );

  /**
   * Neutral at rest, not `filterSelectStyles`' blue.
   *
   * That blue is the toolbar control's "a filter is applied" state: the fill and
   * the border key off `hasValue`, and the selected text and caret are painted
   * brand blue outright. A role picker always has a value — choosing whose
   * applicants to read is not a filter, and a control that is permanently lit
   * says something is narrowed when nothing is.
   *
   * Three overrides for one idea, because the stylesheet expresses it in three
   * places: the control (via a forced `hasValue: false`), the selected label,
   * and the caret beside it. Leaving any one blue reads as a half-applied state
   * rather than a deliberate one.
   */
  const roleSelectStyles = useMemo(
    () =>
      ({
        ...filterSelectStyles,
        control: (base: any, state: any) => ({
          ...(filterSelectStyles.control as any)(base, { ...state, hasValue: false }),
        }),
        singleValue: (base: any, state: any) => ({
          ...(filterSelectStyles.singleValue as any)(base, state),
          color: 'var(--foreground-neutral-primary, #0f172a)',
        }),
        dropdownIndicator: (base: any, state: any) => ({
          ...(filterSelectStyles.dropdownIndicator as any)(base, { ...state, hasValue: false }),
        }),
      }) as unknown as StylesConfig<RoleOption, false>,
    [],
  );

  /* Applied unless it is empty and Interested is not — and only until someone
     chooses, after which their choice stands even when it empties out under a
     search. */
  const tab =
    pickedTab ?? (!lists.data?.applications.length && lists.data?.interests.length ? INTERESTED_TAB : APPLIED_TAB);

  const rows: TeamApplicant[] = useMemo(() => {
    const source = tab === INTERESTED_TAB ? lists.data?.interests : lists.data?.applications;
    return source ?? [];
  }, [lists.data, tab]);

  const term = query.trim().toLowerCase();
  const shown = term
    ? rows.filter((row) =>
        [row.name, row.headline, row.currentCompany].some((field) => field?.toLowerCase().includes(term)),
      )
    : rows;

  const switchRole = (next: string) => {
    if (next === roleUid) return;
    setRoleUid(next);
    /* The next role gets the same derivation as the first: its own answer may be
       all interest, and carrying the previous role's tab over would open it on
       an empty list for the same reason the fixed default did. */
    setPickedTab(null);
    setSelectedUid(null);
    setQuery('');
    setPaneOpen(false);
  };

  const switchTab = (next: string) => {
    if (next === tab) return;
    setPickedTab(next);
    setSelectedUid(null);
    setQuery('');
    setPaneOpen(false);
  };

  const select = (row: TeamApplicant) => {
    setSelectedUid(row.uid);
    if (isNarrow) setPaneOpen(true);
    /* Opening a row IS reading it, so the tint clears on selection rather than
       on some later "mark as read". Fire-and-forget: a failed write costs a
       badge that comes back, which is not worth interrupting anyone over. */
    if (row.unseen) markSeen.mutate({ kind: row.kind, uid: row.uid });
  };

  /**
   * The pane opens on someone, rather than on an instruction to pick someone.
   *
   * Two-column only: on a narrow screen the pane is a second screen the list
   * hands you over to, and preselecting there would land a lead on a profile
   * having never seen the list they came for.
   *
   * **It marks that person seen, and that is the point rather than a side
   * effect.** Their profile is on screen; a "● New" left on the row would be
   * claiming nobody has looked at someone the page just showed. It goes the same
   * way it goes on a press, through the same `select`.
   *
   * `selectedUid` is the whole guard: this fires once, on a list nobody has
   * chosen from yet, and stands down for good afterwards — so typing cannot walk
   * the selection or quietly mark people read as the query narrows. Switching
   * tab or role clears the selection (and the search with it), and this runs
   * again for the new list.
   *
   * `rows` rather than `shown` is therefore belt and braces: the search is
   * always empty at the moment this can fire, so the two are the same list. It
   * is the conservative read, not a behaviour the tests can tell apart.
   */
  useEffect(() => {
    if (isNarrow || selectedUid || !rows.length) return;
    select(rows[0]);
    /* `select` is rebuilt every render and is deliberately not a dependency;
       the guards above are what stop this running twice. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNarrow, selectedUid, rows]);

  const selected = shown.find((row) => row.uid === selectedUid) ?? null;
  const position = selected ? shown.findIndex((row) => row.uid === selected.uid) : -1;

  const step = (delta: number) => {
    const next = shown[position + delta];
    if (next) select(next);
  };

  const showList = !isNarrow || !paneOpen;
  const showPane = !isNarrow || paneOpen;

  const metaParts = role
    ? [
        role.seniority ? seniorityDisplayLabel(role.seniority) : null,
        role.roleCategory,
        role.location?.length ? role.location.join(', ') : null,
        `Posted ${formatRelativeDays(getJobDate(role))}`,
      ].filter(Boolean)
    : [];

  return (
    <div className={s.page}>
      <ScrollPageToTop />
      {/* One control, two meanings. On a narrow screen with the pane open, Back
          is the way out of the pane and not off the page — a lead who tapped a
          row wants the list again, and sending them to the team profile would
          throw away the role and the tab they had chosen.

          `forceTo` on the page-level one, because `BackButton` otherwise prefers
          `router.back()` — and a lead who arrived here from a shared link has a
          browser history that goes somewhere else entirely. */}
      {isNarrow && paneOpen ? (
        <button type="button" className={s.paneBack} onClick={() => setPaneOpen(false)}>
          <CaretLeftIcon width={16} height={16} />
          All applicants
        </button>
      ) : (
        <BackButton to={`/teams/${teamId}`} forceTo className={s.back} />
      )}

      {showList && (
        <header className={s.head}>
          <h1 className={s.title}>Candidates</h1>
          <p className={s.subtitle}>{teamName}</p>
        </header>
      )}

      {showList && roles.length > 0 && (
        <div className={s.roleBar}>
          <label className={s.roleLabel} htmlFor="applicants-role">
            Role:
          </label>
          <div className={s.rolePicker}>
            <Select<RoleOption, false>
              inputId="applicants-role"
              isSearchable
              options={roleOptions}
              value={roleOptions.find((option) => option.value === role?.uid) ?? null}
              onChange={(option) => option && switchRole(option.value)}
              styles={roleSelectStyles}
              menuPortalTarget={typeof document === 'undefined' ? undefined : document.body}
              menuPosition="fixed"
              noOptionsMessage={({ inputValue }) => `No roles match “${inputValue}”`}
              formatOptionLabel={(option) => (
                <span className={s.roleOption}>
                  <span className={s.roleOptionLabel}>{option.label}</span>
                  {option.newCount > 0 && <span className={s.newBadge}>● {option.newCount} new</span>}
                </span>
              )}
            />
          </div>
        </div>
      )}

      <div className={s.split}>
        {showList && (
          <div className={s.listCol}>
            {role && (
              <div className={s.listHead}>
                <p className={s.roleFacts}>{metaParts.join(' · ')}</p>
                {role.applyUrl && (
                  <a className={s.postingLink} href={role.applyUrl} target="_blank" rel="noopener noreferrer">
                    View posting
                    <ArrowUpRightIcon width={14} height={14} />
                  </a>
                )}
              </div>
            )}

            <div className={s.tabs}>
              <Tabs
                variant="secondary"
                activeTab={tab}
                onTabClick={switchTab}
                tabs={[
                  { name: APPLIED_TAB, count: lists.data?.applications.length },
                  { name: INTERESTED_TAB, count: lists.data?.interests.length },
                ]}
              />
            </div>

            <div className={s.searchWrap}>
              <SearchInput value={query} onChange={setQuery} placeholder="Search by name or role" />
            </div>

            {shown.length > 0 ? (
              <div className={s.list}>
                {shown.map((row, index) => (
                  <ApplicantRow
                    key={row.uid}
                    applicant={row}
                    last={index === shown.length - 1}
                    selected={!isNarrow && row.uid === selectedUid}
                    onSelect={() => select(row)}
                  />
                ))}
              </div>
            ) : (
              <DetailsSectionGreyContentContainer>
                <NoDataBlock>{emptyCopy({ roles, role, tab, term, isLoading: lists.isPending })}</NoDataBlock>
              </DetailsSectionGreyContentContainer>
            )}
          </div>
        )}

        {showPane && (
          <div className={clsx(s.paneCol, !selected && s.paneEmpty)}>
            {selected ? (
              <>
                <ApplicantsPaneBar
                  applicant={selected}
                  roleTitle={role?.roleTitle ?? ''}
                  position={position}
                  total={shown.length}
                  onStep={step}
                  onToggleReviewed={() =>
                    toggleReviewed.mutate({
                      kind: selected.kind,
                      uid: selected.uid,
                      reviewed: !selected.reviewed,
                    })
                  }
                />
                {/* Keyed on the row, so stepping to the next person remounts the
                    pane rather than showing the previous one's sections while
                    the new record arrives. */}
                <ApplicantPane key={selected.uid} applicant={selected} isLoggedIn={isLoggedIn} />
              </>
            ) : (
              <DetailsSectionGreyContentContainer>
                <NoDataBlock>Select someone to read their profile and what they sent.</NoDataBlock>
              </DetailsSectionGreyContentContainer>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Four different nothings, because they call for four different things.
 *
 * A team with no postings cannot have applicants and should go and post one; a
 * role nobody has answered is waiting; a search that matched nothing wants the
 * search cleared; and a list still loading is not empty at all. One "No
 * results" would make the first case look like the third.
 */
function emptyCopy({
  roles,
  role,
  tab,
  term,
  isLoading,
}: {
  roles: IJobRole[];
  role: IJobRole | null;
  tab: string;
  term: string;
  isLoading: boolean;
}) {
  if (!roles.length || !role) return 'This team has no open roles, so there is nobody to read yet.';
  if (isLoading) return 'Loading…';
  if (term) return `Nobody here matches “${term}”.`;
  return tab === INTERESTED_TAB ? 'No one has said they’re interested yet.' : 'No one has applied to this role yet.';
}
