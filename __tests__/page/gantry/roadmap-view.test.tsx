import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import { RoadmapView } from '@/components/page/gantry/roadmap/RoadmapView';

const mockUseGantryItems = jest.fn();
const mockUseIsNarrow = jest.fn(() => false);

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/gantry/dashboard',
}));

jest.mock('nuqs', () => ({
  useQueryStates: () => [{ itemId: '' }, jest.fn()],
}));

jest.mock('@/components/page/gantry/GantryItemDrawer/GantryItemDrawer', () => ({
  GantryItemDrawer: () => null,
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => ({ currentUser: { uid: 'member-1' } }),
}));

jest.mock('@/services/rbac/hooks/useGantryAccess', () => ({
  useGantryAccess: () => ({
    canCreateIdea: true,
    canCurate: true,
    canTransition: true,
    canUpvote: true,
  }),
}));

jest.mock('@/services/gantry/store', () => ({
  useSubmitIdeaModalStore: () => ({
    open: false,
    variant: 'roadmap',
    actions: { openModal: jest.fn(), closeModal: jest.fn() },
  }),
}));

jest.mock('@/components/page/gantry/ideas/SubmitIdeaModal/SubmitIdeaModal', () => ({
  SubmitIdeaModal: () => null,
}));

jest.mock('@/services/gantry/hooks/useGantryItems', () => ({
  useGantryItems: (...args: unknown[]) => mockUseGantryItems(...args),
}));

jest.mock('@/services/gantry/hooks/useGantryTransition', () => ({
  useGantryTransition: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock('@/services/gantry/hooks/useGantryUpvote', () => ({
  useGantryUpvote: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock('@/services/gantry/hooks/useGantryPin', () => ({
  useGantryPin: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

jest.mock('@/services/gantry/hooks/useGantryPinStatus', () => ({
  useGantryPinStatus: () => ({ data: undefined, isLoading: false }),
}));

jest.mock('@/services/gantry/hooks/useGantryPinUpdate', () => ({
  useGantryPinUpdate: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('@/services/gantry/hooks/useGantryObjectives', () => ({
  useGantryObjectives: () => ({ data: [], isLoading: false }),
}));

jest.mock('@/services/gantry/hooks/useGantryItemPins', () => ({
  useGantryItemPins: () => ({ data: [], isLoading: false }),
}));

jest.mock('@/services/gantry/hooks/useReorderGantryItem', () => ({
  useReorderGantryItem: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock('@/analytics/gantry.analytics', () => ({
  useGantryAnalytics: () => ({
    onRoadmapViewed: jest.fn(),
    onItemUpvoted: jest.fn(),
  }),
}));

jest.mock('@/services/gantry/hooks/useGantryDraft', () => ({
  useGantryDraftQuery: () => ({ data: null, isLoading: false }),
  useGantryDiscardDraftMutation: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('@/hooks/useIsNarrow', () => ({
  useIsNarrow: () => mockUseIsNarrow(),
}));

describe('RoadmapView', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders roadmap columns and cards', () => {
    mockUseIsNarrow.mockReturnValue(false);
    mockUseGantryItems.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [
          {
            uid: 'item-1',
            title: 'Ship new onboarding',
            description: 'desc',
            acceptanceCriteria: null,
            stage: 'PLANNED',
            focusArea: null,
            createdByUid: 'member-1',
            createdBy: { uid: 'member-1', name: 'Alice', imageUrl: null },
            promotedAt: null,
            promotedByUid: null,
            declinedReason: null,
            externalTrackerUrl: null,
            tags: null,
            type: null,
            order: null,
            upvoteCount: 1,
            viewerHasUpvoted: false,
            pinCount: 0,
            viewerHasPinned: false,
            objectives: [],
            deletedAt: null,
            createdAt: '',
            updatedAt: '',
          },
        ],
      },
    });

    render(<RoadmapView />);

    expect(screen.getByRole('heading', { name: 'Gantry' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Create Item' }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Planned').length).toBeGreaterThan(0);
    expect(screen.getAllByText('In Progress').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Shipped').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Ship new onboarding' })).toBeInTheDocument();
  });

  it('moves the active tab indicator when a swiped-to column becomes visible on mobile', () => {
    class FakeIntersectionObserver {
      static instances: FakeIntersectionObserver[] = [];
      callback: IntersectionObserverCallback;
      observe = jest.fn();
      unobserve = jest.fn();
      disconnect = jest.fn();

      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
        FakeIntersectionObserver.instances.push(this);
      }
    }
    const originalIntersectionObserver = global.IntersectionObserver;
    global.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;

    mockUseIsNarrow.mockReturnValue(true);

    // Mirror the real mount sequence: the roadmap starts in isLoading (skeleton
    // columns, no scrollContainerRef/data-stage refs attached) and only renders
    // the swipeable columns once loading finishes. The observer must be set up
    // AFTER that transition, not just on first mount.
    mockUseGantryItems.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    const { rerender } = render(<RoadmapView />);

    mockUseGantryItems.mockReturnValue({ isLoading: false, isError: false, data: { items: [] } });
    rerender(<RoadmapView />);

    expect(screen.getByRole('tab', { name: 'Submitted' })).toHaveAttribute('aria-selected', 'true');

    const observer = FakeIntersectionObserver.instances[0];
    expect(observer).toBeDefined();

    act(() => {
      observer.callback(
        [
          {
            isIntersecting: true,
            intersectionRatio: 1,
            target: { getAttribute: (attr: string) => (attr === 'data-stage' ? 'IN_PROGRESS' : null) },
          } as unknown as IntersectionObserverEntry,
        ],
        observer as unknown as IntersectionObserver,
      );
    });

    expect(screen.getByRole('tab', { name: 'In Progress' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Submitted' })).toHaveAttribute('aria-selected', 'false');

    global.IntersectionObserver = originalIntersectionObserver;
  });
});
