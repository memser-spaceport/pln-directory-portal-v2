import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { PORTFOLIO_FALLBACK } from '@/components/page/explore-pl-network/data/portfolio';
import { getPortfolioTeams } from '@/services/explore-pl-network/portfolio.service';
import ExplorePlNetworkPage from '@/app/explore-pl-network/page';

jest.mock('next/font/local', () => () => ({ className: 'aileron', variable: 'aileron-var' }));
jest.mock('@/analytics/explore-pl-network.analytics', () => ({
  useExplorePlNetworkAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));
jest.mock('@/services/explore-pl-network/constants', () => ({
  ...jest.requireActual('@/services/explore-pl-network/constants'),
  SHOW_EXPLORE_PL_NETWORK: true,
}));
jest.mock('@/services/explore-pl-network/portfolio.service', () => ({ getPortfolioTeams: jest.fn() }));

const row = PORTFOLIO_FALLBACK.find((r) => r.uid && r.endYear === null)!;

describe('ExplorePlNetworkPage', () => {
  it('renders the map with the Directory data over the fallback', async () => {
    (getPortfolioTeams as jest.Mock).mockResolvedValue([
      {
        id: row.uid,
        teamUid: row.uid,
        name: 'Renamed in the Directory',
        logoUrl: null,
        mapLogoUrl: null,
        island: row.island,
        startYear: row.startYear,
        endYear: row.endYear,
        oneLiner: 'DB one-liner',
        stage: null,
        website: null,
      },
    ]);
    render(await ExplorePlNetworkPage());

    expect(
      screen.getByText('284 teams across four focus areas, with Protocol Labs at the centre.'),
    ).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Renamed in the Directory' }));
    const card = screen.getByRole('dialog', { name: 'Renamed in the Directory' });
    expect(within(card).getByText('DB one-liner')).toBeInTheDocument();
  });

  it('renders every team from the fallback when the API returns nothing', async () => {
    (getPortfolioTeams as jest.Mock).mockResolvedValue([]);
    render(await ExplorePlNetworkPage());
    expect(
      screen.getByText('284 teams across four focus areas, with Protocol Labs at the centre.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: row.name })).toBeInTheDocument();
  });
});
