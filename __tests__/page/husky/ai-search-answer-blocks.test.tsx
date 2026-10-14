import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

const trackDirectoryResultsCardClicked = jest.fn();
const trackHuskyActionCardClicked = jest.fn();
jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () => ({ trackDirectoryResultsCardClicked, trackHuskyActionCardClicked }),
}));

import { DirectoryResults } from '@/components/page/husky/Chat/components/Messages/components/PreviewMessage/components/DirectoryResults';
import { RelatedResults } from '@/components/page/husky/Chat/components/Messages/components/PreviewMessage/components/RelatedResults';
import { FollowupQuestions } from '@/components/core/husky/FollowupQuestions';

const sqlRow = (index: number, type = 'team') => ({ name: `Result ${index}`, type, source: `/teams/result-${index}` });
const sqlRows = (count: number) => Array.from({ length: count }, (_, index) => sqlRow(index + 1));

function blocks(container: HTMLElement) {
  return {
    desktop: container.querySelector('.desktop') as HTMLElement,
    mobile: container.querySelector('.mobile') as HTMLElement,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AI Search answer: directory results', () => {
  it('shows up to 6 cards on desktop and 3 on mobile, with "N of M results" and Show all when there are more', () => {
    const { container } = render(<DirectoryResults actions={sqlRows(8)} />);
    const { desktop, mobile } = blocks(container);

    expect(within(desktop).getByText('Results from the directory')).toBeInTheDocument();
    expect(within(desktop).getAllByRole('link')).toHaveLength(6);
    expect(within(desktop).getByText('6 of 8 results')).toBeInTheDocument();
    expect(within(desktop).getByRole('button', { name: 'Show all directory results' })).toHaveTextContent(
      'Show all (8)',
    );

    expect(within(mobile).getByText('Results from the directory')).toBeInTheDocument();
    expect(within(mobile).getAllByRole('link')).toHaveLength(3);
    expect(within(mobile).getByText('3 of 8 results')).toBeInTheDocument();
    expect(within(mobile).getByRole('button', { name: 'Show all directory results' })).toHaveTextContent(
      'Show all (8)',
    );
  });

  it('shows the count and Show all only on mobile when there are 4 to 6 results', () => {
    const { container } = render(<DirectoryResults actions={sqlRows(5)} />);
    const { desktop, mobile } = blocks(container);

    expect(within(desktop).getAllByRole('link')).toHaveLength(5);
    expect(within(desktop).queryByText(/results$/)).not.toBeInTheDocument();
    expect(within(desktop).queryByRole('button')).not.toBeInTheDocument();

    expect(within(mobile).getAllByRole('link')).toHaveLength(3);
    expect(within(mobile).getByText('3 of 5 results')).toBeInTheDocument();
    expect(within(mobile).getByRole('button', { name: 'Show all directory results' })).toBeInTheDocument();
  });

  it('shows no count and no Show all for 3 results or fewer', () => {
    const { container } = render(<DirectoryResults actions={sqlRows(3)} />);
    const { desktop, mobile } = blocks(container);

    expect(within(desktop).getAllByRole('link')).toHaveLength(3);
    expect(within(mobile).getAllByRole('link')).toHaveLength(3);
    expect(screen.queryByText(/ of 3 results/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show all directory results' })).not.toBeInTheDocument();
  });

  it('opens every result in a dialog from Show all and closes it again', () => {
    const { container } = render(<DirectoryResults actions={sqlRows(8)} />);
    const dialog = container.querySelector('dialog') as HTMLDialogElement;

    expect(dialog).toBeEmptyDOMElement();

    fireEvent.click(within(blocks(container).desktop).getByRole('button', { name: 'Show all directory results' }));

    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    expect(within(dialog).getByText('8')).toBeInTheDocument();
    expect(within(dialog).getByText('Results from the directory')).toBeInTheDocument();
    expect(within(dialog).getAllByRole('link', { hidden: true })).toHaveLength(8);

    fireEvent.click(within(dialog).getByRole('button', { name: 'Close directory results popup', hidden: true }));

    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
    expect(dialog).toBeEmptyDOMElement();
  });

  it('opens the dialog from the mobile Show all too', () => {
    const { container } = render(<DirectoryResults actions={sqlRows(4)} />);
    const dialog = container.querySelector('dialog') as HTMLDialogElement;

    fireEvent.click(within(blocks(container).mobile).getByRole('button', { name: 'Show all directory results' }));

    expect(within(dialog).getAllByRole('link', { hidden: true })).toHaveLength(4);
  });

  it('labels each card with its type, naming an IRL event "Event" and an event participant "Member"', () => {
    const { container } = render(
      <DirectoryResults
        actions={[
          { name: 'Ada', type: 'member', source: '/members/ada' },
          { name: 'Saturn Grid', type: 'team', source: '/teams/saturn' },
          { name: 'IPFS', type: 'project', source: '/projects/ipfs' },
          { name: 'Lab Week', type: 'irl-event', source: '/events/irl/lab-week' },
          { name: 'Grace', type: 'member-event-participation', source: '/members/grace' },
          { name: 'Demo', type: 'event', source: '/events/demo' },
        ]}
      />,
    );
    const desktop = within(blocks(container).desktop);

    expect(desktop.getByRole('link', { name: 'Ada - member' })).toHaveTextContent('member');
    expect(desktop.getByRole('link', { name: 'Saturn Grid - team' })).toHaveTextContent('team');
    expect(desktop.getByRole('link', { name: 'IPFS - project' })).toHaveTextContent('project');
    expect(desktop.getByRole('link', { name: 'Lab Week - irl-event' })).toHaveTextContent(/^Lab WeekEvent$/);
    expect(desktop.getByRole('link', { name: 'Grace - member-event-participation' })).toHaveTextContent(
      /^GraceMember$/,
    );
    expect(desktop.getByRole('link', { name: 'Demo - event' })).toHaveTextContent('event');
  });

  it('shows the icon that matches each card type and none for an unknown type', () => {
    const { container } = render(
      <DirectoryResults
        actions={[
          { name: 'Ada', type: 'Member', source: '/members/ada' },
          { name: 'Grace', type: 'member-event-participation', source: '/members/grace' },
          { name: 'Saturn Grid', type: 'team', source: '/teams/saturn' },
          { name: 'IPFS', type: 'project', source: '/projects/ipfs' },
          { name: 'Lab Week', type: 'irl-event', source: '/events/irl/lab-week' },
          { name: 'Demo', type: 'event', source: '/events/demo' },
        ]}
      />,
    );
    const desktop = within(blocks(container).desktop);
    const iconOf = (name: string) => within(desktop.getByRole('link', { name: new RegExp(`^${name} - `) }));

    expect(iconOf('Ada').getByAltText('Member icon')).toHaveAttribute('src', '/icons/husky/husky-member.svg');
    expect(iconOf('Grace').getByAltText('Member icon')).toBeInTheDocument();
    expect(iconOf('Saturn Grid').getByAltText('Team icon')).toHaveAttribute('src', '/icons/husky/husky-team.svg');
    expect(iconOf('IPFS').getByAltText('Project icon')).toHaveAttribute('src', '/icons/husky/husky-project.svg');
    expect(iconOf('Lab Week').getByAltText('Event icon')).toHaveAttribute('src', '/icons/husky/husky-event.svg');
    expect(iconOf('Demo').getByAltText('Event icon')).toBeInTheDocument();

    const { container: unknown } = render(
      <DirectoryResults actions={[{ name: 'Mystery', type: 'job', source: '/jobs/1' }]} />,
    );
    const card = within(blocks(unknown).desktop).getByRole('link', { name: 'Mystery - job' });
    expect(within(card).queryByRole('img')).not.toBeInTheDocument();
  });

  it('opens a card in a new tab and records the click', () => {
    const action = sqlRow(1);
    const { container } = render(<DirectoryResults actions={[action]} />);
    const card = within(blocks(container).desktop).getByRole('link', { name: 'Result 1 - team' });

    expect(card).toHaveAttribute('href', '/teams/result-1');
    expect(card).toHaveAttribute('target', '_blank');

    fireEvent.click(card);

    expect(trackDirectoryResultsCardClicked).toHaveBeenCalledWith(action);
  });
});

describe('AI Search answer: related results', () => {
  const actions = [
    { name: 'Ada', type: 'Member', directoryLink: '/members/ada' },
    { name: 'Saturn Grid', type: 'team', directoryLink: '/teams/saturn' },
    { name: 'IPFS', type: 'project', directoryLink: '/projects/ipfs' },
    { name: 'Lab Week', type: 'event', directoryLink: '/events/lab-week' },
    { name: 'Backend engineer', type: 'job', directoryLink: '/jobs/1' },
    { name: 'Acme raises Series A', type: 'news', directoryLink: '/home?news=1' },
    { name: 'Storage thread', type: 'forum', directoryLink: '/forum/topics/1' },
    { name: 'Unknown thing', type: 'other', directoryLink: '/other/1' },
  ];

  it('lists each related result as a new-tab link with its name and type', () => {
    render(<RelatedResults actions={actions} />);

    expect(screen.getByRole('heading', { name: 'Related results' })).toBeInTheDocument();
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(actions.length);
    actions.forEach((action, index) => {
      expect(links[index]).toHaveAttribute('href', action.directoryLink);
      expect(links[index]).toHaveAttribute('target', '_blank');
      expect(links[index]).toHaveTextContent(`${action.name}${action.type}`);
    });
  });

  it('shows the icon for each type, reusing project for jobs, event for news and member for forum', () => {
    render(<RelatedResults actions={actions} />);
    const iconSrc = (name: string) =>
      within(screen.getByRole('link', { name: new RegExp(name) }))
        .queryByAltText('icon')
        ?.getAttribute('src');

    expect(iconSrc('Ada')).toBe('/icons/husky/husky-member.svg');
    expect(iconSrc('Saturn Grid')).toBe('/icons/husky/husky-team.svg');
    expect(iconSrc('IPFS')).toBe('/icons/husky/husky-project.svg');
    expect(iconSrc('Lab Week')).toBe('/icons/husky/husky-event.svg');
    expect(iconSrc('Backend engineer')).toBe('/icons/husky/husky-project.svg');
    expect(iconSrc('Acme raises Series A')).toBe('/icons/husky/husky-event.svg');
    expect(iconSrc('Storage thread')).toBe('/icons/husky/husky-member.svg');
    expect(iconSrc('Unknown thing')).toBeUndefined();
  });

  it('records the click on a related result', () => {
    render(<RelatedResults actions={actions} />);

    fireEvent.click(screen.getByRole('link', { name: /Saturn Grid/ }));

    expect(trackHuskyActionCardClicked).toHaveBeenCalledWith(actions[1]);
  });
});

describe('AI Search answer: follow-up questions', () => {
  const questions = ['Who leads Saturn Grid?', 'What does it build?'];

  it('asks the clicked follow-up question', () => {
    const onFollowupClicked = jest.fn();
    render(
      <FollowupQuestions followupQuestions={questions} onFollowupClicked={onFollowupClicked} isLoadingObject={false} />,
    );

    expect(screen.getByRole('heading', { name: /Follow up questions/ })).toBeInTheDocument();
    expect(screen.getByTestId('followup-questions-list')).toHaveAttribute('data-state', '');

    fireEvent.click(screen.getByText('What does it build?'));

    expect(onFollowupClicked).toHaveBeenCalledTimes(1);
    expect(onFollowupClicked).toHaveBeenCalledWith('What does it build?');
  });

  it('marks the list as loading while an answer is being generated', () => {
    render(<FollowupQuestions followupQuestions={questions} isLoadingObject />);

    expect(screen.getByTestId('followup-questions-list')).toHaveAttribute('data-state', 'loading');
  });

  it('ignores a click when no handler is given', () => {
    render(<FollowupQuestions followupQuestions={questions} isLoadingObject={false} />);

    expect(() => fireEvent.click(screen.getByText('Who leads Saturn Grid?'))).not.toThrow();
  });
});
