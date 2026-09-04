'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useLoginRedirect } from '@/components/core/login/utils';
import { useQuery } from '@tanstack/react-query';

import { toast } from '@/components/core/ToastContainer';
import { useMutation } from '@tanstack/react-query';
import { isEmailTakenError, signUpToJobBoard } from '@/services/jobs/job-applications.service';
import { getMember } from '@/services/members.service';
import { MembersQueryKeys } from '@/services/members/constants';
import { useCurrentUserStore } from '@/services/auth/store';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { useJobsAnalytics, type JobSurface } from '@/analytics/jobs.analytics';
import { useRoleApplication } from '@/services/jobs/hooks/useJobApplications';
import { useRoleInterest, useToggleJobInterest } from '@/services/jobs/hooks/useJobInterests';
import { isJobGoneError } from '@/services/jobs/job-interests.service';
import { withPendingApply, withPendingInterest } from '@/services/jobs/job-apply-resume';
import type { IUserInfo } from '@/types/shared.types';

import { shouldApplyGoExternal, type useJobApplyFlow } from '@/components/page/jobs/hooks/useJobApplyFlow';
import type { JobBoardViewerResult } from '@/components/page/jobs/hooks/useJobBoardViewer';
import { canSeeOriginalPosting, canShowJobInterest } from '@/services/jobs/job-board-viewer';
import type { JobSignUpDetails, JobSignUpResult } from '@/components/page/jobs/JobSignUpModal/JobSignUpModal';

/* Most visitors never press Apply, and logged-out visitors can only ever reach
   the sign-up form — so the stack (drawer chrome, RHF forms, member sections)
   loads on demand. Conditional render below is what actually defers the fetch:
   an always-mounted dynamic component would load on page view anyway. */
const JobSignUpModal = dynamic(
  () => import('@/components/page/jobs/JobSignUpModal/JobSignUpModal').then((m) => m.JobSignUpModal),
  { ssr: false },
);
const JobProfileDrawer = dynamic(
  () => import('@/components/page/jobs/JobProfileDrawer/JobProfileDrawer').then((m) => m.JobProfileDrawer),
  { ssr: false },
);
/* One import for all three steps now. The panes travel with it — which is the
   point: the flow is one screen, so it is one chunk, and stepping along the rail
   never waits on a fetch. */
const JobApplyFlowDrawer = dynamic(
  () => import('@/components/page/jobs/JobApplyFlowDrawer/JobApplyFlowDrawer').then((m) => m.JobApplyFlowDrawer),
  { ssr: false },
);

interface JobApplyFlowControllerProps {
  flow: ReturnType<typeof useJobApplyFlow>;
  viewer: JobBoardViewerResult;
  isLoggedIn: boolean;
  userInfo: IUserInfo | undefined;
  source: JobSurface;
}

/**
 * The modal/drawer stack behind in-app Apply, wired to `useJobApplyFlow`.
 *
 * Hosted OUTSIDE the board's list branch (the TeamNewsModal precedent): a
 * filter change that empties the list mid-application must not yank an open
 * modal. The board is host #1; the team profile becomes host #2 in the
 * feature's phase 2 by rendering this same controller beside its own list.
 */
