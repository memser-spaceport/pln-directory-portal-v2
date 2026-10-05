import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { MyAiAppFeedbackPage } from '@/components/page/ai-apps/AiAppFeedbackPage';

const mockUseMyAiAppFeedbackList = jest.fn();

jest.mock('@/services/ai-app-feedback/hooks/useMyAiAppFeedbackList', () => ({
  useMyAiAppFeedbackList: () => mockUseMyAiAppFeedbackList(),
}));

const FEEDBACK = [
  {
    uid: 'fb-1',
    appUid: 'app-1',
    appName: 'Alpha',
    kind: 'COMMENT',
    text: 'The **search** is slow',
    status: 'IMPLEMENTED',
    createdAt: '2026-10-01T12:00:00.000Z',
    member: { uid: 'me', name: 'Me' },
  },
  {
    uid: 'fb-2',
    appUid: 'app-2',
    appName: 'Beta',
    kind: 'FEEDBACK',
    reportKind: 'request',
    priority: 'P1',
    text: 'Add dark mode',
    status: 'VIEWED',
    createdAt: '2026-09-02T12:00:00.000Z',
    member: { uid: 'me', name: 'Me' },
  },
];

const filterTrigger = (filterLabel: string) => within(screen.getByText(filterLabel).parentElement!).getByRole('button');

const selectFilter = (filterLabel: string, option: string) => {
  fireEvent.click(filterTrigger(filterLabel));
  fireEvent.click(screen.getByRole('menuitem', { name: option }));
};

describe('MyAiAppFeedbackPage', () => {
  it('shows the app, kind, note, date and status of each report', () => {
    mockUseMyAiAppFeedbackList.mockReturnValue({ feedback: FEEDBACK, isLoading: false, isError: false });

    render(<MyAiAppFeedbackPage />);

    const [, first, second] = screen.getAllByRole('row');
    expect(within(first).getByText('Alpha')).toBeInTheDocument();
    expect(within(first).getByText('Comment')).toBeInTheDocument();
    expect(within(first).getByText('search').tagName).toBe('STRONG');
    expect(within(first).getByText('Oct 1, 2026')).toBeInTheDocument();
    expect(within(first).getByText('Shipped')).toBeInTheDocument();
    expect(within(second).getByText('Beta')).toBeInTheDocument();
    expect(within(second).getByText('Feedback')).toBeInTheDocument();
    expect(within(second).getByText('Reviewed')).toBeInTheDocument();
  });

  it('shows the status read-only, with no From column', () => {
    mockUseMyAiAppFeedbackList.mockReturnValue({ feedback: FEEDBACK, isLoading: false, isError: false });

    render(<MyAiAppFeedbackPage />);

    expect(screen.queryByRole('button', { name: /Change status/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'From' })).not.toBeInTheDocument();
  });

  it('says so when nothing has been sent', () => {
    mockUseMyAiAppFeedbackList.mockReturnValue({ feedback: [], isLoading: false, isError: false });

    render(<MyAiAppFeedbackPage />);

    expect(screen.getByText('You haven’t sent any feedback yet.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('has an All apps tab and a tab per app, each with a count', () => {
    mockUseMyAiAppFeedbackList.mockReturnValue({ feedback: FEEDBACK, isLoading: false, isError: false });

    render(<MyAiAppFeedbackPage />);

    expect(screen.getByRole('button', { name: 'All apps 2' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Beta 1' }));

    expect(screen.getByText('Add dark mode')).toBeInTheDocument();
    expect(screen.queryByText('search')).not.toBeInTheDocument();
  });

  it('filters by status, kind and priority together, recounting the tabs', () => {
    mockUseMyAiAppFeedbackList.mockReturnValue({ feedback: FEEDBACK, isLoading: false, isError: false });

    render(<MyAiAppFeedbackPage />);

    selectFilter('Status:', 'Reviewed');
    selectFilter('Kind:', 'request');
    selectFilter('Priority:', 'P1 — Serious — there is a workaround and it hurts');

    expect(screen.getByText('Add dark mode')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All apps 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alpha 0' })).toBeInTheDocument();

    selectFilter('Status:', 'Shipped');

    expect(screen.getByText('No feedback matches the selected filters.')).toBeInTheDocument();
  });

  it('has no Export CSV', () => {
    mockUseMyAiAppFeedbackList.mockReturnValue({ feedback: FEEDBACK, isLoading: false, isError: false });

    render(<MyAiAppFeedbackPage />);

    expect(screen.queryByRole('button', { name: /Export CSV/ })).not.toBeInTheDocument();
  });
});
