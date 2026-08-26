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
jest.mock('@/components/page/jobs/JobProfileDrawer/PendingApprovalSteps', () => ({
  PendingApprovalSteps: () => <div data-testid="stepper" />,
}));

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

import { JobProfileDrawer } from '@/components/page/jobs/JobProfileDrawer/JobProfileDrawer';

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
      resumeIntoApply={false}
      onFooterAction={jest.fn()}
      {...props}
    />,
  );
};

/* Matches either wording on purpose: a regression that reintroduces "Save
   profile" should fail on the assertion about what the button SAYS, not by
   throwing "no such element" from the query that finds it. */
const footerButton = () => screen.getByRole('button', { name: /Continue to apply|Save profile/ });

describe('the profile drawer footer', () => {
  beforeEach(() => jest.clearAllMocks());

  /**
   * The rule the change establishes: the words follow whether the account may
   * apply at all, not which door the drawer was opened through.
   */
  it.each([
    ['reached from a role', { resumeIntoApply: true, pendingRoleTitle: 'Senior Engineer' }],
    ['reached from the banner, with nothing pending', { resumeIntoApply: false, pendingRoleTitle: null }],
  ])('says "Continue to apply" when %s', (_label, props) => {
    renderDrawer(INCOMPLETE, props);

    expect(footerButton()).toHaveTextContent('Continue to apply');
  });

  /**
   * No carve-out left, including the one that used to exist here.
   *
   * A pending account cannot reach an application at all, and the hint beside
   * the button says so outright — so this label runs ahead of what that person
   * can do today. That is a deliberate product decision in favour of one
   * consistent word for one act; the hint is what carries the truth. Asserted
   * together so the pairing stays visible: if the sentence ever goes, this
   * label is over-promising on its own.
   */
  it('says "Continue to apply" even while the account waits on approval', () => {
    renderDrawer(COMPLETE, { pendingApproval: true, resumeIntoApply: true, pendingRoleTitle: 'Senior Engineer' });

    expect(footerButton()).toHaveTextContent('Continue to apply');
    expect(screen.getByText(/applying unlocks once the PL team approves/i)).toBeInTheDocument();
  });

  /** And before the required answers are in, where the missing-fields hint is
   *  the one showing — still one label, still disabled. */
  it('says it for a pending account with an unfinished profile too', () => {
    renderDrawer(INCOMPLETE, { pendingApproval: true });

    expect(footerButton()).toHaveTextContent('Continue to apply');
    expect(footerButton()).toBeDisabled();
  });

  /** Disabled until the two required answers are in — that is what makes the
   *  label a statement about the future rather than a lie about the present. */
  it('stays disabled until the profile is ready', () => {
    renderDrawer(INCOMPLETE);

    expect(footerButton()).toBeDisabled();
  });

  it('enables once the role and status are answered', () => {
    renderDrawer(COMPLETE);

    expect(footerButton()).toBeEnabled();
  });

  /**
   * The disagreement this change removes: the hint has always ended
   * "…to continue", so a button reading "Save profile" beside it was describing
   * a different act from the sentence next to it.
   */
  it('agrees with the hint about what the press is for', () => {
    renderDrawer(INCOMPLETE);

    expect(screen.getByText(/to continue\. Everything else is optional\./i)).toBeInTheDocument();
    expect(footerButton()).toHaveTextContent('Continue to apply');
  });
});
