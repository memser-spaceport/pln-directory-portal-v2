'use client';

import dynamic from 'next/dynamic';
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
import { withPendingApply, withPendingProfile } from '@/services/jobs/job-apply-resume';
import type { IUserInfo } from '@/types/shared.types';

import { shouldApplyGoExternal, type useJobApplyFlow } from '@/components/page/jobs/hooks/useJobApplyFlow';
import type { JobBoardViewerResult } from '@/components/page/jobs/hooks/useJobBoardViewer';
import { canSeeOriginalPosting } from '@/services/jobs/job-board-viewer';
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
  const pushLogin = (opts?: { prefillEmail?: string; pendingRoleUid?: string; completeProfile?: boolean }) => {
    const search = new URLSearchParams(window.location.search);
    if (opts?.prefillEmail) {
      search.set('prefillEmail', opts.prefillEmail);
    }
    const withEmail = search.toString();
    // A job in the drawer resumes on that role's profile step. A banner / modal
    // sign-up has no job, so they land in the standalone profile drawer instead.
    const qs = opts?.pendingRoleUid
      ? withPendingApply(withEmail, opts.pendingRoleUid)
      : opts?.completeProfile
        ? withPendingProfile(withEmail)
        : withPendingApply(withEmail, undefined);
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
        jobSearchStatus: details.jobSearchStatus,
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
      completeProfile: !target?.role.uid,
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
          /* Straight through to the one gate. `onApply` replaces or advances the
             step itself, so the drawer needs no close of its own here. */
          onApply={() => flow.onApply({ ...state.target }, 'detail')}
          onSignUp={handleSignUp}
          onSignIn={handleModalSignIn}
          onProfileSaved={flow.onProfileSaved}
          onSubmitted={flow.onSubmitted}
          viewerState={viewer.viewer}
          source={source}
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
