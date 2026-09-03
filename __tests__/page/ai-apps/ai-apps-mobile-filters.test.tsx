import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AiAppsMobileFilters } from '@/components/page/ai-apps/AiAppsPage/components/AiAppsMobileFilters';
import { useAiAppsFilterStore } from '@/services/ai-apps/store';
import type { AiApp } from '@/services/ai-apps/ai-apps.service';

const mockUseAiApps = jest.fn();
jest.mock('@/services/ai-apps/hooks/useAiApps', () => ({
  useAiApps: () => mockUseAiApps(),
}));

const mockSortChanged = jest.fn();
const mockFiltersCleared = jest.fn();
const mockPanelDismissed = jest.fn();
jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => ({
    onSortChanged: mockSortChanged,
    onFiltersCleared: mockFiltersCleared,
    onFiltersPanelDismissed: mockPanelDismissed,
  }),
}));

/**
 * The real wrapper hides its dismiss behind an unnamed icon button, a portalled
 * base-ui dialog and a swipe handler. What matters here is which callback each
 * gesture is wired to, so the surfaces are stubbed as plain buttons.
 */
jest.mock('@/components/common/filters/MobileFilterWrapper', () => ({
  MobileFilterWrapper: ({ onFilterClose, onClearFilters, onSortChange, renderFilter }: any) => (
    <div>
      <button onClick={onFilterClose}>dismiss</button>
      <button onClick={onClearFilters}>clear</button>
      <button onClick={() => onSortChange('name')}>sort</button>
      {renderFilter(jest.fn())}
    </div>
  ),
}));

jest.mock('@/components/page/ai-apps/AiAppsPage/components/AiAppsFilter', () => ({
  AiAppsFilter: () => <div data-testid="ai-apps-filter" />,
}));

const app = (uid: string, creatorName: string): AiApp => ({
  uid,
  memberUid: 'm',
  appId: 'app-id',
  name: uid,
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
  member: { uid: `m-${creatorName}`, name: creatorName, image: null },
});

describe('AiAppsMobileFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => useAiAppsFilterStore.getState().setAllParams(new URLSearchParams()));
    mockUseAiApps.mockReturnValue({
      apps: [app('a1', 'Nina Chen'), app('a2', 'Ada Lovelace')],
      isLoading: false,
      isError: false,
    });
  });

  it('reports a dismissal, and carries what was applied when the sheet was abandoned', async () => {
    const user = userEvent.setup();
    act(() => useAiAppsFilterStore.getState().setAllParams(new URLSearchParams({ createdBy: 'Nina Chen' })));
    render(<AiAppsMobileFilters />);

    await user.click(screen.getByRole('button', { name: 'dismiss' }));

    expect(mockPanelDismissed).toHaveBeenCalledWith({ filterCount: 1 });
  });

  it('keeps a dismissal out of the clear and sort events', async () => {
    const user = userEvent.setup();
    render(<AiAppsMobileFilters />);

    await user.click(screen.getByRole('button', { name: 'dismiss' }));

    expect(mockFiltersCleared).not.toHaveBeenCalled();
    expect(mockSortChanged).not.toHaveBeenCalled();
  });

  it('still reports clear and sort from the sheet', async () => {
    const user = userEvent.setup();
    render(<AiAppsMobileFilters />);

    await user.click(screen.getByRole('button', { name: 'clear' }));
    await user.click(screen.getByRole('button', { name: 'sort' }));

    expect(mockFiltersCleared).toHaveBeenCalledWith({ source: 'mobile' });
    expect(mockSortChanged).toHaveBeenCalledWith({ sort: 'name', source: 'mobile', resultCount: 2 });
    expect(mockPanelDismissed).not.toHaveBeenCalled();
  });
});
