import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * The drawer's own action — what it says, and when it can be pressed.
 *
 * The label used to depend on how the drawer was *opened*: a role held (row →
 * Apply) got "Continue to apply", the banner's "Complete profile" got "Save
 * profile". Same drawer, same required fields, two different accounts of what
 * filling them in was for — and on the banner route the button disagreed with
 * the hint beside it, which has always ended "…to continue".
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
   * The one carve-out, and the reason it is the only one: a pending member
   * cannot reach an application by any route, and the hint beside the button
   * says so. "Continue to apply" over that sentence would be the button
   * contradicting its own caption.
   */
  it('says "Save profile" while the account is waiting on approval', () => {
    /* COMPLETE deliberately: the approval hint only replaces the "what's still
       missing" line once the required answers are in, and it is that sentence
       the label has to agree with. */
    renderDrawer(COMPLETE, { pendingApproval: true, resumeIntoApply: true, pendingRoleTitle: 'Senior Engineer' });

    expect(footerButton()).toHaveTextContent('Save profile');
    expect(screen.getByText(/applying unlocks once the PL team approves/i)).toBeInTheDocument();
  });

  /** Still "Save profile" before the required answers are in — the carve-out is
   *  about the account, not about how much of the profile is filled. */
  it('keeps "Save profile" for a pending account with an unfinished profile', () => {
    renderDrawer(INCOMPLETE, { pendingApproval: true });

    expect(footerButton()).toHaveTextContent('Save profile');
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
