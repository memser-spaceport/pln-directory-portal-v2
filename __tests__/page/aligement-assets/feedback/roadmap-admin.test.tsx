import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import RoadmapBoard from '@/components/page/aligement-assets/feedback/roadmap-board';
import TriageList from '@/components/page/aligement-assets/feedback/triage-list';
import { emptyRoadmap, item } from './__fixtures__/feedback.fixtures';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

/** jsdom has no matchMedia; this lets the test drive the breakpoint. */
function mockViewport(narrow: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: narrow,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
}

beforeEach(() => mockViewport(false));

const roadmap = {
  under_review: [item({ id: 'a', title: 'Under review one' })],
  todo: [item({ id: 'b', title: 'Todo one', status: 'todo' as const })],
  in_progress: [item({ id: 'c', title: 'In progress one', status: 'in_progress' as const })],
  completed: [
    item({ id: 'd', title: 'Completed one', status: 'completed' as const, completed_at: '2026-10-01T00:00:00.000Z' }),
  ],
};

function renderBoard(props: Partial<React.ComponentProps<typeof RoadmapBoard>> = {}) {
  const onMove = jest.fn();
  const onVote = jest.fn();
  render(<RoadmapBoard roadmap={roadmap} isAdmin={false} onVote={onVote} onMove={onMove} {...props} />);
  return { onMove, onVote };
}

