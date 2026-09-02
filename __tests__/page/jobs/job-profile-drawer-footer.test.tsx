import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * The drawer's own action — what it says, and when it can be pressed.
 *
 * The label used to branch twice: on whether a role was held (the banner route
 * carries none) and on whether the account was approved. Both branches read
 * "Save profile", which made the same two required answers look like a filing
 * exercise in some states and like progress in others — distinctions the reader
 * never sees. One label now, and the hint beside it, which has always ended
 * "…to continue", finally agrees with the button.
 */

jest.mock('@/components/common/Drawer', () => ({
  Drawer: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div>{children}</div> : null,
}));

jest.mock('@/components/page/member-details/ProfileDetails', () => ({ ProfileDetails: () => null }));
jest.mock('@/components/page/member-details/ExperienceDetails', () => ({ ExperienceDetails: () => null }));
jest.mock('@/components/page/member-details/ContributionsDetails', () => ({ ContributionsDetails: () => null }));
jest.mock('@/components/page/member-details/RepositoriesDetails', () => ({ RepositoriesDetails: () => null }));
jest.mock('@/components/page/member-details/ContactDetails', () => ({
  ContactDetails: () => <div>Contact details</div>,
}));
jest.mock('@/components/page/jobs/JobProfileDrawer/CvFirstCard', () => ({
  CvFirstCard: () => null,
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => ({ currentUser: { uid: 'm1', name: 'Polina' } }),
}));
jest.mock('@/services/members/hooks/useUpdateMemberParams', () => ({
  useUpdateMemberParams: () => ({ mutate: jest.fn(), isPending: false }),
}));
/* The verification card's own dependencies. The gate is what these tests are
   about, not the round trip: `useLinkedInVerification` is a `useMutation` and
   would need a QueryClientProvider this suite has no other reason to build. */
jest.mock('@/services/members/hooks/useLinkedInVerification', () => ({
  useLinkedInVerification: () => ({ mutate: jest.fn(), isPending: false }),
}));
jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => ({ onConnectLinkedInClicked: jest.fn() }),
}));

jest.mock('@/services/members/hooks/useMemberExperience', () => ({
  useMemberExperience: () => ({ data: [], isLoading: false }),
}));

const mockMember = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: () => mockMember(),
}));

import { JobProfileDrawer, JobProfilePane } from '@/components/page/jobs/JobProfileDrawer/JobProfileDrawer';

const COMPLETE = {
  id: 'm1',
  role: 'Protocol Engineer',
  jobSearchStatus: 'actively-looking',
  skills: [],
  location: null,
};
const INCOMPLETE = { id: 'm1', role: '', jobSearchStatus: null, skills: [], location: null };

const renderDrawer = (member: unknown, props: Partial<React.ComponentProps<typeof JobProfileDrawer>> = {}) => {
  mockMember.mockReturnValue({ data: member, isLoading: false });
  return render(
    <JobProfileDrawer
      open
      onClose={jest.fn()}
      memberUid="m1"
      isLoggedIn
      pendingRoleTitle={null}
      pendingApproval={false}
      onFooterAction={jest.fn()}
      {...props}
    />,
  );
};

/* Matches either wording on purpose: a regression that reintroduces "Save
   profile" should fail on the assertion about what the button SAYS, not by
   throwing "no such element" from the query that finds it. */
const footerButton = () => screen.getByRole('button', { name: /Save and close|Continue to apply|Save profile/ });

