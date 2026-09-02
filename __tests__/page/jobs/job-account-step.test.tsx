import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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

/* The panes this file is not about. All are static imports of the drawer, so
   they load whichever step is showing — and `JobApplicationPane` reaches
   `next/server` through the ReferModal hooks it borrows from `prototypes/`,
   which throws `Request is not defined` under jsdom. Stubbing them keeps this
   suite about the drawer.

   `JobDetailPane` is stubbed down to its banner slot rather than to null. The
   pane's own layout is `job-detail-pane.test.tsx`'s subject; what belongs here
   is the one decision the drawer makes about it — who gets handed a banner —
   and a stub returning null would hide that decision completely. */
jest.mock('@/components/page/jobs/JobDetailPane/JobDetailPane', () => ({
  JobDetailPane: ({ banner }: { banner?: React.ReactNode }) => <>{banner}</>,
}));
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

/**
 * Every answer `accountSchema` requires — which now includes the role.
 *
 * The role arrived here as a consequence rather than as this step's own change.
 * Both doors share one schema, and role stopped being conditional on the
 * PL-team tick, so this host requires it for the same reason the modal does.
 * That is the right way round: `isJobProfileComplete` is `role &&
 * jobSearchStatus`, and this step exists to make an account that can apply.
 */
const fillAccount = () => {
  fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: 'polina@protocol.ai' } });
  fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Polina Bublii' } });
  fireEvent.change(screen.getByLabelText(/LinkedIn profile/), { target: { value: 'polina-bublii' } });
  fireEvent.change(screen.getByLabelText('Current role'), { target: { value: 'Protocol Engineer' } });
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
      expect(screen.queryByRole('list', { name: 'Application steps' })).not.toBeInTheDocument();
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

  /* The note is asserted *within the footer*, not against the document.
     A bare `getByText` here would keep passing if this sentence moved into the
     body of the step — which is exactly where the case for a profile is headed —
     and the assertion would then be guarding a different element than the one it
     names. Scoped, it fails the moment the footer stops saying this. */
  const footerOf = (container: HTMLElement) =>
    container.querySelector('[class*="footerInner"]') as HTMLElement;

  it('offers a stranger the profile as well as the employer’s site', () => {
    const { container } = outboundReview();

    expect(screen.getByRole('button', { name: /Apply on team site/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create your profile' })).toBeInTheDocument();
    /* The case for a profile is no longer made here — it is a card in the body
       of the step. What the footer keeps is the caption on the press itself,
       which is a different kind of sentence: what this costs and what it buys,
       not why a profile is worth having. */
    expect(within(footerOf(container)).getByText(/teams across the network can find you/)).toBeInTheDocument();
    expect(
      within(footerOf(container)).queryByText(/A profile lets recruiters across the network/),
    ).not.toBeInTheDocument();
  });

  /* A caption floating near a button is not a caption for it. The footer draws
     the note and the branch owns the button, so the association is the one thing
     neither can do alone — which is exactly the kind of wiring that rots. */
  it('names the caption as the press’s description', () => {
    const { container } = outboundReview();

    const note = within(footerOf(container)).getByText(/teams across the network can find you/);
    expect(screen.getByRole('button', { name: 'Create your profile' })).toHaveAttribute(
      'aria-describedby',
      note.id,
    );
  });

  /* Into the drawer's own step 2 — the account form — so signing up from the job
     you are reading is one press and no navigation. */
  it('sends the profile press to the account step', () => {
    const onStepChange = jest.fn();
    outboundReview({ onStepChange });

    fireEvent.click(screen.getByRole('button', { name: 'Create your profile' }));

    expect(onStepChange).toHaveBeenCalledWith('profile');
  });

  /* A signed-in member whose account is still pending reaches the same branch,
     and already has the profile this offers to make. Offering it to them would
     be the footer asking for something they have. */
  it('does not offer a profile to someone who already has one', () => {
    outboundReview({ isLoggedIn: true, memberUid: 'm1', viewerState: 'pending-approval' });

    expect(screen.getByRole('button', { name: /Apply on team site/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create your profile' })).not.toBeInTheDocument();
    expect(screen.queryByText(/teams across the network can find you/)).not.toBeInTheDocument();
  });

  /* **DOM order is load-bearing here.** On phones the bar stacks and the design
     puts the profile press on top, which the stylesheet gets by demoting the
     outbound press with `order: 1` (`.footerLeadDemoted`) — so the order these
     two are written in is the order they appear in reversed. Someone tidying the
     JSX by putting the primary button first would silently flip the mobile
     layout, and no media query runs in jsdom to catch it. This is what catches
     it.

     The mechanism changed and the assertion did not: this used to be
     `column-reverse` on a group holding both buttons, back when the bar's left
     slot was a tinted note. The outbound press moved into that slot when the
     note became a card in the body of the step, and `order` is how a lone child
     of `.footerInner` does what a group could do for itself. */
  it('writes the outbound press first, which is what the mobile stack reverses', () => {
    outboundReview();

    const buttons = screen
      .getAllByRole('button')
      .map((b) => b.textContent?.trim())
      .filter((label) => label === 'Create your profile' || label?.startsWith('Apply on team site'));

    expect(buttons).toEqual(['Apply on team site', 'Create your profile']);
  });

  /* The rail is withheld for every step of an outbound run, not just the reading
     one. Someone who presses Create your profile lands on the account form, and
     from there goes back to the posting and out — there is no third stop, so a
     rail drawing one would be the flow lying about itself. */
  it('keeps the rail off on the account step too, where there is no third stop', () => {
    renderStep(OTHER, { applyGoesExternal: true, at: 'profile' });

    expect(screen.queryByRole('list', { name: 'Application steps' })).not.toBeInTheDocument();
    expect(screen.queryByText('Application')).not.toBeInTheDocument();
  });
});

/**
 * Who is told what a profile is for.
 *
 * The banner is the drawer's decision, not the pane's — `JobDetailPane` takes it
 * as a slot and has no idea who is reading. These are the two halves of that
 * decision: the gate on the way in, and the caption in the footer, which is
 * gated separately and on a branch shared with four signed-in states.
 */
describe('the case for a profile', () => {
  beforeEach(() => jest.clearAllMocks());

  const heading = () => screen.queryByRole('heading', { name: 'What your profile unlocks' });

  it('makes it to a stranger reading a role', () => {
    renderStep(OTHER, { applyGoesExternal: true, at: 'review' });

    expect(heading()).toBeInTheDocument();
  });

  /* The banner is gated on `isLoggedIn` alone, so it survives on a Protocol Labs
     role — where applying happens in-app and the three-step rail is *not*
     withheld. That is the busiest this screen gets, and it is deliberate: the
     rail says which steps exist, the banner says why bother, and the state where
     the flow actually completes in-app is the one where the argument is truest.
     Pinned because the obvious "tidy-up" is to hide one of them. */
  it('makes it on a role that applies in-app, alongside the rail', () => {
    renderStep(PL, { at: 'review' });

    expect(heading()).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Application steps' })).toBeInTheDocument();
  });

  it('is not made to someone who already has a profile', () => {
    renderStep(OTHER, { applyGoesExternal: true, at: 'review', isLoggedIn: true, memberUid: 'm1' });

    expect(heading()).not.toBeInTheDocument();
  });

  /* Only the reading step. On the account form the argument has been won — the
     person is filling it in — and on the letter step it would be arguing for
     something they are three fields from having. */
  it('is not made again on the steps after it', () => {
    renderStep(OTHER, { applyGoesExternal: true, at: 'profile' });

    expect(heading()).not.toBeInTheDocument();
  });

  describe('the footer caption on an in-app role', () => {
    const caption = () => screen.queryByText(/your profile goes with your application/);

    it('tells a stranger what the press costs', () => {
      renderStep(PL, { at: 'review' });

      expect(caption()).toBeInTheDocument();
    });

    /**
     * **The gate that is easy to lose.** This branch is not the logged-out one —
     * it is every in-app apply there is, so an approved member, a Job Aspirant
     * and a member still pending all press the same button. Only the *label* has
     * ever switched on `isLoggedIn`; a caption that did not would be this footer
     * offering a sign-up to three states that signed up months ago, in a state
     * nobody exercises by hand because it looks identical until you read it.
     */
    it('says nothing to a member who already has one', () => {
      renderStep(PL, { at: 'review', isLoggedIn: true, memberUid: 'm1', viewerState: 'ready' });

      expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
      expect(caption()).not.toBeInTheDocument();
    });
  });
});
