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
import back from '@/components/ui/BackButton/BackButton.module.scss';
// The role row's clock + relative date, and its tone override.
import row from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/ReferRoleRow.module.scss';
import rowTone from '../job-board/JobReferRoleRow.module.scss';
import { ClockIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';

import { CvAttachmentLine } from '../profile-shared/StoredCv/CvAttachmentLine';
import { EnvelopeIcon, ReviewCheckIcon } from './icons';
import { ApplicantRow } from './ApplicantRow';
import { ApplicantMemberPage } from './ApplicantMemberPage';
import { Tabs } from '@/components/ui/tabs/Tabs';

import type { RoleApplicant, RoleInterested } from './mocks';
import s from './TeamApplicantsPage.module.scss';

const APPLIED_TAB = 'Applied';
const INTERESTED_TAB = 'Interested';

type Person = RoleApplicant | RoleInterested;
/** A picker option with the role's live unopened count, for its `● M new`. */
type RoleOption = Option & { newCount: number };
const personDate = (p: Person) => ('appliedAt' in p ? p.appliedAt : p.interestedAt);

export interface ApplicantsRole {
  uid: string;
  title: string;
  /** The team's own posting — the same link the role row's ⋯ menu calls "View posting". */
  postingHref?: string;
  /** The role row's meta line: seniority · category · location. */
  meta?: string;
  /** ISO — when the role was posted, for "Posted 2d ago". */
  postedAt?: string;
  applicants: RoleApplicant[];
  /** Pressed "I'm interested" on this role instead of applying. */
  interested: RoleInterested[];
}

interface Props {
  teamName: string;
  roles: ApplicantsRole[];
  /** The role whose count line was pressed. */
  initialRoleUid: string;
  onBack: () => void;
}

/**
 * The team's applicants, as a page of the team's own: the list on the left,
 * the selected person's profile on the right.
 *
 * **Why a page, beside the modal.** The modal answers "who applied?"; it does
 * not answer "which of these fifty should I write to?", because judging each
 * one means opening each one, and a modal that opens fifty tabs is a list that
 * has stopped helping. Contra's and Deel's per-job candidate views keep the
 * list in place and show the person beside it, so a founder steps through
 * applicants the way they would step through an inbox. This is that, on the
 * team's own surface: reached from the count line on the role row, with Back
 * to the profile, and the team's roles in a picker above the split so all of a
 * team's hiring is one place rather than one modal per role.
 *
 * **The role heads its list.** The role's facts (seniority · category ·
 * location · posted) and **View posting** sit at the top of the applicant
 * list, above its search, so the list reads "these people answered this".
 * Chosen from five placements compared side by side (beside the picker, the
 * page header, a role summary card, here, and a narrow list).
 *
 * **The picker is searchable**, because a team can carry ten or more roles and
 * a menu of ten titles is a scan. It is production's searchable toolbar select
 * (`FilterSelect`'s react-select and styles), not a search field bolted into
 * the old `SortDropdown` menu, which has none. It rests white rather than in
 * that control's blue: the blue says "a filter is applied", and choosing which
 * role's applicants to read is not a filter.
 *
 * **The right pane is the member's page, not a new object.** It is
 * `/members/<id>` itself — every section, in production's order and with
 * production's visibility rules (`ApplicantMemberPage`) — because the founder
 * is judging the same person the directory shows. One section is added, under
 * the profile card: the application — when, what they wrote, and the CV that
 * came with it. The pane used to be a slice (header, skills, experience) with
 * a "View full profile ↗" link out for the rest; with the whole page here,
 * that link had nothing left to reach, so it went.
 *
 * **One bar above the pane: where you are, next, and the reply.** Wellfound
 * heads its applicant pane with "1 of 26" and Previous / Next applicant;
 * Workable and Homerun show "2 of 4" with arrows; every ATS reference pins
 * the action (Workable's toolbar, Homerun's top bar, User Interviews' bottom
 * bar). At fifty applicants the founder's question after reading one person
 * is "how many left, and next", and the list beside the pane answers it only
 * by scrolling back to find the row they were on. So the pane opens with a
 * slim sticky row: `2 of 3`, prev / next, and **Email** — the only thing the
 * team does with an application in this product (`{team} can reply to you
 * directly`). It used to sit at the foot of the Application section, and went
 * out of reach the moment the founder scrolled to Experience to check what
 * the note claimed. It is the page's one bar, above the profile card rather
 * than in it, so the card stays production's. No Shortlist / Reject — see
 * `applicantMocks`.
 *
 * **The picker says what is new.** The role row on the profile reads
 * "N applicants · M new"; the picker's options used to say only "(3)". A
 * founder with ten roles is asking which role has something they haven't
 * looked at (Wellfound's job list: "28 applicants to review"), so each option
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
 * Reject, see `applicantMocks`. Seeded from the record, kept here for the
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
 * **Mobile: one column at a time.** The split needs ~900px; below the tablet
 * breakpoint the list shows alone and a row opens the pane full-width with a
 * back to the list, which is how the members grid and its profile relate on a
 * phone already.
 */
export function TeamApplicantsPage({ teamName, roles, initialRoleUid, onBack }: Props) {
  const isMobile = useIsMobile();
  const [roleUid, setRoleUid] = useState(initialRoleUid);
  const [tab, setTab] = useState(APPLIED_TAB);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => new Set());
  // Who the team has marked reviewed — starts from the record's own flags.
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(
    () => new Set(roles.flatMap((r) => [...r.applicants, ...r.interested].filter((p) => p.reviewed).map((p) => p.id))),
  );
  const toggleReviewed = (id: string) =>
    setReviewedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  // Mobile only: whether the pane is showing instead of the list.
  const [paneOpen, setPaneOpen] = useState(false);

  const role = roles.find((r) => r.uid === roleUid) ?? roles[0];
  const newest = useMemo<Person[]>(
    () =>
      [...(tab === INTERESTED_TAB ? role.interested : role.applicants)].sort((a, b) =>
        personDate(b).localeCompare(personDate(a)),
      ),
    [role, tab],
  );
  const term = query.trim().toLowerCase();
  const shown = term
    ? newest.filter((a) => a.name.toLowerCase().includes(term) || a.role.toLowerCase().includes(term))
    : newest;

  // Desktop opens on the newest applicant so the pane is never blank; mobile
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

  /* The team's roles with their applicant counts, searchable. A tab strip was
     here first and fitted the four mocked roles exactly (the tell that it would
     not fit ten); then the board's `SortDropdown`, which lists ten but makes
     you read all ten. Typing into the control filters the titles.

     Transcribed from `FilterSelect` rather than imported for one reason: that
     wrapper takes no `noOptionsMessage`, and react-select's own "No options"
     is library copy, not ours. Portal and fixed menu are what `FilterSelect`
     passes; the styles are its own too, minus the blue — see below. */
  const newCountFor = (r: ApplicantsRole) => r.applicants.filter((a) => a.unseen && !seenIds.has(a.id)).length;
  const roleOptions: RoleOption[] = roles.map((r) => ({
    value: r.uid,
    label: r.applicants.length ? `${r.title} (${r.applicants.length})` : r.title,
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
      <label htmlFor="applicants-role" className={sort.sortByLabel}>
        Role:
      </label>
      <div className={s.rolePicker}>
        <Select
          inputId="applicants-role"
          options={roleOptions}
          value={roleOptions.find((o) => o.value === role.uid) ?? null}
          onChange={(opt) => opt && switchRole(opt.value)}
          isSearchable
          /* The option: the title with its count, then the count line's green
             `● M new` when any of that role's applicants are unopened. */
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
     link, and the same words, as the row's ⋯ menu on the profile, so the exit
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
        'note' in selected ? `Your application for ${role.title}` : `Your interest in ${role.title}`,
      )}`
    : '';

  const paneBar = selected && (
    <div className={s.paneBar}>
      <div className={s.paneNav}>
        <button
          type="button"
          className={clsx(btn.root, btn.small, btn.border, btn.neutral, s.stepBtn)}
          onClick={() => step(-1)}
          disabled={position <= 0}
          aria-label="Previous applicant"
        >
          <CaretLeftIcon width={16} height={16} />
        </button>
        <button
          type="button"
          className={clsx(btn.root, btn.small, btn.border, btn.neutral, s.stepBtn)}
          onClick={() => step(1)}
          disabled={position < 0 || position >= shown.length - 1}
          aria-label="Next applicant"
        >
          <CaretRightIcon width={16} height={16} />
        </button>
        {position >= 0 && (
          <span className={s.position}>
            {position + 1} of {shown.length}
          </span>
        )}
      </div>
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
        <a href={emailHref} className={clsx(btn.root, btn.small, btn.fill, btn.primary, s.actionLink)}>
          <EnvelopeIcon size={14} />
          Email {selected.name.split(' ')[0]}
        </a>
      </div>
    </div>
  );

  return (
    <div className={s.page}>
      {/* BackButton's own chrome on a press that unwinds state rather than a
          route: this page is client state inside the profile prototype. The
          real thing would be /teams/<id>/applicants and the production button. */}
      <button
        type="button"
        className={clsx(back.backBtn, s.back)}
        onClick={isMobile && paneOpen ? () => setPaneOpen(false) : onBack}
      >
        <BackIcon /> {isMobile && paneOpen ? 'All applicants' : `Back to ${teamName}`}
      </button>

      {showList && (
        <header className={s.head}>
          <h1 className={s.title}>Applicants</h1>
          <p className={s.subtitle}>{teamName}</p>
        </header>
      )}

      {showList && <div className={s.roleBar}>{picker}</div>}

      <div className={s.split}>
        {showList && (
          <div className={s.listCol}>
            {/* The role heads the list of people who answered it. */}
            {(roleFacts || postingButton) && (
              <div className={s.listHead}>
                {roleFacts && <p className={s.roleFacts}>{roleFacts}</p>}
                {postingButton}
              </div>
            )}
            <div className={s.tabs}>
              <Tabs
                variant="secondary"
                activeTab={tab}
                onTabClick={switchTab}
                tabs={[
                  { name: APPLIED_TAB, count: role.applicants.length },
                  { name: INTERESTED_TAB, count: role.interested.length },
                ]}
              />
            </div>
            <div className={s.searchWrap}>
              <SearchInput value={query} onChange={setQuery} placeholder="Search by name or role" />
            </div>
            {shown.length ? (
              <div className={s.list}>
                {shown.map((a, index) => (
                  <ApplicantRow
                    key={a.id}
                    applicant={a}
                    isNew={a.unseen && !seenIds.has(a.id)}
                    reviewed={reviewedIds.has(a.id)}
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
                    : tab === INTERESTED_TAB
                      ? 'No one has said they’re interested yet.'
                      : 'No applicants yet.'}
                </NoDataBlock>
              </DetailsSectionGreyContentContainer>
            )}
          </div>
        )}

        {showPane && selected && (
          <div className={s.paneCol}>
            {paneBar}
            <ApplicantMemberPage
              key={selected.id}
              applicant={selected}
              application={
                !('note' in selected) ? (
                  /* The interest press: no note to quote, so the section is its
                   date, the CV when one went with the profile, and the reply. */
                  <DetailsSection>
                    <DetailsSectionHeader title="Interest">
                      <span className={clsx(row.relative, rowTone.relativeTone)}>
                        <ClockIcon />
                        Interested {formatRelativeDays(selected.interestedAt)}
                      </span>
                    </DetailsSectionHeader>
                    {selected.cv && (
                      <DetailsSectionGreyContentContainer>
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
    </div>
  );
}

/* BackButton's glyph, which it doesn't export. */
const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M11 14L5 8L11 2" stroke="#5E718D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
