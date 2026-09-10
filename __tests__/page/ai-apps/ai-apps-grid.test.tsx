import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';

import { act } from '@testing-library/react';

import { AiAppsGrid } from '@/components/page/ai-apps/AiAppsPage/components/AiAppsGrid';
import { useAiAppsFilterStore } from '@/services/ai-apps/store';
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

const mockLogsOpened = jest.fn();
const mockEmptyResultsShown = jest.fn();
jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => ({
    onCardClicked: jest.fn(),
    onAuthorClicked: jest.fn(),
    onDeploymentLogsOpened: mockLogsOpened,
    onEmptyResultsShown: mockEmptyResultsShown,
  }),
}));

const mockCanLikelyManage = jest.fn().mockReturnValue(false);
jest.mock('@/services/ai-apps/hooks/useAiAppManageAccess', () => ({
  useAiAppManageAccess: () => ({ canLikelyManage: mockCanLikelyManage, isDirectoryAdmin: false }),
}));

// The lazy modal registry pulls in next/dynamic; stub it so the logs modal's
// open/close wiring can be asserted without loading the real modal tree.
jest.mock('@/components/page/ai-apps/dynamicActionModals', () => ({
  EditAiAppModal: () => null,
  DeploymentSettingsModal: () => null,
  DeploymentLogsModal: ({ app }: { app: { uid: string } }) => <div data-testid="logs-modal">{app.uid}</div>,
  DeleteAiAppDialog: () => null,
  AiAppDetailsModal: () => null,
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
  status: 'READY',
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
  member: { uid: 'm-1', name: 'Ada Lovelace', image: null },
  ...partial,
});

describe('AiAppsGrid', () => {
  const onOpenCreateModal = jest.fn();

  const setFilters = (init: Record<string, string>) =>
    act(() => useAiAppsFilterStore.getState().setAllParams(new URLSearchParams(init)));

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseReducedMotion.mockReturnValue(false);
    mockCanLikelyManage.mockReturnValue(false);
    setFilters({});
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

  it("failure strip 'See logs' opens the logs modal and reports source + variant", () => {
    mockCanLikelyManage.mockReturnValue(true);
    mockUseAiApps.mockReturnValue({
      apps: [app({ uid: 'a1', name: 'Alpha', status: 'ERROR', deployment: { serving: 'previous' } })],
      isLoading: false,
      isError: false,
    });
    render(<AiAppsGrid onOpenCreateModal={onOpenCreateModal} />);

    fireEvent.click(screen.getByRole('button', { name: /see logs/i }));

    expect(mockLogsOpened).toHaveBeenCalledWith({
      appUid: 'a1',
      appName: 'Alpha',
      source: 'failure-strip',
      variant: 'warning',
    });
    expect(screen.getByTestId('logs-modal')).toHaveTextContent('a1');
  });

  it('visitors get no failure strip on an ERROR app', () => {
    mockUseAiApps.mockReturnValue({
      apps: [app({ uid: 'a1', name: 'Alpha', status: 'ERROR', deployment: { serving: 'none' } })],
      isLoading: false,
      isError: false,
    });
    render(<AiAppsGrid onOpenCreateModal={onOpenCreateModal} />);

    expect(screen.queryByText('Deploy failed')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /see logs/i })).not.toBeInTheDocument();
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

  it('renders only the apps matching the search', () => {
    mockUseAiApps.mockReturnValue({
      apps: [app({ uid: 'a1', name: 'Alpha' }), app({ uid: 'a2', name: 'Beta' })],
      isLoading: false,
      isError: false,
    });
    setFilters({ search: 'beta' });
    render(<AiAppsGrid onOpenCreateModal={onOpenCreateModal} />);

    expect(screen.getAllByRole('heading', { level: 3 }).map((el) => el.textContent)).toEqual(['Beta']);
  });

  it('renders only the apps belonging to the selected creators', () => {
    mockUseAiApps.mockReturnValue({
      apps: [
        app({ uid: 'a1', name: 'Alpha', member: { uid: 'm-1', name: 'Ada Lovelace', image: null } }),
        app({ uid: 'a2', name: 'Beta', member: { uid: 'm-2', name: 'Nina Chen', image: null } }),
      ],
      isLoading: false,
      isError: false,
    });
    setFilters({ createdBy: 'Nina Chen' });
    render(<AiAppsGrid onOpenCreateModal={onOpenCreateModal} />);

    expect(screen.getAllByRole('heading', { level: 3 }).map((el) => el.textContent)).toEqual(['Beta']);
  });

  it('reorders the cards when the sort changes', () => {
    mockUseAiApps.mockReturnValue({
      apps: [
        app({ uid: 'a1', name: 'Zeta', updatedAt: '2026-08-01T00:00:00.000Z' }),
        app({ uid: 'a2', name: 'Alpha', updatedAt: '2026-06-01T00:00:00.000Z' }),
      ],
      isLoading: false,
      isError: false,
    });
    const { rerender } = render(<AiAppsGrid onOpenCreateModal={onOpenCreateModal} />);
    expect(screen.getAllByRole('heading', { level: 3 }).map((el) => el.textContent)).toEqual(['Zeta', 'Alpha']);

    setFilters({ sort: 'name' });
    rerender(<AiAppsGrid onOpenCreateModal={onOpenCreateModal} />);

    expect(screen.getAllByRole('heading', { level: 3 }).map((el) => el.textContent)).toEqual(['Alpha', 'Zeta']);
  });

  it('hides AddAiAppCard once a filter is applied, and restores it when cleared', () => {
    mockUseAiApps.mockReturnValue({ apps: [app({ uid: 'a1', name: 'Alpha' })], isLoading: false, isError: false });
    setFilters({ search: 'alpha' });
    const { rerender } = render(<AiAppsGrid onOpenCreateModal={onOpenCreateModal} />);

    expect(screen.queryByText('Create AI App')).not.toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();

    setFilters({});
    rerender(<AiAppsGrid onOpenCreateModal={onOpenCreateModal} />);

    expect(screen.getByText('Create AI App')).toBeInTheDocument();
  });

  it('keeps AddAiAppCard visible when only the sort is set — sorting is not filtering', () => {
    mockUseAiApps.mockReturnValue({ apps: [app({ uid: 'a1', name: 'Alpha' })], isLoading: false, isError: false });
    setFilters({ sort: 'name' });
    render(<AiAppsGrid onOpenCreateModal={onOpenCreateModal} />);

    expect(screen.getByText('Create AI App')).toBeInTheDocument();
  });

  it('shows the empty state, and no create card, when a filter matches nothing', () => {
    mockUseAiApps.mockReturnValue({ apps: [app({ uid: 'a1', name: 'Alpha' })], isLoading: false, isError: false });
    setFilters({ search: 'nothing matches this' });
    render(<AiAppsGrid onOpenCreateModal={onOpenCreateModal} />);

    expect(screen.getByText(/no apps match your filters/i)).toBeInTheDocument();
    expect(screen.queryByText('Create AI App')).not.toBeInTheDocument();
    expect(mockEmptyResultsShown).toHaveBeenCalledWith({ filterCount: 1 });
  });

  it('shows AddAiAppCard rather than the empty state when the account simply has no apps yet', () => {
    mockUseAiApps.mockReturnValue({ apps: [], isLoading: false, isError: false });
    render(<AiAppsGrid onOpenCreateModal={onOpenCreateModal} />);

    expect(screen.getByText('Create AI App')).toBeInTheDocument();
    expect(screen.queryByText(/no apps match your filters/i)).not.toBeInTheDocument();
    expect(mockEmptyResultsShown).not.toHaveBeenCalled();
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
