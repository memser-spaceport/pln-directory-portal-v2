import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { AiAppsGrid } from '@/components/page/ai-apps/AiAppsPage/components/AiAppsGrid';
import {
  getAddCardVariants,
  getCardVariants,
  getContainerVariants,
} from '@/components/page/ai-apps/AiAppsPage/components/AiAppsGrid/AiAppsGrid.variants';
import type { AiApp } from '@/services/ai-apps/ai-apps.service';

const mockUseAiApps = jest.fn();
jest.mock('@/services/ai-apps/hooks/useAiApps', () => ({
  useAiApps: () => mockUseAiApps(),
}));

jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => ({
    onCardClicked: jest.fn(),
    onAuthorClicked: jest.fn(),
  }),
}));

const mockUseReducedMotion = jest.fn();
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => mockUseReducedMotion(),
  };
});

const app = (partial: Partial<AiApp> & Pick<AiApp, 'uid'>): AiApp => ({
  memberUid: 'm-1',
  appId: 'app-id',
  name: 'App',
  description: 'Description',
  status: 'DEPLOYED',
  notes: null,
  url: null,
  httpUrl: null,
  host: null,
  port: null,
  deploymentId: 'dep-1',
  requiredEnvVars: [],
  providedEnvVars: [],
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  member: { uid: 'm-1', name: 'Ada Lovelace' },
  ...partial,
});

describe('AiAppsGrid', () => {
  const onOpenCreateModal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseReducedMotion.mockReturnValue(false);
  });

  it('shows a loading state and no cards while loading', () => {
    mockUseAiApps.mockReturnValue({ apps: [], isLoading: true, isError: false });
    render(<AiAppsGrid onOpenCreateModal={onOpenCreateModal} />);

    expect(screen.getByText(/loading apps/i)).toBeInTheDocument();
    expect(screen.queryByText('Create AI App')).not.toBeInTheDocument();
  });

  it('shows an error state', () => {
    mockUseAiApps.mockReturnValue({ apps: [], isLoading: false, isError: true });
    render(<AiAppsGrid onOpenCreateModal={onOpenCreateModal} />);

    expect(screen.getByText(/unable to load apps/i)).toBeInTheDocument();
  });

  it('renders AddAiAppCard alone when 0 apps are returned', () => {
    mockUseAiApps.mockReturnValue({ apps: [], isLoading: false, isError: false });
    render(<AiAppsGrid onOpenCreateModal={onOpenCreateModal} />);

    expect(screen.getByText('Create AI App')).toBeInTheDocument();
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);
  });

  it('renders every fetched app card in order after AddAiAppCard', () => {
    mockUseAiApps.mockReturnValue({
      apps: [app({ uid: 'a1', name: 'Alpha' }), app({ uid: 'a2', name: 'Beta' })],
      isLoading: false,
      isError: false,
    });
    render(<AiAppsGrid onOpenCreateModal={onOpenCreateModal} />);

    expect(screen.getByText('Create AI App')).toBeInTheDocument();
    const headings = screen.getAllByRole('heading', { level: 3 }).map((el) => el.textContent);
    expect(headings).toEqual(['Alpha', 'Beta']);
  });

  it('renders correctly when data is already resolved on the very first render (cache-fresh mount)', () => {
    // isLoading is false immediately with data present — no loading -> success transition is ever observed.
    mockUseAiApps.mockReturnValue({ apps: [app({ uid: 'a1', name: 'Alpha' })], isLoading: false, isError: false });
    render(<AiAppsGrid onOpenCreateModal={onOpenCreateModal} />);

    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('does not remount existing cards when the apps array reference changes but content is stable (background refetch)', () => {
    mockUseAiApps.mockReturnValue({ apps: [app({ uid: 'a1', name: 'Alpha' })], isLoading: false, isError: false });
    const { rerender, container } = render(<AiAppsGrid onOpenCreateModal={onOpenCreateModal} />);
    const firstNode = container.querySelector('h3');

    // Same content, new array/object identity — simulates a React Query background refetch.
    mockUseAiApps.mockReturnValue({ apps: [app({ uid: 'a1', name: 'Alpha' })], isLoading: false, isError: false });
    rerender(<AiAppsGrid onOpenCreateModal={onOpenCreateModal} />);
    const secondNode = container.querySelector('h3');

    expect(secondNode).toBe(firstNode);
  });
});

describe('AiAppsGrid variants', () => {
  it('gives the container a stagger transition, unless reduced motion is preferred', () => {
    expect(getContainerVariants(true).show).toEqual({});
    expect(getContainerVariants(false).show).toMatchObject({
      transition: { staggerChildren: expect.any(Number) },
    });
  });

  it('omits the vertical slide from card variants when reduced motion is preferred', () => {
    expect(getCardVariants(true).hidden).toEqual({ opacity: 0 });
    expect(getCardVariants(false).hidden).toMatchObject({ opacity: 0, y: expect.any(Number) });
  });

  it('gives AddAiAppCard a fade-only entrance', () => {
    expect(getAddCardVariants().hidden).toEqual({ opacity: 0 });
    expect(getAddCardVariants().show).toMatchObject({ opacity: 1 });
  });
});
