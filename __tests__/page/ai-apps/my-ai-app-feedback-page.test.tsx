import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { MyAiAppFeedbackPage } from '@/components/page/ai-apps/AiAppFeedbackPage';

const mockUseMyAiAppFeedbackList = jest.fn();

const mockUseAiAppFeedbackList = jest.fn(() => ({ feedback: [] as unknown[], isLoading: false, isError: false }));
const mockUseAiAppFeedbackReviewAccess = jest.fn(() => ({
  canReview: false,
  isDirectoryAdmin: false,
  isLoading: false,
}));

jest.mock('@/services/ai-app-feedback/hooks/useMyAiAppFeedbackList', () => ({
  useMyAiAppFeedbackList: () => mockUseMyAiAppFeedbackList(),
}));

jest.mock('@/services/ai-app-feedback/hooks/useAiAppFeedbackList', () => ({
  useAiAppFeedbackList: () => mockUseAiAppFeedbackList(),
}));

jest.mock('@/services/ai-app-feedback/hooks/useAiAppFeedbackReviewAccess', () => ({
  useAiAppFeedbackReviewAccess: () => mockUseAiAppFeedbackReviewAccess(),
}));

jest.mock('@/services/ai-app-feedback/hooks/useUpdateAiAppFeedbackStatus', () => ({
  useUpdateAiAppFeedbackStatus: () => ({ mutate: jest.fn(), isPending: false, variables: undefined }),
}));

jest.mock('@/services/ai-apps/hooks/useAiApps', () => ({
  useAiApps: () => ({ apps: [], isLoading: false, isError: false }),
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => ({ currentUser: { uid: 'me', name: 'Me' } }),
}));

jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => ({
    onFeedbackReviewViewed: jest.fn(),
    onFeedbackTabFiltered: jest.fn(),
    onFeedbackExported: jest.fn(),
    onFeedbackStatusFiltered: jest.fn(),
    onFeedbackStatusChanged: jest.fn(),
  }),
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
  beforeEach(() => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: false, isDirectoryAdmin: false, isLoading: false });
    mockUseAiAppFeedbackList.mockReturnValue({ feedback: [], isLoading: false, isError: false });
  });

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

  it('filters by app, with All apps first and the apps in the rows', () => {
    mockUseMyAiAppFeedbackList.mockReturnValue({ feedback: FEEDBACK, isLoading: false, isError: false });

    render(<MyAiAppFeedbackPage />);

    fireEvent.click(filterTrigger('App:'));
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'All apps · 2',
      'Alpha · 1',
      'Beta · 1',
    ]);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Beta · 1' }));

    expect(screen.getByText('Add dark mode')).toBeInTheDocument();
    expect(screen.queryByText('search')).not.toBeInTheDocument();
  });

  it('filters by status, kind and priority together, recounting the apps', () => {
    mockUseMyAiAppFeedbackList.mockReturnValue({ feedback: FEEDBACK, isLoading: false, isError: false });

    render(<MyAiAppFeedbackPage />);

    selectFilter('Status:', 'Reviewed');
    selectFilter('Kind:', 'request');
    selectFilter('Priority:', 'P1 — Serious — there is a workaround and it hurts');

    expect(screen.getByText('Add dark mode')).toBeInTheDocument();
    fireEvent.click(filterTrigger('App:'));
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'All apps · 1',
      'Alpha · 0',
      'Beta · 1',
    ]);
    fireEvent.click(screen.getByRole('menuitem', { name: 'All apps · 1' }));

    selectFilter('Status:', 'Shipped');

    expect(screen.getByText('No feedback matches the selected filters.')).toBeInTheDocument();
  });

  /* LAB-2767: the one Feedback page; without review access there is one list and no tabs. */
  it('is titled Feedback and shows no tabs to a member who reviews nothing', () => {
    mockUseMyAiAppFeedbackList.mockReturnValue({ feedback: FEEDBACK, isLoading: false, isError: false });

    render(<MyAiAppFeedbackPage />);

    expect(screen.getByRole('heading', { name: 'Feedback' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Received/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Given/ })).not.toBeInTheDocument();
  });

  it('shows Received and Given tabs to an app creator, Given selected', () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: true, isDirectoryAdmin: false, isLoading: false });
    mockUseAiAppFeedbackList.mockReturnValue({ feedback: [FEEDBACK[0]], isLoading: false, isError: false });
    mockUseMyAiAppFeedbackList.mockReturnValue({ feedback: FEEDBACK, isLoading: false, isError: false });

    render(<MyAiAppFeedbackPage />);

    expect(screen.getByRole('button', { name: 'Received 1' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Given 2' }).querySelector('[class*="activeIndicator"]'),
    ).toBeInTheDocument();
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: false, isDirectoryAdmin: false, isLoading: false });
  });

  it('shows no filters when nothing has been sent', () => {
    mockUseMyAiAppFeedbackList.mockReturnValue({ feedback: [], isLoading: false, isError: false });

    render(<MyAiAppFeedbackPage />);

    expect(screen.queryByText('App:')).not.toBeInTheDocument();
    expect(screen.queryByText('Status:')).not.toBeInTheDocument();
  });

  it('has no Export CSV', () => {
    mockUseMyAiAppFeedbackList.mockReturnValue({ feedback: FEEDBACK, isLoading: false, isError: false });

    render(<MyAiAppFeedbackPage />);

    expect(screen.queryByRole('button', { name: /Export CSV/ })).not.toBeInTheDocument();
  });
});
