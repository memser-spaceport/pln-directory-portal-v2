import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { PrdViewerBody } from '@/components/page/ai-apps/components/PrdViewerBody';

jest.mock('@/components/ui/Spinner', () => ({
  Spinner: () => <div data-testid="spinner" />,
}));

jest.mock('@/components/page/ai-apps/components/PrdContent', () => ({
  PrdContent: ({ prd }: { prd: string }) => <div data-testid="prd-content">{prd}</div>,
}));

describe('PrdViewerBody', () => {
  it('shows a spinner while loading, regardless of error/content', () => {
    render(<PrdViewerBody isLoading error={null} content={null} />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('prd-content')).not.toBeInTheDocument();
  });

  it('shows the error message when an error is present', () => {
    render(<PrdViewerBody isLoading={false} error="Custom failure" content={null} />);
    expect(screen.getByText('Custom failure')).toBeInTheDocument();
  });

  it('falls back to a default message when content is null with no explicit error', () => {
    render(<PrdViewerBody isLoading={false} error={null} content={null} />);
    expect(screen.getByText('One-pager could not be loaded')).toBeInTheDocument();
  });

  it('renders PrdContent once loading is done and content resolved', () => {
    render(<PrdViewerBody isLoading={false} error={null} content="# Hello" />);
    expect(screen.getByTestId('prd-content')).toHaveTextContent('# Hello');
  });
});
