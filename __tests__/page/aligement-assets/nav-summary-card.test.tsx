import { render, screen, within } from '@testing-library/react';
import NavSummaryCard from '@/components/page/aligement-assets/nav-summary-card/nav-summary-card';

const valueOf = (label: string) => within(screen.getByText(label).closest('div')!).getByRole('definition').textContent;

describe('NavSummaryCard', () => {
  it('derives NAV per PLAA from navUsd / totalUnits, rounded to 2dp', () => {
    render(<NavSummaryCard navUsd={19_070_000} totalUnits={1_061_000} />);

    expect(valueOf('Fully Diluted NAV')).toBe('$17.97');
  });

  it('renders an em dash for the per-unit value when totalUnits is 0, not NaN/Infinity', () => {
    render(<NavSummaryCard navUsd={19_070_000} totalUnits={0} />);

    expect(valueOf('Fully Diluted NAV')).toBe('—');
    expect(screen.queryByText(/NaN/)).toBeNull();
    expect(screen.queryByText(/Infinity/)).toBeNull();
  });

  it('renders an em dash for the per-unit value when totalUnits is null', () => {
    render(<NavSummaryCard navUsd={19_070_000} totalUnits={null} />);

    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('shows a dash instead of "$0.00M" when navUsd is missing', () => {
    render(<NavSummaryCard navUsd={null} totalUnits={1_061_000} />);

    expect(screen.queryByText(/\$0\.00M/)).toBeNull();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('formats navUsd and totalUnits as expected', () => {
    render(<NavSummaryCard navUsd={19_070_000} totalUnits={1_061_000} />);

    expect(screen.getByText('$19.07M')).toBeTruthy();
    expect(valueOf('Total PLAA outstanding')).toBe('1,061,000');
  });

  it('handles sub-million navUsd without an M/B suffix', () => {
    render(<NavSummaryCard navUsd={450_000} totalUnits={1_061_000} />);

    expect(screen.getByText('$450,000')).toBeTruthy();
  });

  it('leads with fully diluted NAV per PLAA, over every PLAA including reserves', () => {
    render(<NavSummaryCard navUsd={22_000_000} totalUnits={1_000_000} reserves={100_000} />);

    expect(valueOf('Fully Diluted NAV')).toBe('$22.00');
  });

  it('shows NAV per outstanding PLAA, leaving reserves out', () => {
    render(<NavSummaryCard navUsd={22_000_000} totalUnits={1_000_000} reserves={100_000} />);

    expect(valueOf('Outstanding PLAA NAV')).toBe('$24.44');
  });

  it('treats a month without reserves as fully issued', () => {
    render(<NavSummaryCard navUsd={22_000_000} totalUnits={1_000_000} reserves={null} />);

    expect(valueOf('Outstanding PLAA NAV')).toBe('$22.00');
  });

  it('shows Total PLAA outstanding as the issued count, reserves left out', () => {
    render(<NavSummaryCard navUsd={22_000_000} totalUnits={1_000_000} reserves={100_000} />);

    expect(valueOf('Total PLAA outstanding')).toBe('900,000');
  });
});
