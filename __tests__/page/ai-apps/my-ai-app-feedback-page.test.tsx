import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';

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
    text: 'Add dark mode',
    status: 'VIEWED',
    createdAt: '2026-09-02T12:00:00.000Z',
    member: { uid: 'me', name: 'Me' },
  },
];

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
});
