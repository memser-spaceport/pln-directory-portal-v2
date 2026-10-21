'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Select, { type StylesConfig } from 'react-select';

import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import { toast } from '@/components/core/ToastContainer';
import { BackButton } from '@/components/ui/BackButton';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { Tabs } from '@/components/ui/tabs/Tabs';
import { DetailsSectionGreyContentContainer, NoDataBlock } from '@/components/common/profile/DetailsSection';
import { filterSelectStyles } from '@/components/common/filters/FilterSelect';
import btn from '@/components/common/Button/Button.module.scss';
import { AiSearchIcon } from '@/components/icons/AiSearchIcon';
import { ArrowUpRightIcon } from '@/components/icons/ArrowUpRightIcon';
import { CaretLeftIcon } from '@/components/icons/CaretLeftIcon';
import type { Option } from '@/components/form/FormSelect/types';
import { useIsBelowTabletLandscape } from '@/hooks/useIsBelowTabletLandscape';
import { SUGGESTED_LIMIT, type SuggestedCandidate } from '@/schema/suggested-candidates';
import type { TeamApplicant } from '@/schema/team-applicants';
import { SHOW_TEAM_APPLICANTS } from '@/services/jobs/constants';
import {
  useApplicantCounts,
  useContactSuggestedCandidate,
  useMarkApplicantSeen,
  useRoleApplicants,
  useSaveMatchCriteria,
  useSuggestedCandidates,
  useToggleApplicantReviewed,
} from '@/services/jobs/hooks/useTeamApplicants';
import { jobDetailPath } from '@/services/jobs/job-detail-link';
import { isAlreadyContactedError, TeamApplicantsError } from '@/services/jobs/team-applicants.service';
import type { IJobRole } from '@/types/jobs.types';
import { formatRelativeDays, getJobDate, seniorityDisplayLabel } from '@/utils/jobs.utils';

import { ApplicantPane, MemberProfilePane } from './components/ApplicantPane';
import { ApplicantRow } from './components/ApplicantRow';
import { ContactSuggestedModal } from './components/ContactSuggestedModal';
import { EditCriteriaModal } from './components/EditCriteriaModal';
import { SuggestedPaneBar } from './components/SuggestedPaneBar';
import { SuggestedRow } from './components/SuggestedRow';
import { SuggestedWhy } from './components/SuggestedWhy';
import { useContactSender } from './components/useContactSender';
import { roleDescriptionLead } from './roleDescriptionLead';
import { ScrollPageToTop } from './ScrollPageToTop';
import { ApplicantsPaneBar } from './components/ApplicantsPaneBar';
import s from './TeamApplicantsView.module.scss';

export const APPLIED_TAB = 'Applied';
export const INTERESTED_TAB = 'Interested';
/**
 * Members the product proposes for the role (LAB-2771) — the third tab and the
 * weakest signal: applied sent something, interested raised a hand, suggested
 * did nothing. Never the derived default; a lead opens it on purpose.
 */
export const SUGGESTED_TAB = 'Suggested';

const TAB_EVENT: Record<string, 'applied' | 'interested' | 'suggested'> = {
  [APPLIED_TAB]: 'applied',
  [INTERESTED_TAB]: 'interested',
  [SUGGESTED_TAB]: 'suggested',
};

/** `?tab=` value that opens the Suggested tab (LAB-2853). */
export const SUGGESTED_TAB_PARAM = 'suggested';
/** `?edit=` value that also opens Edit criteria once, on arrival (LAB-2853). */
export const EDIT_CRITERIA_PARAM = 'criteria';

/**
 * `utm_source` values the suggested-candidates emails put on their links to
 * this page (LAB-2853). A Suggested tab view that arrives with one of these
 * is counted as coming from email.
 */
export const SUGGESTED_EMAIL_UTM_SOURCES = ['job_suggested_candidates_email', 'job_suggested_candidate_intro_email'];

/**
 * Drop `?edit=` from the address bar without a navigation, once it has been
 * acted on, so a reload or a shared copy of the URL does not open the modal
 * again. `replaceState` rather than `router.replace`, so the server page does
 * not render again for a param it never reads.
 *
 * The state is `null`, never `window.history.state` (LAB-2893). Next patches
 * `replaceState` and only takes the new URL into its router when the state is
 * not its own: handed back Next's `__NA` state, it left the router holding the
 * old URL and wrote `edit=criteria` back on its next history sync, so a reload
 * reopened the modal.
 */
