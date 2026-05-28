import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { IdeasView } from '@/components/page/gantry/ideas/IdeasView';

const mockPush = jest.fn();
const mockUseGantryItems = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/gantry/ideas',
}));

jest.mock('@/services/gantry/store', () => ({
  useSubmitIdeaModalStore: () => ({
    open: false,
    variant: 'idea',
    actions: { openModal: jest.fn(), closeModal: jest.fn() },
  }),
}));

jest.mock('@/components/page/gantry/ideas/SubmitIdeaModal/SubmitIdeaModal', () => ({
  SubmitIdeaModal: () => null,
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => ({ currentUser: { uid: 'member-1' } }),
}));

jest.mock('@/services/rbac/hooks/useGantryAccess', () => ({
  useGantryAccess: () => ({
    canCreateIdea: true,
    canUpvote: true,
  }),
}));

jest.mock('@/services/gantry/hooks/useGantryItems', () => ({
  useGantryItems: (...args: unknown[]) => mockUseGantryItems(...args),
}));

jest.mock('@/services/gantry/hooks/useGantryFocusAreas', () => ({
  useGantryFocusAreas: () => ({ options: [], isLoading: false }),
}));

jest.mock('@/services/gantry/hooks/useCreateGantryItem', () => ({
  useCreateGantryItem: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock('@/services/gantry/hooks/useGantryUpvote', () => ({
  useGantryUpvote: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock('@/analytics/gantry.analytics', () => ({
  useGantryAnalytics: () => ({
    onIdeasViewed: jest.fn(),
    onIdeaCreated: jest.fn(),
    onItemUpvoted: jest.fn(),
  }),
}));

describe('IdeasView', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders list of idea cards', () => {
    mockUseGantryItems.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [
          {
            uid: 'idea-1',
            title: 'Improve profile sharing',
            description: 'desc',
            acceptanceCriteria: null,
            stage: 'IDEA',
            focusAreaUid: null,
            focusArea: null,
            createdByUid: 'member-1',
            createdBy: { uid: 'member-1', name: 'Alice', imageUrl: null },
            promotedAt: null,
            promotedByUid: null,
            declinedReason: null,
            externalTrackerUrl: null,
            upvoteCount: 3,
            viewerHasUpvoted: false,
            deletedAt: null,
            createdAt: '',
            updatedAt: '',
          },
        ],
      },
    });

    render(<IdeasView />);

    expect(screen.getByRole('heading', { name: 'Ideas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Improve profile sharing' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Submit an Idea/i }).length).toBeGreaterThan(0);
  });
});
