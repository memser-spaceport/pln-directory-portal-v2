import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AiAppFeedbackPage } from '@/components/page/ai-apps/AiAppFeedbackPage';
import { serializeAnnotations } from '@/components/page/ai-apps/components/screenshot-feedback/types';

const mockUseAiAppFeedbackList = jest.fn();
const mockUseAiAppFeedbackReviewAccess = jest.fn();
const mockUseUpdateAiAppFeedbackStatus = jest.fn();
const mockExportAiAppFeedbackCsv = jest.fn();
const mockOnFeedbackReviewViewed = jest.fn();
const mockOnFeedbackTabFiltered = jest.fn();
const mockOnFeedbackExported = jest.fn();
const mockOnFeedbackStatusChanged = jest.fn();
const mockMutate = jest.fn();

jest.mock('@/services/ai-app-feedback/hooks/useAiAppFeedbackList', () => ({
  useAiAppFeedbackList: () => mockUseAiAppFeedbackList(),
}));

jest.mock('@/services/ai-app-feedback/hooks/useAiAppFeedbackReviewAccess', () => ({
  useAiAppFeedbackReviewAccess: () => mockUseAiAppFeedbackReviewAccess(),
}));

jest.mock('@/services/ai-app-feedback/hooks/useUpdateAiAppFeedbackStatus', () => ({
  useUpdateAiAppFeedbackStatus: () => mockUseUpdateAiAppFeedbackStatus(),
}));

jest.mock('@/components/page/ai-apps/AiAppFeedbackPage/utils/exportAiAppFeedbackCsv', () => ({
  exportAiAppFeedbackCsv: (...args: unknown[]) => mockExportAiAppFeedbackCsv(...args),
}));

jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => ({
    onFeedbackReviewViewed: mockOnFeedbackReviewViewed,
    onFeedbackTabFiltered: mockOnFeedbackTabFiltered,
    onFeedbackExported: mockOnFeedbackExported,
    onFeedbackStatusChanged: mockOnFeedbackStatusChanged,
  }),
}));

const FEEDBACK = [
  {
    uid: 'fb-1',
    appUid: 'app-1',
    appName: 'Alpha',
    text: 'Loved it',
    status: 'NEW' as const,
    member: { uid: 'm-1', name: 'Ada Lovelace' },
    createdAt: '2026-07-01T00:00:00.000Z',
  },
  {
    uid: 'fb-2',
    appUid: 'app-2',
    appName: 'Beta',
    text: 'Needs work',
    status: 'VIEWED' as const,
    member: { uid: 'm-2', name: 'Alan Turing' },
    createdAt: '2026-07-02T00:00:00.000Z',
  },
];

