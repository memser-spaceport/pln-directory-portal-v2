import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Step 2 of the apply flow, for a visitor with no account.
 *
 * The thing worth guarding here is not that a form renders — it is that the
 * form renders *inside the flow*, with the rail still on screen. The account
 * used to be a modal on top of this drawer, and a regression back to that would
 * look identical in any test that only asked "are the fields present".
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
    onJobApplyStepViewed: jest.fn(),
    onJobApplyFlowClosed: jest.fn(),
    onJobApplyExternalRedirected: jest.fn(),
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
  fireEvent.change(screen.getByLabelText(/LinkedIn profile/), { target: { value: 'polina-bublii' } });
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
    expect(screen.queryByText('Team email')).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /Not looking/ })).not.toBeInTheDocument();
  });

  /**
   * Two cards, not one. The account questions make an account; the status is the
   * profile answer that decides whether that account can apply without stopping
   * again — and its own card is what lets it wear the profile step's amber
   * required treatment, so a stranger and a member see one field.
   */
  describe('the two cards', () => {
    it('titles the account card without echoing the rail', () => {
      renderStep();

      expect(screen.getByText('Your account')).toBeInTheDocument();
      // The rail's label, and only the rail's — a card header repeating its own
      // step label names nothing, and rendered the words twice 40px apart.
      expect(screen.getAllByText('Your details')).toHaveLength(1);
    });

    it('marks the status card required until it is answered', () => {
      renderStep();

      expect(screen.getByText('Required to continue.')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('radio', { name: /Actively looking/ }));

      expect(screen.queryByText('Required to continue.')).not.toBeInTheDocument();
    });

    /* The strip is standing state; this appears only once someone has pressed.
       Without it the button reads as dead, because the control that would
       otherwise take focus is a deliberately invisible radio. */
    it('says why the press did nothing when no status is chosen', async () => {
      renderStep();
      fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: 'polina@protocol.ai' } });
      fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Polina Bublii' } });
      fireEvent.change(screen.getByLabelText(/LinkedIn profile/), { target: { value: 'polina-bublii' } });

      fireEvent.click(screen.getByRole('button', { name: 'Create Profile' }));

      await waitFor(() => expect(screen.getByText('Select where you are with job hunting')).toBeInTheDocument());
      expect(onSignUp).not.toHaveBeenCalled();
    });
  });

  /* Above the fields, not below them. Under the form is past all of the work
     the escape exists to save, for the returning member whose session lapsed. */
  it('offers the sign-in escape', () => {
    renderStep();

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(onSignIn).toHaveBeenCalled();
  });

  describe('the footer', () => {
    /* Silence for everyone now, and it is worth asserting for both employers
       rather than only one.

       A sentence used to run here for non-PL teams — "{team} takes your
       application on their own site" — written when the rail promised a
       stranger three steps and delivered two. The rail is withheld for the whole
       of an outbound run now, so there is no promise left to correct, and the
       warning is carried by the review step on either side of this one: the
       button that sent them here, and the same button waiting when they return.

       Absent, not empty. An always-rendered <p> would still cost 12px of column
       gap above the button on a phone, so `toBeNull` is the assertion and not
       an empty-string check. */
    it('says nothing at all, for either kind of employer', () => {
      const pl = renderStep(PL);
      expect(pl.container.querySelector('p[class*="footerHint"]')).toBeNull();
      pl.unmount();

      const other = renderStep(OTHER);
      expect(screen.queryByText(/takes your application on their own site/)).not.toBeInTheDocument();
      expect(other.container.querySelector('p[class*="footerHint"]')).toBeNull();
    });

    /* The review step's own version of that honesty: Apply is an outbound link,
       so the rail of three in-app steps comes off — and with the hint gone from
       beside it, the label is the only thing left that can name the destination. */
    it('hides the rail when Apply leaves the site, and says where it goes', () => {
      renderStep(OTHER, { applyGoesExternal: true, at: 'review' });

      expect(screen.getByRole('button', { name: /Apply on team site/ })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Continue to apply' })).not.toBeInTheDocument();
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
      expect(screen.queryByText('Review job')).not.toBeInTheDocument();
      expect(screen.queryByText('Application')).not.toBeInTheDocument();
    });

    it('creates the account with what was typed', async () => {
      renderStep();
      fillAccount();

      fireEvent.click(screen.getByRole('button', { name: 'Create Profile' }));

      await waitFor(() => expect(onSignUp).toHaveBeenCalled());
      expect(onSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'polina@protocol.ai',
          name: 'Polina Bublii',
          linkedin: 'polina-bublii',
          jobSearchStatus: 'actively-looking',
        }),
      );
    });

    it('will not create an account from an unfinished form', async () => {
      renderStep();
      fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: 'polina@protocol.ai' } });

      fireEvent.click(screen.getByRole('button', { name: 'Create Profile' }));

      await waitFor(() => expect(screen.getByText('Name is required')).toBeInTheDocument());
      expect(onSignUp).not.toHaveBeenCalled();
    });

    /* The refusal lands in the pane with the fields it is about, not in the
       footer with the button that triggered it. */
    it('reports a refusal where the answers are', async () => {
      onSignUp.mockResolvedValueOnce({ success: false, emailTaken: true });
      renderStep();
      fillAccount();

      fireEvent.click(screen.getByRole('button', { name: 'Create Profile' }));

      await waitFor(() => expect(screen.getByText(/This email already has an account/)).toBeInTheDocument());
    });
  });
});

