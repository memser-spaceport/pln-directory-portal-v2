import { render, screen } from '@testing-library/react';
import NavSummaryCard from '@/components/page/aligement-assets/nav-summary-card/nav-summary-card';

describe('NavSummaryCard', () => {
  it('derives NAV per PLAA from navUsd / totalUnits, rounded to 2dp', () => {
    render(<NavSummaryCard navUsd={19_070_000} totalUnits={1_061_000} />);

    expect(screen.getByText('$17.97')).toBeTruthy();
  });

  it('renders an em dash for the per-unit value when totalUnits is 0, not NaN/Infinity', () => {
    render(<NavSummaryCard navUsd={19_070_000} totalUnits={0} />);

    expect(screen.getByText('—')).toBeTruthy();
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
    expect(screen.getByText('1,061,000')).toBeTruthy();
  });

  it('handles sub-million navUsd without an M/B suffix', () => {
    render(<NavSummaryCard navUsd={450_000} totalUnits={1_061_000} />);

    expect(screen.getByText('$450,000')).toBeTruthy();
  });
});