describe('the standalone profile drawer footer', () => {
  beforeEach(() => jest.clearAllMocks());

  /* This surface is the banner's "Update profile" now — the one profile visit
     with no application behind it. `Continue to apply` was the right label while
     it was also the apply flow's step 2; that step is inside
     `JobApplyFlowDrawer` and keeps that label. Here there is nothing to continue
     to, and a button promising an application that is not waiting would be
     inventing one. */
  it('says what the press actually does here, which is not applying', () => {
    renderDrawer(INCOMPLETE);

    expect(footerButton()).toHaveTextContent('Save and close');
    expect(screen.queryByText('Continue to apply')).not.toBeInTheDocument();
  });

  it('stays disabled until the profile is ready', () => {
    renderDrawer(INCOMPLETE);

    expect(footerButton()).toBeDisabled();
  });

  it('enables once the role and status are answered', () => {
    const { container } = renderDrawer(COMPLETE);

    expect(footerButton()).toBeEnabled();
    /* And says what is still optional. This is also the positive control for the
       `toBeNull` in the silence test below — a selector matching nothing would
       make that one pass while the sentence was still rendering. */
    expect(screen.getByText(/Experience, skills and bio are optional/)).toBeInTheDocument();
    expect(container.querySelector('p[class*="footerHint"]')).not.toBeNull();
  });

  /* This used to assert the footer named what was still owed — "Add your current
     role and choose a job search status to continue. Everything else is
     optional." That sentence is gone: the requirement is stated on the card
     whose answer is missing (`DataIncomplete`'s strip on the header card, the
     `Required to continue` mark on the status section), which is where someone
     can act on it, and the footer was restating it from the bottom of a
     scrolling drawer.

     The incomplete state is not now untested — `stays disabled until the profile
     is ready` above is its sentinel, and it is the one that matters, because the
     dead button is the thing the sentence existed to explain. */
  it('stays silent about what is missing — the cards say it where the answers are', () => {
    const { container } = renderDrawer(INCOMPLETE);

    expect(screen.queryByText(/Everything else is optional/i)).not.toBeInTheDocument();
    expect(container.querySelector('p[class*="footerHint"]')).toBeNull();
  });

  /* The completeness the footer reads is the pane's own, reported up — the
     drawer has no fetch of its own any more. A pane that stopped reporting would
     leave this button dead in front of a finished profile. */
  it('reads completeness from the pane rather than deriving its own', () => {
    renderDrawer(COMPLETE);
    expect(footerButton()).toBeEnabled();

    renderDrawer(INCOMPLETE);
    expect(screen.getAllByRole('button', { name: /Save and close/ }).at(-1)).toBeDisabled();
  });
});

/* The lede belongs to the pane, and it is where the PL review is mentioned now
   that the stepper describing it is gone. */
