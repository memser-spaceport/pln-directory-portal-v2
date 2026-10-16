import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import TrustHoldings from '@/components/page/aligement-assets/trust-holdings/trust-holdings';
import type { NavPoint, TrustHoldingsData } from '@/services/plaa/trust-holdings.service';

jest.mock('next/image', () => ({ __esModule: true, default: () => null }));
jest.mock('@/hooks/useScrollDepthTracking', () => ({ useScrollDepthTracking: jest.fn() }));
jest.mock('@/analytics/alignment-assets.analytics', () => ({
  useAlignmentAssetsAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));
// Recharts measures its container, which jsdom can't; give it a fixed size.
jest.mock('recharts', () => {
  const actual = jest.requireActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) => (
      <div style={{ width: 800, height: 400 }}>{children}</div>
    ),
  };
});

const point = (label: string, nav: number): NavPoint => ({
  label,
  date: label,
  totalPlaa: 600_000,
  nav,
  navPerPlaa: nav / 600_000,
  treasuries: nav * 0.05,
  btc: nav * 0.01,
  eth: nav * 0.01,
  fil: nav * 0.08,
  plvh: nav * 0.85,
});

const data = {
  navPerPlaaHeadline: '',
  asOfDate: 'September 30th, 2026',
  trustTotalValue: '$13.47M',
  portfolioCompanies: 0,
  quarterly: [point("Q3 '26", 13_472_330)],
  monthly: [point("Aug '26", 11_465_146), point("Sep '26", 13_472_330)],
  buybackMetrics: [],
  focusAreas: [],
  trustComposition: [],
  disclaimers: [],
} as unknown as TrustHoldingsData;

describe('Portfolio & Holdings NAV views', () => {
  it('offers only the chart and the table, opening on the chart', () => {
    render(<TrustHoldings data={data} />);
    const views = screen.getByRole('group', { name: 'NAV view' });

    expect(Array.from(views.querySelectorAll('button')).map((b) => b.textContent)).toEqual([
      'Chart View',
      'Table View',
    ]);
    expect(screen.getByRole('button', { name: 'Chart View' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText(/Quarterly/)).not.toBeInTheDocument();
    expect(screen.queryByText(/figures are preliminary/)).not.toBeInTheDocument();
  });

  it('still switches to the table view', () => {
    render(<TrustHoldings data={data} />);
    fireEvent.click(screen.getByRole('button', { name: 'Table View' }));

    expect(screen.getByRole('button', { name: 'Table View' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('table')).toHaveTextContent("Sep '26");
  });
});