describe('AiAppFeedbackPage', () => {
  beforeEach(() => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ isDirectoryAdmin: false });
    mockUseUpdateAiAppFeedbackStatus.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      variables: undefined,
    });
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

  it('shows each row’s current status without marking it viewed', () => {
    mockUseAiAppFeedbackList.mockReturnValue({ feedback: FEEDBACK, isLoading: false, isError: false });

    render(<AiAppFeedbackPage />);

    expect(screen.getByRole('button', { name: 'Change status (currently New)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change status (currently Reviewed)' })).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('changes a row’s status when a different option is chosen', () => {
    mockUseAiAppFeedbackList.mockReturnValue({ feedback: FEEDBACK, isLoading: false, isError: false });

    render(<AiAppFeedbackPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Change status (currently New)' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Shipped' }));

    expect(mockMutate).toHaveBeenCalledWith(
      { appUid: 'app-1', feedbackUid: 'fb-1', status: 'IMPLEMENTED' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
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

  it('renders HTML headings, links, and images', () => {
    mockUseAiAppFeedbackList.mockReturnValue({
      feedback: [
        {
          uid: 'fb-html',
          appUid: 'app-1',
          appName: 'Alpha',
          text: '<h2>Broken screenshot</h2><p><a href="https://example.com/docs">docs</a></p><p><img src="https://cdn.test/shot.png" alt="shot"></p>',
          status: 'NEW' as const,
          member: { uid: 'm-1', name: 'Ada Lovelace' },
          createdAt: '2026-07-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
    });

    render(<AiAppFeedbackPage />);

    expect(screen.getByRole('heading', { name: 'Broken screenshot' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'docs' })).toHaveAttribute('href', 'https://example.com/docs');
    expect(screen.getByAltText('shot')).toHaveAttribute('src', 'https://cdn.test/shot.png');
    expect(screen.queryByText('View annotations')).not.toBeInTheDocument();
  });

  it('opens a feedback image fullscreen and closes on Escape or overlay click', async () => {
    mockUseAiAppFeedbackList.mockReturnValue({
      feedback: [
        {
          uid: 'fb-html',
          appUid: 'app-1',
          appName: 'Alpha',
          text: '<p><img src="https://cdn.test/shot.png" alt="shot"></p>',
          status: 'NEW' as const,
          member: { uid: 'm-1', name: 'Ada Lovelace' },
          createdAt: '2026-07-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
    });

    render(<AiAppFeedbackPage />);

    fireEvent.click(screen.getByAltText('shot'));
    expect(screen.getByRole('dialog', { name: 'Full size image' })).toBeInTheDocument();
    expect(screen.getAllByAltText('shot')).toHaveLength(2);

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Full size image' })).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByAltText('shot'));
    fireEvent.click(screen.getByRole('dialog', { name: 'Full size image' }).parentElement!);
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Full size image' })).not.toBeInTheDocument();
    });
  });

  it('replays drawings and bubble comments in the lightbox', async () => {
    const encoded = serializeAnnotations({
      version: 1,
      strokes: [
        {
          color: '#1b4dff',
          width: 0.006,
          points: [
            { x: 0.1, y: 0.1 },
            { x: 0.4, y: 0.4 },
          ],
        },
      ],
      comments: [{ id: 'c1', x: 0.5, y: 0.5, text: 'Broken button' }],
    });
    mockUseAiAppFeedbackList.mockReturnValue({
      feedback: [
        {
          uid: 'fb-html',
          appUid: 'app-1',
          appName: 'Alpha',
          text: `<p><img src="https://cdn.test/shot.png" alt="shot" class="ai-app-annotated-screenshot" data-annotations="${encoded}"></p>`,
          status: 'NEW' as const,
          member: { uid: 'm-1', name: 'Ada Lovelace' },
          createdAt: '2026-07-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
    });

    render(<AiAppFeedbackPage />);

    expect(screen.getByText('View annotations')).toBeInTheDocument();
    expect(screen.getByAltText('shot').closest('[title="View annotations"]')).toBeTruthy();

    fireEvent.click(screen.getByText('View annotations'));
    expect(screen.getByRole('dialog', { name: 'Full size image' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Comment 1' }));
    expect(screen.getByText('Broken button')).toBeInTheDocument();
  });

  it('renders legacy plain-text feedback as text, not HTML', () => {
    mockUseAiAppFeedbackList.mockReturnValue({ feedback: FEEDBACK, isLoading: false, isError: false });

    render(<AiAppFeedbackPage />);

    expect(screen.getByText('Loved it')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Loved it' })).not.toBeInTheDocument();
  });

  /**
   * Screenshots are lifted out of the body and given identical tiles.
   *
   * Left inline they stack at whatever size each capture happens to be, so one
   * tall phone screenshot makes a table row hundreds of pixels deep.
   */
  describe('screenshot strip', () => {
    const withBody = (text: string) =>
      mockUseAiAppFeedbackList.mockReturnValue({
        feedback: [
          {
            uid: 'fb-html',
            appUid: 'app-1',
            appName: 'Alpha',
            text,
            status: 'NEW' as const,
            member: { uid: 'm-1', name: 'Ada Lovelace' },
            createdAt: '2026-07-01T00:00:00.000Z',
          },
        ],
        isLoading: false,
        isError: false,
      });

    it('moves every screenshot out of the message text and into one row', () => {
      withBody(
        '<p>Two problems</p><p><img src="https://cdn.test/a.png" alt="first"></p><p><img src="https://cdn.test/b.png" alt="second"></p>',
      );

      render(<AiAppFeedbackPage />);

      const strip = screen.getByRole('list');
      expect(screen.getByAltText('first').closest('ul')).toBe(strip);
      expect(screen.getByAltText('second').closest('ul')).toBe(strip);
      expect(screen.getByText('Two problems').querySelector('img')).toBeNull();
    });

    it('makes each tile a button, so the lightbox is reachable by keyboard', () => {
      withBody('<p><img src="https://cdn.test/a.png" alt="shot"></p>');

      render(<AiAppFeedbackPage />);

      const tile = screen.getByAltText('shot').closest('button');
      expect(tile).toBeInTheDocument();

      fireEvent.click(tile!);
      expect(screen.getByRole('dialog', { name: 'Full size image' })).toBeInTheDocument();
    });

    it('names an unlabelled screenshot by its position', () => {
      withBody('<p><img src="https://cdn.test/a.png"><img src="https://cdn.test/b.png"></p>');

      render(<AiAppFeedbackPage />);

      expect(screen.getByAltText('Screenshot 1')).toBeInTheDocument();
      expect(screen.getByAltText('Screenshot 2')).toBeInTheDocument();
    });

    /* Image-only feedback is a supported submission; an empty editor block for
       it would leave padding under nothing. */
    it('renders no message block when the feedback is only a screenshot', () => {
      withBody('<p><img src="https://cdn.test/a.png" alt="shot"></p>');

      const { container } = render(<AiAppFeedbackPage />);

      expect(screen.getByAltText('shot')).toBeInTheDocument();
      expect(container.querySelector('.ql-editor')).toBeNull();
    });

    it('badges only the screenshots that carry annotations', () => {
      const encoded = serializeAnnotations({
        version: 1,
        strokes: [],
        shapes: [],
        comments: [{ id: 'c1', x: 0.5, y: 0.5, text: 'Here' }],
      });
      withBody(
        `<p><img src="https://cdn.test/plain.png" alt="plain"><img src="https://cdn.test/marked.png" alt="marked" data-annotations="${encoded}"></p>`,
      );

      render(<AiAppFeedbackPage />);

      expect(screen.getAllByText('View annotations')).toHaveLength(1);
      expect(screen.getByAltText('marked').closest('[title="View annotations"]')).toBeTruthy();
      expect(screen.getByAltText('plain').closest('[title="View annotations"]')).toBeNull();
    });

    /* A shape-only annotation is what a `strokes || comments` check misses: no
       error, the screenshot just quietly stops looking annotated. */
    it('badges a screenshot annotated with only a shape', () => {
      const encoded = serializeAnnotations({
        version: 1,
        strokes: [],
        shapes: [{ kind: 'rect', color: '#dc2626', width: 0.006, x: 0.1, y: 0.1, w: 0.3, h: 0.2 }],
        comments: [],
      });
      withBody(`<p><img src="https://cdn.test/a.png" alt="shot" data-annotations="${encoded}"></p>`);

      render(<AiAppFeedbackPage />);

      expect(screen.getByText('View annotations')).toBeInTheDocument();
    });
  });
});
