import { fireEvent, render, screen, within } from '@testing-library/react';
import TrustHoldings from '@/components/page/aligement-assets/trust-holdings/trust-holdings';
import MonthlyActivity, {
  formatBalance,
  formatSigned,
} from '@/components/page/aligement-assets/trust-holdings/monthly-activity';
import { MONTHLY_RECONCILIATION } from '@/components/page/aligement-assets/trust-holdings/reconciliation/monthly-reconciliation';
import { NavPoint, TrustHoldingsData } from '@/services/plaa/trust-holdings.service';

jest.mock('@/analytics/alignment-assets.analytics', () => ({
  useAlignmentAssetsAnalytics: () => ({ onNavMenuClicked: jest.fn() }),
}));
jest.mock('@/hooks/useScrollDepthTracking', () => ({ useScrollDepthTracking: jest.fn() }));

// The default graph view mounts recharts' ResponsiveContainer, which needs this.
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const point = (date: string, nav: number): NavPoint => ({
  label: date,
  date,
  totalPlaa: 600_000,
  nav,
  navPerPlaa: 20.15,
  treasuries: 600_000,
  btc: 160_000,
  eth: 120_000,
  fil: 1_000_000,
  plvh: 10_000_000,
});

const data: TrustHoldingsData = {
  navPerPlaaHeadline: '$20.15',
  asOfDate: 'September 30th, 2026',
  trustTotalValue: '$13.47M',
  portfolioCompanies: 12,
  quarterly: [],
  monthly: [point("Jul '26", 8_392_031), point("Aug '26", 11_465_146), point("Sep '26", 13_472_330)],
  buybackMetrics: [],
  focusAreas: [],
  trustComposition: [],
  disclaimers: [],
};

const openTable = () => {
  render(<TrustHoldings data={data} />);
  fireEvent.click(screen.getByRole('button', { name: 'Table View' }));
};

const monthToggle = (month: string) => screen.getByRole('button', { name: month });

describe('formatting', () => {
  it('signs movements with two decimals', () => {
    expect(formatSigned(30_336_177)).toBe('+$303,361.77');
    expect(formatSigned(-167_500)).toBe('\u2212$1,675.00');
    expect(formatBalance(1_146_514_594)).toBe('$11,465,145.94');
  });

  it('renders no activity as an em dash, not zero', () => {
    expect(formatSigned(null)).toBe('—');
  });
});

const rowsOf = (table: HTMLElement) =>
  within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.textContent);

describe('MonthlyActivity', () => {
  it('shows the September 2026 NAV bridge and the contributions & expenses view', () => {
    render(<MonthlyActivity month="Sep '26" reconciliation={MONTHLY_RECONCILIATION['M9-2026']} />);
    const [bridge, activity] = screen.getAllByRole('table');
    expect(rowsOf(bridge)).toEqual([
      'Opening NAV (Aug 31)$11,465,145.94',
      'Contributions & Distributions+$1,485,743.77',
      'Cash Contributions+$110,000.00',
      'FIL Contributions+$193,361.77',
      'PLVH SPV Class B Interest Adjustment+$1,182,382.00',
      'Trust\u2019s Class B interest in PL Venture Holdings: 93.78% (from 83.25%)',
      'Auction Proceeds Paid—',
      'Income & Expenses\u2212$14,716.94',
      'Interest Income+$1,541.39',
      'Legal Expenses\u2212$1,675.00',
      'Trust Administrative Expenses\u2212$14,583.33',
      'Asset Value Changes+$536,157.65',
      'PLVH SPV\u2212$4,849.00',
      'BTC & ETH+$20,314.00',
      'FIL+$520,692.65',
      'Closing NAV (Sep 30)$13,472,330.42',
    ]);
    expect(rowsOf(activity)).toEqual([
      'Trust Contributions+$1,485,743.77',
      'Interest Income+$1,541.39',
      'Legal Expenses\u2212$1,675.00',
      'Trust Administrative Expenses\u2212$14,583.33',
      'Net Financial Activity+$1,471,026.83',
    ]);
  });

  it('shows no review flag when every September movement is verified', () => {
    render(<MonthlyActivity month="Sep '26" reconciliation={MONTHLY_RECONCILIATION['M9-2026']} />);
    expect(screen.queryByText(/inferred/)).toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it("footnotes August's combined BTC/ETH/FIL movement as inferred", () => {
    render(<MonthlyActivity month="Aug '26" reconciliation={MONTHLY_RECONCILIATION['M8-2026']} />);
    expect(screen.getByText(/Some movements are inferred/)).toBeTruthy();
    expect(screen.getByRole('list').textContent).toContain('cannot be split by asset');
  });

  it('says so when a month has no trust statement', () => {
    render(<MonthlyActivity month="Jul '26" />);
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByText(/No trust statement has been published for Jul '26/)).toBeTruthy();
  });
});

describe('NavTable month accordion', () => {
  it('starts collapsed and keeps the asset columns unchanged', () => {
    openTable();
    ["Jul '26", "Aug '26", "Sep '26"].forEach((month) =>
      expect(monthToggle(month).getAttribute('aria-expanded')).toBe('false'),
    );
    expect(screen.getByText('$13,472,330')).toBeTruthy();
  });

  it('expands a month on click and collapses it on a second click', () => {
    openTable();
    const toggle = monthToggle("Sep '26");
    const panel = document.getElementById(toggle.getAttribute('aria-controls')!)!;

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(panel.getAttribute('aria-hidden')).toBe('false');
    expect(within(panel).getByText('+$1,471,026.83')).toBeTruthy();

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(panel.getAttribute('aria-hidden')).toBe('true');
  });

  it('toggles from anywhere on the row, not just the date', () => {
    openTable();
    fireEvent.click(screen.getByText('$13,472,330'));
    expect(monthToggle("Sep '26").getAttribute('aria-expanded')).toBe('true');
  });

  it('keeps only one month open at a time', () => {
    openTable();
    fireEvent.click(monthToggle("Aug '26"));
    fireEvent.click(monthToggle("Sep '26"));
    expect(monthToggle("Aug '26").getAttribute('aria-expanded')).toBe('false');
    expect(monthToggle("Sep '26").getAttribute('aria-expanded')).toBe('true');
  });

  it('reports August buyback payouts once, as one aggregate amount in the bridge', () => {
    openTable();
    const toggle = monthToggle("Aug '26");
    fireEvent.click(toggle);
    const panel = document.getElementById(toggle.getAttribute('aria-controls')!)!;
    const rows = within(panel)
      .getAllByRole('rowheader', { name: 'Auction Proceeds Paid' })
      .map((header) => header.closest('tr')!.textContent);
    expect(rows).toEqual(['Auction Proceeds Paid−$19,686.55']);
  });
});
