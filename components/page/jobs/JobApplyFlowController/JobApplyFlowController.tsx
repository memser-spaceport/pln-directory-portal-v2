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
import { withPendingApply } from '@/services/jobs/job-apply-resume';
import type { IUserInfo } from '@/types/shared.types';

import type { useJobApplyFlow } from '@/components/page/jobs/hooks/useJobApplyFlow';
import type { JobBoardViewerResult } from '@/components/page/jobs/hooks/useJobBoardViewer';
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
const JobApplyModal = dynamic(
  () => import('@/components/page/jobs/JobApplyModal/JobApplyModal').then((m) => m.JobApplyModal),
  { ssr: false },
);
const JobDetailDrawer = dynamic(
  () => import('@/components/page/jobs/JobDetailDrawer/JobDetailDrawer').then((m) => m.JobDetailDrawer),
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
    enabled: state.step === 'apply' && !!viewer.memberUid,
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
  const pushLogin = (opts?: { prefillEmail?: string; pendingRoleUid?: string }) => {
    const search = new URLSearchParams(window.location.search);
    if (opts?.prefillEmail) {
      search.set('prefillEmail', opts.prefillEmail);
    }
    // The role rides the same channel, so signing in lands them back on the
    // application instead of on a board they have to re-navigate.
    const qs = withPendingApply(search.toString(), opts?.pendingRoleUid);
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
    const target = state.step === 'sign-up' ? state.target : null;
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
        role: details.role,
        ...(details.linkedin ? { linkedinHandler: details.linkedin } : {}),
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

    analytics.onJobApplySignUpSubmitted({ ...analyticsBase, trigger: target ? 'row' : 'banner' });
    flow.closeSignUp();
    // They just typed this email into the form the line above submitted —
    // asking for it again in the login modal is asking twice for one fact.
    pushLogin({ prefillEmail: details.email, pendingRoleUid: target?.role.uid });
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

  const handleDrawerFooter = ({ profileComplete }: { profileComplete: boolean }) => {
    const willResume =
      state.step === 'drawer' && !!state.pendingApply && viewer.verdict === 'approved' && profileComplete;
    flow.onDrawerSaved({ profileComplete, canApply: viewer.verdict === 'approved' });
    if (!willResume) {
      // Sections already committed their own saves — this press just ends the
      // visit, and the toast is the receipt.
      toast.success('Profile saved.');
    }
  };

  /* The detail drawer's footer reports the application the row's clock reports —
     same query, same entry, so the two cannot disagree about one application.
     Scoped to the open role; inert (`enabled: false`) the rest of the time. */
  const detailRole = state.step === 'detail' ? state.target.role : null;
  const detailApplication = useRoleApplication(detailRole?.uid ?? '', {
    memberUid: viewer.memberUid,
    enabled: state.step === 'detail' && !!viewer.memberUid,
  });

  return (
    <>
      {state.step === 'detail' && (
        <JobDetailDrawer
          open
          onClose={flow.closeDetail}
          role={state.target.role}
          team={state.target.team}
          /* Straight through to the one gate. `onApply` replaces this step with
             whichever outcome it picks, so the drawer needs no close of its
             own — and must not fire one, or a stray CLOSE_DETAIL would land on
             the step that just replaced it. */
          onApply={() => flow.onApply({ ...state.target }, 'detail')}
          applied={!!detailApplication}
          appliedAt={detailApplication?.appliedAt ?? null}
          pendingApproval={viewer.viewer === 'pending-approval'}
          loggedIn={isLoggedIn}
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

      {state.step === 'drawer' && viewer.memberUid && (
        <JobProfileDrawer
          open
          onClose={flow.closeDrawer}
          memberUid={viewer.memberUid}
          isLoggedIn={isLoggedIn}
          pendingRoleTitle={state.pendingApply?.role.roleTitle ?? null}
          pendingApproval={viewer.viewer === 'pending-approval'}
          needsIdentityVerification={userInfo?.rbac?.status === 'PENDING'}
          resumeIntoApply={!!state.pendingApply}
          onFooterAction={handleDrawerFooter}
        />
      )}

      {state.step === 'apply' && (
        <JobApplyModal
          open
          onClose={flow.closeApply}
          role={state.target.role}
          teamId={state.target.teamId}
          teamName={state.target.teamName}
          member={member ?? null}
          memberUid={viewer.memberUid}
          viewerState={viewer.viewer}
          source={source}
          onEditProfile={flow.onEditProfileFromApply}
          initialCoverLetter={state.coverLetterDraft}
          onSubmitted={flow.onSubmitted}
        />
      )}
    </>
  );
}
