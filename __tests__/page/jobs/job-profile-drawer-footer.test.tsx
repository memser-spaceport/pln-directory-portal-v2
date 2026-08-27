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

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => ({ currentUser: { uid: 'm1', name: 'Polina' } }),
}));
jest.mock('@/services/members/hooks/useUpdateMemberParams', () => ({
  useUpdateMemberParams: () => ({ mutate: jest.fn(), isPending: false }),
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
    renderDrawer(COMPLETE);

    expect(footerButton()).toBeEnabled();
  });

  /* The hint and the button have to describe one act. The hint ends
     "…to continue", which is still true of the requirement even though the
     destination changed. */
  it('names what is still owed', () => {
    renderDrawer(INCOMPLETE);

    expect(screen.getByText(/to continue\. Everything else is optional\./i)).toBeInTheDocument();
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
});
