import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { CompletedDemoDayTeamsList } from '@/components/page/demo-day/DemodayCompletedView/components/CompletedDemoDayTeamsList';
import type { DemoDayState, DemoDayTeam } from '@/app/actions/demo-day.actions';

// The card is covered by its own suite; here the list's collapse rule is the subject.
jest.mock(
  '@/components/page/demo-day/DemodayCompletedView/components/CompletedDemoDayTeamsList/components/PastTeamCard',
  () => ({
    PastTeamCard: ({ team }: { team: { uid: string; name: string } }) => (
      <div data-testid="past-team-card">{team.name}</div>
    ),
  }),
);

const team = (n: number): DemoDayTeam => ({
  uid: `team-${n}`,
  name: `Team ${n}`,
  logoUrl: null,
  newsCount: 0,
  shortDescription: `Building thing ${n}`,
  isFollowing: false,
});

const teams = (count: number) => Array.from({ length: count }, (_, i) => team(i + 1));

const demoDay = (count: number) => ({ teams: teams(count) }) as DemoDayState;

const onShowMore = jest.fn();

function renderList(count: number) {
  return render(
    <CompletedDemoDayTeamsList demoDay={demoDay(count)} onCompletedViewShowMoreTeamsClicked={onShowMore} />,
  );
}

const showAllButton = () => screen.queryByRole('button', { name: /show (all|less) teams/i });

beforeEach(() => jest.clearAllMocks());

describe('CompletedDemoDayTeamsList — the six-team threshold', () => {
  it.each([1, 5, 6])('renders %i teams with no expand button — they all fit already', (count) => {
    renderList(count);

    expect(screen.getAllByTestId('past-team-card')).toHaveLength(count);
    expect(showAllButton()).not.toBeInTheDocument();
  });

  it('offers the expand button at seven teams, one past the threshold', () => {
    renderList(7);

    expect(showAllButton()).toHaveTextContent('Show All Teams');
  });

  it('expands the grid at or below the threshold without anyone clicking', () => {
    const { container } = renderList(6);

    expect(container.querySelector('.cardsGridContainer')).toHaveClass('expanded');
  });

  it('leaves the grid collapsed above the threshold until it is expanded', () => {
    const { container } = renderList(7);

    expect(container.querySelector('.cardsGridContainer')).not.toHaveClass('expanded');

    fireEvent.click(showAllButton() as HTMLElement);

    expect(container.querySelector('.cardsGridContainer')).toHaveClass('expanded');
  });
});

describe('CompletedDemoDayTeamsList — expanding', () => {
  it('flips the label between All and Less on each click', () => {
    renderList(10);

    expect(showAllButton()).toHaveTextContent('Show All Teams');

    fireEvent.click(showAllButton() as HTMLElement);
    expect(showAllButton()).toHaveTextContent('Show Less Teams');

    fireEvent.click(showAllButton() as HTMLElement);
    expect(showAllButton()).toHaveTextContent('Show All Teams');
  });

  it('reports the click, collapsing included — the event tracks intent to toggle', () => {
    renderList(10);

    fireEvent.click(showAllButton() as HTMLElement);
    fireEvent.click(showAllButton() as HTMLElement);

    expect(onShowMore).toHaveBeenCalledTimes(2);
  });

  it('renders every team up front — expanding is a CSS reveal, not a fetch', () => {
    renderList(10);

    expect(screen.getAllByTestId('past-team-card')).toHaveLength(10);
  });
});

describe('CompletedDemoDayTeamsList — nothing to show', () => {
  it('renders nothing when the demo day has no teams', () => {
    const { container } = render(
      <CompletedDemoDayTeamsList demoDay={demoDay(0)} onCompletedViewShowMoreTeamsClicked={onShowMore} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when there is no demo day at all', () => {
    const { container } = render(
      <CompletedDemoDayTeamsList demoDay={undefined} onCompletedViewShowMoreTeamsClicked={onShowMore} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

describe('CompletedDemoDayTeamsList — heading', () => {
  it('states how many teams took part', () => {
    renderList(9);

    expect(screen.getByRole('heading', { name: 'Participating teams (9)' })).toBeInTheDocument();
  });
});
