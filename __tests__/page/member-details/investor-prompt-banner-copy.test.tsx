import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { InvestorPromptBanner } from '@/components/page/member-details/InvestorProfileDetails/components/InvestorProfileView/components/InvestorPromptBanner/InvestorPromptBanner';

// LAB-2663: the settings page is now called "Settings" everywhere, including
// the toast that points a member back to it.

const mockMutate = jest.fn();
jest.mock('@/services/members/hooks/useUpdateMemberInvestorSettings', () => ({
  useUpdateMemberInvestorSettings: () => ({ mutate: mockMutate }),
}));
const mockToastInfo = jest.fn();
jest.mock('@/components/core/ToastContainer', () => ({
  toast: { info: (...args: unknown[]) => mockToastInfo(...args) },
}));
jest.mock('@/analytics/demoday.analytics', () => ({
  useDemoDayAnalytics: () => ({
    onInvestorProfileAddDetailsClicked: jest.fn(),
    onInvestorProfileNotAnInvestorClicked: jest.fn(),
  }),
}));

describe('InvestorPromptBanner — "Not an Investor" toast copy (LAB-2663)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('points the member to "Settings → Email Preferences", not "Account Settings"', async () => {
    render(
      <InvestorPromptBanner
        member={{ id: 'm1', accessLevel: '' } as never}
        isInvestor={null}
        secRulesAccepted={false}
        showIncomplete
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Not an Investor/ }));

    expect(mockToastInfo).toHaveBeenCalledTimes(1);
    const [message] = mockToastInfo.mock.calls[0];
    expect(message).toBe('Investor section hidden. You can re-enable it anytime in Settings → Email Preferences.');
    expect(message).not.toMatch(/Account Settings/);
  });
});