function stripEditParam() {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('edit')) return;
    url.searchParams.delete('edit');
    const search = url.searchParams.toString();
    window.history.replaceState(null, '', `${url.pathname}${search ? `?${search}` : ''}${url.hash}`);
  } catch {
    // A URL we cannot rewrite is not worth failing the page over.
  }
}

interface Props {
  teamId: string;
  teamName: string;
  /** The team's open postings, from the jobs list the page fetched. */
  roles: IJobRole[];
  /** `?role=` — the role whose count line was pressed. */
  initialRoleUid: string | null;
  /** `?candidate=` — a member uid, from the application email's link to the person. */
  initialCandidateUid: string | null;
  /** `?suggested=` — a member uid, from a shared link to a suggested match. */
  initialSuggestedMemberUid?: string | null;
  /** `?tab=` — `suggested` opens the Suggested tab (LAB-2853), as the founder email's links do. */
  initialTab?: string | null;
  /**
   * `?edit=` — `criteria` also opens Edit criteria once, when the role has
   * criteria to edit (LAB-2853). It implies the Suggested tab, where the
   * modal lives.
   */
  initialEdit?: string | null;
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

/** The server's own words when it sent some, else the page's. */
const failureMessage = (error: unknown, fallback: string) =>
  error instanceof TeamApplicantsError && error.message ? error.message : fallback;

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
export function TeamApplicantsView({
  teamId,
  teamName,
  roles,
  initialRoleUid,
  initialCandidateUid,
  initialSuggestedMemberUid = null,
  initialTab = null,
  initialEdit = null,
  viewerUid,
  isLoggedIn,
}: Props) {
  /* The tablet-landscape hook, not `useIsMobile`. `useIsMobile` switches at
     768px and this layout goes two-column at 960 — between the two the pane
     would render under the list with nothing to go back to. */
  const isNarrow = useIsBelowTabletLandscape();
  const analytics = useJobsAnalytics();
  const hiringViewed = useRef(false);

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
  const [pickedTab, setPickedTab] = useState<string | null>(() =>
    initialSuggestedMemberUid || initialTab === SUGGESTED_TAB_PARAM || initialEdit === EDIT_CRITERIA_PARAM
      ? SUGGESTED_TAB
      : null,
  );
  /* `?edit=criteria` waiting for the role's criteria to load (LAB-2853). */
  const [pendingEditCriteria, setPendingEditCriteria] = useState(initialEdit === EDIT_CRITERIA_PARAM);
  const [query, setQuery] = useState('');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [paneOpen, setPaneOpen] = useState(false);
  const [pendingCandidateUid, setPendingCandidateUid] = useState(initialCandidateUid);
  const [pendingSuggestedMemberUid, setPendingSuggestedMemberUid] = useState(initialSuggestedMemberUid);

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  /* Where the lead came from, read once on arrival (LAB-2853). The page's own
     URL writes keep the utm params, so a read on a later render could not
     tell an email arrival from a lead who has been clicking around since. */
  const [arrival] = useState(() => {
    const utmSource = searchParams.get('utm_source');
    return {
      source: utmSource && SUGGESTED_EMAIL_UTM_SOURCES.includes(utmSource) ? ('email' as const) : ('app' as const),
      utm_content: searchParams.get('utm_content'),
    };
  });

  const replaceApplicantsSearch = useCallback(
    (patch: { roleUid?: string; suggestedUid?: string | null; candidateUid?: string | null; tab?: null }) => {
      const params = new URLSearchParams(searchParams.toString());
      const role = patch.roleUid ?? roleUid;
      if (role) params.set('role', role);
      else params.delete('role');
      /* One-shot: acted on at arrival, never carried into a later URL. */
      params.delete('edit');
      if (patch.tab === null) params.delete('tab');

      if (patch.suggestedUid !== undefined) {
        if (patch.suggestedUid) params.set('suggested', patch.suggestedUid);
        else params.delete('suggested');
      }
      if (patch.candidateUid !== undefined) {
        if (patch.candidateUid) params.set('candidate', patch.candidateUid);
        else params.delete('candidate');
      }
      if (patch.suggestedUid) params.delete('candidate');

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, roleUid, searchParams],
  );

  const role = roles.find((r) => r.uid === roleUid) ?? roles[0] ?? null;

  /* LAB-2853: the posting's first paragraph as plain text, clamped to three
     lines in CSS, under the role's title on every tab. It comes from the role
     the page already loaded, so there is no request, and a role whose posting
     has no body shows no paragraph. */
  const roleLead = useMemo(() => roleDescriptionLead(role?.descriptionHtml), [role]);

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

  const suggestions = useSuggestedCandidates({
    roleUid: role?.uid,
    viewerUid,
    enabled: SHOW_TEAM_APPLICANTS,
  });

  /* The people; the role's criteria ride in the same answer (LAB-2847). */
  const suggestedList = suggestions.data?.suggestions;
  const roleCriteria = suggestions.data?.criteria ?? null;
  /* Nothing to switch on an older backend (null) or a role whose posting has
     no extracted criteria ([]) — the PUT would only answer 409. */
  const canEditCriteria = !!roleCriteria?.length;
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const criteriaPrompt = suggestions.data?.criteriaPrompt ?? null;
  const saveCriteria = useSaveMatchCriteria({ roleUid: role?.uid, viewerUid });

  /* Contact (LAB-2847): the member the modal is open for, and every draft the
     lead has started while the page is open, keyed `roleUid:memberUid`, so a
     close or a failed send never costs the text. */
  const [contactMemberUid, setContactMemberUid] = useState<string | null>(null);
  const [contactDrafts, setContactDrafts] = useState<Record<string, string>>({});
  const contactSuggested = useContactSuggestedCandidate({ roleUid: role?.uid, viewerUid });
  const contactTarget = contactMemberUid
    ? (suggestedList?.find((row) => row.memberUid === contactMemberUid) ?? null)
    : null;
  const draftKey = (memberUid: string) => `${role?.uid ?? ''}:${memberUid}`;

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

  /* Applied unless it is empty and Interested is not, then Suggested when that
     is all there is — and only until someone chooses, after which their choice
     stands even when it empties out under a search. Suggested waits for the
     lists: with them still loading, "no answers" is not yet known. */
  const derivedTab = lists.data?.applications.length
    ? APPLIED_TAB
    : lists.data?.interests.length
      ? INTERESTED_TAB
      : lists.data && suggestedList?.length
        ? SUGGESTED_TAB
        : APPLIED_TAB;
  const tab = pickedTab ?? derivedTab;

  const isSuggestedTab = tab === SUGGESTED_TAB;

  /* The lead as the Contact template introduces them (LAB-2853). Read only on
     the Suggested tab, the one place Contact is offered. */
  const sender = useContactSender({ viewerUid, teamId, isLoggedIn, enabled: isSuggestedTab });

  const rows: TeamApplicant[] = useMemo(() => {
    if (tab === SUGGESTED_TAB) return [];
    const source = tab === INTERESTED_TAB ? lists.data?.interests : lists.data?.applications;
    return source ?? [];
  }, [lists.data, tab]);

  const suggestedRows: SuggestedCandidate[] = useMemo(
    () => (tab === SUGGESTED_TAB ? (suggestedList ?? []) : []),
    [suggestedList, tab],
  );

  const term = query.trim().toLowerCase();
  const shown = term
    ? rows.filter((row) =>
        [row.name, row.headline, row.currentCompany].some((field) => field?.toLowerCase().includes(term)),
      )
    : rows;
  /* Suggested has no search (LAB-2904): five names need no filtering, and a
     term typed on Applied or Interested must not narrow it. */
  const shownSuggested = suggestedRows;

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
    setPendingSuggestedMemberUid(null);
    setCriteriaOpen(false);
    setPendingEditCriteria(false);
    setContactMemberUid(null);
    replaceApplicantsSearch({ roleUid: next, suggestedUid: null, candidateUid: null, tab: null });
  };

