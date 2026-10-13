import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { EditInvestorProfileForm } from '@/components/page/member-details/InvestorProfileDetails/components/EditInvestorProfileForm';
import type { IMember } from '@/types/members.types';

const mockUpdateInvestorProfile = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ setQueryData: jest.fn(), invalidateQueries: jest.fn() }),
}));

jest.mock('@/analytics/demoday.analytics', () => ({
  useDemoDayAnalytics: () => ({
    onInvestorProfileUpdated: jest.fn(),
    onInvestorDrawerInputChanged: jest.fn(),
    onInvestorDrawerFormSaved: jest.fn(),
  }),
}));

jest.mock('@/services/demo-day/hooks/useReportAnalyticsEvent', () => ({
  useReportAnalyticsEvent: () => ({ mutate: jest.fn() }),
}));

jest.mock('@/services/members/hooks/useUpdateInvestorProfile', () => ({
  useUpdateInvestorProfile: () => ({ mutateAsync: (...args: unknown[]) => mockUpdateInvestorProfile(...args) }),
}));

jest.mock('@/services/teams/hooks/useUpdateTeamInvestorProfile', () => ({
  useUpdateTeamInvestorProfile: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock('@/services/teams/hooks/useTeamsFormOptions', () => ({
  useTeamsFormOptions: () => ({ data: undefined }),
}));

jest.mock('@/services/members/hooks/useMemberFormOptions', () => ({
  useMemberFormOptions: () => ({ data: undefined }),
}));

// onSubmit bails out until the member's own read has landed.
jest.mock('@/services/members/hooks/useMember', () => ({
  useMember: () => ({ data: { memberInfo: { teamMemberRoles: [] } } }),
}));

jest.mock('@/hooks/createTeam/useGetSaveTeam', () => ({
  useGetSaveTeam: () => jest.fn(),
}));

jest.mock('@/services/contact-support/store', () => ({
  useContactSupportStore: (select: (s: { actions: { openModal: () => void } }) => unknown) =>
    select({ actions: { openModal: jest.fn() } }),
}));

const mockToastError = jest.fn();
jest.mock('@/components/core/ToastContainer', () => ({
  toast: { success: jest.fn(), error: (...args: unknown[]) => mockToastError(...args) },
}));

const userInfo = { uid: 'member-1', name: 'Ada', email: 'ada@example.com' };

const buildMember = (investorProfile: unknown = null) =>
  ({ id: 'member-1', name: 'Ada', teams: [], investorProfile }) as unknown as IMember;

// CSS modules render their keys in jest, so the class names are readable.
const angelTick = () => screen.getByText(/I angel invest as an accredited investor/).closest('label') as HTMLElement;
const fundTick = () => screen.getByText('I invest through fund(s).').closest('label') as HTMLElement;
const fieldRow = (label: string) => screen.getByText(label).closest('.row') as HTMLElement;

describe('EditInvestorProfileForm — highlightUnfilled (SPV Spotlight)', () => {
  beforeEach(() => mockUpdateInvestorProfile.mockReset());

  it('marks nothing without the prop (Demo Day and the member page)', async () => {
    const { container } = render(
      <EditInvestorProfileForm onClose={jest.fn()} member={buildMember()} userInfo={userInfo} />,
    );
    await userEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(container.querySelector('.needsFill, .needsFillTick')).toBeNull();
  });

  it('marks "how do you invest" until a box is ticked, then the empty angel fields', async () => {
    render(
      <EditInvestorProfileForm onClose={jest.fn()} member={buildMember()} userInfo={userInfo} highlightUnfilled />,
    );
    expect(angelTick()).toHaveClass('needsFillTick');
    expect(fundTick()).toHaveClass('needsFillTick');

    await userEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(angelTick()).not.toHaveClass('needsFillTick');
    expect(fieldRow('Startup stage(s) you invest in?')).toHaveClass('needsFill');
    expect(fieldRow('Typical Check Size')).toHaveClass('needsFill');
  });

  it('clears a field as soon as it is filled', async () => {
    render(
      <EditInvestorProfileForm onClose={jest.fn()} member={buildMember()} userInfo={userInfo} highlightUnfilled />,
    );
    await userEvent.click(screen.getAllByRole('checkbox')[0]);
    await userEvent.type(screen.getByPlaceholderText('E.g. $250.000'), '50000');
    expect(fieldRow('Typical Check Size')).not.toHaveClass('needsFill');
    expect(fieldRow('Startup stage(s) you invest in?')).toHaveClass('needsFill');
  });

  it('leaves a filled profile unmarked', () => {
    const { container } = render(
      <EditInvestorProfileForm
        onClose={jest.fn()}
        member={buildMember({
          type: 'ANGEL',
          secRulesAccepted: true,
          investInStartupStages: ['Seed'],
          typicalCheckSize: '50000',
          investmentFocus: ['AI'],
        })}
        userInfo={userInfo}
        highlightUnfilled
      />,
    );
    expect(container.querySelector('.needsFill, .needsFillTick')).toBeNull();
  });

  it('calls onSaved after a successful save', async () => {
    const onSaved = jest.fn();
    render(
      <EditInvestorProfileForm
        onClose={jest.fn()}
        member={buildMember({
          type: 'ANGEL',
          secRulesAccepted: true,
          investInStartupStages: ['Seed'],
          typicalCheckSize: '50000',
          investmentFocus: ['AI'],
        })}
        userInfo={userInfo}
        onSaved={onSaved}
      />,
    );
    const checkSize = screen.getByPlaceholderText('E.g. $250.000');
    await userEvent.clear(checkSize);
    await userEvent.type(checkSize, '75000');
    fireEvent.submit(checkSize.closest('form') as HTMLFormElement);
    await waitFor(() => expect(mockUpdateInvestorProfile).toHaveBeenCalled());
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
  });
});
