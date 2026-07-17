import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';

import { AiAppDetailsModal } from '@/components/page/ai-apps/components/AiAppDetailsModal';

const mockPrefetchQuery = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({ prefetchQuery: mockPrefetchQuery }),
}));

const mockUseAiAppPrdContent = jest.fn();
jest.mock('@/services/ai-apps/hooks/useAiAppPrdContent', () => ({
  useAiAppPrdContent: (...args: unknown[]) => mockUseAiAppPrdContent(...args),
}));

const mockAnalytics = { onPrdOpenInNewTabClicked: jest.fn() };
jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => mockAnalytics,
}));

jest.mock('@/components/page/ai-apps/components/PrdViewerBody', () => ({
  PrdViewerBody: ({ isLoading, error, content }: { isLoading: boolean; error: string | null; content: string | null }) => (
    <div data-testid="prd-viewer-body">{isLoading ? 'loading' : error ?? content}</div>
  ),
}));

describe('AiAppDetailsModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAiAppPrdContent.mockReturnValue({ content: '# One-pager', error: null, isLoading: false });
  });

  it('renders an "Open in new tab" link pointing at the app\'s prd route, opening in a new tab', () => {
    render(<AiAppDetailsModal isOpen uid="app-1" appName="News Summarizer" prdUrl="https://s3.example/prd.md" onClose={onClose} />);

    const link = screen.getByRole('link', { name: /open in new tab/i });
    expect(link).toHaveAttribute('href', '/pl-infra/ai-apps/app-1/prd');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('encodes the uid when building the link', () => {
    render(<AiAppDetailsModal isOpen uid="app 1/x" appName="News Summarizer" prdUrl="https://s3.example/prd.md" onClose={onClose} />);

    const link = screen.getByRole('link', { name: /open in new tab/i });
    expect(link).toHaveAttribute('href', `/pl-infra/ai-apps/${encodeURIComponent('app 1/x')}/prd`);
  });

  it('fires analytics on click without blocking navigation, even if the analytics client throws', () => {
    mockAnalytics.onPrdOpenInNewTabClicked.mockImplementation(() => {
      throw new Error('posthog unavailable');
    });
    render(<AiAppDetailsModal isOpen uid="app-1" appName="News Summarizer" prdUrl="https://s3.example/prd.md" onClose={onClose} />);

    const link = screen.getByRole('link', { name: /open in new tab/i });
    expect(() => fireEvent.click(link)).not.toThrow();
    expect(mockAnalytics.onPrdOpenInNewTabClicked).toHaveBeenCalledWith('app-1', 'News Summarizer');
  });

  it('primes the prd content cache on hover', () => {
    render(<AiAppDetailsModal isOpen uid="app-1" appName="News Summarizer" prdUrl="https://s3.example/prd.md" onClose={onClose} />);

    fireEvent.mouseEnter(screen.getByRole('link', { name: /open in new tab/i }));

    expect(mockPrefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(['ai-app-prd-content', 'https://s3.example/prd.md']) }),
    );
  });

  it('renders PrdViewerBody driven by useAiAppPrdContent', () => {
    mockUseAiAppPrdContent.mockReturnValue({ content: '# Hello', error: null, isLoading: false });
    render(<AiAppDetailsModal isOpen uid="app-1" appName="News Summarizer" prdUrl="https://s3.example/prd.md" onClose={onClose} />);

    expect(screen.getByTestId('prd-viewer-body')).toHaveTextContent('# Hello');
  });

  it('calls onClose when the close button is clicked', () => {
    render(<AiAppDetailsModal isOpen uid="app-1" appName="News Summarizer" prdUrl="https://s3.example/prd.md" onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
