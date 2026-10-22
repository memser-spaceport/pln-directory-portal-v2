import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import FeedbackPage from '@/components/page/aligement-assets/feedback/feedback-page';
import { RoadmapResponse } from '@/services/plaa/feedback/feedback.types';
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
const listParams = jest.fn();
const mockRoadmap = jest.fn<RoadmapResponse, []>(() => emptyRoadmap);

jest.mock('@/services/plaa/feedback/useFeedback', () => ({
  useFeedbackMe: () => mockMe(),
  useFeedbackList: (params: unknown) => {
    listParams(params);
    return { data: { items: [item()] }, isLoading: false, isError: false, refetch: jest.fn() };
  },
  useFeedbackRoadmap: () => ({ data: mockRoadmap(), isLoading: false, isError: false, refetch: jest.fn() }),
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

/** A roadmap with a card in every column, so each one can be checked. */
const populatedRoadmap = {
  under_review: [item({ id: 'r1', status: 'under_review' })],
  todo: [item({ id: 'r2', status: 'todo' })],
  in_progress: [item({ id: 'r3', status: 'in_progress' })],
  completed: [item({ id: 'r4', status: 'completed' })],
};

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

describe('AC-T7.3 Move to is admin-only on the roadmap', () => {
  beforeEach(() => mockRoadmap.mockReturnValue(populatedRoadmap));
  afterEach(() => mockRoadmap.mockReturnValue(emptyRoadmap));

  it('gives a member no Move to control on any card', () => {
    renderPage({ isAdmin: false, tab: 'roadmap' });

    expect(screen.getAllByTestId(/^fb-card-r/)).toHaveLength(4); // the cards are there
    expect(screen.queryAllByTestId(/-moveto$/)).toHaveLength(0); // the controls are not
    expect(screen.queryByRole('button', { name: /move to/i })).not.toBeInTheDocument();
  });

  it('gives an admin one on every card', () => {
    renderPage({ isAdmin: true, tab: 'roadmap' });
    expect(screen.queryAllByTestId(/-moveto$/)).toHaveLength(4);
  });

  it('hides it from a member whose admin flag has not loaded yet', () => {
    mockMe.mockReturnValue({ data: undefined });
    searchParams.set('tab', 'roadmap');
    render(<FeedbackPage />);
    searchParams.delete('tab');
    expect(screen.queryAllByTestId(/-moveto$/)).toHaveLength(0);
  });
});

describe('Ideas hides work already in progress', () => {
  it('asks for proposed items only', () => {
    renderPage({ isAdmin: false });
    expect(listParams).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'proposed' }));
  });

  it('still shows a member their own in-progress submissions', () => {
    renderPage({ isAdmin: false, tab: 'mine' });
    expect(listParams).toHaveBeenLastCalledWith(expect.objectContaining({ mine: true, status: 'open' }));
  });

  it('drops the status filter entirely when the member picks All', () => {
    searchParams.set('status', 'all');
    renderPage({ isAdmin: false });
    searchParams.delete('status');
    expect(listParams).toHaveBeenLastCalledWith(expect.not.objectContaining({ status: expect.anything() }));
  });
});

describe('stylesheet', () => {
  const styles: string = require('fs').readFileSync(
    require('path').join(process.cwd(), 'components/page/aligement-assets/feedback/feedback-styles.tsx'),
    'utf8',
  );
  const ruleFor = (selector: string): string => styles.match(new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`))![1];

  it('fills most of the shell with a readable ceiling', () => {
    const rule = ruleFor('.fb-page');
    const width = Number(rule.match(/width:\s*(\d+)%/)![1]);
    expect(width).toBeGreaterThanOrEqual(90);
    expect(rule).toMatch(/max-width:\s*\d+px/);
  });

  it('wraps the tabs instead of giving them a scrollbar', () => {
    const rule = ruleFor('.fb-tabs');
    expect(rule).toMatch(/flex-wrap:\s*wrap/);
    // The declaration, not the word "overflow" that appears in the comment.
    expect(rule).not.toMatch(/overflow(-[xy])?\s*:/);
  });
});