export function JobApplyFlowController(props: JobApplyFlowControllerProps) {
  const { flow, viewer, isLoggedIn, userInfo, source } = props;
  const { state } = flow;

  const goToLogin = useLoginRedirect();
  const analytics = useJobsAnalytics();
  const signUpMutation = useMutation({ mutationFn: signUpToJobBoard });

  const { currentUser } = useCurrentUserStore();
  const isAdmin = isAdminUser(currentUser);
  const isOwner = !!currentUser && currentUser.uid === viewer.memberUid;

  // The read-back's member — the same record (and cache entry) the drawer's
  // sections edit, so "Edit profile" can never come back to a stale quote.
  const { data: member } = useQuery({
    queryKey: [MembersQueryKeys.GET_MEMBER, viewer.memberUid, isLoggedIn, currentUser?.uid],
    queryFn: () =>
      getMember(
        viewer.memberUid as string,
        { with: 'image,skills,location,teamMemberRoles.team' },
        isLoggedIn,
        currentUser,
        !isAdmin && !isOwner,
        true,
      ),
    enabled: state.step === 'flow' && !!viewer.memberUid,
    select: (data) => data?.data?.formattedData,
  });

  /**
   * Hand off to Privy, optionally carrying the email the person just typed so
   * they don't retype it into the login modal.
   *
   * The email HAS to travel as a query param: `AuthInfo` — which is what
   * `#login` mounts — calls `localStorage.clear()` before it does anything
   * else, so anything written to storage on the way here is gone by the time
   * Privy asks for it. `AuthInfo` then reads `prefillEmail` off the URL and
   * puts it back into storage, which is where `PrivyModals` looks. Same
   * channel `SignupWizard`, `AccountCreatedSuccessModal` and
   * `AppliedInvestorSteps` use.
   *
   * The rest of the search string rides along, so the rail the person narrowed
   * before signing up is still narrowed when they land back on the board.
   */
  const pushLogin = (opts?: { prefillEmail?: string; pendingRoleUid?: string; pendingInterestUid?: string }) => {
    const search = new URLSearchParams(window.location.search);
    if (opts?.prefillEmail) {
      search.set('prefillEmail', opts.prefillEmail);
    }
    const withEmail = search.toString();
    /* A job in the drawer resumes on that role's profile step. A banner / modal
       sign-up has no job and gets no instruction — passing no uid also CLEARS a
       stale one, so an abandoned sign-up can't resume here. See
       `job-apply-resume` for why that door lands on the plain board. */
    /* Both intents are written on every trip, and both CLEAR when their uid is
       absent. That symmetry is the whole safety property: a door that merely
       declined to set a parameter would inherit whichever stale one was already
       on the search string and resume something nobody just asked for. */
    const qs = withPendingInterest(withPendingApply(withEmail, opts?.pendingRoleUid), opts?.pendingInterestUid);
    goToLogin({ returnTo: `${window.location.pathname}${qs}` });
  };

  /**
   * Filling the form IS the sign-up; Privy authentication follows. The board
   * has its own endpoint for this — the participants-request route is
   * explicitly not for job-board sign-up.
   *
   * Ordering matters: await the POST, then close, then push `#login`, so a
   * failed request leaves nothing behind.
   */
  const handleSignUp = async (details: JobSignUpDetails): Promise<JobSignUpResult> => {
    /* Two doors reach this now: the modal (`sign-up`, role-less) and the flow's
       step 2 (`flow`, always carrying a role). Reading the target from whichever
       is open keeps one handler — and one place where the analytics for a
       sign-up are fired — rather than a second copy that could drift. */
    const target = state.step === 'sign-up' ? state.target : state.step === 'flow' ? state.target : null;
    const analyticsBase = {
      job_id: target?.role.uid ?? null,
      team_id: target?.teamId ?? null,
      viewer_state: viewer.viewer,
      source,
    };

    try {
      await signUpMutation.mutateAsync({
        name: details.name,
        email: details.email,
        /* Both doors ask for these two now, so in practice both spreads always
           fire. They stay conditional rather than becoming plain keys, and the
           reason is the wire schema rather than this form: `jobSearchStatus` is
           optional on both sides, and `role` is `min(1)` — so an empty string
           here would be *rejected* by `parse()` where an absent key is accepted.
           Omission is the honest way to say "not answered" and the only safe way
           to say "empty", which is two reasons to keep the guard even now that
           nothing should be able to reach it. */
        ...(details.jobSearchStatus ? { jobSearchStatus: details.jobSearchStatus } : {}),
        linkedinHandler: details.linkedin,
        ...(details.role ? { role: details.role } : {}),
        // The company select offers existing network teams only, so this is
        // always an affiliation rather than a new team. Omitted entirely when
        // they skipped it — the endpoint reads that as no affiliation.
        ...(details.teamUid ? { team: { uid: details.teamUid } } : {}),
      });
    } catch (error) {
      analytics.onJobApplySignUpFailed({
        ...analyticsBase,
        failure_category: isEmailTakenError(error) ? 'duplicate' : 'request-failed',
      });
      return { success: false, emailTaken: isEmailTakenError(error) };
    }

    analytics.onJobApplySignUpSubmitted({
      ...analyticsBase,
      /* Three doors, three values, all of them already in `JobApplyTrigger`.
         `detail` is the flow's own step 2 — the pane reached by pressing Apply
         on a job — and it is the path that matters most now, so it must not be
         counted as a row press. */
      trigger: state.step === 'flow' ? 'detail' : target ? 'row' : 'banner',
      has_team_email: false,
    });
    flow.closeSignUp({ completed: true });
    // They just typed this email into the form the line above submitted —
    // asking for it again in the login modal is asking twice for one fact.
    pushLogin({
      prefillEmail: details.email,
      pendingRoleUid: target?.role.uid,
    });
    return { success: true };
  };

  /**
   * The modal's "Already have an account? Sign in" escape — ordinary Privy,
   * and deliberately NOT a resume: only signing up reopens the flow on the
   * way back. Someone who already has an account is returning to a board they
   * know, and having a drawer open itself at them is an interruption rather
   * than a continuation. Passing no role also clears any `applyTo` left in the
   * URL by an abandoned sign-up, so a stale one can't resume here.
   */
  const handleModalSignIn = () => {
    flow.closeSignUp();
    pushLogin();
  };

  /* The standalone profile drawer's press — the banner's "Update profile", which
     has no application behind it. Nothing to resume into, so this always ends
     the visit and the toast is the receipt. */
  const handleProfileOnlySaved = ({ profileComplete }: { profileComplete: boolean }) => {
    flow.onProfileSaved({ profileComplete });
    flow.close({ completed: true });
    toast.success('Profile saved.');
  };

  /* The flow's footer reports the application the row's clock reports — same
     query, same entry, so the two cannot disagree about one application. Scoped
     to the open role; inert (`enabled: false`) the rest of the time. */
  /* Where the review step's Apply will actually land. Computed here because the
     rule is `useJobApplyFlow`'s and the footer that has to say it is the
     drawer's — see `onApply`. */
  const applyGoesExternal =
    state.step === 'flow' &&
    shouldApplyGoExternal({ viewer: viewer.viewer, verdict: viewer.verdict, team: state.target.team });

  const flowRole = state.step === 'flow' ? state.target.role : null;
  const flowApplication = useRoleApplication(flowRole?.uid ?? '', {
    memberUid: viewer.memberUid,
    enabled: state.step === 'flow' && !!viewer.memberUid,
  });

  /* The light signal beside Apply. Same member-scoped whole-map read as the
     application above it, so the drawer answers "has this person acted on this
     role" from two caches with one shape rather than two idioms. */
  const { isInterested, isSettled: interestSettled } = useRoleInterest(flowRole?.uid ?? '', {
    memberUid: viewer.memberUid,
    enabled: state.step === 'flow' && !!viewer.memberUid,
  });
  const toggleInterest = useToggleJobInterest(viewer.memberUid);
  /* A refusal belongs to the role it was refused for, so it is STORED with that
     role rather than cleared by an effect when the role changes. Same outcome,
     no cascading render — and it survives the drawer closing and reopening on
     the same role, which a reset-on-change would have thrown away. Without
     either, opening a second role after a failed toggle carries the red line
     across to a banner that never failed at anything. */
  const [interestError, setInterestError] = useState<{ roleUid: string; message: string } | null>(null);
  const interestErrorForRole =
    interestError && interestError.roleUid === flowRole?.uid ? interestError.message : null;

  const handleToggleInterest = (nextInterested: boolean) => {
    if (state.step !== 'flow') return;
    const target = state.target;
    const analyticsBase = {
      job_id: target.role.uid,
      team_id: target.teamId,
      viewer_state: viewer.viewer,
      source,
    };

    setInterestError(null);

    /* No account, nothing to attach the signal to. The press is not discarded —
       it rides to Privy as `interestIn` and is recorded on the way back, landing
       the person on the confirmed banner rather than on the button they already
       pressed. Deliberately fires no interest event here: nothing has been
       signalled yet, and counting an intent as a signal would make the funnel
       report a conversion that has not happened. */
    if (!isLoggedIn) {
      pushLogin({ pendingInterestUid: target.role.uid });
      return;
    }

    toggleInterest.mutate(
      { roleUid: target.role.uid, nextInterested },
      {
        /* Reported from the server's answer rather than from the press, so a
           press that turned out to be a no-op (both writes are idempotent) is
           not counted as a state change that never happened. */
        onSuccess: (result) => {
          if (result.viewerIsInterested) {
            analytics.onJobInterestMarked({ ...analyticsBase, resumed: false });
          } else {
            analytics.onJobInterestUndone(analyticsBase);
          }
        },
        onError: (error) => {
          setInterestError({
            roleUid: target.role.uid,
            message: error instanceof Error ? error.message : 'Something went wrong. Try again.',
          });
          analytics.onJobInterestFailed({
            ...analyticsBase,
            action: nextInterested ? 'mark' : 'undo',
            failure_category: isJobGoneError(error) ? 'gone' : 'request-failed',
          });
        },
      },
    );
  };

  return (
    <>
      {state.step === 'flow' && (
        <JobApplyFlowDrawer
          open
          onClose={flow.close}
          target={state.target}
          at={state.at}
          onStepChange={flow.goToStep}
          coverLetter={state.coverLetterDraft}
          onCoverLetterChange={flow.setCoverLetter}
          memberUid={viewer.memberUid}
          member={member ?? null}
          isLoggedIn={isLoggedIn}
          pendingApproval={viewer.viewer === 'pending-approval'}
          profileComplete={viewer.profileComplete}
          applied={!!flowApplication}
          appliedAt={flowApplication?.appliedAt ?? null}
          /* Two ways to earn the link. The first is the standing rule: an
             established member keeps it, a signed-out visitor and a Job Aspirant
             do not, because both came here to apply through this board.

             The second overrides it for one case — when Apply *is* that link.
             A signed-out visitor, or an unapproved account, applying to a
             non-PL role is sent to the employer's site, and hiding the way
             there from the one person whose only way it is would be the board
             withholding its own answer. */
          showOriginalPosting={canSeeOriginalPosting({ isLoggedIn, userInfo }) || applyGoesExternal}
          applyGoesExternal={applyGoesExternal}
          /* Only the resume sets this. It is what lets the footer tell the
             person who just came back from Privy that the account exists —
             a sentence that would be false for the Job Aspirant and the
             pending member sitting in the same footer branch. */
          justSignedUp={state.justSignedUp ?? false}
          /* Straight through to the one gate. `onApply` replaces or advances the
             step itself, so the drawer needs no close of its own here. */
          onApply={() => flow.onApply({ ...state.target }, 'detail')}
          onSignUp={handleSignUp}
          onSignIn={handleModalSignIn}
          onProfileSaved={flow.onProfileSaved}
          onSubmitted={flow.onSubmitted}
          viewerState={viewer.viewer}
          source={source}
          interest={
            canShowJobInterest({ isLoggedIn, userInfo })
              ? {
                  isInterested,
                  isSettled: interestSettled,
                  error: interestErrorForRole,
                  onToggle: handleToggleInterest,
                }
              : undefined
          }
        />
      )}

      {state.step === 'sign-up' && (
        <JobSignUpModal
          open
          onClose={flow.closeSignUp}
          role={state.target?.role ?? null}
          teamName={state.target?.teamName ?? ''}
          onSignUp={handleSignUp}
          onSignIn={handleModalSignIn}
        />
      )}

      {state.step === 'profile-only' && viewer.memberUid && (
        <JobProfileDrawer
          open
          onClose={flow.close}
          memberUid={viewer.memberUid}
          isLoggedIn={isLoggedIn}
          pendingRoleTitle={null}
          pendingApproval={viewer.viewer === 'pending-approval'}
          onFooterAction={handleProfileOnlySaved}
        />
      )}
    </>
  );
}
