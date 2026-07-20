import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { AiAppFeedbackPage } from '@/components/page/ai-apps/AiAppFeedbackPage';

const mockUseAiAppFeedbackList = jest.fn();
const mockUseAiAppFeedbackReviewAccess = jest.fn();
const mockExportAiAppFeedbackCsv = jest.fn();
const mockOnFeedbackReviewViewed = jest.fn();
const mockOnFeedbackTabFiltered = jest.fn();
const mockOnFeedbackExported = jest.fn();

jest.mock('@/services/ai-app-feedback/hooks/useAiAppFeedbackList', () => ({
  useAiAppFeedbackList: () => mockUseAiAppFeedbackList(),
}));

jest.mock('@/services/ai-app-feedback/hooks/useAiAppFeedbackReviewAccess', () => ({
  useAiAppFeedbackReviewAccess: () => mockUseAiAppFeedbackReviewAccess(),
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
    text: 'Loved it',
    member: { uid: 'm-1', name: 'Ada Lovelace' },
    createdAt: '2026-07-01T00:00:00.000Z',
  },
  {
    uid: 'fb-2',
    appUid: 'app-2',
    appName: 'Beta',
    text: 'Needs work',
    member: { uid: 'm-2', name: 'Alan Turing' },
    createdAt: '2026-07-02T00:00:00.000Z',
  },
];

describe('AiAppFeedbackPage', () => {
  beforeEach(() => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ isDirectoryAdmin: false });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('always shows a link back to the AI Apps dashboard', () => {
    mockUseAiAppFeedbackList.mockReturnValue({ feedback: [], isLoading: false, isError: false });

    render(<AiAppFeedbackPage />);

    expect(screen.getByRole('link', { name: /Back to all/ })).toHaveAttribute('href', '/pl-infra/ai-apps');
  });

  it('shows the app-creator heading/subtitle for a non-admin reviewer', () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ isDirectoryAdmin: false });
    mockUseAiAppFeedbackList.mockReturnValue({ feedback: [], isLoading: false, isError: false });

    render(<AiAppFeedbackPage />);

    expect(screen.getByRole('heading', { name: 'Feedback on your apps' })).toBeInTheDocument();
    expect(screen.getByText('Only the apps you build — not every app on the page.')).toBeInTheDocument();
  });

  it('shows the admin heading/subtitle for a directory admin', () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ isDirectoryAdmin: true });
    mockUseAiAppFeedbackList.mockReturnValue({ feedback: [], isLoading: false, isError: false });

    render(<AiAppFeedbackPage />);

    expect(screen.getByRole('heading', { name: 'All app feedback' })).toBeInTheDocument();
    expect(screen.getByText('Every app across the directory.')).toBeInTheDocument();
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

  it('shows an empty state with no Export button when there is no feedback at all', () => {
    mockUseAiAppFeedbackList.mockReturnValue({ feedback: [], isLoading: false, isError: false });

    render(<AiAppFeedbackPage />);

    expect(screen.getByText('No feedback has been submitted yet.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Export CSV/ })).not.toBeInTheDocument();
  });

  it('lists feedback in a table, filters by app tab, and exports only the visible rows', () => {
    mockUseAiAppFeedbackList.mockReturnValue({ feedback: FEEDBACK, isLoading: false, isError: false });

    render(<AiAppFeedbackPage />);

    expect(mockOnFeedbackReviewViewed).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Loved it')).toBeInTheDocument();
    expect(screen.getByText('Needs work')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();

    // The tab is a <button> with the count in a separate span; the table cell below
    // also shows "Alpha" as plain text (not a button), so role + name disambiguates.
    fireEvent.click(screen.getByRole('button', { name: /Alpha/ }));

    expect(mockOnFeedbackTabFiltered).toHaveBeenCalledWith('Alpha');
    expect(screen.getByText('Loved it')).toBeInTheDocument();
    expect(screen.queryByText('Needs work')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Export CSV/ }));

    expect(mockExportAiAppFeedbackCsv).toHaveBeenCalledWith([FEEDBACK[0]], 'ai-app-feedback-alpha.csv');
    expect(mockOnFeedbackExported).toHaveBeenCalledWith(1);
  });

  it('moves the sliding active-tab indicator to whichever tab was clicked', () => {
    mockUseAiAppFeedbackList.mockReturnValue({ feedback: FEEDBACK, isLoading: false, isError: false });

    render(<AiAppFeedbackPage />);

    const allAppsTab = screen.getByRole('button', { name: /All apps/ });
    const alphaTab = screen.getByRole('button', { name: /Alpha/ });

    // Framer Motion's layoutId indicator is only rendered inside the active tab.
    expect(allAppsTab.querySelector('[class*="activeIndicator"]')).toBeInTheDocument();
    expect(alphaTab.querySelector('[class*="activeIndicator"]')).not.toBeInTheDocument();

    fireEvent.click(alphaTab);

    expect(allAppsTab.querySelector('[class*="activeIndicator"]')).not.toBeInTheDocument();
    expect(alphaTab.querySelector('[class*="activeIndicator"]')).toBeInTheDocument();
  });
});
