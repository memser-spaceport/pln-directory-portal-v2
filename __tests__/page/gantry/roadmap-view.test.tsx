import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { RoadmapView } from '@/components/page/gantry/roadmap/RoadmapView';

const mockUseGantryItems = jest.fn();

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

jest.mock('@/services/gantry/hooks/useGantryPinNote', () => ({
  useGantryPinNote: () => ({ mutate: jest.fn(), isPending: false }),
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
  useIsNarrow: () => false,
}));

describe('RoadmapView', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders roadmap columns and cards', () => {
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
});