  const switchTab = (next: string) => {
    if (next === tab) return;
    setPickedTab(next);
    setSelectedUid(null);
    setQuery('');
    setPaneOpen(false);
    if (next !== SUGGESTED_TAB) {
      replaceApplicantsSearch({ suggestedUid: null, tab: null });
    }
    analytics.onJobHiringTabChanged({
      team_id: teamId,
      job_id: role?.uid ?? null,
      tab: TAB_EVENT[next] ?? 'applied',
    });
  };

  /* A suggestion has no row of its own on the server, so its member uid is its
     id here — unique within a role's list, which is all a selection needs. */
  const selectSuggested = (row: SuggestedCandidate) => {
    setSelectedUid(row.memberUid);
    replaceApplicantsSearch({
      roleUid: role?.uid ?? roleUid,
      suggestedUid: row.memberUid,
      candidateUid: null,
    });
    analytics.onJobSuggestedCandidateOpened({
      team_id: teamId,
      job_id: role?.uid ?? null,
      rank: row.rank,
      label: row.label,
    });
    if (isNarrow) setPaneOpen(true);
  };

  /* Once per role, when the tab is open and its answer is in: the count is the
     number the lead actually saw. LAB-2853: `source` says whether the lead came
     from one of the suggested-candidates emails. Only the first view counts as
     the email's, because the email links one role and a lead who then switches
     roles is browsing the page. */
  const suggestedViewedFor = useRef<string | null>(null);
  const suggestedViewCount = useRef(0);
  useEffect(() => {
    if (!isSuggestedTab || !role || !suggestedList) return;
    if (suggestedViewedFor.current === role.uid) return;
    suggestedViewedFor.current = role.uid;
    const first = suggestedViewCount.current === 0;
    suggestedViewCount.current += 1;
    analytics.onJobSuggestedCandidatesViewed({
      team_id: teamId,
      job_id: role.uid,
      count: suggestedList.length,
      source: first ? arrival.source : 'app',
      utm_content: first ? arrival.utm_content : null,
    });
  }, [analytics, arrival, isSuggestedTab, role, suggestedList, teamId]);