describe('the profile pane lede', () => {
  beforeEach(() => jest.clearAllMocks());

  it('tells a pending member the review is not holding the application up', () => {
    mockMember.mockReturnValue({ data: COMPLETE, isLoading: false });
    render(
      <JobProfilePane
        memberUid="m1"
        isLoggedIn
        pendingRoleTitle="Senior Engineer"
        pendingApproval
        onProfileState={jest.fn()}
      />,
    );

    expect(screen.getByText(/isn't holding up your application to Senior Engineer/i)).toBeInTheDocument();
  });

  /* And says nothing to everyone else. "This is what hiring teams see when you
     apply." stood here for them — a sentence describing the step rather than
     saying anything about it, on a pane headed "Your profile" reached by pressing
     Apply. The pending line above is the only one left, because it is the only
     one carrying a fact nothing else on the screen shows. */
  it('opens on the profile itself for everyone else', () => {
    mockMember.mockReturnValue({ data: COMPLETE, isLoading: false });
    render(
      <JobProfilePane
        memberUid="m1"
        isLoggedIn
        pendingRoleTitle="Senior Engineer"
        pendingApproval={false}
        onProfileState={jest.fn()}
      />,
    );

    expect(screen.queryByText(/what hiring teams see/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/isn't holding up your application/i)).not.toBeInTheDocument();
  });

  it('offers contact details alongside the rest of the profile', () => {
    mockMember.mockReturnValue({ data: COMPLETE, isLoading: false });
    render(
      <JobProfilePane
        memberUid="m1"
        isLoggedIn
        pendingRoleTitle={null}
        pendingApproval={false}
        onProfileState={jest.fn()}
      />,
    );

    expect(screen.getByText('Contact details')).toBeInTheDocument();
  });
});

/**
 * The order of the pane's cards.
 *
 * Worth a test because the order it replaced had a written reason — "the
 * required section, so it comes first" — and that reason is still readable in
 * the file's history. Someone acting on it in good faith would put the status
 * back on top, and nothing else in this suite would notice.
 *
 * The requirement is not carried by position: the status card is the only amber
 * one on the screen and says `Required to continue` on its own title. What
 * position carries is reading order, and a profile opens with who you are and
 * how to reach you.
 */
describe('the profile pane’s section order', () => {
  beforeEach(() => jest.clearAllMocks());

  it('puts contact details above the job search status', () => {
    renderDrawer(INCOMPLETE);

    const contact = screen.getByText('Contact details');
    const status = screen.getByText('Job search status');

    /* `DOCUMENT_POSITION_FOLLOWING` — status comes after contact in document
       order. Asserted on the nodes rather than on an array of headings, so it
       stays true if either card grows another heading inside it. */
    expect(contact.compareDocumentPosition(status) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  /* The amber treatment is what actually marks the requirement, so it has to
     survive the move — otherwise the reordering quietly removes the only signal
     that is left once position stops carrying it. */
  it('still marks the status required when it is unanswered', () => {
    renderDrawer(INCOMPLETE);

    expect(screen.getByText('Required to continue')).toBeInTheDocument();
  });
});

/**
 * The identity-verification card, for an account the PL team is reviewing.
 *
 * The same card the member profile page shows. It is gated three ways and each
 * gate excludes a different person, which is why all three are asserted rather
 * than only the happy path — any one of them failing open puts a LinkedIn
 * hand-off in front of someone it cannot help.
 */
describe('the profile pane’s identity verification', () => {
  beforeEach(() => jest.clearAllMocks());

  const UNVERIFIED = { ...INCOMPLETE, linkedinProfile: null };
  const RETURN_TO = 'https://directory.plnetwork.io/jobs?applyTo=r1';

  it('offers verification to a member under review who has not linked LinkedIn', () => {
    renderDrawer(UNVERIFIED, { pendingApproval: true, verifyReturnTo: RETURN_TO });

    expect(screen.getByText('Please verify your identity')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /LinkedIn/ })).toBeInTheDocument();
    /* The flow's sentence, not the member page's default. That one says the
       verification is the point; here the point is what it unblocks, and only a
       surface with an application behind it can say so. */
    expect(screen.getByText('Verify your LinkedIn to get your application reviewed faster.')).toBeInTheDocument();
    expect(screen.queryByText('Link your LinkedIn account to complete verification.')).not.toBeInTheDocument();
  });

  /* An approved member is in no review, and neither is a Job Aspirant —
     `deriveBoardViewer` never yields `pending-approval` for one, which is what
     keeps this away from job-board sign-ups it would only confuse. */
  it('withholds it from anyone who is not in a review', () => {
    renderDrawer(UNVERIFIED, { pendingApproval: false, verifyReturnTo: RETURN_TO });

    expect(screen.queryByText('Please verify your identity')).not.toBeInTheDocument();
  });

  /* The answer it asks for. Having one retires the card. */
  it('withholds it once LinkedIn is linked', () => {
    renderDrawer(
      { ...INCOMPLETE, linkedinProfile: { id: 'li-1' } },
      { pendingApproval: true, verifyReturnTo: RETURN_TO },
    );

    expect(screen.queryByText('Please verify your identity')).not.toBeInTheDocument();
  });

  /* **The gate that is not about the member.** Connecting navigates the whole
     page to LinkedIn, so a host that cannot say where the round trip returns
     cannot safely offer it — the standalone drawer would come back to a board
     with the flow gone. Withheld rather than offered with nowhere to land. */
  it('withholds it when the host names no way back', () => {
    renderDrawer(UNVERIFIED, { pendingApproval: true });

    expect(screen.queryByText('Please verify your identity')).not.toBeInTheDocument();
  });
});
