import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import FeedbackPage from '@/components/page/aligement-assets/feedback/feedback-page';
import { emptyRoadmap, item } from './__fixtures__/feedback.fixtures';

const searchParams = new URLSearchParams();
const replace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: jest.fn() }),
  usePathname: () => '/alignment-asset/feedback',
  useSearchParams: () => searchParams,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

const mockMe = jest.fn();

jest.mock('@/services/plaa/feedback/useFeedback', () => ({
  useFeedbackMe: () => mockMe(),
  useFeedbackList: () => ({ data: { items: [item()] }, isLoading: false, isError: false, refetch: jest.fn() }),
  useFeedbackRoadmap: () => ({ data: emptyRoadmap, isLoading: false, isError: false, refetch: jest.fn() }),
  useFeedbackTriage: () => ({ data: { items: [] }, isLoading: false, isError: false, refetch: jest.fn() }),
  useVote: () => ({ mutate: jest.fn() }),
  useCreateFeedback: () => ({ mutate: jest.fn(), isPending: false, error: null }),
  useChangeStatus: () => ({ mutate: jest.fn() }),
  useRetryLinear: () => ({ mutate: jest.fn(), isPending: false, variables: undefined }),
}));

jest.mock('@/analytics/plaa-feedback.analytics', () => ({
  usePlaaFeedbackAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));

function renderPage({ isAdmin, tab }: { isAdmin: boolean; tab?: string }) {
  searchParams.delete('tab');
  if (tab) searchParams.set('tab', tab);
  mockMe.mockReturnValue({ data: { is_admin: isAdmin } });
  render(<FeedbackPage />);
}

function tabNames() {
  return screen.getAllByRole('tab').map((element) => element.textContent);
}

describe('Completed is no longer a tab', () => {
  it('is absent for a member', () => {
    renderPage({ isAdmin: false });
    expect(tabNames()).toEqual(['Ideas', 'Roadmap', 'My submissions']);
  });

  it('is absent for an admin', () => {
    renderPage({ isAdmin: true });
    expect(tabNames()).not.toContain('Completed');
  });

  it('falls back to Ideas for an old ?tab=completed link rather than rendering nothing', () => {
    renderPage({ isAdmin: false, tab: 'completed' });
    expect(screen.getByRole('tab', { name: 'Ideas' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('Triage is admin-only', () => {
  it('is hidden from a member', () => {
    renderPage({ isAdmin: false });
    expect(tabNames()).not.toContain('Triage');
    expect(screen.queryByTestId('fb-tab-triage')).not.toBeInTheDocument();
  });

  it('is shown to an admin', () => {
    renderPage({ isAdmin: true });
    expect(tabNames()).toEqual(['Ideas', 'Roadmap', 'My submissions', 'Triage']);
  });

  it('cannot be reached by a member typing ?tab=triage', () => {
    renderPage({ isAdmin: false, tab: 'triage' });
    expect(screen.getByRole('tab', { name: 'Ideas' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByText('Nothing waiting for triage.')).not.toBeInTheDocument();
  });

  it('is hidden while the admin check is still loading, not flashed then removed', () => {
    searchParams.delete('tab');
    mockMe.mockReturnValue({ data: undefined });
    render(<FeedbackPage />);
    expect(tabNames()).not.toContain('Triage');
  });
});

describe('page width', () => {
  it('fills 90% of the shell with a readable ceiling', () => {
    const styles = require('fs').readFileSync(
      require('path').join(process.cwd(), 'components/page/aligement-assets/feedback/feedback-styles.tsx'),
      'utf8',
    );
    const rule = styles.match(/\.fb-page\s*\{([^}]*)\}/)[1];
    expect(rule).toMatch(/width:\s*90%/);
    expect(rule).toMatch(/max-width:\s*\d+px/);
  });
});