describe('AC-T7.1 four columns', () => {
  it('renders every roadmap column', () => {
    renderBoard();
    for (const label of ['Under Review', 'To Do', 'In Progress', 'Completed']) {
      expect(screen.getByRole('region', { name: label })).toBeInTheDocument();
    }
  });

  it('renders no column for declined or duplicate', () => {
    renderBoard();
    expect(screen.queryByRole('region', { name: 'Declined' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Duplicate' })).not.toBeInTheDocument();
  });

  it('shows the empty message per column', () => {
    renderBoard({ roadmap: emptyRoadmap });
    expect(screen.getAllByText('Nothing here yet.')).toHaveLength(4);
  });
});

describe('AC-T7.2 completed window', () => {
  it('labels the Completed column as the last 90 days', () => {
    renderBoard();
    expect(screen.getByRole('region', { name: 'Completed' })).toHaveTextContent('Last 90 days');
  });
});

describe('AC-T7.3 admin Move to', () => {
  it('is absent for a member and present for an admin', () => {
    const { unmount } = render(
      <RoadmapBoard roadmap={roadmap} isAdmin={false} onVote={jest.fn()} onMove={jest.fn()} />,
    );
    expect(screen.queryByTestId('fb-card-a-moveto')).not.toBeInTheDocument();
    unmount();

    renderBoard({ isAdmin: true });
    expect(screen.getByTestId('fb-card-a-moveto')).toBeInTheDocument();
  });

  it('moves a card to the chosen status', () => {
    const { onMove } = renderBoard({ isAdmin: true });

    fireEvent.click(screen.getByTestId('fb-card-a-moveto'));
    fireEvent.click(screen.getByTestId('fb-card-a-moveto-in_progress'));
    fireEvent.click(screen.getByTestId('fb-card-a-moveto-confirm'));

    expect(onMove).toHaveBeenCalledWith('a', 'in_progress', undefined, undefined);
  });

  it('will not decline without a public note', () => {
    const { onMove } = renderBoard({ isAdmin: true });

    fireEvent.click(screen.getByTestId('fb-card-a-moveto'));
    fireEvent.click(screen.getByTestId('fb-card-a-moveto-declined'));
    expect(screen.getByTestId('fb-card-a-moveto-confirm')).toBeDisabled();

    fireEvent.change(screen.getByTestId('fb-card-a-moveto-note'), { target: { value: 'Out of scope' } });
    expect(screen.getByTestId('fb-card-a-moveto-confirm')).toBeEnabled();

    fireEvent.click(screen.getByTestId('fb-card-a-moveto-confirm'));
    expect(onMove).toHaveBeenCalledWith('a', 'declined', 'Out of scope', undefined);
  });

  it('will not mark a duplicate without a canonical id', () => {
    const { onMove } = renderBoard({ isAdmin: true });

    fireEvent.click(screen.getByTestId('fb-card-a-moveto'));
    fireEvent.click(screen.getByTestId('fb-card-a-moveto-duplicate'));
    expect(screen.getByTestId('fb-card-a-moveto-confirm')).toBeDisabled();

    fireEvent.change(screen.getByTestId('fb-card-a-moveto-canonical'), { target: { value: 'canon-id' } });
    fireEvent.click(screen.getByTestId('fb-card-a-moveto-confirm'));
    expect(onMove).toHaveBeenCalledWith('a', 'duplicate', undefined, 'canon-id');
  });

  it('never offers the status the card is already in', () => {
    renderBoard({ isAdmin: true });
    fireEvent.click(screen.getByTestId('fb-card-a-moveto'));
    expect(screen.queryByTestId('fb-card-a-moveto-under_review')).not.toBeInTheDocument();
    expect(screen.getByTestId('fb-card-a-moveto-todo')).toBeInTheDocument();
  });
});

describe('AC-T7.7 narrow viewport', () => {
  it('renders columns as tabs under 768px', () => {
    mockViewport(true);
    renderBoard();

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
    // Only the selected column is on screen, and it is that tab's panel.
    // The panel takes its name from the tab, which carries the item count.
    expect(screen.getByRole('tabpanel', { name: /Under Review/ })).toBeInTheDocument();
    expect(screen.queryByRole('tabpanel', { name: /To Do/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /To Do/ }));
    expect(screen.getByRole('tabpanel', { name: /To Do/ })).toBeInTheDocument();
    expect(screen.queryByRole('tabpanel', { name: /Under Review/ })).not.toBeInTheDocument();
  });

  it('renders all four columns at desktop width', () => {
    mockViewport(false);
    renderBoard();
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
  });
});

describe('AC-T7.5 triage Linear state', () => {
  const triageHandlers = () => ({ onMove: jest.fn(), onRetryLinear: jest.fn() });

  it('links the identifier once the issue exists', () => {
    const handlers = triageHandlers();
    render(
      <TriageList
        items={[
          item({
            id: 't1',
            linear_status: 'created',
            linear_issue_identifier: 'PLAA-150',
            linear_issue_url: 'https://linear.app/x/issue/PLAA-150',
          }),
        ]}
        {...handlers}
      />,
    );
    const link = screen.getByTestId('fb-linear-t1');
    expect(link).toHaveAttribute('href', 'https://linear.app/x/issue/PLAA-150');
    expect(link).toHaveTextContent('PLAA-150');
    expect(screen.queryByTestId('fb-linear-retry-t1')).not.toBeInTheDocument();
  });

  it.each(['pending', 'failed'] as const)('offers Retry while %s', (linearStatus) => {
    const handlers = triageHandlers();
    render(<TriageList items={[item({ id: 't1', linear_status: linearStatus })]} {...handlers} />);

    expect(screen.getByTestId('fb-linear-t1')).toHaveTextContent(`Linear: ${linearStatus}`);
    fireEvent.click(screen.getByTestId('fb-linear-retry-t1'));
    expect(handlers.onRetryLinear).toHaveBeenCalledWith('t1');
  });

  it('disables Retry while one is in flight', () => {
    const handlers = triageHandlers();
    render(<TriageList items={[item({ id: 't1', linear_status: 'failed' })]} retryingId="t1" {...handlers} />);
    expect(screen.getByTestId('fb-linear-retry-t1')).toBeDisabled();
  });

  it('shows the triage empty state', () => {
    const handlers = triageHandlers();
    render(<TriageList items={[]} {...handlers} />);
    expect(screen.getByText('Nothing waiting for triage.')).toBeInTheDocument();
  });
});
