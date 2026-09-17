'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import Select, { type StylesConfig } from 'react-select';

import { BackButton } from '@/components/ui/BackButton';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { Tabs } from '@/components/ui/tabs/Tabs';
import { DetailsSectionGreyContentContainer, NoDataBlock } from '@/components/common/profile/DetailsSection';
import { filterSelectStyles } from '@/components/common/filters/FilterSelect';
import { ArrowUpRightIcon } from '@/components/icons/ArrowUpRightIcon';
import type { Option } from '@/components/form/FormSelect/types';
import { useIsBelowTabletLandscape } from '@/hooks/useIsBelowTabletLandscape';
import type { TeamApplicant } from '@/schema/team-applicants';
import { SHOW_TEAM_APPLICANTS } from '@/services/jobs/constants';
import { useApplicantCounts, useRoleApplicants } from '@/services/jobs/hooks/useTeamApplicants';
import type { IJobRole } from '@/types/jobs.types';
import { formatRelativeDays, getJobDate, seniorityDisplayLabel } from '@/utils/jobs.utils';

import { ApplicantRow } from './components/ApplicantRow';
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
export function TeamApplicantsView({ teamId, teamName, roles, initialRoleUid, viewerUid }: Props) {
  /* The tablet-landscape hook, not `useIsMobile`. `useIsMobile` switches at
     768px and this layout goes two-column at 960 — between the two the pane
     would render under the list with nothing to go back to. */
  const isNarrow = useIsBelowTabletLandscape();

  const [roleUid, setRoleUid] = useState(() => initialRoleUid ?? roles[0]?.uid ?? '');
  const [tab, setTab] = useState(APPLIED_TAB);
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
   * White at rest, not `filterSelectStyles`' blue.
   *
   * That blue is the control's "a filter is applied" state and it keys off
   * `hasValue` — which a role picker always has, because choosing which role's
   * applicants to read is not a filter.
   */
  const roleSelectStyles = useMemo(
    () =>
      ({
        ...filterSelectStyles,
        control: (base: any, state: any) => ({
          ...(filterSelectStyles.control as any)(base, { ...state, hasValue: false }),
        }),
      }) as unknown as StylesConfig<RoleOption, false>,
    [],
  );

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
    setSelectedUid(null);
    setQuery('');
    setPaneOpen(false);
  };

  const switchTab = (next: string) => {
    if (next === tab) return;
    setTab(next);
    setSelectedUid(null);
    setQuery('');
    setPaneOpen(false);
  };

  const select = (row: TeamApplicant) => {
    setSelectedUid(row.uid);
    if (isNarrow) setPaneOpen(true);
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
      {/* `forceTo`, because `BackButton` otherwise prefers `router.back()` —
          and a lead who arrived on this page from a shared link has a browser
          history that goes somewhere else entirely. */}
      <BackButton to={`/teams/${teamId}`} forceTo className={s.back} />

      {showList && (
        <header className={s.head}>
          <h1 className={s.title}>Applicants</h1>
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
          <div className={clsx(s.paneCol, !selectedUid && s.paneEmpty)}>
            {!selectedUid && (
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
