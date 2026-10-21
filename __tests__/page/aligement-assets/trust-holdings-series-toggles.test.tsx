import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import TrustHoldings, { TrustBuyback } from '@/components/page/aligement-assets/trust-holdings/trust-holdings';
import type { NavPoint, TrustHoldingsData } from '@/services/plaa/trust-holdings.service';

jest.mock('@/analytics/alignment-assets.analytics', () => ({
  useAlignmentAssetsAnalytics: () => ({ onNavMenuClicked: jest.fn() }),
}));
jest.mock('@/hooks/useScrollDepthTracking', () => ({ useScrollDepthTracking: jest.fn() }));
jest.mock('@/components/page/aligement-assets/nav-summary-card/nav-summary-card', () => ({
  __esModule: true,
  default: () => null,
}));

// Recharts needs a measured container to render; stub it and expose each
// series by its dataKey so the test can assert which lines are plotted.
jest.mock('recharts', () => {
  const Passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: Passthrough,
    ComposedChart: Passthrough,
    PieChart: Passthrough,
    Pie: Passthrough,
    Cell: () => null,
    Bar: () => null,
    CartesianGrid: () => null,
    LabelList: () => null,
    XAxis: () => null,
    YAxis: ({ yAxisId }: { yAxisId?: string }) => <div data-testid={`axis-${yAxisId}`} />,
    Line: ({ dataKey }: { dataKey?: string }) => <div data-testid={`line-${dataKey}`} />,
  };
});

const point = (label: string, month: string): NavPoint => ({
  label,
  date: month,
  totalPlaa: 1000,
  nav: 2000,
  navPerPlaa: 2,
  treasuries: 500,
  btc: 100,
  eth: 100,
  fil: 100,
  plvh: 1200,
});

const data = {
  navPerPlaaHeadline: '$2.00',
  asOfDate: 'Mar 31, 2026',
  trustTotalValue: '$2,000',
  portfolioCompanies: 191,
  quarterly: [point('Q1 2026', '2026-03'), point('Q2 2026', '2026-06')],
  monthly: [point('Jan 2026', '2026-01'), point('Feb 2026', '2026-02')],
  buybackMetrics: [],
  focusAreas: [],
  trustComposition: [],
  disclaimers: [],
} as unknown as TrustHoldingsData;

const buybacks = [
  {
    roundNumber: 18,
    monthYear: 'February 2026',
    auctionNumber: 2,
    section: {
      summary: { title: 'Buyback #2 - Key Results', items: [{ label: 'Clearing Price', value: '$1.80' }] },
    },
  },
] as unknown as TrustBuyback[];

// Selected by testid, not legend copy: relabelling a series must not fail these.
const legendBox = (series: 'nav' | 'buyback' | 'issuance') => screen.getByTestId(`th-key-${series}`);

test('every series checkbox starts checked and its line is plotted', () => {
  render(<TrustHoldings data={data} buybacks={buybacks} />);

  expect(legendBox('nav')).toBeChecked();
  expect(legendBox('buyback')).toBeChecked();
  expect(screen.getByTestId('line-navPerPlaa')).toBeInTheDocument();
  expect(screen.getByTestId('line-buyback')).toBeInTheDocument();
});

test('unchecking a series removes only that line from the chart', () => {
  render(<TrustHoldings data={data} buybacks={buybacks} />);

  fireEvent.click(legendBox('nav'));
  expect(legendBox('nav')).not.toBeChecked();
  expect(screen.queryByTestId('line-navPerPlaa')).not.toBeInTheDocument();
  expect(screen.getByTestId('line-buyback')).toBeInTheDocument();

  fireEvent.click(legendBox('buyback'));
  expect(screen.queryByTestId('line-buyback')).not.toBeInTheDocument();

  fireEvent.click(legendBox('nav'));
  expect(screen.getByTestId('line-navPerPlaa')).toBeInTheDocument();
});

test('PLAA issuance toggle drops its line and its right-hand axis in the monthly view', () => {
  render(<TrustHoldings data={data} buybacks={buybacks} />);

  fireEvent.click(screen.getByRole('button', { name: 'Monthly Graph' }));
  expect(screen.getByTestId('line-totalPlaa')).toBeInTheDocument();
  expect(screen.getByTestId('axis-issuance')).toBeInTheDocument();

  fireEvent.click(legendBox('issuance'));
  expect(screen.queryByTestId('line-totalPlaa')).not.toBeInTheDocument();
  expect(screen.queryByTestId('axis-issuance')).not.toBeInTheDocument();
});
