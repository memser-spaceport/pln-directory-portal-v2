import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AiAppsFilter } from '@/components/page/ai-apps/AiAppsPage/components/AiAppsFilter';
import { useAiAppsFilterStore } from '@/services/ai-apps/store';
import type { AiApp } from '@/services/ai-apps/ai-apps.service';

const mockUseAiApps = jest.fn();
jest.mock('@/services/ai-apps/hooks/useAiApps', () => ({
  useAiApps: () => mockUseAiApps(),
}));

const mockFiltersCleared = jest.fn();
const mockCreatorSelected = jest.fn();
const mockSearchApplied = jest.fn();
const mockCreatorSearched = jest.fn();
const mockFiltersApplied = jest.fn();
jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => ({
    onFiltersCleared: mockFiltersCleared,
    onCreatorFilterSelected: mockCreatorSelected,
    onSearchApplied: mockSearchApplied,
    onCreatorFilterSearched: mockCreatorSearched,
    onFiltersApplied: mockFiltersApplied,
  }),
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

const resetStore = () => act(() => useAiAppsFilterStore.getState().setAllParams(new URLSearchParams()));

/**
 * The applied-filters badge, read off the panel heading rather than by its text.
 * A bare getByText('2') also matches the *facet* count beside a creator who
 * happens to have two apps.
 */
const filtersHeading = () => screen.getByRole('heading', { name: /filters/i });

describe('AiAppsFilter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
    mockUseAiApps.mockReturnValue({
      apps: [app('a1', 'Nina Chen'), app('a2', 'Ada Lovelace'), app('a3', 'Nina Chen')],
      isLoading: false,
      isError: false,
    });
  });

  it('offers one alphabetical creator option per creator, with their app counts', () => {
    render(<AiAppsFilter />);

    const creators = screen.getAllByText(/Nina Chen|Ada Lovelace/).map((el) => el.textContent);
    expect(creators).toEqual(['Ada Lovelace', 'Nina Chen']);
    expect(screen.getByText('Created by')).toBeInTheDocument();
  });

  it('ticking a creator writes the facet param', async () => {
    const user = userEvent.setup();
    render(<AiAppsFilter />);

    await user.click(screen.getByText('Nina Chen'));

    expect(useAiAppsFilterStore.getState().params.get('createdBy')).toBe('Nina Chen');
    expect(mockCreatorSelected).toHaveBeenCalledWith(expect.objectContaining({ creatorCount: 1 }));
  });

  it('shows the applied-filter count, and excludes sort from it', () => {
    act(() =>
      useAiAppsFilterStore
        .getState()
        .setAllParams(new URLSearchParams({ search: 'matcher', createdBy: 'Nina Chen', sort: 'name' })),
    );
    render(<AiAppsFilter />);

    expect(filtersHeading()).toHaveTextContent(/^Filters2$/);
  });

  it('does not count the create-modal deep link as an applied filter', () => {
    act(() => useAiAppsFilterStore.getState().setAllParams(new URLSearchParams({ dialog: 'addAiApp' })));
    render(<AiAppsFilter />);

    // No badge at all — the rail reads as untouched.
    expect(filtersHeading()).toHaveTextContent(/^Filters$/);
  });

  it('Clear All empties the params and reports the surface', async () => {
    const user = userEvent.setup();
    act(() => useAiAppsFilterStore.getState().setAllParams(new URLSearchParams({ search: 'matcher' })));
    render(<AiAppsFilter />);

    await user.click(screen.getByRole('button', { name: /clear all/i }));

    expect(useAiAppsFilterStore.getState().params.toString()).toBe('');
    expect(mockFiltersCleared).toHaveBeenCalledWith({ source: 'rail' });
  });

  it('reports the mobile surface when rendered in the bottom sheet', async () => {
    const user = userEvent.setup();
    render(<AiAppsFilter source="mobile" onClose={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: /clear all/i }));

    expect(mockFiltersCleared).toHaveBeenCalledWith({ source: 'mobile' });
  });

  it('stamps the surface on the creator facet, so rail and sheet stay separable', async () => {
    const user = userEvent.setup();
    render(<AiAppsFilter source="mobile" onClose={jest.fn()} />);

    await user.click(screen.getByText('Nina Chen'));

    // resultCount is the count the tick *before* the facet narrows the list (3, not 2):
    // onChange runs alongside the param write, so the derived list has yet to recompute.
    expect(mockCreatorSelected).toHaveBeenCalledWith({ creatorCount: 1, resultCount: 3, source: 'mobile' });
  });

  it('stamps the surface on the search event', () => {
    render(<AiAppsFilter />);
    // Set after mount: the effect reports a *change* of query, so a param that was
    // already there when the panel opened is deliberately silent.
    act(() => useAiAppsFilterStore.getState().setAllParams(new URLSearchParams({ search: 'matcher' })));

    expect(mockSearchApplied).toHaveBeenCalledWith({ queryLength: 7, resultCount: 0, source: 'rail' });
  });

  describe('Apply filters', () => {
    it('reports the press and closes the sheet', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      act(() => useAiAppsFilterStore.getState().setAllParams(new URLSearchParams({ createdBy: 'Nina Chen' })));
      render(<AiAppsFilter source="mobile" onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /apply filters/i }));

      expect(mockFiltersApplied).toHaveBeenCalledWith({ source: 'mobile', filterCount: 1, resultCount: 2 });
      expect(onClose).toHaveBeenCalled();
    });

    it('still reports on the rail, where the press closes nothing', async () => {
      const user = userEvent.setup();
      render(<AiAppsFilter />);

      await user.click(screen.getByRole('button', { name: /apply filters/i }));

      expect(mockFiltersApplied).toHaveBeenCalledWith({ source: 'rail', filterCount: 0, resultCount: 3 });
    });
  });

  describe('creator lookup', () => {
    // Fake timers only here: the other cases drive userEvent, which stalls on them.
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    /** The box behind the facet list; the app-search field is a separate input. */
    const creatorBox = () => screen.getByPlaceholderText('E.g. Nina Chen');

    it('reports the query length and the surface, never the text', () => {
      render(<AiAppsFilter />);

      fireEvent.change(creatorBox(), { target: { value: 'Nina' } });
      act(() => jest.advanceTimersByTime(700));

      expect(mockCreatorSearched).toHaveBeenCalledWith({ queryLength: 4, source: 'rail' });
      // A creator query is a member's name: the payload must not carry it.
      const [[payload]] = mockCreatorSearched.mock.calls;
      expect(JSON.stringify(payload)).not.toContain('Nina');
    });

    it('lands one event per settled query, not one per keystroke', () => {
      render(<AiAppsFilter />);

      fireEvent.change(creatorBox(), { target: { value: 'N' } });
      fireEvent.change(creatorBox(), { target: { value: 'Ni' } });
      fireEvent.change(creatorBox(), { target: { value: 'Nina' } });
      act(() => jest.advanceTimersByTime(700));

      expect(mockCreatorSearched).toHaveBeenCalledTimes(1);
      expect(mockCreatorSearched).toHaveBeenCalledWith({ queryLength: 4, source: 'rail' });
    });

    it('stays silent when the box is emptied — a reset is not a lookup', () => {
      render(<AiAppsFilter />);

      fireEvent.change(creatorBox(), { target: { value: 'Nina' } });
      act(() => jest.advanceTimersByTime(700));
      mockCreatorSearched.mockClear();

      fireEvent.change(creatorBox(), { target: { value: '' } });
      act(() => jest.advanceTimersByTime(700));

      expect(mockCreatorSearched).not.toHaveBeenCalled();
    });
  });
});
