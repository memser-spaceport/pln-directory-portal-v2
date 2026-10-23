import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ExplorePlNetworkView } from '@/components/page/explore-pl-network/ExplorePlNetworkView';
import { PORTFOLIO_FALLBACK } from '@/components/page/explore-pl-network/data/portfolio';
import { mergePortfolio } from '@/components/page/explore-pl-network/data/mergePortfolio';

jest.mock('next/font/local', () => () => ({ className: 'aileron', variable: 'aileron-var' }));
const mockAnalytics: Record<string, jest.Mock> = {};
jest.mock('@/analytics/explore-pl-network.analytics', () => ({
  useExplorePlNetworkAnalytics: () =>
    new Proxy(mockAnalytics, { get: (target, key: string) => (target[key] ??= jest.fn()) }),
}));

const teams = mergePortfolio(PORTFOLIO_FALLBACK, []);
const SECTIONS = [
  { id: 'focus-areas', label: 'Focus areas' },
  { id: 'entities', label: 'Entities' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'investors', label: 'Investors' },
];

// jsdom has no layout: give each section a top, relative to the viewport.
const placeSections = (tops: Record<string, number>) => {
  for (const [id, top] of Object.entries(tops)) {
    const el = document.getElementById(id)!;
    el.getBoundingClientRect = () => ({ top, bottom: top + 500, left: 0, right: 0, width: 0, height: 500 }) as DOMRect;
  }
};

const nav = () => within(screen.getByRole('navigation', { name: 'Sections' }));

describe('Explore PL Network section links', () => {
  let scrollIntoView: jest.Mock;

  beforeEach(() => {
    Object.values(mockAnalytics).forEach((fn) => fn.mockClear());
    scrollIntoView = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    Element.prototype.scrollTo = jest.fn();
    window.scrollTo = jest.fn();
    window.history.replaceState(null, '', '/explore-pl-network');
  });

  it('shows the four section links after the mark, in order, and no FAQ', () => {
    render(<ExplorePlNetworkView teams={teams} />);
    const links = nav().getAllByRole('link');
    expect(links.map((a) => a.textContent)).toEqual(SECTIONS.map((x) => x.label));
    links.forEach((a, i) => expect(a).toHaveAttribute('href', `#${SECTIONS[i].id}`));
    expect(nav().queryByRole('link', { name: /FAQ/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to top' })).toHaveTextContent('Protocol Labs Network');
  });

  it('gives every linked section its anchor on the page', () => {
    render(<ExplorePlNetworkView teams={teams} />);
    for (const { id } of SECTIONS) expect(document.getElementById(id)).toBeInTheDocument();
    expect(document.getElementById('investors')).toContainElement(
      screen.getByRole('heading', { name: /raised from top VCs/ }),
    );
  });

  it('scrolls smoothly to the section on a click, updates the hash and reports the click', async () => {
    const user = userEvent.setup();
    render(<ExplorePlNetworkView teams={teams} />);
    await user.click(nav().getByRole('link', { name: 'Portfolio' }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(document.getElementById('portfolio'));
    expect(window.location.hash).toBe('#portfolio');
    expect(mockAnalytics.onSectionLinkClicked).toHaveBeenCalledWith({ section: 'portfolio', source: 'header' });
  });

  it('marks only the section under the bar as current while the visitor scrolls', () => {
    render(<ExplorePlNetworkView teams={teams} />);
    placeSections({ 'focus-areas': -900, entities: -300, portfolio: 400, investors: 1500 });
    act(() => {
      fireEvent.scroll(document.body);
    });
    expect(nav().getByRole('link', { name: 'Entities' })).toHaveAttribute('aria-current', 'location');
    expect(
      nav()
        .getAllByRole('link')
        .filter((a) => a.hasAttribute('aria-current')),
    ).toHaveLength(1);

    placeSections({ 'focus-areas': -2000, entities: -1400, portfolio: -700, investors: 60 });
    act(() => {
      fireEvent.scroll(document.body);
    });
    expect(nav().getByRole('link', { name: 'Investors' })).toHaveAttribute('aria-current', 'location');
    expect(
      nav()
        .getAllByRole('link')
        .filter((a) => a.hasAttribute('aria-current')),
    ).toHaveLength(1);
  });

  it('marks no link above the first section', () => {
    render(<ExplorePlNetworkView teams={teams} />);
    placeSections({ 'focus-areas': 900, entities: 1500, portfolio: 2400, investors: 3500 });
    act(() => {
      fireEvent.scroll(document.body);
    });
    expect(
      nav()
        .getAllByRole('link')
        .filter((a) => a.hasAttribute('aria-current')),
    ).toHaveLength(0);
  });

  it('goes back to the top on a click on the mark and reports it', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', '/explore-pl-network#entities');
    render(<ExplorePlNetworkView teams={teams} />);
    await user.click(screen.getByRole('button', { name: 'Back to top' }));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(window.location.hash).toBe('');
    expect(mockAnalytics.onLogoClicked).toHaveBeenCalled();
  });

  it('opens at the section named in the hash on load', () => {
    window.history.replaceState(null, '', '/explore-pl-network#investors');
    render(<ExplorePlNetworkView teams={teams} />);
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(document.getElementById('investors'));
  });

  it('ignores a hash that names no section', () => {
    window.history.replaceState(null, '', '/explore-pl-network#faq');
    render(<ExplorePlNetworkView teams={teams} />);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
