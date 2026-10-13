import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { PortfolioPanel } from '@/components/page/explore-pl-network/PortfolioPanel/PortfolioPanel';
import { PORTFOLIO } from '@/components/page/explore-pl-network/data/islands';
import { TEAM_INFO } from '@/components/page/explore-pl-network/data/teamInfo';
import { displayNameOf } from '@/components/page/explore-pl-network/data/directoryUrl';

// A matched team that is on the 2026 map.
const team = PORTFOLIO.find((l) => TEAM_INFO[l.id]?.uid && TEAM_INFO[l.id]?.oneLiner && l.endYear === null)!;
const info = TEAM_INFO[team.id]!;

const setup = () => {
  const handlers = {
    onViewChanged: jest.fn(),
    onTileOpened: jest.fn(),
    onProfileClicked: jest.fn(),
    onShowAllToggled: jest.fn(),
  };
  render(<PortfolioPanel {...handlers} />);
  return { ...handlers, user: userEvent.setup() };
};

describe('PortfolioPanel', () => {
  it('opens on the map', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Map' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('group', { name: 'PL Network portfolio map' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous year' })).toBeInTheDocument();
  });

  it('opens a team card from a tile, with the directory facts and profile link', async () => {
    const { user, onTileOpened, onProfileClicked } = setup();
    await user.click(screen.getByRole('button', { name: displayNameOf(team) }));

    const card = screen.getByRole('dialog', { name: displayNameOf(team) });
    expect(within(card).getByText(info.oneLiner!)).toBeInTheDocument();
    expect(within(card).getByText(`In the network since ${team.startYear}`)).toBeInTheDocument();
    const profile = within(card).getByRole('link', { name: /View profile on PL Network/ });
    expect(profile).toHaveAttribute('href', `/teams/${info.uid}`);
    expect(onTileOpened).toHaveBeenCalledWith(team);

    await user.click(profile);
    expect(onProfileClicked).toHaveBeenCalledWith(team, 'map');

    await user.click(within(card).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('switches to a list of every team, cropped until Show all', async () => {
    const { user, onViewChanged, onShowAllToggled } = setup();
    await user.click(screen.getByRole('button', { name: 'List' }));
    expect(onViewChanged).toHaveBeenCalledWith('list');

    expect(screen.getAllByRole('link')).toHaveLength(PORTFOLIO.length);
    const more = screen.getByRole('button', { name: `Show all ${PORTFOLIO.length} teams` });
    expect(more).toHaveAttribute('aria-expanded', 'false');

    await user.click(more);
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
    expect(onShowAllToggled).toHaveBeenCalledWith(true);
  });

  it('links list rows to the directory', async () => {
    const { user, onProfileClicked } = setup();
    await user.click(screen.getByRole('button', { name: 'List' }));
    const row = screen.getByRole('link', { name: displayNameOf(team) });
    expect(row).toHaveAttribute('href', `/teams/${info.uid}`);
    await user.click(row);
    expect(onProfileClicked).toHaveBeenCalledWith(team, 'list');
  });

  it('does not report a view change when the current view is pressed again', async () => {
    const { user, onViewChanged } = setup();
    await user.click(screen.getByRole('button', { name: 'Map' }));
    expect(onViewChanged).not.toHaveBeenCalled();
  });
});
