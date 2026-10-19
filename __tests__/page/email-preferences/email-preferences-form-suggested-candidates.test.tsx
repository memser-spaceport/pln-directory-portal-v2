import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { EmailPreferencesForm } from '@/components/page/email-preferences/components/EmailPreferencesForm';
import type { IUserInfo } from '@/types/shared.types';

// Only the gate is under test: who sees the Suggested Candidates switch.
let mockFlag = false;
jest.mock('@/services/jobs/constants', () => ({
  get SHOW_SUGGESTED_CANDIDATES_EMAIL() {
    return mockFlag;
  },
}));

jest.mock('@/components/page/email-preferences/components/SuggestedCandidatesEmail', () => ({
  SuggestedCandidatesEmail: () => <div data-testid="suggested-candidates-email" />,
}));
jest.mock('@/components/page/email-preferences/components/ForumDigest', () => ({ ForumDigest: () => null }));
jest.mock('@/components/page/email-preferences/components/Newsletter', () => ({ Newsletter: () => null }));
jest.mock('@/components/page/email-preferences/components/DemoDayUpdates', () => ({ DemoDayUpdates: () => null }));
jest.mock('@/components/page/email-preferences/components/InvestorCommunications', () => ({
  InvestorCommunications: () => null,
}));
jest.mock('@/services/access-control/hooks/useInvestorAccess', () => ({
  useInvestorAccess: () => ({ isInvestor: false }),
}));
jest.mock('@/services/auth/store', () => ({ useCurrentUserStore: () => ({ currentUser: null }) }));
jest.mock('@/services/members.service', () => ({ getMemberInfo: jest.fn() }));
jest.mock('@/utils/common.utils', () => ({ triggerLoader: jest.fn() }));

const initialData = {
  settings: {} as never,
  investorSettings: {} as never,
  memberInfo: {} as never,
};

function renderForm(userInfo: IUserInfo) {
  render(<EmailPreferencesForm uid={userInfo.uid as string} userInfo={userInfo} initialData={initialData} />);
}

describe('EmailPreferencesForm — Suggested Candidates gate', () => {
  afterEach(() => {
    mockFlag = false;
  });

  it('shows the switch to a team lead when the flag is on', () => {
    mockFlag = true;
    renderForm({ uid: 'lead-1', leadingTeams: ['team-1'] });
    expect(screen.getByTestId('suggested-candidates-email')).toBeInTheDocument();
  });

  it('hides it from a member who leads no team', () => {
    mockFlag = true;
    renderForm({ uid: 'member-1', leadingTeams: [] });
    expect(screen.queryByTestId('suggested-candidates-email')).not.toBeInTheDocument();
  });

  it('hides it when leadingTeams is missing', () => {
    mockFlag = true;
    renderForm({ uid: 'member-1' });
    expect(screen.queryByTestId('suggested-candidates-email')).not.toBeInTheDocument();
  });

  it('hides it from a team lead while the flag is off', () => {
    renderForm({ uid: 'lead-1', leadingTeams: ['team-1'] });
    expect(screen.queryByTestId('suggested-candidates-email')).not.toBeInTheDocument();
  });
});
