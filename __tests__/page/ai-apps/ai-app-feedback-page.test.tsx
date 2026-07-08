import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { AiAppFeedbackPage } from '@/components/page/ai-apps/AiAppFeedbackPage';

const mockUseAiAppFeedbackList = jest.fn();
const mockExportAiAppFeedbackCsv = jest.fn();
const mockOnFeedbackReviewViewed = jest.fn();
const mockOnFeedbackTabFiltered = jest.fn();
const mockOnFeedbackExported = jest.fn();

jest.mock('@/services/ai-app-feedback/hooks/useAiAppFeedbackList', () => ({
  useAiAppFeedbackList: () => mockUseAiAppFeedbackList(),
}));

jest.mock('@/components/page/ai-apps/AiAppFeedbackPage/utils/exportAiAppFeedbackCsv', () => ({
  exportAiAppFeedbackCsv: (...args: unknown[]) => mockExportAiAppFeedbackCsv(...args),
}));

jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => ({
    onFeedbackReviewViewed: mockOnFeedbackReviewViewed,
    onFeedbackTabFiltered: mockOnFeedbackTabFiltered,
    onFeedbackExported: mockOnFeedbackExported,
  }),
}));

const FEEDBACK = [
  {
    uid: 'fb-1',
    appUid: 'app-1',
    appName: 'Alpha',
    message: 'Loved it',
    memberUid: 'm-1',
    memberName: 'Ada Lovelace',
    createdAt: '2026-07-01T00:00:00.000Z',
  },
  {
    uid: 'fb-2',
    appUid: 'app-2',
    appName: 'Beta',
    message: 'Needs work',
    memberUid: 'm-2',
    memberName: 'Alan Turing',
    createdAt: '2026-07-02T00:00:00.000Z',
  },
];

describe('AiAppFeedbackPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading state', () => {
    mockUseAiAppFeedbackList.mockReturnValue({ feedback: [], isLoading: true, isError: false });

    render(<AiAppFeedbackPage />);

    expect(screen.getByText('Loading feedback…')).toBeInTheDocument();
  });

  it('shows an error state', () => {
    mockUseAiAppFeedbackList.mockReturnValue({ feedback: [], isLoading: false, isError: true });

    render(<AiAppFeedbackPage />);

    expect(screen.getByText('Unable to load feedback. Please try again later.')).toBeInTheDocument();
  });

  it('shows an empty state when there is no feedback at all', () => {
    mockUseAiAppFeedbackList.mockReturnValue({ feedback: [], isLoading: false, isError: false });

    render(<AiAppFeedbackPage />);

    expect(screen.getByText('No feedback has been submitted yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export (CSV)' })).toBeDisabled();
  });

  it('lists feedback, filters by app tab, and exports only the visible rows', () => {
    mockUseAiAppFeedbackList.mockReturnValue({ feedback: FEEDBACK, isLoading: false, isError: false });

    render(<AiAppFeedbackPage />);

    expect(mockOnFeedbackReviewViewed).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Loved it')).toBeInTheDocument();
    expect(screen.getByText('Needs work')).toBeInTheDocument();

    // The tab renders as "Alpha (1)" (secondary Tabs variant appends the count); the
    // bare row below also shows "Alpha", so target the tab's full text to disambiguate.
    fireEvent.click(screen.getByText('Alpha (1)'));

    expect(mockOnFeedbackTabFiltered).toHaveBeenCalledWith('Alpha');
    expect(screen.getByText('Loved it')).toBeInTheDocument();
    expect(screen.queryByText('Needs work')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Export (CSV)' }));

    expect(mockExportAiAppFeedbackCsv).toHaveBeenCalledWith([FEEDBACK[0]], 'ai-app-feedback-alpha.csv');
    expect(mockOnFeedbackExported).toHaveBeenCalledWith(1);
  });
});
