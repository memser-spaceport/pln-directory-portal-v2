'use client';

import React from 'react';
import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';

import { Drawer } from '@/components/common/Drawer';
import { Button } from '@/components/common/Button';
import { toast } from '@/components/core/ToastContainer';
import { DetailsSection } from '@/components/common/profile/DetailsSection/DetailsSection';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { DataIncomplete } from '@/components/page/member-details/DataIncomplete/DataIncomplete';
import { ProfileDetails } from '@/components/page/member-details/ProfileDetails';
import { ExperienceDetails } from '@/components/page/member-details/ExperienceDetails';
import { ContributionsDetails } from '@/components/page/member-details/ContributionsDetails';
import { RepositoriesDetails } from '@/components/page/member-details/RepositoriesDetails';
import { getMember } from '@/services/members.service';
import { MembersQueryKeys } from '@/services/members/constants';
import { useMemberExperience } from '@/services/members/hooks/useMemberExperience';
import { useUpdateMemberParams } from '@/services/members/hooks/useUpdateMemberParams';
import { isJobSearchStatus, JOB_SEARCH_STATUS_OPTIONS, JobSearchStatus } from '@/services/jobs/job-board-viewer';
import { SHOW_CV_IMPORT } from '@/services/jobs/constants';
import { useCurrentUserStore } from '@/services/auth/store';
import { isAdminUser } from '@/utils/user/isAdminUser';

import { PlTeamOnlyPill } from '@/components/page/jobs/PlTeamOnlyPill/PlTeamOnlyPill';
import { PendingApprovalSteps } from './PendingApprovalSteps';
import { CvFirstCard } from './CvFirstCard';
import { pickCvImportHost } from './cvImportHost';

// Demo Day's profile-completion chrome: the sticky 64px header with its "Back"
// affordance, and the 720px-max centred content column.
import s from '@/components/page/demo-day/AppliedInvestorSteps/EditInvestorProfileDrawer/EditInvestorProfileDrawer.module.scss';
import d from './JobProfileDrawer.module.scss';

/**
 * "Complete your profile" — the one thing standing between a signed-in visitor
 * and a one-click application.
 *
 * The Demo Day pattern (`EditInvestorProfileDrawer`), promoted from the
 * job-board prototype — but where the prototype transcribed the member-detail
 * sections against mock data, this composes the REAL section components, which
 * own their editing and their saves (each section commits through its existing
 * endpoints and invalidates the member queries). That is also what makes the
 * footer's resume safe: "Continue to apply" enables off the same member cache
 * the apply modal reads back, so the read-back can never quote a pre-edit
 * profile.
 *
 * The gate on Apply is exactly two answers — current role + job search status
 * (`isJobProfileComplete`). Their cards mark themselves while unanswered;
 * everything else refines a read rather than making one possible.
 *
 * Escapable (Escape and overlay both close), unlike the investor drawer, which
 * pins itself shut: someone who pressed Apply and changed their mind about the
 * role is not someone to hold.
 */

interface JobProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  memberUid: string;
  isLoggedIn: boolean;
  /** Set when the drawer is holding up an application — names the role. */
  pendingRoleTitle: string | null;
  /** Signed up but not yet approved: profile saves, applying waits. */
  pendingApproval: boolean;
  /** rbac PENDING (identity unverified) — the stepper nudges verification. */
  needsIdentityVerification?: boolean;
  /**
   * True when saving resumes straight into the apply modal — a role is held and
   * the account may apply.
   *
   * No longer decides the button's WORDS, only whether the press lands on an
   * application or on the board. See the footer.
   */
  resumeIntoApply: boolean;
  /** The footer press. Completeness is reported from the drawer's own (freshest) read. */
  onFooterAction: (args: { profileComplete: boolean }) => void;
}

