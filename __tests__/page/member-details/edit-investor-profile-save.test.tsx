import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { EditInvestorProfileForm } from '@/components/page/member-details/InvestorProfileDetails/components/EditInvestorProfileForm';
import type { IMember } from '@/types/members.types';

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
  useUpdateInvestorProfile: () => ({ mutateAsync: jest.fn() }),
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

jest.mock('@/services/members/hooks/useMember', () => ({
  useMember: () => ({ data: undefined }),
}));

jest.mock('@/hooks/createTeam/useGetSaveTeam', () => ({
  useGetSaveTeam: () => jest.fn(),
}));

jest.mock('@/services/contact-support/store', () => ({
  useContactSupportStore: (select: (s: { actions: { openModal: () => void } }) => unknown) =>
    select({ actions: { openModal: jest.fn() } }),
}));

const member = {
  id: 'member-1',
  name: 'Ada',
  teams: [],
  investorProfile: null,
} as unknown as IMember;

const userInfo = { uid: 'member-1', name: 'Ada', email: 'ada@example.com' };

describe('Investor Details Save', () => {
  it('is disabled until the form is changed', () => {
    render(<EditInvestorProfileForm onClose={jest.fn()} member={member} userInfo={userInfo} />);

    const save = screen.getByRole('button', { name: 'Cancel' }).parentElement?.querySelector('button[type="submit"]');
    expect(save).toBeDisabled();
  });
});
