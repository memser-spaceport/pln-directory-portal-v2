import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

const mockUseRightsTokensBalance = jest.fn();
jest.mock('@/services/rights-tokens/hooks/useRightsTokens', () => ({
  useRightsTokensBalance: () => mockUseRightsTokensBalance(),
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: (selector: (s: any) => any) => selector({ currentUser: { name: 'Alex Rivera' } }),
}));

// Render tooltip copy inline so it can be checked without hover interactions.
jest.mock('@/components/core/tooltip/tooltip', () => ({
  Tooltip: ({ trigger, content }: { trigger: React.ReactNode; content: string }) => (
    <>
      {trigger}
      <span>{content}</span>
    </>
  ),
}));

import RightsTokensDashboard from '@/components/page/aligement-assets/rights-tokens-dashboard/rights-tokens-dashboard';

describe('RightsTokensDashboard copy', () => {
  beforeEach(() => {
    mockUseRightsTokensBalance.mockReturnValue({
      data: { totalRightsAndTokens: 1200, rights: 1000, tokens: 200, tokensSold: 50, lastUpdated: '' },
      isLoading: false,
    });
  });

  it('labels the primary total PLAA Balance', () => {
    render(<RightsTokensDashboard />);

    expect(screen.getByText('PLAA Balance')).toBeInTheDocument();
  });

  it('never says owned or earned, including tooltips', () => {
    const { container } = render(<RightsTokensDashboard />);

    expect(container.textContent).not.toMatch(/owned|earned/i);
    expect(screen.getByText('Combined Value of PLAA Balance + PLAA Redeemed')).toBeInTheDocument();
    expect(screen.getByText('Total PLAA Redeemed in Buyback Auctions')).toBeInTheDocument();
  });
});