export function JobProfileDrawer(props: JobProfileDrawerProps) {
  const {
    open,
    onClose,
    memberUid,
    isLoggedIn,
    pendingRoleTitle,
    pendingApproval,
    needsIdentityVerification = false,
    resumeIntoApply,
    onFooterAction,
  } = props;

  const { currentUser: userInfo } = useCurrentUserStore();
  const isAdmin = isAdminUser(userInfo);
  const isOwner = !!userInfo && userInfo.uid === memberUid;

  // The same fetch the investor drawer and the member page make — the section
  // components edit against this record and invalidate this key on save.
  const { data: member, isLoading } = useQuery({
    queryKey: [MembersQueryKeys.GET_MEMBER, memberUid, isLoggedIn, userInfo?.uid],
    queryFn: () =>
      getMember(
        memberUid,
        { with: 'image,skills,location,teamMemberRoles.team' },
        isLoggedIn,
        userInfo,
        !isAdmin && !isOwner,
        true,
      ),
    enabled: open && !!memberUid,
    select: (data) => data?.data?.formattedData,
  });

  /* The status lives on the member record (PL-Team-only: the API omits it for
     anyone but this member or an admin), so it arrives with the fetch above
     and saves through a partial PATCH of just this field — the endpoint the
     contract names for it, and the one that cannot clobber a section this
     drawer never touched. The mutation invalidates GET_MEMBER, so the value
     the gate reads next is the one the server stored rather than the one we
     hoped it stored. */
  const updateMember = useUpdateMemberParams();
  const jobSearchStatus: JobSearchStatus | null = isJobSearchStatus(member?.jobSearchStatus)
    ? member.jobSearchStatus
    : null;

  const hasRole = Boolean(((member?.mainTeam?.role ?? '').trim() || (member?.role ?? '').trim()).length);
  const hasStatus = jobSearchStatus !== null;
  const complete = hasRole && hasStatus;

  /* The row count the blank test needs. A cache read in practice — the
     Experience section below issues the same key — but the drawer asks first, so
     it carries the `enabled` that keeps a closed drawer off the network. */
  const { data: experienceRows, isLoading: experiencesLoading } = useMemberExperience(memberUid, {
    enabled: open && !!memberUid,
  });
  /* `Array.isArray` rather than `?? []`: the repo's global `useQuery` mock
     resolves every query to an object, and `.length` on one is `undefined`. */
  const experienceCount = Array.isArray(experienceRows) ? experienceRows.length : 0;

  /* Set when someone hits a parse dead end in the top card and presses "Add
     manually" — see `CvImportHostInput.handedOff`. Deliberately not reset on
     close: someone who said they would type it in should not be met by the same
     card the next time they open this. */
  const [handedOff, setHandedOff] = React.useState(false);

  /* One call, two props: the host is picked once and both the card below and the
     section's `enableCvImport` read the same answer, so "never both doors" is
     structural rather than a rule two expressions have to keep agreeing on. */
  const cvImportHost = pickCvImportHost({
    enabled: SHOW_CV_IMPORT,
    hasRole,
    experienceCount,
    experiencesLoading,
    handedOff,
  });

  return (
    <Drawer isOpen={open} onClose={onClose}>
      <div className={clsx(s.drawerHeader, d.drawerHeaderLift)}>
        <div className={s.breadcrumbs}>
          <button type="button" className={s.backButton} onClick={onClose}>
            <BackIcon />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className={s.drawerContent}>
        {/* Where a pending member is in the process — above the lede because it
            answers "can I even do this". */}
        {pendingApproval && <PendingApprovalSteps needsIdentityVerification={needsIdentityVerification} />}

        <p className={d.lede}>
          {pendingRoleTitle
            ? pendingApproval
              ? `You'll be able to apply to ${pendingRoleTitle} once your account is approved.`
              : `We send your profile with your application to ${pendingRoleTitle}.`
            : 'This is what hiring teams see when you apply.'}
        </p>

        {isLoading && <div className={d.loading}>Loading profile…</div>}

        {member && (
          <>
            {/* 0. Start with a document, while there is nothing to start from.
                   Above the header card because a CV answers the required role
                   sitting in it — a control that answers the question below it
                   belongs above it. Disappears the moment the profile has
                   anything in it, handing the offer to the Experience section. */}
            {cvImportHost === 'top-card' && <CvFirstCard member={member} onHandOff={() => setHandedOff(true)} />}

            {/* 1. The header card — the first required answer (current role)
                   lives in its editor. While the role is missing the card wears
                   the required treatment: the strip names the consequence, the
                   amber "+ Your Role" inside is production's own affordance. */}
            <div className={clsx(d.headerCard, { [d.missingCard]: !hasRole })}>
              {!hasRole && (
                <DataIncomplete className={d.incompleteStrip}>
                  {pendingRoleTitle
                    ? `Your current role is required to apply to ${pendingRoleTitle}.`
                    : 'Your current role is required to apply.'}
                </DataIncomplete>
              )}
              <ProfileDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
            </div>

            {/* 2. Job search status — the required section, so it comes first
                   after the header. PL-Team-only: the pill carries the
                   audience, the note carries the purpose, and the value never
                   appears on the public profile or in the apply read-back. */}
            <DetailsSection missingData={!hasStatus}>
              {!hasStatus && (
                <DataIncomplete className={d.incompleteStrip}>
                  {pendingRoleTitle
                    ? `An answer here is required to apply to ${pendingRoleTitle}.`
                    : 'An answer here is required to apply.'}
                </DataIncomplete>
              )}
              <div className={clsx({ [d.missingBody]: !hasStatus })}>
                <DetailsSectionHeader title="Job search status">
                  <PlTeamOnlyPill />
                </DetailsSectionHeader>
                {/* Not disabled while saving, deliberately. The write is
                    optimistic now, so the dot has already moved and the only
                    thing a lock would buy is stopping someone changing their
                    mind during a window they can no longer see. Two clicks in
                    that window race, and the later PATCH's invalidation settles
                    last — which is the answer they picked last, so the race has
                    the right winner. */}
                <JobSearchStatusInput
                  value={jobSearchStatus}
                  onChange={(value) =>
                    updateMember.mutate(
                      { uid: memberUid, payload: { jobSearchStatus: value } },
                      {
                        /* Here rather than in the hook's own `onError`: the bio
                           and profile forms already show their own message, and
                           a blanket toast would double up on both. The hook
                           owns the rollback; each caller owns what it says.

                           And it has to say something. Before this the dot never
                           moved, so a failed save claimed nothing; optimistically
                           it moves and then un-moves on its own, which turns a
                           silent failure into a misleading one. */
                        onError: () => toast.error("Couldn't save your job search status. Please try again."),
                      },
                    )
                  }
                />
              </div>
            </DetailsSection>

            {/* 3–5. Optional sections — what a hiring team actually reads.
                   Real components: they edit in place and save themselves.

                   Experience is the one section with a shortcut: drop a CV and
                   it fills itself, including the required current role. The flag
                   is read here rather than inside the section because the
                   section is shared with `/members/[id]`, which does not offer
                   this.

                   This is the other half of the one-host rule: while the card at
                   the top is making the offer, this section must not make it a
                   second time. Passing `false` withholds the whole bundle
                   (`CvImportControls` is optional precisely so "off" is the
                   absence of it), so the empty row goes back to being
                   production's plain empty row.

                   Note this gates the OFFER, not the bytes: a prop is not an
                   `&&` guard, so the importer's components are imported by
                   `ExperienceDetails` either way and ship in this drawer's
                   chunk. That is the intended trade — the drawer is already a
                   `ssr:false` dynamic import behind `SHOW_JOB_BOARD_APPLY`, so
                   nothing loads until someone presses Apply, and buying true
                   dead-code elimination would cost a second dynamic boundary
                   inside the section for a feature that is about to be on. */}
            <ExperienceDetails
              userInfo={userInfo}
              member={member}
              isLoggedIn={isLoggedIn}
              enableCvImport={cvImportHost === 'experience-section'}
            />
            <ContributionsDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
            <RepositoriesDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
          </>
        )}
      </div>

      {/* The drawer's own action — always on screen, disabled until usable. The
          sections' own Saves commit one card each; this one says what happens
          NEXT.

          **"Continue to apply" whenever the account may apply — not only when a
          role is held.** It used to read "Save profile" on the banner route,
          because that route carries no `pendingApply` and there is no specific
          application to land on. Two things were wrong with that. The hint
          beside it already ends "…to continue", so the button and the sentence
          next to it disagreed about what the press was for. And the drawer only
          exists to unblock applying: framing the same completion as a filing
          exercise on one route and as progress on the other made the ask look
          like two different asks depending on which door you came through.

          It is not a promise it can't keep. With a role held the press resumes
          straight into the apply modal; without one it saves and closes to the
          board, where every row's Apply is now live. Both are "continue to
          apply" — the second just doesn't pick the role for you.

          `pendingApproval` keeps its carve-out, and it is the only one. There
          the press genuinely cannot lead to an application at any point, which
          the hint beside it says outright; "Continue to apply" over that
          sentence would be the button contradicting its own caption. */}
      <div className={d.footer}>
        <div className={d.footerInner}>
          <p className={d.footerHint}>
            {!complete
              ? `${sentenceCase(missingHint(hasRole, hasStatus))} to continue. Everything else is optional.`
              : pendingApproval
                ? 'Your profile is saved as you go; applying unlocks once the PL team approves your account.'
                : 'Experience, skills and bio are optional — you can add them any time.'}
          </p>
          <Button
            variant="primary"
            style="fill"
            size="m"
            disabled={!complete}
            onClick={() => onFooterAction({ profileComplete: complete })}
          >
            {pendingApproval ? 'Save profile' : 'Continue to apply'}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

/** What's still owed, as a verb phrase the footer drops into its sentence. */
function missingHint(hasRole: boolean, hasStatus: boolean): string {
  if (!hasRole && !hasStatus) return 'add your current role and choose a job search status';
  if (!hasRole) return 'add your current role';
  return 'choose a job search status';
}

const sentenceCase = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/* No `disabled` prop any more: the only thing that ever set it was "a save is in
   flight", and an optimistic save has nothing to wait for. */
function JobSearchStatusInput({
  value,
  onChange,
}: {
  value: JobSearchStatus | null;
  onChange: (next: JobSearchStatus) => void;
}) {
  return (
    <div className={d.statusRoot}>
      {/* The pill carries the audience; this line carries the purpose. */}
      <p className={d.statusPrivacyNote}>Used to decide whether to surface your profile to founders who are hiring.</p>

      <div className={d.statusOptions} role="radiogroup" aria-label="Job search status">
        {JOB_SEARCH_STATUS_OPTIONS.map((option) => (
          <label key={option.value} className={clsx(d.statusOption, { [d.statusOptionOn]: value === option.value })}>
            <input
              type="radio"
              name="job-search-status"
              className={d.statusInput}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className={d.statusIndicator} aria-hidden="true" />
            <span className={d.statusText}>
              <span className={d.statusLabel}>{option.label}</span>
              <span className={d.statusHint}>{option.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

// EditInvestorProfileDrawer's own glyph, copied so the Back control it sits in
// is the same control, not a lookalike.
export const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17.5 9.99998C17.5 10.1657 17.4342 10.3247 17.3169 10.4419C17.1997 10.5591 17.0408 10.625 16.875 10.625H4.6336L9.19219 15.1828C9.25026 15.2409 9.29632 15.3098 9.32775 15.3857C9.35918 15.4615 9.37535 15.5429 9.37535 15.625C9.37535 15.7071 9.35918 15.7884 9.32775 15.8643C9.29632 15.9402 9.25026 16.0091 9.19219 16.0672C9.13412 16.1252 9.06518 16.1713 8.98931 16.2027C8.91344 16.2342 8.83213 16.2503 8.75 16.2503C8.66788 16.2503 8.58656 16.2342 8.51069 16.2027C8.43482 16.1713 8.36588 16.1252 8.30782 16.0672L2.68282 10.4422C2.62471 10.3841 2.57861 10.3152 2.54715 10.2393C2.5157 10.1634 2.49951 10.0821 2.49951 9.99998C2.49951 9.91785 2.5157 9.83652 2.54715 9.76064C2.57861 9.68477 2.62471 9.61584 2.68282 9.55779L8.30782 3.93279C8.42509 3.81552 8.58415 3.74963 8.75 3.74963C8.91586 3.74963 9.07492 3.81552 9.19219 3.93279C9.30947 4.05007 9.37535 4.20913 9.37535 4.37498C9.37535 4.54083 9.30947 4.69989 9.19219 4.81717L4.6336 9.37498H16.875C17.0408 9.37498 17.1997 9.44083 17.3169 9.55804C17.4342 9.67525 17.5 9.83422 17.5 9.99998Z"
      fill="currentColor"
    />
  </svg>
);
