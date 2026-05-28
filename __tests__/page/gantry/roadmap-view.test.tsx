import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { RoadmapView } from '@/components/page/gantry/roadmap/RoadmapView';

const mockUseGantryItems = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/gantry/roadmap',
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

jest.mock('@/services/gantry/hooks/useGantryFocusAreas', () => ({
  useGantryFocusAreas: () => ({ options: [], isLoading: false }),
}));

jest.mock('@/services/gantry/hooks/useGantryTransition', () => ({
  useGantryTransition: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock('@/services/gantry/hooks/useGantryUpvote', () => ({
  useGantryUpvote: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock('@/analytics/gantry.analytics', () => ({
  useGantryAnalytics: () => ({
    onRoadmapViewed: jest.fn(),
    onItemUpvoted: jest.fn(),
  }),
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
            focusAreaUid: null,
            focusArea: null,
            createdByUid: 'member-1',
            createdBy: { uid: 'member-1', name: 'Alice', imageUrl: null },
            promotedAt: null,
            promotedByUid: null,
            declinedReason: null,
            externalTrackerUrl: null,
            upvoteCount: 1,
            viewerHasUpvoted: false,
            deletedAt: null,
            createdAt: '',
            updatedAt: '',
          },
        ],
      },
    });

    render(<RoadmapView />);

    expect(screen.getByRole('heading', { name: 'Roadmap' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Create Roadmap Item' }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Planned').length).toBeGreaterThan(0);
    expect(screen.getAllByText('In Progress').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Shipped').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Ship new onboarding' })).toBeInTheDocument();
  });
});
