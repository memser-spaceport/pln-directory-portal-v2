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
import { ContactDetails } from '@/components/page/member-details/ContactDetails';
import { getMember } from '@/services/members.service';
import { MembersQueryKeys } from '@/services/members/constants';
import { useMemberExperience } from '@/services/members/hooks/useMemberExperience';
import { useUpdateMemberParams } from '@/services/members/hooks/useUpdateMemberParams';
import { isJobSearchStatus, JobSearchStatus } from '@/services/jobs/job-board-viewer';
import { JobSearchStatusInput } from '@/components/page/jobs/JobSearchStatusInput/JobSearchStatusInput';
import { SHOW_CV_IMPORT } from '@/services/members/constants';
import { useCurrentUserStore } from '@/services/auth/store';
import { isAdminUser } from '@/utils/user/isAdminUser';

import { PlTeamOnlyPill } from '@/components/page/jobs/PlTeamOnlyPill/PlTeamOnlyPill';
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

/** What the flow's footer needs to know about a profile it cannot see. */
export interface ProfileState {
  complete: boolean;
  hasRole: boolean;
  hasStatus: boolean;
}

export interface JobProfilePaneProps {
  memberUid: string;
  isLoggedIn: boolean;
  /** Set when an application is waiting on this — names the role in the lede. */
  pendingRoleTitle: string | null;
  /** Signed up but not yet approved. Says so in the lede; gates nothing. */
  pendingApproval: boolean;
  /** Reported on every change — see the note in the component. */
  onProfileState: (state: ProfileState) => void;
}

/**
 * The profile stack: everything an application needs, edited in place.
 *
 * **The body only.** This used to be the whole drawer — its own header, its own
 * sticky footer with `Continue to apply`, its own way out. It is step 2 of the
 * apply flow now, and the flow owns the chrome, so what is left here is the
 * content. `JobProfileDrawer` below still wraps it for the one case that is not
 * a flow: the banner's "Update profile", where there is no role to review and
 * nothing to send.
 *
 * Completeness is reported upward rather than acted on here, because both hosts
 * need it and neither of their footers is inside this component.
 */
export function JobProfilePane(props: JobProfilePaneProps) {
  const { memberUid, isLoggedIn, pendingRoleTitle, pendingApproval, onProfileState } = props;

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
    enabled: !!memberUid,
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
    enabled: !!memberUid,
  });
  /* `Array.isArray` rather than `?? []`: the repo's global `useQuery` mock
     resolves every query to an object, and `.length` on one is `undefined`. */
  const experienceCount = Array.isArray(experienceRows) ? experienceRows.length : 0;

  /* Reported rather than returned: the footer that reads this lives outside
     this component in both hosts, and it is derived from a fetch that only
     happens in here. */
  React.useEffect(() => {
    onProfileState({ complete, hasRole, hasStatus });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete, hasRole, hasStatus]);

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
    experienceCount,
    experiencesLoading,
    handedOff,
  });

  return (
    <>
      {/* (`PendingApprovalSteps` — the vertical "signed up → complete your
            profile → await approval" rail — stood here, above the lede, because
            it answered "can I even do this". The answer is now yes regardless,
            so a stepper counting down to approval described a wait that holds
            nothing up. Deleted rather than hidden: it had one caller and one
            reason to exist.) */}
      <p className={d.lede}>
        {/* The pending line no longer defers the application — it says the
              review isn't in the way. Same fact, opposite consequence.

              Everyone else reads the generic line, INCLUDING mid-application.
              ("We send your profile with your application to <role>." stood in
              that slot — a promise the letter step's own lede already makes, one
              step before it can be acted on. Said once, where it is true.) */}
        {pendingApproval && pendingRoleTitle
          ? `Your account is under review — we'll email you when it's approved. It isn't holding up your application to ${pendingRoleTitle}, which goes as soon as you send it.`
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
            <ProfileDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} variant="apply-flow" />
          </div>

          {/* 2. Job search status — the required section, so it comes first
                   after the header. PL-Team-only: the pill carries the
                   audience, the note carries the purpose, and the value never
                   appears on the public profile or in the apply read-back. */}
          {/* The requirement is said once, on the title, instead of in a strip
              above the card.

              The strip named the role — "An answer here is required to apply to
              Start Up Operator" — which was worth the width when this was a
              drawer that opened out of nowhere and had to re-establish what it
              was holding up. It is step 2 of a rail that names the job at step 1
              and carries it in the lede two lines above, so the strip spent a
              full-width amber band restating what the screen already said, and
              it sat *outside* the card it was about. `Required to continue` says
              the same thing where the answer is, in the words the footer uses.

              The amber card treatment stays: `missingData` is what marks the
              section, and that is the part the strip was only decorating. */}
          <DetailsSection missingData={!hasStatus}>
            <div className={clsx({ [d.missingBody]: !hasStatus })}>
              <DetailsSectionHeader
                title={
                  <>
                    Job search status
                    {!hasStatus && <span className={d.requiredMark}>Required to continue</span>}
                  </>
                }
              >
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

          <ContactDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} variant="drawer" />

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
    </>
  );
}

/**
 * The profile stack on its own, for the one case that is not an application:
 * the banner's **Update profile**, and where a post-login resume lands when the
 * role it was holding has since closed.
 *
 * No rail, because there is nothing to walk — no role to review and nothing to
 * send. A three-step stepper here would be promising two places that do not
 * exist for this visit.
 */
export function JobProfileDrawer({
  open,
  onClose,
  onFooterAction,
  ...paneProps
}: Omit<JobProfilePaneProps, 'onProfileState'> & {
  open: boolean;
  onClose: () => void;
  /** The footer press. Completeness comes from the pane's own (freshest) read. */
  onFooterAction: (args: { profileComplete: boolean }) => void;
}) {
  const [{ complete, hasRole, hasStatus }, setProfileState] = React.useState<ProfileState>({
    complete: false,
    hasRole: false,
    hasStatus: false,
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
        <JobProfilePane {...paneProps} onProfileState={setProfileState} />
      </div>

      {/* One label for one act. The sections' own Saves commit one card each;
          this one says what happens NEXT — and for this surface that is going
          back to the board, because nothing was waiting on it. */}
      <div className={d.footer}>
        <div className={d.footerInner}>
          <p className={d.footerHint}>
            {!complete
              ? `${sentenceCase(missingHint(hasRole, hasStatus))} to continue. Everything else is optional.`
              : 'Experience, skills and bio are optional — you can add them any time.'}
          </p>
          <Button
            variant="primary"
            style="fill"
            size="m"
            className={d.footerAction}
            disabled={!complete}
            onClick={() => onFooterAction({ profileComplete: complete })}
          >
            Save and close
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

/** What's still owed, as a verb phrase the footer drops into its sentence. */
export function missingHint(hasRole: boolean, hasStatus: boolean): string {
  if (!hasRole && !hasStatus) return 'add your current role and choose a job search status';
  if (!hasRole) return 'add your current role';
  return 'choose a job search status';
}

export const sentenceCase = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/* (`JobSearchStatusInput` stood here, with its ~12 rules in this file's
    stylesheet. It moved to `components/page/jobs/JobSearchStatusInput/` when the
    sign-up form started asking the same question: that form is a light chunk on
    purpose — the controller defers *this* module through `dynamic({ssr:false})`
    so a logged-out visitor never downloads the member-editing stack — and
    importing the input from here would have dragged all of it back. Same reason
    `JobSignUpModal` copies the back glyph instead of importing it. The component
    is unchanged but for a `name` prop; see its own header.) */

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