  /* `?edit=criteria` (LAB-2853): open Edit criteria once the role's criteria
     are in, and only when there is something to edit. It is consumed either
     way, and the param leaves the URL so a reload does not open it again. */
  useEffect(() => {
    if (!pendingEditCriteria) return;
    if (!suggestions.data && !suggestions.isError) return;
    setPendingEditCriteria(false);
    stripEditParam();
    if (canEditCriteria) setCriteriaOpen(true);
  }, [canEditCriteria, pendingEditCriteria, suggestions.data, suggestions.isError]);

  const select = (row: TeamApplicant) => {
    setSelectedUid(row.uid);
    analytics.onJobApplicantOpened({
      team_id: teamId,
      job_id: role?.uid ?? null,
      kind: row.kind,
    });
    if (isNarrow) setPaneOpen(true);
    /* Opening a row IS reading it, so the tint clears on selection rather than
       on some later "mark as read". Fire-and-forget: a failed write costs a
       badge that comes back, which is not worth interrupting anyone over. */
    if (row.unseen) markSeen.mutate({ kind: row.kind, uid: row.uid });
  };

  useEffect(() => {
    if (hiringViewed.current) return;
    hiringViewed.current = true;
    analytics.onJobHiringViewed({ team_id: teamId, job_id: role?.uid ?? null });
  }, [analytics, teamId, role]);

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
    if (selectedUid || !rows.length) return;
    /* A lead arriving from the email came for one person, so that person opens
       on a narrow screen too. Consumed on first use: switching back to this
       tab later should not pull them back to it. */
    const candidate = pendingCandidateUid ? rows.find((row) => row.memberUid === pendingCandidateUid) : undefined;
    if (pendingCandidateUid) setPendingCandidateUid(null);
    if (candidate) select(candidate);
    else if (!isNarrow) select(rows[0]);
    /* `select` is rebuilt every render and is deliberately not a dependency;
       the guards above are what stop this running twice. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNarrow, selectedUid, rows]);

  /* A shared `?suggested=` link: open that person once the list is in. */
  useEffect(() => {
    if (!pendingSuggestedMemberUid || !suggestedList) return;
    const match = suggestedList.find((row) => row.memberUid === pendingSuggestedMemberUid);
    setPendingSuggestedMemberUid(null);
    if (match) {
      setSelectedUid(match.memberUid);
      if (isNarrow) setPaneOpen(true);
    } else if (!isNarrow && suggestedRows.length) {
      setSelectedUid(suggestedRows[0].memberUid);
    }
  }, [isNarrow, pendingSuggestedMemberUid, suggestedList, suggestedRows]);

  /* The Suggested tab's version of the preselect above: two-column only, and
     with no unread state to clear. It sets the selection without the "opened"
     event — the lead did not press anyone, and counting the page's own choice
     would inflate rank 1 in the opened-to-contacted funnel. */
  useEffect(() => {
    if (pendingSuggestedMemberUid || selectedUid || isNarrow || !suggestedRows.length) return;
    setSelectedUid(suggestedRows[0].memberUid);
  }, [isNarrow, pendingSuggestedMemberUid, selectedUid, suggestedRows]);

