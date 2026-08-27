import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Step 2 of the apply flow, for a visitor with no account.
 *
 * The thing worth guarding here is not that a form renders — it is that the
 * form renders *inside the flow*, with the rail still on screen. The account
 * used to be a modal on top of this drawer, and a regression back to that would
 * look identical in any test that only asked "are the six fields present".
 *
 * The other half is the footer, which is the one place the flow admits it may
 * end early: an account created by this press is `pending`, and a pending
 * account applying to a non-Protocol-Labs role is sent to the employer's own
 * site. The rail promises three steps; for those roles it delivers two, and the
 * hint is where that gets said.
 */

jest.mock('@/components/common/Drawer', () => ({
  Drawer: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div>{children}</div> : null,
}));

// react-select in a form nobody drives through the company picker is noise.
jest.mock('@/components/form/FormSelect', () => ({ FormSelect: () => null }));

jest.mock('@/services/members/hooks/useMemberFormOptions', () => ({
  useMemberFormOptions: () => ({ data: { teams: [{ teamUid: 't1', teamTitle: 'Acme' }] } }),
}));

/* The two panes this file is not about. Both are static imports of the drawer,
   so they load whichever step is showing — and `JobApplicationPane` reaches
   `next/server` through the ReferModal hooks it borrows from `prototypes/`,
   which throws `Request is not defined` under jsdom. Stubbing them keeps this
   suite about step 2. */
jest.mock('@/components/page/jobs/JobDetailPane/JobDetailPane', () => ({ JobDetailPane: () => null }));
jest.mock('@/components/page/jobs/JobApplicationPane/JobApplicationPane', () => ({
  JobApplicationPane: () => null,
  COVER_LETTER_MAX_LENGTH: 2000,
}));
jest.mock('@/components/page/jobs/JobProfileDrawer/JobProfileDrawer', () => ({
  JobProfilePane: () => null,
  BackIcon: () => null,
  missingHint: () => 'add your current role',
  sentenceCase: (text: string) => text,
}));

jest.mock('@/services/jobs/hooks/useJobApplications', () => ({
  useSubmitJobApplication: () => ({ mutate: jest.fn(), isPending: false }),
  useRoleApplication: () => null,
}));

jest.mock('@/analytics/jobs.analytics', () => ({
  useJobsAnalytics: () => ({
    onJobApplySubmitted: jest.fn(),
    onJobApplyFailed: jest.fn(),
    onJobDetailOpened: jest.fn(),
  }),
}));

import { JobApplyFlowDrawer } from '@/components/page/jobs/JobApplyFlowDrawer/JobApplyFlowDrawer';
import type { IJobRole, IJobTeam } from '@/types/jobs.types';

const role = {
  uid: 'r1',
  roleTitle: 'Protocol Engineer',
  applyUrl: 'https://example.com/apply',
} as unknown as IJobRole;

const teamNamed = (uid: string, name: string) => ({ uid, name }) as unknown as IJobTeam;
const PL = teamNamed('cldvnyxaf01ynu21k62uopjvg', 'Protocol Labs');
const OTHER = teamNamed('t2', 'Bluesky');

const onSignUp = jest.fn().mockResolvedValue({ success: true });
const onSignIn = jest.fn();

const renderStep = (team: IJobTeam = PL, props: Partial<React.ComponentProps<typeof JobApplyFlowDrawer>> = {}) =>
  render(
    <JobApplyFlowDrawer
      open
      onClose={jest.fn()}
      target={{ role, teamId: team.uid, teamName: team.name, team }}
      at="profile"
      onStepChange={jest.fn()}
      coverLetter=""
      onCoverLetterChange={jest.fn()}
      memberUid={undefined}
      member={null}
      isLoggedIn={false}
      pendingApproval={false}
      profileComplete={false}
      applied={false}
      appliedAt={null}
      showOriginalPosting={false}
      applyGoesExternal={false}
      onApply={jest.fn()}
      onSignUp={onSignUp}
      onSignIn={onSignIn}
      onProfileSaved={jest.fn()}
      onSubmitted={jest.fn()}
      viewerState="logged-out"
      source="job-board"
      {...props}
    />,
  );

const fillAccount = () => {
  fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: 'polina@protocol.ai' } });
  fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Polina Bublii' } });
  fireEvent.change(screen.getByPlaceholderText('Enter your current role'), {
    target: { value: 'Senior Protocol Engineer' },
  });
  fireEvent.click(screen.getByRole('radio', { name: /Actively looking/ }));
};

describe('the apply flow’s account step', () => {
  beforeEach(() => jest.clearAllMocks());

  /* The whole point of the change: the rail is still there. A modal over the
     drawer would render the same fields and hide this. */
  it('keeps the three-step rail on screen, naming the middle one for a stranger', () => {
    renderStep();

    expect(screen.getByText('Review job')).toBeInTheDocument();
    expect(screen.getByText('Application')).toBeInTheDocument();
    // Not "Your profile": a stranger has no profile yet, and the rail names the
    // position rather than the thing a member happens to have.
    expect(screen.getByText('Your details')).toBeInTheDocument();
    expect(screen.queryByText('Your profile')).not.toBeInTheDocument();
  });

  it('asks the account questions in the flow, not in a dialog over it', () => {
    renderStep();

    expect(screen.getByLabelText(/Email address/)).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Job search status' })).toBeInTheDocument();
  });

  /* Above the fields, not below them. Under the form is past all of the work
     the escape exists to save, for the returning member whose session lapsed. */
  it('offers the sign-in escape', () => {
    renderStep();

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(onSignIn).toHaveBeenCalled();
  });

  describe('the footer', () => {
    it('promises a return to the application for a Protocol Labs role', () => {
      renderStep(PL);

      expect(screen.getByText(/you’ll come back here to finish your application/)).toBeInTheDocument();
    });

    /* The honest version for every other employer. A new account is pending,
       and `onApply` sends a pending applicant to a non-PL employer's own site —
       so the rail's third step is not where this one ends. */
    it('says where a non-PL application actually goes', () => {
      renderStep(OTHER);

      expect(screen.getByText(/Bluesky takes your application on their own site/)).toBeInTheDocument();
    });

    it('creates the account with what was typed', async () => {
      renderStep();
      fillAccount();

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => expect(onSignUp).toHaveBeenCalled());
      expect(onSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'polina@protocol.ai',
          name: 'Polina Bublii',
          jobSearchStatus: 'actively-looking',
        }),
      );
    });

    it('will not create an account from an unfinished form', async () => {
      renderStep();
      fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: 'polina@protocol.ai' } });

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => expect(screen.getByText('Name is required')).toBeInTheDocument());
      expect(onSignUp).not.toHaveBeenCalled();
    });

    /* The refusal lands in the pane with the fields it is about, not in the
       footer with the button that triggered it. */
    it('reports a refusal where the answers are', async () => {
      onSignUp.mockResolvedValueOnce({ success: false, emailTaken: true });
      renderStep();
      fillAccount();

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => expect(screen.getByText(/This email already has an account/)).toBeInTheDocument());
    });
  });
});
