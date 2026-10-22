import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ExplorePlNetworkView } from '@/components/page/explore-pl-network/ExplorePlNetworkView';
import { MAP_STATES } from '@/components/page/explore-pl-network/data/islands';
import { PORTFOLIO_FALLBACK } from '@/components/page/explore-pl-network/data/portfolio';
import { mergePortfolio } from '@/components/page/explore-pl-network/data/mergePortfolio';
import { PL_ENTITIES } from '@/components/page/explore-pl-network/data/content';

jest.mock('next/font/local', () => () => ({ className: 'aileron', variable: 'aileron-var' }));
const mockAnalytics: Record<string, jest.Mock> = {};
jest.mock('@/analytics/explore-pl-network.analytics', () => ({
  useExplorePlNetworkAnalytics: () =>
    new Proxy(mockAnalytics, { get: (target, key: string) => (target[key] ??= jest.fn()) }),
}));

const teams = mergePortfolio(PORTFOLIO_FALLBACK, []);

describe('ExplorePlNetworkView', () => {
  beforeEach(() => render(<ExplorePlNetworkView teams={teams} />));

  it('leads with the statement', () => {
    expect(screen.getByRole('heading', { level: 1, name: 'The Protocol Labs Network' })).toBeInTheDocument();
    expect(
      screen.getByText('Protocol Labs drives breakthroughs in computing to push humanity forward.'),
    ).toBeInTheDocument();
  });

  it("counts portfolio teams from the map's own data", () => {
    expect(screen.getByText(String(teams.length))).toBeInTheDocument();
    expect(
      screen.getByText(`${teams.length} teams across four focus areas, with Protocol Labs at the centre.`),
    ).toBeInTheDocument();
  });

  it('shows the figures without source lines', () => {
    expect(screen.getByText('Organizations in the network')).toBeInTheDocument();
    expect(screen.queryByText(/^Source:/)).not.toBeInTheDocument();
    expect(screen.queryByText('Listed below')).not.toBeInTheDocument();
  });

  it('links every PL entity in a new tab', () => {
    const entities = within(screen.getByRole('region', { name: 'Protocol Labs entities' }));
    for (const e of PL_ENTITIES) {
      const link = entities.getByRole('link', { name: new RegExp(`^${e.name}\\b`) });
      expect(link).toHaveAttribute('href', e.href);
      expect(link).toHaveAttribute('target', '_blank');
    }
  });

  it('has the logo wall and a footer without the FAQ, PL Capital, or legal links', () => {
    expect(screen.getByRole('heading', { name: /raised from top VCs/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Questions investors ask' })).not.toBeInTheDocument();
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).queryByRole('link', { name: 'PL Capital' })).not.toBeInTheDocument();
    expect(within(footer).queryByText(/PL Capital/)).not.toBeInTheDocument();
    expect(within(footer).queryByRole('link', { name: 'Privacy Policy' })).not.toBeInTheDocument();
    expect(within(footer).queryByRole('link', { name: 'Terms & Conditions' })).not.toBeInTheDocument();
  });

  it("reports a tile by marketing's logo id, the directory uid and the island", async () => {
    const user = userEvent.setup();
    const row =
      PORTFOLIO_FALLBACK[MAP_STATES['2026'].find((_, i, flat) => i % 3 === 0 && PORTFOLIO_FALLBACK[flat[i]].uid)!];
    await user.click(screen.getByRole('button', { name: row.name }));
    expect(mockAnalytics.onMapTileOpened).toHaveBeenCalledWith({
      logo_id: row.id,
      team_uid: row.uid,
      island: row.island,
    });
  });

  it('draws its own top bar, with no routes into the app', () => {
    expect(screen.getByText('Protocol Labs Network')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Contact us' })).not.toBeInTheDocument();
  });
});
