'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import Select, { type StylesConfig } from 'react-select';

import { formatRelativeDays } from '@/utils/jobs.utils';
import { useIsMobile } from '@/hooks/useIsMobile';

import { SearchInput } from '@/components/common/filters/SearchInput';
import type { Option } from '@/components/form/FormSelect/types';
// Production's searchable toolbar select — `FilterSelect`'s own styles.
import { filterSelectStyles } from '@/components/common/filters/FilterSelect/filterSelectStyles';
// "Role:" keeps the label treatment it had beside the old dropdown.
import sort from '@/components/common/filters/SortDropdown/SortDropdown.module.scss';
import { ArrowUpRightIcon } from '@/components/icons/ArrowUpRightIcon';
import { CaretLeftIcon } from '@/components/icons/CaretLeftIcon';
import { CaretRightIcon } from '@/components/icons/CaretRightIcon';
import {
  DetailsSection,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
  NoDataBlock,
} from '@/components/common/profile/DetailsSection';

import btn from '@/components/common/Button/Button.module.scss';
// The highlighted primary — inset light highlights and a brand glow over the
// flat DS fill. Production hand-rolls it on its headline presses (Demo Day's
// primary action, Office Hours' Schedule Meeting, the forum's Post) in design-
// system tokens; the coded DS `Button` does not carry it. The prototypes keep
// one transcription, on the Follow button, and this imports that class rather
// than writing a second copy.
import fb from '../follow-shared/FollowButton.module.scss';
import back from '@/components/ui/BackButton/BackButton.module.scss';
// The role row's clock + relative date, and its tone override.
import row from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/ReferRoleRow.module.scss';
import rowTone from '../job-board/JobReferRoleRow.module.scss';
import { ClockIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';

import { CvAttachmentLine } from '../profile-shared/StoredCv/CvAttachmentLine';
import { AiSearchIcon } from '@/prototypes/components/AiSearchIcon/AiSearchIcon';
import { EnvelopeIcon, ReviewCheckIcon } from './icons';
import { CandidateRow } from './CandidateRow';
import { CandidateMemberPage } from './CandidateMemberPage';
import { ReachOutModal, type ReachOutSender } from './ReachOutModal';
import { Tabs } from '@/components/ui/tabs/Tabs';

import {
  sortSuggested,
  suggestionMatch,
  visibleSuggested,
  type RoleCandidate,
  type RoleCriterion,
  type RoleInterested,
  type RoleSuggested,
} from './mocks';
import { SuggestedWhy } from './SuggestedWhy';
import { CriteriaModal } from './CriteriaModal';
import { AiBriefModal } from './AiBriefModal';
import s from './TeamCandidatesPage.module.scss';

const APPLIED_TAB = 'Applied';
const INTERESTED_TAB = 'Interested';
const SUGGESTED_TAB = 'Suggested';

export type CandidatesTab = typeof APPLIED_TAB | typeof INTERESTED_TAB | typeof SUGGESTED_TAB;

type Person = RoleCandidate | RoleInterested | RoleSuggested;
const isSuggested = (p: Person): p is RoleSuggested => 'reasons' in p;
/** A picker option with the role's live unopened count, for its `● M new`. */
type RoleOption = Option & { newCount: number };
const personDate = (p: RoleCandidate | RoleInterested) => ('appliedAt' in p ? p.appliedAt : p.interestedAt);

export interface CandidatesRole {
  uid: string;
  title: string;
  /** The team's own posting — the same link the job board's ⋯ menu calls "View posting". */
  postingHref?: string;
  /** The role row's meta line: seniority · category · location. */
  meta?: string;
  /** ISO — when the role was posted, for "Posted 2d ago". */
  postedAt?: string;
  /**
   * A few sentences on the role, from the posting — the reminder a lead
   * landing from an email needs before judging anyone (LAB-2819 review:
   * "which role is this, again?", worst for a team with twenty open).
   */
  summary?: string;
  candidates: RoleCandidate[];
  /** Pressed "I'm interested" on this role instead of applying. */
  interested: RoleInterested[];
  /**
   * Members the product proposes for this role — see `RoleSuggested`. Left
   * out entirely by a host that has no suggestions to make, and the tab is
   * then not drawn.
   */
  suggested?: RoleSuggested[];
  /** What the suggestions are matched against — see `RoleCriterion`. */
  criteria?: RoleCriterion[];
}

const NO_CRITERIA_OFF: ReadonlySet<string> = new Set();

interface Props {
  teamName: string;
  roles: CandidatesRole[];
  /** The role whose count line was pressed. */
  initialRoleUid: string;
  /** The tab to open on: the count line's "N suggested" clause opens Suggested. */
  initialTab?: CandidatesTab;
  /**
   * The person to open on — the suggested-candidates email and notification
   * link a name straight to that member's pane. Ignored when they are not in
   * the opening list (the lead may since have switched a criterion off).
   */
  initialSelectedId?: string;
  onBack: () => void;
  /**
   * What Back is called. "Back to <team>" by default — the page's first home is
   * the team profile. The job board mounts the same page from its owner rows
   * and passes "Back to job board": a Back control names where it goes, and a
   * lead who came from the board is not going to the team's profile.
   */
  backLabel?: string;
  /** The lead writing to a suggested member — their profile goes with the message. */
  sender?: ReachOutSender;
}

/**
 * The team's candidates, as a page of the team's own: the list on the left,
 * the selected person's profile on the right.
 *
 * **Why a page, beside the modal.** The modal answers "who applied?"; it does
 * not answer "which of these fifty should I write to?", because judging each
 * one means opening each one, and a modal that opens fifty tabs is a list that
 * has stopped helping. Contra's and Deel's per-job candidate views keep the
 * list in place and show the person beside it, so a founder steps through
 * candidates the way they would step through an inbox. This is that, on the
 * team's own surface: reached from the count line on the role row, with Back
 * to the profile, and the team's roles in a picker above the split so all of a
 * team's hiring is one place rather than one modal per role.
 *
 * **The role heads its list.** The role's facts (seniority · category ·
 * location · posted) and **View posting** sit at the top of the candidate
 * list, above its search, so the list reads "these people answered this".
 * Chosen from five placements compared side by side (beside the picker, the
 * page header, a role summary card, here, and a narrow list).
 *
 * **The picker is searchable**, because a team can carry ten or more roles and
 * a menu of ten titles is a scan. It is production's searchable toolbar select
 * (`FilterSelect`'s react-select and styles), not a search field bolted into
 * the old `SortDropdown` menu, which has none. It rests white rather than in
 * that control's blue: the blue says "a filter is applied", and choosing which
 * role's candidates to read is not a filter.
 *
 * **The right pane is the member's page, not a new object.** It is
 * `/members/<id>` itself — every section, in production's order and with
 * production's visibility rules (`CandidateMemberPage`) — because the founder
 * is judging the same person the directory shows. One section is added, under
 * the profile card: the application — when, what they wrote, and the CV that
 * came with it. The pane used to be a slice (header, skills, experience) with
 * a "View full profile ↗" link out for the rest; with the whole page here,
 * that link had nothing left to reach, so it went.
 *
 * **One bar above the pane: where you are, next, and the reply.** Wellfound
 * heads its candidate pane with "1 of 26" and Previous / Next candidate;
 * Workable and Homerun show "2 of 4" with arrows; every ATS reference pins
 * the action (Workable's toolbar, Homerun's top bar, User Interviews' bottom
 * bar). At fifty candidates the founder's question after reading one person
 * is "how many left, and next", and the list beside the pane answers it only
 * by scrolling back to find the row they were on. So the pane opens with a
 * slim sticky row: `2 of 3`, prev / next, and **Email** — the only thing the
 * team does with an application in this product (`{team} can reply to you
 * directly`). It used to sit at the foot of the Application section, and went
 * out of reach the moment the founder scrolled to Experience to check what
 * the note claimed. It is the page's one bar, above the profile card rather
 * than in it, so the card stays production's. No Shortlist / Reject — see
 * `candidateMocks`.
 *
 * **The picker says what is new.** The role row on the profile reads
 * "N candidates · M new"; the picker's options used to say only "(3)". A
 * founder with ten roles is asking which role has something they haven't
 * looked at (Wellfound's job list: "28 candidates to review"), so each option
 * carries the count line's own `● M new`, live against what was opened here.
 *
 * **New clears per person, on selection.** An unread row is tinted and marked
 * `● New`; the look is opening the person, so selecting a row returns it to
 * the plain grey and the others keep their tint. Read is the row at rest, not
 * a state with a mark of its own. Session-local here; production would keep
 * it per team member.
 *
 * **Reviewed is the team's own press.** Beside Email in the bar: **Mark as
 * reviewed**, a bordered neutral button that turns into the state itself
 * (`✓ Reviewed`, the DS success pair) and back on a second press — the same
 * switch shape as a listing's Mark inactive / Bring back, no confirm because
 * the undo is the button it turns into. The row in the list carries the same
 * green check. This is not the "viewed" mark lesson 21 removed: that was the
 * product reading an open back to the founder as a stage; this is the founder
 * saying they have dealt with someone, which an open cannot say (stepping
 * past a row opens it too). Still one tick, not a pipeline — no Shortlist /
 * Reject, see `candidateMocks`. Seeded from the record, kept here for the
 * session.
 *
 * **Applied / Interested.** Two tabs above the search, per role: the people who
 * applied, and the people who pressed **I'm interested** on the board
 * (`InterestStrip`) instead. They sit in tabs, not one merged list, because
 * they are two different acts. An application has a note and asks for a
 * reply. An interest press is a bare signal. Same row and same pane for both:
 * the interested row has no note, and its pane's section is Interest rather
 * than Application. It is production's `Tabs` `variant="secondary"` with a
 * count, which is the board's own Applied scope strip.
 *
 * **Suggested — the third tab, and the weakest signal.** The strip reads left
 * to right down a scale of intent: applied (sent something), interested
 * (raised a hand), suggested (did nothing; the product is proposing them).
 * Braintrust ("Invite Talent" beside Applications), Dribbble (Recommended /
 * Submissions) and Fiverr (Invite freelancers / Offers) all keep matched
 * people in the candidates' own strip rather than on a page of their own.
 * Three differences from the other two tabs, all from that one fact:
 *   - **A band over its working.** Each row ends in the match — *Strong
 *     match* or *Good match*, read off the share of the role's requirements
 *     the profile meets (a percentage was shown first and corrected: on a
 *     five-item checklist it is a grade with four possible values) — and the
 *     pane's "Why suggested" lists every requirement with a check or a fade
 *     so the claim can be checked. Requirements come from the posting; the
 *     lead can switch them off in **Edit criteria** (Workable's "Manage
 *     matching criteria"), and nobody under the floor is suggested at all.
 *     What the network knows (an interest press, shared work) is *not* in the
 *     band: it is the row's last line and the pane's first block. See
 *     `suggestedMocks.ts`.
 *   - **The count on the row, the working in the pane (LAB-2687, trimmed in
 *     LAB-2819).** Each row says "4 of 5 requirements"; the pane's Why we
 *     suggested lists every requirement with the profile fact that meets it
 *     or "Not on their profile", with Edit criteria in its header. The list
 *     no longer repeats the criteria as a "Matched on …" line — the pane
 *     names them where they can be checked. Criteria are the POC's own (LAB-2643: 4–6 checkable skill / seniority / location
 *     statements) plus a short label this design asks it to write.
 *   - **Landing.** The suggested-candidates email and the bell notification
 *     open this page on the role with Suggested open (`initialTab`), and a
 *     name in the email opens that person (`initialSelectedId`).
 *   - **Sorted by the share the band is read off, not by date** — nothing
 *     happened, so there is no date, and a Good match above a Strong one
 *     reads as a bug. One spine, no top-N band; ties go to the stronger
 *     network signal. Applied and Interested stay newest-first: those people
 *     chose to be here, and re-ranking them by our guess would bury someone
 *     the founder owes a look.
 *   - **Rate, then contact — two separate acts (LAB-2819).** The bar carries
 *     **Good match** and **Not a match**, a pair of switches, and **Contact
 *     <name>** beside them past a divider. Rating tells the matcher whether it
 *     was right and writes to nobody; Contact opens ReachOutModal —
 *     the apply flow's message step run the other way, sent through the
 *     platform) and records no rating. "Not a match" opens one optional
 *     free-text "What didn't fit?" under the bar. The rating is the team's
 *     working, never shown to the member. (Review 2026-10-13: Anuj would drop
 *     the rating for v1; Polina kept it, optional, beside the one action.)
 *   - **The short card.** A suggested person's pane is the profile card,
 *     bio, Why we suggested, the CV if they stored one, and Experience —
 *     no scroll to decide. Contact details and the rest are behind Full
 *     profile ↗ (`CandidateMemberPage`'s `compact`).
 * The note under the tabs says the one thing nothing else on the page can:
 * these members are in the network and haven't applied.
 *
 * **Mobile: one column at a time.** The split needs ~900px; below the tablet
 * breakpoint the list shows alone and a row opens the pane full-width with a
 * back to the list, which is how the members grid and its profile relate on a
 * phone already.
 */
export function TeamCandidatesPage({
  teamName,
  roles,
  initialRoleUid,
  initialTab,
  initialSelectedId,
  onBack,
  backLabel,
  sender,
}: Props) {
  const isMobile = useIsMobile();
  const [roleUid, setRoleUid] = useState(initialRoleUid);
  const [tab, setTab] = useState<string>(initialTab ?? APPLIED_TAB);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => new Set());
  // Who the team has marked reviewed — starts from the record's own flags.
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(
    () => new Set(roles.flatMap((r) => [...r.candidates, ...r.interested].filter((p) => p.reviewed).map((p) => p.id))),
  );
  const toggleReviewed = (id: string) =>
    setReviewedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  // The lead's rating of each suggestion, and an optional note on a miss —
  // session-local, like `seenIds`. Pressing the pressed rating clears it.
  const [ratings, setRatings] = useState<Record<string, SuggestionRating>>({});
  const rate = (id: string, verdict: SuggestionRating['verdict']) =>
    setRatings((prev) => {
      const next = { ...prev };
      if (prev[id]?.verdict === verdict) delete next[id];
      else next[id] = { verdict };
      return next;
    });
  const setMissNote = (id: string, note: string) => setRatings((prev) => ({ ...prev, [id]: { verdict: 'not', note } }));
  // Who the lead has messaged, and when; drafts kept per person so closing
  // the modal never costs what was typed. Session-local, like `seenIds`.
  const [messagedAt, setMessagedAt] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [reachOutOpen, setReachOutOpen] = useState(false);
  // Mobile only: whether the pane is showing instead of the list.
  // A link to one person (the email's names) opens on their pane there too.
  const [paneOpen, setPaneOpen] = useState(Boolean(initialSelectedId));
  // Criteria the lead has switched off, per role — session-local; production
  // would keep it on the listing.
  const [criteriaOff, setCriteriaOff] = useState<Record<string, ReadonlySet<string>>>({});
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  // The lead's free-text prompt for the matcher, per role (CriteriaModal).
  const [criteriaPrompt, setCriteriaPrompt] = useState<Record<string, string>>({});

  const role = roles.find((r) => r.uid === roleUid) ?? roles[0];
  const criteria = role.criteria ?? [];
  const off = criteriaOff[role.uid] ?? NO_CRITERIA_OFF;
  // Members at or above the floor against the criteria that are on.
  const suggestedShown = useMemo(
    () => visibleSuggested(role.suggested ?? [], criteria, off),
    [role.suggested, criteria, off],
  );
  const newest = useMemo<Person[]>(
    () =>
      tab === SUGGESTED_TAB
        ? sortSuggested(suggestedShown, criteria, off)
        : [...(tab === INTERESTED_TAB ? role.interested : role.candidates)].sort((a, b) =>
            personDate(b).localeCompare(personDate(a)),
          ),
    [role, tab, suggestedShown, criteria, off],
  );
  // Suggested has no search field, so a term typed on another tab can't filter it.
  const term = tab === SUGGESTED_TAB ? '' : query.trim().toLowerCase();
  const shown = term
    ? newest.filter((a) => a.name.toLowerCase().includes(term) || a.role.toLowerCase().includes(term))
    : newest;

  // Desktop opens on the newest candidate so the pane is never blank; mobile
  // opens on the list, because the pane is a second screen there.
  useEffect(() => {
    if (!isMobile && !selectedId && newest[0]) {
      // Opening on someone is looking at them: the pane shows the person, so
      // the row's mark goes the same way it would on a press.
      setSelectedId(newest[0].id);
      setSeenIds((prev) => new Set(prev).add(newest[0].id));
    }
  }, [isMobile, selectedId, newest]);

  const selected = shown.find((a) => a.id === selectedId) ?? newest.find((a) => a.id === selectedId) ?? null;

  const select = (a: Person) => {
    setSelectedId(a.id);
    setSeenIds((prev) => new Set(prev).add(a.id));
    if (isMobile) setPaneOpen(true);
  };

  const switchRole = (uid: string) => {
    if (uid === role.uid) return;
    setRoleUid(uid);
    setSelectedId(null);
    setQuery('');
    setPaneOpen(false);
  };

  const switchTab = (next: string) => {
    if (next === tab) return;
    setTab(next);
    setSelectedId(null);
    setQuery('');
    setPaneOpen(false);
  };

  const showList = !isMobile || !paneOpen;
  const showPane = !isMobile || paneOpen;

  /* The team's roles with their candidate counts, searchable. A tab strip was
     here first and fitted the four mocked roles exactly (the tell that it would
     not fit ten); then the board's `SortDropdown`, which lists ten but makes
     you read all ten. Typing into the control filters the titles.

     Transcribed from `FilterSelect` rather than imported for one reason: that
     wrapper takes no `noOptionsMessage`, and react-select's own "No options"
     is library copy, not ours. Portal and fixed menu are what `FilterSelect`
     passes; the styles are its own too, minus the blue — see below. */
  const newCountFor = (r: CandidatesRole) => r.candidates.filter((a) => a.unseen && !seenIds.has(a.id)).length;
  const roleOptions: RoleOption[] = roles.map((r) => ({
    value: r.uid,
    label: r.candidates.length ? `${r.title} (${r.candidates.length})` : r.title,
    newCount: newCountFor(r),
  }));

  /* White at rest, not `filterSelectStyles`' blue. That blue is its "a filter is
     applied" state, and it keys off `hasValue` — which a role picker always
     has, so the control would be permanently blue for a choice that is not a
     filter. Every value here is that same stylesheet's own *unselected* branch
     (white fill, the pale border, #5E718D + ring on hover/focus/open, neutral
     text and caret), which is also exactly how production's founder-guides
     "Viewing as:" scope select — the one `filterSelectStyles` says it matches —
     draws a select that always holds a value. Menu, options and portal stay
     `filterSelectStyles`'. */
  const roleSelectStyles: StylesConfig<RoleOption, false> = {
    ...(filterSelectStyles as unknown as StylesConfig<RoleOption, false>),
    control: (base, state) => ({
      ...base,
      borderRadius: '8px',
      border: `1px solid ${state.isFocused || state.menuIsOpen ? '#5E718D' : 'rgba(203, 213, 225, 0.50)'}`,
      boxShadow: state.isFocused || state.menuIsOpen ? '0 0 0 4px rgba(27, 56, 96, 0.12)' : 'none',
      background: 'var(--background-base-white, #fff)',
      fontSize: '14px',
      color: 'var(--foreground-neutral-secondary, #455468)',
      minHeight: '40px',
      cursor: 'pointer',
      '&:hover': {
        borderColor: '#5E718D',
        boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12)',
      },
    }),
    singleValue: (base) => ({ ...base, color: 'var(--foreground-neutral-secondary, #455468)', fontWeight: 400 }),
    dropdownIndicator: (base) => ({ ...base, color: 'var(--foreground-neutral-secondary, #455468)', padding: '0 8px' }),
  };
  const picker = (
    <div className={clsx(sort.sortGroup, s.roleGroup)}>
      <label htmlFor="candidates-role" className={sort.sortByLabel}>
        Role:
      </label>
      <div className={s.rolePicker}>
        <Select
          inputId="candidates-role"
          options={roleOptions}
          value={roleOptions.find((o) => o.value === role.uid) ?? null}
          onChange={(opt) => opt && switchRole(opt.value)}
          isSearchable
          /* The option: the title with its count, then the count line's green
             `● M new` when any of that role's candidates are unopened. */
          formatOptionLabel={(opt) => (
            <span className={s.roleOption}>
              <span className={s.roleOptionLabel}>{opt.label}</span>
              {opt.newCount > 0 && <span className={row.newBadge}>● {opt.newCount} new</span>}
            </span>
          )}
          noOptionsMessage={({ inputValue }) => `No roles match “${inputValue.trim()}”`}
          styles={roleSelectStyles}
          menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
          menuPosition="fixed"
        />
      </div>
    </div>
  );

  /* The posting itself, one press from the people who answered it — the same
     link, and the same words, as the board's own ⋯ menu, so the exit
     reads the same on both surfaces. */
  const postingButton = role.postingHref ? (
    <a
      href={role.postingHref}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(btn.root, btn.small, btn.border, btn.neutral, s.actionLink)}
    >
      View posting
      <ArrowUpRightIcon width={14} height={14} />
    </a>
  ) : null;

  /* The role row's own facts, at the head of the list beside the posting:
     seniority · category · location, then its age. */
  const roleFacts = [role.meta, role.postedAt ? `Posted ${formatRelativeDays(role.postedAt)}` : null]
    .filter(Boolean)
    .join(' · ');

  /* Where the selected person sits in the list as shown (the search narrows
     it), for "2 of 3" and the two steps. Stepping is selecting, so it marks
     the row opened the same way a press does. */
  const position = selected ? shown.findIndex((a) => a.id === selected.id) : -1;
  const step = (delta: number) => {
    const next = shown[position + delta];
    if (next) select(next);
  };
  const emailHref = selected
    ? `mailto:${selected.email}?subject=${encodeURIComponent(
        isSuggested(selected)
          ? `Our ${role.title} role at ${teamName}`
          : 'note' in selected
            ? `Your application for ${role.title}`
            : `Your interest in ${role.title}`,
      )}`
    : '';
  const rating = selected ? ratings[selected.id] : undefined;
  /* The page's one filled press, so it wears the product's headline-primary
     treatment (`fb.glossy`) — see the import. */
  const emailButton = selected && (
    <a href={emailHref} className={clsx(btn.root, btn.small, btn.fill, btn.primary, fb.glossy, s.actionLink)}>
      <EnvelopeIcon size={14} />
      Email {selected.name.split(' ')[0]}
    </a>
  );

  const paneBar = selected && (
    <div className={s.paneBar} data-tour="candidate-actions">
      <div className={s.paneNav}>
        <button
          type="button"
          className={clsx(btn.root, btn.small, btn.border, btn.neutral, s.stepBtn)}
          onClick={() => step(-1)}
          disabled={position <= 0}
          aria-label="Previous candidate"
        >
          <CaretLeftIcon width={16} height={16} />
        </button>
        <button
          type="button"
          className={clsx(btn.root, btn.small, btn.border, btn.neutral, s.stepBtn)}
          onClick={() => step(1)}
          disabled={position < 0 || position >= shown.length - 1}
          aria-label="Next candidate"
        >
          <CaretRightIcon width={16} height={16} />
        </button>
        {position >= 0 && (
          <span className={s.position}>
            {position + 1} of {shown.length}
          </span>
        )}
      </div>
      {isSuggested(selected) ? (
        <div className={s.paneActions}>
          {/* The rating, apart from the contact (LAB-2819): a pair of switches
              the lead can press without writing to anyone, and Email beside
              them that records nothing. A divider keeps them two groups. */}
          <div className={s.ratingGroup} role="group" aria-label="Rate this match">
            <button
              type="button"
              className={clsx(btn.root, btn.small, btn.border, btn.neutral, s.reviewBtn, {
                [s.isReviewed]: rating?.verdict === 'good',
              })}
              onClick={() => rate(selected.id, 'good')}
              aria-pressed={rating?.verdict === 'good'}
            >
              <ReviewCheckIcon
                size={16}
                state={rating?.verdict === 'good' ? 'filled' : 'outline'}
                className={s.reviewIcon}
              />
              Good match
            </button>
            <button
              type="button"
              className={clsx(btn.root, btn.small, btn.border, btn.neutral, s.reviewBtn, s.notMatchBtn, {
                [s.isNotMatch]: rating?.verdict === 'not',
              })}
              onClick={() => rate(selected.id, 'not')}
              aria-pressed={rating?.verdict === 'not'}
            >
              <NotMatchIcon filled={rating?.verdict === 'not'} />
              Not a match
            </button>
          </div>
          <span className={s.actionsDivider} aria-hidden="true" />
          {/* The one thing to do with a suggestion: write to them through the
              platform (ReachOutModal). Once sent it is a status, not a press. */}
          {messagedAt[selected.id] ? (
            <span
              className={clsx(btn.root, btn.small, btn.border, btn.neutral, s.reviewBtn, s.isReviewed, s.sentStatus)}
              role="status"
            >
              <ReviewCheckIcon size={16} state="filled" className={s.reviewIcon} />
              Contacted
            </span>
          ) : (
            <button
              type="button"
              className={clsx(btn.root, btn.small, btn.fill, btn.primary, fb.glossy, s.actionLink)}
              onClick={() => setReachOutOpen(true)}
            >
              <EnvelopeIcon size={14} />
              Contact {selected.name.split(' ')[0]}
            </button>
          )}
        </div>
      ) : (
        <div className={s.paneActions}>
          {/* The status as a switch: press to mark, press again to unmark. Email
            stays the bar's only brand press; this one is bordered neutral at
            rest and wears the success pair once on. */}
          <button
            type="button"
            className={clsx(btn.root, btn.small, btn.border, btn.neutral, s.reviewBtn, {
              [s.isReviewed]: reviewedIds.has(selected.id),
            })}
            onClick={() => toggleReviewed(selected.id)}
            aria-pressed={reviewedIds.has(selected.id)}
            title={reviewedIds.has(selected.id) ? 'Press to unmark' : undefined}
          >
            <ReviewCheckIcon
              size={16}
              state={reviewedIds.has(selected.id) ? 'filled' : 'outline'}
              className={s.reviewIcon}
            />
            {reviewedIds.has(selected.id) ? 'Reviewed' : 'Mark as reviewed'}
          </button>
          {emailButton}
        </div>
      )}
    </div>
  );

  /* What didn't fit — optional, under the bar, only once "Not a match" is
     pressed. Free text rather than five reason chips (design review
     2026-10-13): the chips guessed the reasons for the lead, and a few words
     of their own are what can actually change the criteria. Kept as typed. */
  const missNote = selected && isSuggested(selected) && rating?.verdict === 'not' && (
    <div className={s.reasonStrip}>
      <label htmlFor="miss-note" className={s.reasonLabel}>
        What didn’t fit? <span className={s.reasonOptional}>Optional</span>
      </label>
      <input
        id="miss-note"
        className={s.missInput}
        value={rating.note ?? ''}
        onChange={(e) => setMissNote(selected.id, e.target.value)}
        placeholder="e.g. needs more protocol work"
        maxLength={280}
      />
    </div>
  );

  return (
    <div className={s.page}>
      {/* BackButton's own chrome on a press that unwinds state rather than a
          route: this page is client state inside the profile prototype. The
          real thing would be /teams/<id>/candidates and the production button. */}
      <button
        type="button"
        className={clsx(back.backBtn, s.back)}
        onClick={isMobile && paneOpen ? () => setPaneOpen(false) : onBack}
      >
        <BackIcon /> {isMobile && paneOpen ? 'All candidates' : (backLabel ?? `Back to ${teamName}`)}
      </button>

      {showList && (
        <header className={s.head}>
          <h1 className={s.title}>Candidates</h1>
          <p className={s.subtitle}>{teamName}</p>
        </header>
      )}

      {showList && <div className={s.roleBar}>{picker}</div>}

      <div className={s.split}>
        {showList && (
          <div className={s.listCol}>
            {/* The role heads the list of people who answered it. */}
            {/* The role heads the list of people who answered it — its
                title, its facts and a few sentences from the posting, so a
                lead who arrives from an email knows which role this is before
                judging anyone against it. */}
            <div className={s.listHead}>
              <div className={s.roleSummary}>
                <h2 className={s.roleTitle}>{role.title}</h2>
                {roleFacts && <p className={s.roleFacts}>{roleFacts}</p>}
                {role.summary && <p className={s.roleDesc}>{role.summary}</p>}
              </div>
              {postingButton}
            </div>
            <div className={s.tabs}>
              <Tabs
                variant="secondary"
                activeTab={tab}
                onTabClick={switchTab}
                tabs={[
                  { name: APPLIED_TAB, count: role.candidates.length },
                  { name: INTERESTED_TAB, count: role.interested.length },
                  ...(role.suggested ? [{ name: SUGGESTED_TAB, count: suggestedShown.length }] : []),
                ]}
              />
            </div>
            {/* What this list is — dev staging's copy: how many, that nobody on
                it applied, and who is left out (the team's own people). */}
            {tab === SUGGESTED_TAB && (
              <div className={s.suggestedNote}>
                <p className={s.tabNote}>
                  {suggestedShown.length === 1
                    ? 'The top member matched to this role on their profile.'
                    : `The top ${suggestedShown.length} members matched to this role on their profile.`}{' '}
                  They haven’t applied. People who worked at {teamName} are not suggested.
                </p>
                {/* The role-level lever beside the list it re-ranks; Edit
                    criteria stays on the person's "Why we suggested". Once
                    written, the brief itself is the label, so the lead can
                    see what the AI was told without opening it. */}
                {(() => {
                  const brief = criteriaPrompt[role.uid];
                  return (
                    <button type="button" className={s.briefDoor} onClick={() => setBriefOpen(true)}>
                      <AiSearchIcon size={14} />
                      {brief ? (
                        <>
                          <span className={s.briefText}>“{brief}”</span>
                          <span className={s.briefEdit}>Edit</span>
                        </>
                      ) : (
                        <span>Brief the AI on who you’re looking for</span>
                      )}
                    </button>
                  );
                })()}
              </div>
            )}
            {/* The Suggested tab has no search: it holds the top five, and five
                names need no filtering. Its one control is the door to what the
                AI matches against — a bordered button carrying the product's AI
                mark and saying "AI" in its label, so the lead knows these are
                the matcher's criteria (and its prompt), not a filter of their
                own. Under the note, on the list's left edge. Grey, not brand:
                Contact is the page's one brand press. */}
            {tab === SUGGESTED_TAB ? (
              criteria.length > 0 && (
                <div className={s.criteriaRow}>
                  <button
                    type="button"
                    className={clsx(btn.root, btn.small, btn.border, btn.neutral, s.criteriaBtn)}
                    onClick={() => setCriteriaOpen(true)}
                  >
                    <AiSearchIcon size={16} className={s.criteriaIcon} />
                    Edit AI criteria
                  </button>
                </div>
              )
            ) : (
              <div className={s.searchWrap}>
                <SearchInput value={query} onChange={setQuery} placeholder="Search by name or role" />
              </div>
            )}
            {shown.length ? (
              <div className={s.list} data-tour="candidate-list">
                {shown.map((a, index) => (
                  <CandidateRow
                    key={a.id}
                    candidate={a}
                    isNew={!isSuggested(a) && a.unseen && !seenIds.has(a.id)}
                    reviewed={reviewedIds.has(a.id)}
                    rating={isSuggested(a) ? ratings[a.id]?.verdict : undefined}
                    messagedAt={messagedAt[a.id]}
                    match={isSuggested(a) ? suggestionMatch(a, criteria, off) : undefined}
                    last={index === shown.length - 1}
                    selected={!isMobile && a.id === selectedId}
                    onSelect={() => select(a)}
                  />
                ))}
              </div>
            ) : (
              <DetailsSectionGreyContentContainer>
                <NoDataBlock>
                  {term
                    ? `No one matches “${query.trim()}”.`
                    : tab === SUGGESTED_TAB
                      ? 'No one to suggest for this role yet.'
                      : tab === INTERESTED_TAB
                        ? 'No one has said they’re interested yet.'
                        : 'No candidates yet.'}
                </NoDataBlock>
              </DetailsSectionGreyContentContainer>
            )}
          </div>
        )}

        {showPane && selected && (
          <div className={s.paneCol}>
            {paneBar}
            {missNote}
            <CandidateMemberPage
              key={selected.id}
              candidate={selected}
              compact={isSuggested(selected) ? { fullProfileHref: '/prototypes/member-profile' } : undefined}
              application={
                isSuggested(selected) ? (
                  /* Why they are here, in full and strongest first — the
                     section this tab has where the others have Application or
                     Interest. Plain sentences off profile facts; the sections
                     below are where each one can be checked. */
                  <SuggestedWhy
                    person={selected}
                    criteria={criteria}
                    off={off}
                    match={suggestionMatch(selected, criteria, off)}
                  />
                ) : !('note' in selected) ? (
                  /* The interest press: its date, the note when the candidate
                   wrote one, and the CV when one went with the profile.
                   LAB-2713: no note → no description, no placeholder, no empty
                   block — the header's date is the whole report. */
                  <DetailsSection>
                    <DetailsSectionHeader title="Interest">
                      <span className={clsx(row.relative, rowTone.relativeTone)}>
                        <ClockIcon />
                        Interested {formatRelativeDays(selected.interestedAt)}
                      </span>
                    </DetailsSectionHeader>
                    {(selected.comment || selected.cv) && (
                      <DetailsSectionGreyContentContainer>
                        {selected.comment && <p className={s.noteFull}>{selected.comment}</p>}
                        {selected.cv && (
                          <a href={selected.cv.url} target="_blank" rel="noopener noreferrer" className={s.cvLink}>
                            <CvAttachmentLine
                              cv={{
                                fileName: selected.cv.name,
                                size: selected.cv.size,
                                uploadedAt: selected.interestedAt,
                              }}
                              variant="chip"
                            />
                          </a>
                        )}
                      </DetailsSectionGreyContentContainer>
                    )}
                  </DetailsSection>
                ) : (
                  /* The application — the only section this page has that the
                 member page doesn't. The reply lives here, under what it
                 answers, so the profile card above stays production's. */
                  <DetailsSection>
                    <DetailsSectionHeader title="Application">
                      <span className={clsx(row.relative, rowTone.relativeTone)}>
                        <ClockIcon />
                        Applied {formatRelativeDays(selected.appliedAt)}
                      </span>
                    </DetailsSectionHeader>
                    <DetailsSectionGreyContentContainer>
                      <p className={s.noteFull}>{selected.note}</p>
                      {selected.cv && (
                        <a href={selected.cv.url} target="_blank" rel="noopener noreferrer" className={s.cvLink}>
                          <CvAttachmentLine
                            cv={{ fileName: selected.cv.name, size: selected.cv.size, uploadedAt: selected.appliedAt }}
                            variant="chip"
                          />
                        </a>
                      )}
                    </DetailsSectionGreyContentContainer>
                  </DetailsSection>
                )
              }
            />
          </div>
        )}
      </div>

      {selected && isSuggested(selected) && sender && (
        <ReachOutModal
          open={reachOutOpen}
          onClose={() => setReachOutOpen(false)}
          personName={selected.name}
          roleTitle={role.title}
          teamName={teamName}
          postingHref={role.postingHref}
          sender={sender}
          draft={drafts[selected.id]}
          onDraftChange={(text) => setDrafts((prev) => ({ ...prev, [selected.id]: text }))}
          onSend={() => {
            setMessagedAt((prev) => ({ ...prev, [selected.id]: new Date().toISOString() }));
            setReachOutOpen(false);
          }}
        />
      )}

      {role.suggested && (
        <AiBriefModal
          open={briefOpen}
          onClose={() => setBriefOpen(false)}
          roleTitle={role.title}
          prompt={criteriaPrompt[role.uid] ?? ''}
          onSave={(prompt) => setCriteriaPrompt((prev) => ({ ...prev, [role.uid]: prompt }))}
        />
      )}

      {role.suggested && criteria.length > 0 && (
        <CriteriaModal
          open={criteriaOpen}
          onClose={() => setCriteriaOpen(false)}
          roleTitle={role.title}
          criteria={criteria}
          people={role.suggested}
          off={off}
          onSave={(next) => {
            setCriteriaOff((prev) => ({ ...prev, [role.uid]: next }));
            // The person in the pane may have dropped below the floor.
            setSelectedId(null);
          }}
        />
      )}
    </div>
  );
}

/** A lead's rating of one suggestion; `note` only on a miss, and optional there. */
interface SuggestionRating {
  verdict: 'good' | 'not';
  note?: string;
}

/* "Not a match"'s glyph — a ring with a dash, the counterpart of Good match's
   ring with a check (`ReviewCheckIcon`), filled grey once pressed. A dash, not
   the DS ✕: the ✕ means dismiss everywhere else, and the person stays in the
   list. */
const NotMatchIcon = ({ filled }: { filled: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={s.notMatchIcon}>
    <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.4" fill={filled ? 'currentColor' : 'none'} />
    <path d="M5.5 8h5" stroke={filled ? '#fff' : 'currentColor'} strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

/* BackButton's glyph, which it doesn't export. */
const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M11 14L5 8L11 2" stroke="#5E718D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
