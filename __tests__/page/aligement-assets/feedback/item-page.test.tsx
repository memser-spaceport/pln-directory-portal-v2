import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import ItemDetailContainer from '@/components/page/aligement-assets/feedback/item-detail-container';
import { item } from './__fixtures__/feedback.fixtures';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: (select: (state: { currentUser: { uid: string } }) => unknown) =>
    select({ currentUser: { uid: 'member-1' } }),
}));
jest.mock('@/analytics/plaa-feedback.analytics', () => ({
  usePlaaFeedbackAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));

const mockMe = jest.fn();
const mockItem = jest.fn();
jest.mock('@/services/plaa/feedback/useFeedback', () => {
  const idle = () => ({ mutate: jest.fn(), isPending: false });
  return {
    useFeedbackMe: () => mockMe(),
    useFeedbackItem: () => mockItem(),
    useFeedbackComments: () => ({ data: { items: [] }, hasMore: false, isLoadingMore: false, loadMore: jest.fn() }),
    useVote: idle,
    useAddComment: idle,
    useDeleteComment: idle,
    useHideComment: idle,
    useChangeStatus: idle,
    useRetryLinear: idle,
    useAdminUpdate: idle,
    useUpdateFeedback: () => ({ mutate: jest.fn(), isPending: false, error: null, reset: jest.fn() }),
  };
});

const loaded = { data: item({ linear_status: 'failed' }), isLoading: false, isError: false, refetch: jest.fn() };
const adminPanel = () => screen.queryByLabelText('Admin controls');

describe('admin controls on the item page', () => {
  beforeEach(() => mockItem.mockReturnValue(loaded));

  it('are shown to an admin', () => {
    mockMe.mockReturnValue({ data: { is_admin: true, vote_budget: { limit: 5, used: 0, remaining: 5 } } });
    render(<ItemDetailContainer id="item-1" />);
    expect(adminPanel()).toBeInTheDocument();
  });

  it('are hidden from a member', () => {
    mockMe.mockReturnValue({ data: { is_admin: false, vote_budget: { limit: 5, used: 0, remaining: 5 } } });
    render(<ItemDetailContainer id="item-1" />);
    expect(adminPanel()).not.toBeInTheDocument();
  });

  it('are hidden while the admin check is still loading, not flashed then removed', () => {
    mockMe.mockReturnValue({ data: undefined });
    render(<ItemDetailContainer id="item-1" />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(adminPanel()).not.toBeInTheDocument();
  });
});

describe('an item that fails to load', () => {
  it('offers Retry, which asks for the item again', () => {
    const refetch = jest.fn();
    mockMe.mockReturnValue({ data: undefined });
    mockItem.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch });

    render(<ItemDetailContainer id="item-1" />);
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
