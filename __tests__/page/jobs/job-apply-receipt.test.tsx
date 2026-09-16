import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * What the send says back, which is not one sentence.
 *
 * A verified LinkedIn is what lets an application go straight to the hiring team;
 * without one the PL team reads it first. The design draws both receipts and
 * names them — "Toast — LinkedIn verified" and "Toast — LinkedIn not verified" —
 * and this is the moment the profile step's offer to "get your application
 * reviewed faster" is either kept or explained.
 *
 * Worth its own suite because nothing else asserts the toast, and because the
 * wrong branch here is invisible: both are green successes, and the one that
 * over-promises is the one that reads better.
 */

jest.mock('@/components/common/Drawer', () => ({
  Drawer: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div>{children}</div> : null,
}));

jest.mock('@/components/page/jobs/JobDetailPane/JobDetailPane', () => ({ JobDetailPane: () => null }));
jest.mock('@/components/page/jobs/JobApplicationPane/JobApplicationPane', () => ({
  JobApplicationPane: () => null,
  COVER_LETTER_MAX_LENGTH: 2000,
}));
jest.mock('@/components/page/jobs/JobProfileDrawer/JobProfileDrawer', () => ({
  JobProfilePane: () => null,
  BackIcon: () => null,
}));

const toastSuccess = jest.fn();
jest.mock('@/components/core/ToastContainer', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: jest.fn(),
  },
}));

/* The send itself, resolved straight to `onSuccess` — the receipt is what this
   file is about, not the request. */
jest.mock('@/services/jobs/hooks/useJobApplications', () => ({
  useSubmitJobApplication: () => ({
    mutate: (_vars: unknown, opts: { onSuccess: () => void }) => opts.onSuccess(),
    isPending: false,
  }),
  useRoleApplication: () => null,
}));

jest.mock('@/analytics/jobs.analytics', () => ({
  useJobsAnalytics: () => ({
    onJobApplySubmitted: jest.fn(),
    onJobApplyFailed: jest.fn(),
    onJobDetailOpened: jest.fn(),
    onJobApplyStepViewed: jest.fn(),
    onJobApplyFlowClosed: jest.fn(),
    onJobApplyExternalRedirected: jest.fn(),
  }),
}));

/* Default: the member already follows this team, so no tick is drawn and the
   receipts below stay the sentences they always were. The follow cases reset
   this to an empty set. */
let mockFollowedUids = new Set<string>(['t2']);
jest.mock('@/services/follow/hooks/useFollowedTeamUids', () => ({
  useFollowedTeamUids: () => ({ followedTeamUids: mockFollowedUids, isSettled: true }),
  useRememberTeamFollowed: () => jest.fn(),
}));

const mockFollowTeam = jest.fn();
jest.mock('@/services/follow/follow.service', () => ({
  followTeam: (...args: unknown[]) => mockFollowTeam(...args),
}));

jest.mock('@/analytics/follow.analytics', () => ({
  useFollowAnalytics: () => ({ onTeamFollowed: jest.fn(), onTeamUnfollowed: jest.fn(), onTeamFollowFailed: jest.fn() }),
}));

import { JobApplyFlowDrawer } from '@/components/page/jobs/JobApplyFlowDrawer/JobApplyFlowDrawer';
import type { IJobRole, IJobTeam } from '@/types/jobs.types';

const role = { uid: 'r1', roleTitle: 'Founding Backend Engineer' } as unknown as IJobRole;
const team = { uid: 't2', name: 'Bacalhau' } as unknown as IJobTeam;

const renderApplicationStep = (member: unknown) =>
  render(
    <JobApplyFlowDrawer
      open
      onClose={jest.fn()}
      target={{ role, teamId: team.uid, teamName: team.name, team }}
      at="application"
      onStepChange={jest.fn()}
      coverLetter="I have built exactly this before."
      onCoverLetterChange={jest.fn()}
      memberUid="m1"
      member={member as never}
      isLoggedIn
      pendingApproval={false}
      profileComplete
      applied={false}
      appliedAt={null}
      showOriginalPosting={false}
      applyGoesExternal={false}
      onApply={jest.fn()}
      onSignUp={jest.fn()}
      onSignIn={jest.fn()}
      onProfileSaved={jest.fn()}
      onSubmitted={jest.fn()}
      viewerState="profile-ready"
      source="job-board"
    />,
  );

const send = () => fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

describe('the receipt a sent application shows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFollowedUids = new Set<string>(['t2']);
  });

  it('tells a verified member it has gone', () => {
    renderApplicationStep({ id: 'm1', linkedinProfile: { id: 'li-1' } });
    send();

    expect(toastSuccess).toHaveBeenCalledWith(
      'Applied to Founding Backend Engineer at Bacalhau. Your profile went with your note.',
    );
  });

  /* The second sentence is the whole point: the note has not reached anybody
     yet, which is news, and it is the cost the verification card offered to
     remove. */
  it('tells an unverified member it is being read first', () => {
    renderApplicationStep({ id: 'm1', linkedinProfile: null });
    send();

    expect(toastSuccess).toHaveBeenCalledWith(
      'Submitted for Founding Backend Engineer at Bacalhau. Your note went with your profile. Once we’ve reviewed it, we’ll send it to the recruiter.',
    );
  });

  /* The record has not arrived. Both receipts make a claim about what happens
     next, and the safe one to make blind is the slower one — promising a direct
     send that is actually queued is the failure people notice. */
  it('assumes the slower path when the record is not loaded', () => {
    renderApplicationStep(null);
    send();

    expect(toastSuccess).toHaveBeenCalledWith(expect.stringContaining('Once we’ve reviewed it'));
  });

  /* The follow tick is checked by default, so a press that leaves it alone
     follows the team — and the receipt says so, because nothing else on the
     board will. Async: the clause waits on the follow's answer. */
  it('says when the press also followed the team', async () => {
    mockFollowedUids = new Set();
    mockFollowTeam.mockResolvedValue({ following: true, entityType: 'TEAM', entityUid: 't2', followerCount: 1 });

    renderApplicationStep({ id: 'm1', linkedinProfile: { id: 'li-1' } });
    send();

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(
        "Applied to Founding Backend Engineer at Bacalhau. Your profile went with your note. You're now following Bacalhau.",
      ),
    );
    expect(mockFollowTeam).toHaveBeenCalledWith('t2');
  });

  /* An unticked box is the opt-out: the application still goes, the follow
     does not, and the receipt is the one it always was. */
  it('leaves the receipt alone when the tick was removed', () => {
    mockFollowedUids = new Set();

    renderApplicationStep({ id: 'm1', linkedinProfile: { id: 'li-1' } });
    fireEvent.click(screen.getByText('Follow Bacalhau to hear when they post or hire'));
    send();

    expect(toastSuccess).toHaveBeenCalledWith(
      'Applied to Founding Backend Engineer at Bacalhau. Your profile went with your note.',
    );
    expect(mockFollowTeam).not.toHaveBeenCalled();
  });

  /* A failed follow never earns the clause — the application stands, the
     receipt stays silent about a follow that did not happen. */
  it('omits the clause when the follow itself failed', async () => {
    mockFollowedUids = new Set();
    mockFollowTeam.mockResolvedValue(null);

    renderApplicationStep({ id: 'm1', linkedinProfile: { id: 'li-1' } });
    send();

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(
        'Applied to Founding Backend Engineer at Bacalhau. Your profile went with your note.',
      ),
    );
    expect(mockFollowTeam).toHaveBeenCalledWith('t2');
  });
});
