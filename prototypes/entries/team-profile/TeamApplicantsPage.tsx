'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import type { IMember } from '@/types/members.types';
import type { IUserInfo } from '@/types/shared.types';
import { formatRelativeDays } from '@/utils/jobs.utils';
import { useIsMobile } from '@/hooks/useIsMobile';

import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { ArrowUpRightIcon } from '@/components/icons/ArrowUpRightIcon';
import { TagsList } from '@/components/common/profile/TagsList';
import {
  DetailsSection,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
  NoDataBlock,
} from '@/components/common/profile/DetailsSection';
import { ExperiencesList } from '@/components/page/member-details/ExperienceDetails/components/ExperienceDetailsView/components/ExperiencesList';

// The member profile's header chrome, as the member-profile prototype wears it:
// 48px avatar, name, team · role · location, the tag row.
import h from '@/components/page/member-details/MemberDetailHeader/MemberDetailHeader.module.scss';
import profile from '@/components/page/member-details/ProfileDetails/ProfileDetails.module.scss';
import btn from '@/components/common/Button/Button.module.scss';
import back from '@/components/ui/BackButton/BackButton.module.scss';
// The role row's clock + relative date, and its tone override.
import row from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/ReferRoleRow.module.scss';
import rowTone from '../job-board/JobReferRoleRow.module.scss';
import { ClockIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';

import { CvAttachmentLine } from '../profile-shared/StoredCv/CvAttachmentLine';
import { EnvelopeIcon } from './icons';
import { ApplicantRow } from './ApplicantRow';
import type { RoleApplicant } from './mocks';
import s from './TeamApplicantsPage.module.scss';

export interface ApplicantsRole {
  uid: string;
  title: string;
  /** The team's own posting — the same link the role row's ⋯ menu calls "View posting". */
  postingHref?: string;
  applicants: RoleApplicant[];
}

interface Props {
  teamName: string;
  roles: ApplicantsRole[];
  /** The role whose count line was pressed. */
  initialRoleUid: string;
  onBack: () => void;
}

/* `ExperiencesList` takes a member and a viewer it never reads for a read-only
   list; the member-profile prototype passes the same casts. */
const NO_MEMBER = {} as unknown as IMember;
const VIEWER = { uid: 'viewer', name: 'Viewer', email: 'viewer@pl.org' } as unknown as IUserInfo;

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
 * **The right pane is the member's profile, not a new object.** Its header is
 * `MemberDetailHeader`'s chrome and its Experience block is production's
 * `ExperiencesList`, because the founder is reading the same person the
 * directory shows — plus the one section only this page has, the application
 * itself: when, what they wrote, and the CV that came with it. The link out
 * to the full profile stays, in a new tab, for everything the pane doesn't
 * carry.
 *
 * **One action: Email.** It is the only thing the team does with an
 * application in this product (`{team} can reply to you directly`), so it is
 * the pane's one filled button. No Shortlist / Reject — see `applicantMocks`.
 *
 * **New clears per person, on selection.** An unread row is tinted and marked
 * `● New`; the look is opening the person, so selecting a row returns it to
 * the plain grey and the others keep their tint. Read is the row at rest, not
 * a state with a mark of its own. Session-local here; production would keep
 * it per team member.
 *
 * **Mobile: one column at a time.** The split needs ~900px; below the tablet
 * breakpoint the list shows alone and a row opens the pane full-width with a
 * back to the list, which is how the members grid and its profile relate on a
 * phone already.
 */
export function TeamApplicantsPage({ teamName, roles, initialRoleUid, onBack }: Props) {
  const isMobile = useIsMobile();
  const [roleUid, setRoleUid] = useState(initialRoleUid);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => new Set());
  // Mobile only: whether the pane is showing instead of the list.
  const [paneOpen, setPaneOpen] = useState(false);

  const role = roles.find((r) => r.uid === roleUid) ?? roles[0];
  const newest = useMemo(
    () => [...role.applicants].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)),
    [role],
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

  const select = (a: RoleApplicant) => {
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

  const showList = !isMobile || !paneOpen;
  const showPane = !isMobile || paneOpen;

  return (
    <div className={s.page}>
      {/* BackButton's own chrome on a press that unwinds state rather than a
          route: this page is client state inside the profile prototype. The
          real thing would be /teams/<id>/applicants and the production button. */}
      <button type="button" className={clsx(back.backBtn, s.back)} onClick={isMobile && paneOpen ? () => setPaneOpen(false) : onBack}>
        <BackIcon /> {isMobile && paneOpen ? 'All applicants' : `Back to ${teamName}`}
      </button>

      {showList && (
        <header className={s.head}>
          <h1 className={s.title}>Applicants</h1>
          <p className={s.subtitle}>{teamName}</p>
        </header>
      )}

      {showList && (
        <div className={s.roleBar}>
          {/* The product's toolbar picker (the board's "Sort by:"), holding the
              team's roles with their counts — a tab strip was here first and
              fitted the four mocked roles exactly, which is the tell that it
              would not fit ten. */}
          <SortDropdown
            sortByLabel="Role:"
            className={s.rolePicker}
            options={roles.map((r) => ({
              value: r.uid,
              label: r.applicants.length ? `${r.title} (${r.applicants.length})` : r.title,
            }))}
            currentSort={role.uid}
            onSortChange={switchRole}
          />
          {/* The posting itself, one press from the people who answered it —
              the same link, and the same words, as the row's ⋯ menu on the
              profile, so the exit reads the same on both surfaces. */}
          {role.postingHref && (
            <a
              href={role.postingHref}
              target="_blank"
              rel="noopener noreferrer"
              className={clsx(btn.root, btn.small, btn.border, btn.neutral, s.actionLink)}
            >
              View posting
              <ArrowUpRightIcon width={14} height={14} />
            </a>
          )}
        </div>
      )}

      <div className={s.split}>
        {showList && (
          <div className={s.listCol}>
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
                    last={index === shown.length - 1}
                    selected={!isMobile && a.id === selectedId}
                    onSelect={() => select(a)}
                  />
                ))}
              </div>
            ) : (
              <DetailsSectionGreyContentContainer>
                <NoDataBlock>{term ? `No applicants match “${query.trim()}”.` : 'No applicants yet.'}</NoDataBlock>
              </DetailsSectionGreyContentContainer>
            )}
          </div>
        )}

        {showPane && selected && (
          <div className={s.pane}>
            {/* Profile header — MemberDetailHeader's chrome, as the member-profile
                prototype composes it. */}
            <div className={profile.root}>
              <div className={h.header}>
                <div className={h.headerProfile}>
                  <img className={h.headerProfileImg} src={selected.avatar} alt={selected.name} />
                </div>
                <div className={h.headerDetails}>
                  <div>
                    <div className={h.specificsHdr}>
                      <h2 className={h.specificsName}>{selected.name}</h2>
                    </div>
                    <div className={h.roleAndLocation}>
                      <div className={h.teams}>
                        <p className={h.teamsName}>{selected.team}</p>
                      </div>
                      <div className={clsx(h.divider, h.desktopOnly)} />
                      <p className={h.role}>{selected.title}</p>
                      <div className={h.divider} />
                      <div className={h.location}>
                        <LocationIcon />
                        <p className={h.locationName}>{selected.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={h.tags}>
                  <TagsList tags={selected.skills.map((title) => ({ title }))} tagsToShow={5} />
                </div>
              </div>

              {/* The pane's actions: the one thing the team does (write back),
                  and the way out to everything the pane doesn't carry. */}
              <div className={s.actions}>
                <a
                  href={`mailto:${selected.email}?subject=${encodeURIComponent(`Your application for ${role.title}`)}`}
                  className={clsx(btn.root, btn.small, btn.fill, btn.primary, s.actionLink)}
                >
                  {/* The product's envelope, at the arrow's size on the button beside it. */}
                  <EnvelopeIcon size={14} />
                  Email {selected.name.split(' ')[0]}
                </a>
                <a
                  href={`/members/${selected.memberId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clsx(btn.root, btn.small, btn.border, btn.neutral, s.actionLink)}
                >
                  View full profile
                  <ArrowUpRightIcon width={14} height={14} />
                </a>
              </div>
            </div>

            {/* The application — the only section this page has that the
                profile doesn't. */}
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

            <DetailsSection>
              <DetailsSectionHeader title={`Experience (${selected.experience.length})`} />
              <ExperiencesList
                data={selected.experience}
                member={NO_MEMBER}
                userInfo={VIEWER}
                isEditable={false}
                isLoading={false}
                onEdit={() => {}}
              />
            </DetailsSection>
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

/* The member-profile prototype's location pin, transcribed. */
const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M8 1.5A4.75 4.75 0 0 0 3.25 6.25c0 3.4 4.3 7.75 4.48 7.93a.4.4 0 0 0 .54 0c.18-.18 4.48-4.53 4.48-7.93A4.75 4.75 0 0 0 8 1.5Zm0 6.5a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5Z"
      fill="#94A3B8"
    />
  </svg>
);
