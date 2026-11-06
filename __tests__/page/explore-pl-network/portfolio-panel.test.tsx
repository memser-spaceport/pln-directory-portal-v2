import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { PortfolioPanel } from '@/components/page/explore-pl-network/PortfolioPanel/PortfolioPanel';
import { ISLANDS, MAP_STATES } from '@/components/page/explore-pl-network/data/islands';
import { PORTFOLIO_FALLBACK } from '@/components/page/explore-pl-network/data/portfolio';
import { mergePortfolio } from '@/components/page/explore-pl-network/data/mergePortfolio';

// Rows drawn on the 2026 map.
const on2026 = new Set(MAP_STATES['2026'].filter((_, i) => i % 3 === 0));
const fallbackRows = PORTFOLIO_FALLBACK.filter((_, i) => on2026.has(i));
const matchedRow = fallbackRows.find((r) => r.uid && r.oneLiner)!;
const noUidRow = fallbackRows.find((r) => !r.uid)!;

const DB_ONE_LINER = 'One-liner edited in the Directory';
const teams = mergePortfolio(PORTFOLIO_FALLBACK, [
  {
    id: matchedRow.uid!,
    teamUid: matchedRow.uid!,
    name: matchedRow.name,
    logoUrl: null,
    mapLogoUrl: null,
    island: matchedRow.island,
    startYear: matchedRow.startYear,
    endYear: matchedRow.endYear,
    oneLiner: DB_ONE_LINER,
    stage: null,
    website: null,
  },
]);
const team = teams.find((t) => t.id === matchedRow.id)!;
const noUidTeam = teams.find((t) => t.id === noUidRow.id)!;

const setup = () => {
  const handlers = {
    onViewChanged: jest.fn(),
    onTileOpened: jest.fn(),
    onProfileClicked: jest.fn(),
    onShowAllToggled: jest.fn(),
  };
  render(<PortfolioPanel teams={teams} {...handlers} />);
  return { ...handlers, user: userEvent.setup() };
};

describe('PortfolioPanel', () => {
  it('opens on the map', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Map' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('group', { name: 'PL Network portfolio map' })).toBeInTheDocument();
  });

  // LAB-2877: past-year data is not accurate, so the year control is hidden and the map shows 2026 only.
  it('hides the year control and shows no year label', () => {
    setup();
    expect(screen.queryByRole('button', { name: 'Previous year' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next year' })).not.toBeInTheDocument();
    for (let y = 2014; y <= 2026; y++) {
      expect(screen.queryByRole('button', { name: String(y) })).not.toBeInTheDocument();
    }
    expect(screen.queryByText('2026')).not.toBeInTheDocument();
  });

  it('draws every team on the 2026 map', () => {
    setup();
    const map = screen.getByRole('group', { name: 'PL Network portfolio map' });
    const drawn = teams.filter((_, i) => on2026.has(i));
    expect(within(map).getAllByRole('button')).toHaveLength(drawn.length);
    for (const t of drawn) {
      expect(within(map).getByRole('button', { name: t.name })).toBeInTheDocument();
    }
  });

  it('keeps the category filter without the year control', async () => {
    const { user } = setup();
    const island = ISLANDS.find((i) => !i.isCentre)!;
    await user.click(screen.getByRole('button', { name: new RegExp(`^${island.name}`) }));
    expect(screen.getByRole('button', { name: /Close/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Previous year' })).not.toBeInTheDocument();
  });

  it('opens a team card from a tile, with the DB facts and profile link', async () => {
    const { user, onTileOpened, onProfileClicked } = setup();
    await user.click(screen.getByRole('button', { name: team.name }));

    const card = screen.getByRole('dialog', { name: team.name });
    expect(within(card).getByText(DB_ONE_LINER)).toBeInTheDocument();
    expect(within(card).getByText(`In the network since ${team.startYear}`)).toBeInTheDocument();
    const profile = within(card).getByRole('link', { name: /View profile on PL Network/ });
    expect(profile).toHaveAttribute('href', `/teams/${team.uid}`);
    expect(onTileOpened).toHaveBeenCalledWith(team);

    await user.click(profile);
    expect(onProfileClicked).toHaveBeenCalledWith(team, 'map');

    await user.click(within(card).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('links a tile with no directory match to a directory search', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: noUidTeam.name }));

    const card = screen.getByRole('dialog', { name: noUidTeam.name });
    expect(within(card).getByRole('link', { name: /View profile on PL Network/ })).toHaveAttribute(
      'href',
      `/teams?searchBy=${encodeURIComponent(noUidTeam.name)}`,
    );
  });

  it('switches to a list of every team grouped by island, cropped until Show all', async () => {
    const { user, onViewChanged, onShowAllToggled } = setup();
    await user.click(screen.getByRole('button', { name: 'List' }));
    expect(onViewChanged).toHaveBeenCalledWith('list');

    expect(screen.getAllByRole('link')).toHaveLength(284);
    for (const island of ISLANDS) {
      const group = screen.getByRole('region', { name: island.isCentre ? 'Protocol Labs' : island.name });
      expect(within(group).getAllByRole('link')).toHaveLength(teams.filter((t) => t.island === island.id).length);
    }

    const more = screen.getByRole('button', { name: 'Show all 284 teams' });
    expect(more).toHaveAttribute('aria-expanded', 'false');

    await user.click(more);
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
    expect(onShowAllToggled).toHaveBeenCalledWith(true);
  }, 15000);

  it('links list rows to the directory', async () => {
    const { user, onProfileClicked } = setup();
    await user.click(screen.getByRole('button', { name: 'List' }));
    const row = screen.getByRole('link', { name: team.name });
    expect(row).toHaveAttribute('href', `/teams/${team.uid}`);
    await user.click(row);
    expect(onProfileClicked).toHaveBeenCalledWith(team, 'list');
    // The list renders every portfolio row. Under a full Jest run that scan
    // can pass the default 5s limit; alone it finishes well inside it.
  }, 15000);

  it('loads every logo through the Next image endpoint, on the map and in the list', async () => {
    const { user } = setup();
    const optimized = (url: string) => `/_next/image?url=${encodeURIComponent(url)}&w=128&q=75`;
    const tile = screen.getByRole('button', { name: team.name });
    expect(tile.querySelector('image')).toHaveAttribute('href', optimized(team.logo));

    await user.click(screen.getByRole('button', { name: 'List' }));
    const row = screen.getByRole('link', { name: team.name });
    expect(row.querySelector('img')).toHaveAttribute('src', optimized(team.logo));
  }, 15000);

  it('does not report a view change when the current view is pressed again', async () => {
    const { user, onViewChanged } = setup();
    await user.click(screen.getByRole('button', { name: 'Map' }));
    expect(onViewChanged).not.toHaveBeenCalled();
  });
});
