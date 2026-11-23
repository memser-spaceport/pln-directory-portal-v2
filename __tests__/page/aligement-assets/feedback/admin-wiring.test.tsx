import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import FeedbackPage from '@/components/page/aligement-assets/feedback/feedback-page';
import ItemDetailContainer from '@/components/page/aligement-assets/feedback/item-detail-container';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  usePathname: () => '/alignment-asset/feedback',
  useSearchParams: () => new URLSearchParams('tab=triage'),
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: (select: (state: { currentUser: { uid: string } }) => unknown) =>
    select({ currentUser: { uid: 'admin-1' } }),
}));
jest.mock('@/analytics/plaa-feedback.analytics', () => ({
  usePlaaFeedbackAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));

const mockAdminUpdate = jest.fn();
jest.mock('@/services/plaa/feedback/useFeedback', () => {
  const { item: fixture, emptyRoadmap: roadmap } = jest.requireActual('./__fixtures__/feedback.fixtures');
  const idle = () => ({ mutate: jest.fn(), isPending: false, variables: undefined, error: null });
  const one = { data: { items: [fixture({ id: 'card-9', title: 'A card' })] }, isLoading: false, isError: false };
  return {
    useFeedbackMe: () => ({ data: { is_admin: true, vote_budget: { limit: 5, used: 0, remaining: 5 } } }),
    useFeedbackList: () => ({ ...one, refetch: jest.fn() }),
    useFeedbackRoadmap: () => ({ data: roadmap, isLoading: false, isError: false, refetch: jest.fn() }),
    useFeedbackTriage: () => ({ ...one, refetch: jest.fn() }),
    useFeedbackItem: () => ({ data: fixture({ id: 'card-9', title: 'A card' }), isLoading: false, isError: false }),
    useFeedbackComments: () => ({ data: { items: [] }, hasMore: false, isLoadingMore: false, loadMore: jest.fn() }),
    useVote: idle,
    useCreateFeedback: idle,
    useChangeStatus: idle,
    useRetryLinear: idle,
    useAddComment: idle,
    useDeleteComment: idle,
    useHideComment: idle,
    useAdminUpdate: () => ({ mutate: mockAdminUpdate, isPending: false }),
  };
});

beforeEach(() => mockAdminUpdate.mockClear());

describe('an admin change is saved against the right item', () => {
  it('from the Triage tab', () => {
    render(<FeedbackPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm remove' }));

    expect(mockAdminUpdate).toHaveBeenCalledWith({ id: 'card-9', removed: true });
  });

  it('from the item page', () => {
    render(<ItemDetailContainer id="card-9" />);

    fireEvent.click(screen.getByRole('button', { name: 'Make private' }));

    expect(mockAdminUpdate).toHaveBeenCalledWith({ id: 'card-9', is_public: false });
  });
});