  const selected = shown.find((row) => row.uid === selectedUid) ?? null;
  const position = selected ? shown.findIndex((row) => row.uid === selected.uid) : -1;

  const selectedSuggested = shownSuggested.find((row) => row.memberUid === selectedUid) ?? null;

  /* Applied and Interested only: the Suggested bar has no stepper (LAB-2837 feedback). */
  const step = (delta: number) => {
    const next = shown[position + delta];
    if (next) select(next);
  };

  /* Not optimistic: the modal stays open on a pending Save and closes on the
     server's answer, and a refusal leaves it open on the lead's draft. */
  const onSaveCriteria = (disabled: string[], prompt: string | null) => {
    saveCriteria.mutate(
      { disabled, prompt },
      {
        onSuccess: ({ criteria }) => {
          setCriteriaOpen(false);
          analytics.onJobSuggestedCriteriaEdited({
            team_id: teamId,
            job_id: role?.uid ?? null,
            enabled_count: criteria.filter((c) => c.enabled).length,
            disabled_count: criteria.filter((c) => !c.enabled).length,
          });
        },
        onError: (error) => {
          toast.error(failureMessage(error, 'Could not save the criteria. Please try again.'));
        },
      },
    );
  };

  /* The send is not optimistic either. Success patches `contactedAt` from the
     server; a 409 means someone on the team already wrote to them, so it is
     handled as done — closed, no toast, no event — and the hook re-reads. */
  const onSendContact = (target: SuggestedCandidate, message: string) => {
    contactSuggested.mutate(
      { memberUid: target.memberUid, message },
      {
        onSuccess: () => {
          setContactMemberUid(null);
          setContactDrafts(({ [draftKey(target.memberUid)]: _sent, ...rest }) => rest);
          analytics.onJobSuggestedCandidateContacted({
            team_id: teamId,
            job_id: role?.uid ?? null,
            rank: target.rank,
            label: target.label,
            interested: target.interested === true,
          });
        },
        onError: (error) => {
          if (isAlreadyContactedError(error)) {
            setContactMemberUid(null);
            return;
          }
          toast.error(failureMessage(error, 'Could not send your message. Please try again.'));
        },
      },
    );
  };