/**
 * The review step for a stranger whose Apply would leave the site.
 *
 * `onApply` sends a logged-out visitor on a non-PL role straight to the
 * employer's posting, so before this the only door out of the drawer was a door
 * off the board. The profile press is offered *beside* the outbound one rather
 * than instead of it — both are honest, so neither hides behind the other.
 */
describe('the outbound review step’s two doors', () => {
  beforeEach(() => jest.clearAllMocks());

  const outboundReview = (props: Partial<React.ComponentProps<typeof JobApplyFlowDrawer>> = {}) =>
    renderStep(OTHER, { applyGoesExternal: true, at: 'review', ...props });

  it('offers a stranger the profile as well as the employer’s site', () => {
    outboundReview();

    expect(screen.getByRole('button', { name: /Apply on team site/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Job Profile' })).toBeInTheDocument();
    expect(screen.getByText(/A profile lets recruiters across the network/)).toBeInTheDocument();
  });

  /* Into the drawer's own step 2 — the account form — so signing up from the job
     you are reading is one press and no navigation. */
  it('sends the profile press to the account step', () => {
    const onStepChange = jest.fn();
    outboundReview({ onStepChange });

    fireEvent.click(screen.getByRole('button', { name: 'Create Job Profile' }));

    expect(onStepChange).toHaveBeenCalledWith('profile');
  });

  /* A signed-in member whose account is still pending reaches the same branch,
     and already has the profile this offers to make. Offering it to them would
     be the footer asking for something they have. */
  it('does not offer a profile to someone who already has one', () => {
    outboundReview({ isLoggedIn: true, memberUid: 'm1', viewerState: 'pending-approval' });

    expect(screen.getByRole('button', { name: /Apply on team site/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create Job Profile' })).not.toBeInTheDocument();
    expect(screen.queryByText(/A profile lets recruiters across the network/)).not.toBeInTheDocument();
  });

  /* **DOM order is load-bearing here.** On phones the bar stacks and the design
     puts the profile press on top, which the stylesheet gets with
     `column-reverse` — so the order these two are written in is the order they
     appear in reversed. Someone tidying the JSX by putting the primary button
     first would silently flip the mobile layout, and no media query runs in
     jsdom to catch it. This is what catches it. */
  it('writes the outbound press first, which is what the mobile stack reverses', () => {
    outboundReview();

    const buttons = screen
      .getAllByRole('button')
      .map((b) => b.textContent?.trim())
      .filter((label) => label === 'Create Job Profile' || label?.startsWith('Apply on team site'));

    expect(buttons).toEqual(['Apply on team site', 'Create Job Profile']);
  });

  /* The rail is withheld for every step of an outbound run, not just the reading
     one. Someone who presses Create Job Profile lands on the account form, and
     from there goes back to the posting and out — there is no third stop, so a
     rail drawing one would be the flow lying about itself. */
  it('keeps the rail off on the account step too, where there is no third stop', () => {
    renderStep(OTHER, { applyGoesExternal: true, at: 'profile' });

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByText('Application')).not.toBeInTheDocument();
  });
});
