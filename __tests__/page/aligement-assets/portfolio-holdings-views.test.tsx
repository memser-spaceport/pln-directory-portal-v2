import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';

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
    ResponsiveContainer: ({ children }: { children: React.ReactElement<{ width?: number; height?: number }> }) => (
      <div style={{ width: 800, height: 400 }}>
        {jest.requireActual('react').cloneElement(children, { width: 800, height: 400 })}
      </div>
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
  monthly: [
    point("Aug '26", 11_465_146),
    point("Sep '26", 13_472_330),
    { ...point("Nov '26", 14_000_000), plaaReserves: 25_000 },
  ],
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
      'Monthly Graph',
      'Table View',
    ]);
    expect(screen.getByRole('button', { name: 'Monthly Graph' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText(/Quarterly/)).not.toBeInTheDocument();
    expect(screen.queryByText(/figures are preliminary/)).not.toBeInTheDocument();
  });

  it('still switches to the table view', () => {
    render(<TrustHoldings data={data} />);
    fireEvent.click(screen.getByRole('button', { name: 'Table View' }));

    expect(screen.getByRole('button', { name: 'Table View' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('table')).toHaveTextContent("Sep '26");
  });

  it('shows reserves in the table, blank for months before they existed', () => {
    render(<TrustHoldings data={data} />);
    fireEvent.click(screen.getByRole('button', { name: 'Table View' }));

    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent);
    expect(headers.slice(0, 5)).toEqual(['DATE', 'TOTAL PLAA', 'PLAA RESERVES', 'NAV', 'NAV / PLAA FDV']);
    expect(headers.join(' ')).not.toMatch(/ISSUED/);

    const cellsOf = (label: string) =>
      Array.from(screen.getByText(label).closest('tr')!.querySelectorAll('td')).map((td) => td.textContent);
    expect(cellsOf("Nov '26")[2]).toBe('25,000');
    expect(cellsOf("Aug '26")[2]).toBe('');
  });

  it('lets the key switch each chart line off and back on', () => {
    render(<TrustHoldings data={data} />);
    const key = screen.getByRole('list', { name: 'Chart key' });
    const toggle = (name: RegExp) => within(key).getByRole('checkbox', { name });

    for (const name of [/NAV \/ PLAA/, /Buyback clearing price/, /Total PLAA/]) {
      expect(toggle(name)).toBeChecked();
    }
    expect(within(key).queryByRole('checkbox', { name: /PLVH/ })).not.toBeInTheDocument();

    const totalPlaaPoints = () => screen.queryAllByText(/total PLAA$/, { selector: 'title' });
    const totalPlaaAxisTitle = () => screen.queryAllByText('Total PLAA', { selector: 'text, tspan' });
    const navPriceLabels = () => screen.queryAllByText(/^\$\d+\.\d{2}$/, { selector: 'text, tspan' });

    expect(totalPlaaPoints().length).toBeGreaterThan(0);
    expect(totalPlaaAxisTitle().length).toBeGreaterThan(0);
    fireEvent.click(toggle(/Total PLAA/));
    expect(toggle(/Total PLAA/)).not.toBeChecked();
    expect(totalPlaaPoints()).toHaveLength(0);
    expect(totalPlaaAxisTitle()).toHaveLength(0);

    expect(navPriceLabels().length).toBeGreaterThan(0);
    fireEvent.click(toggle(/NAV \/ PLAA/));
    expect(navPriceLabels()).toHaveLength(0);

    fireEvent.click(toggle(/Total PLAA/));
    expect(totalPlaaPoints().length).toBeGreaterThan(0);
  });

  it("shows the latest month's Total PLAA outstanding with its reserves left out", () => {
    render(<TrustHoldings data={data} />);
    const field = screen.getByText('Total PLAA outstanding').closest('div')!;
    expect(within(field).getByRole('definition')).toHaveTextContent('575,000');
  });

  it('keeps the same key in both views', () => {
    render(<TrustHoldings data={data} />);
    const keyItems = () =>
      Array.from(screen.getByRole('list', { name: 'Chart key' }).querySelectorAll('li')).map((li) => li.textContent);

    const onGraph = keyItems();
    fireEvent.click(screen.getByRole('button', { name: 'Table View' }));

    expect(keyItems()).toEqual(onGraph);
    expect(onGraph).toContain('Total PLAA');
  });
});