  const hasSelection = isSuggestedTab ? !!selectedSuggested : !!selected;

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
          All candidates
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
                {/* LAB-2853: the role heads the list, with its title and the
                    posting's first paragraph, so a lead who arrives from an
                    email knows which role this is before judging anyone. */}
                <h2 className={s.roleTitle}>{role.roleTitle}</h2>
                <p className={s.roleFacts}>{metaParts.join(' · ')}</p>
                {roleLead && (
                  <p className={s.roleLead} data-testid="role-description-lead">
                    {roleLead}
                  </p>
                )}
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
                  { name: SUGGESTED_TAB, count: suggestedList?.length },
                ]}
              />
            </div>

            {/* What this list is, in the one sentence nothing else here can say:
                nobody on it did anything, and the people the team already knows
                are left out on purpose. */}
            {isSuggestedTab && (
              <p className={s.suggestedNote} data-testid="suggested-note">
                The top {SUGGESTED_LIMIT} members matched to this role on their profile. They haven’t applied. People
                who worked at {teamName || 'this team'} are not suggested.
              </p>
            )}

            {/* Suggested holds the top five, so it has no search: Edit AI criteria
                takes its place, under the note, on the list's left edge. It changes
                the role, not the person in the pane (LAB-2837 feedback). Grey, not
                brand: Contact is the page's one brand action (LAB-2904). */}
            {isSuggestedTab ? (
              canEditCriteria && (
                <div className={s.criteriaRow}>
                  <button
                    type="button"
                    className={clsx(btn.root, btn.small, btn.border, btn.neutral, s.criteriaBtn)}
                    onClick={() => setCriteriaOpen(true)}
                  >
                    <AiSearchIcon size={16} />
                    Edit AI criteria
                  </button>
                </div>
              )
            ) : (
              <div className={s.searchWrap}>
                <SearchInput value={query} onChange={setQuery} placeholder="Search by name or role" />
              </div>
            )}

            {isSuggestedTab && shownSuggested.length > 0 ? (
              <div className={s.list}>
                {shownSuggested.map((row, index) => (
                  <SuggestedRow
                    key={row.memberUid}
                    suggestion={row}
                    last={index === shownSuggested.length - 1}
                    selected={!isNarrow && row.memberUid === selectedUid}
                    onSelect={() => selectSuggested(row)}
                  />
                ))}
              </div>
            ) : !isSuggestedTab && shown.length > 0 ? (
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
                <NoDataBlock>
                  {emptyCopy({
                    roles,
                    role,
                    tab,
                    term,
                    isLoading: isSuggestedTab ? suggestions.isPending : lists.isPending,
                    isError: isSuggestedTab && suggestions.isError,
                  })}
                </NoDataBlock>
              </DetailsSectionGreyContentContainer>
            )}
          </div>
        )}

        {showPane && (
          <div className={clsx(s.paneCol, !hasSelection && s.paneEmpty)}>
            {isSuggestedTab && selectedSuggested ? (
              <>
                <SuggestedPaneBar
                  suggestion={selectedSuggested}
                  onContact={() => setContactMemberUid(selectedSuggested.memberUid)}
                />
                <MemberProfilePane
                  key={selectedSuggested.memberUid}
                  memberUid={selectedSuggested.memberUid}
                  isLoggedIn={isLoggedIn}
                  section={<SuggestedWhy suggestion={selectedSuggested} />}
                  officeHours={false}
                />
              </>
            ) : !isSuggestedTab && selected ? (
              <>
                <ApplicantsPaneBar
                  applicant={selected}
                  roleTitle={role?.roleTitle ?? ''}
                  position={position}
                  total={shown.length}
                  onStep={step}
                  onToggleReviewed={() => {
                    const reviewed = !selected.reviewed;
                    const base = { team_id: teamId, job_id: role?.uid ?? null, kind: selected.kind };
                    toggleReviewed.mutate(
                      { kind: selected.kind, uid: selected.uid, reviewed },
                      {
                        onSuccess: () => {
                          if (reviewed) analytics.onJobApplicantReviewed(base);
                          else analytics.onJobApplicantReviewUndone(base);
                        },
                        onError: () =>
                          analytics.onJobApplicantReviewFailed({ ...base, action: reviewed ? 'mark' : 'undo' }),
                      },
                    );
                  }}
                  onEmailClick={() =>
                    analytics.onJobApplicantEmailClicked({
                      team_id: teamId,
                      job_id: role?.uid ?? null,
                      kind: selected.kind,
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

      {isSuggestedTab && canEditCriteria && roleCriteria && (
        <EditCriteriaModal
          isOpen={criteriaOpen}
          onClose={() => setCriteriaOpen(false)}
          roleTitle={role?.roleTitle ?? ''}
          criteria={roleCriteria}
          prompt={criteriaPrompt}
          isSaving={saveCriteria.isPending}
          onSave={onSaveCriteria}
        />
      )}

      {isSuggestedTab && contactTarget && (
        <ContactSuggestedModal
          isOpen={!contactTarget.contactedAt}
          onClose={() => setContactMemberUid(null)}
          personName={contactTarget.name}
          roleTitle={role?.roleTitle ?? ''}
          teamName={teamName}
          postingHref={role ? jobDetailPath(role.uid) : null}
          senderName={sender.name}
          senderRole={sender.role}
          draft={contactDrafts[draftKey(contactTarget.memberUid)]}
          onDraftChange={(text) =>
            setContactDrafts((drafts) => ({ ...drafts, [draftKey(contactTarget.memberUid)]: text }))
          }
          isSending={contactSuggested.isPending}
          onSend={(message) => onSendContact(contactTarget, message)}
        />
      )}
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
  isError = false,
}: {
  roles: IJobRole[];
  role: IJobRole | null;
  tab: string;
  term: string;
  isLoading: boolean;
  isError?: boolean;
}) {
  if (!roles.length || !role) return 'This team has no open roles, so there is nobody to read yet.';
  if (isError) return 'Suggested candidates could not be loaded. Try again later.';
  if (isLoading) return 'Loading…';
  if (term) return `Nobody here matches “${term}”.`;
  if (tab === SUGGESTED_TAB) return 'No one to suggest for this role yet.';
  return tab === INTERESTED_TAB ? 'No one has said they’re interested yet.' : 'No one has applied to this role yet.';
}
