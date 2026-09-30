import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExplorePlNetworkView } from '@/components/page/explore-pl-network/ExplorePlNetworkView';
import { PORTFOLIO } from '@/components/page/explore-pl-network/data/islands';
import { PL_ENTITIES } from '@/components/page/explore-pl-network/data/content';

jest.mock('next/font/local', () => () => ({ className: 'aileron', variable: 'aileron-var' }));
jest.mock('@/analytics/explore-pl-network.analytics', () => ({
  useExplorePlNetworkAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));

describe('ExplorePlNetworkView', () => {
  beforeEach(() => render(<ExplorePlNetworkView />));

  it('leads with the statement', () => {
    expect(screen.getByRole('heading', { level: 1, name: 'The Protocol Labs Network' })).toBeInTheDocument();
    expect(
      screen.getByText('Protocol Labs drives breakthroughs in computing to push humanity forward.'),
    ).toBeInTheDocument();
  });

  it("counts portfolio teams from the map's own data", () => {
    expect(screen.getByText(String(PORTFOLIO.length))).toBeInTheDocument();
    expect(
      screen.getByText(`${PORTFOLIO.length} teams across four focus areas, with Protocol Labs at the centre.`),
    ).toBeInTheDocument();
  });

  it('shows the figures without source lines', () => {
    expect(screen.getByText('Organizations in the network')).toBeInTheDocument();
    expect(screen.queryByText(/^Source:/)).not.toBeInTheDocument();
    expect(screen.queryByText('Listed below')).not.toBeInTheDocument();
  });

  it('keeps its Q&A to the network; the Spotlight questions live on the Spotlight page', () => {
    expect(screen.getByText('What is the PL Network?')).toBeInTheDocument();
    expect(screen.queryByText('What is PL Spotlight?')).not.toBeInTheDocument();
  });

  it('links every PL entity in a new tab', () => {
    const entities = within(screen.getByRole('region', { name: 'Protocol Labs entities' }));
    for (const e of PL_ENTITIES) {
      const link = entities.getByRole('link', { name: new RegExp(`^${e.name}\\b`) });
      expect(link).toHaveAttribute('href', e.href);
      expect(link).toHaveAttribute('target', '_blank');
    }
  });

  it('has the logo wall, the FAQ and the footer', () => {
    expect(screen.getByRole('heading', { name: /raised from top VCs/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Questions investors ask' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'PL Capital' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeInTheDocument();
  });

  it('draws its own top bar, with no routes into the app', () => {
    expect(screen.getByText('PL Network')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact us' })).toHaveAttribute('href', 'mailto:spotlight@protocol.ai');
  });
});
