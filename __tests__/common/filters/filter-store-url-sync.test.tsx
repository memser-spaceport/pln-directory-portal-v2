import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';

import { createFilterStore } from '@/services/filters';
import { FilterStoreUrlSync } from '@/components/common/filters/FilterStoreUrlSync';

const mockPush = jest.fn();
const mockRefresh = jest.fn();
let currentSearch = '';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

const useTestStore = createFilterStore({
  namespace: 'url-sync-test',
  trackedParams: ['search', 'createdBy', 'sort'],
});

const setLocation = (search: string) => {
  currentSearch = search;
  window.history.replaceState(null, '', search ? `/list?${search}` : '/list');
};

const flush = (ms = 300) => act(() => jest.advanceTimersByTime(ms));

describe('FilterStoreUrlSync', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    setLocation('');
    act(() => useTestStore.getState().setAllParams(new URLSearchParams()));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('hydrates the store from the URL before children render', () => {
    setLocation('search=matcher&createdBy=Nina%20Chen');

    render(
      <FilterStoreUrlSync store={useTestStore}>
        <span>child</span>
      </FilterStoreUrlSync>,
    );

    expect(screen.getByText('child')).toBeInTheDocument();
    expect(useTestStore.getState().params.get('search')).toBe('matcher');
    expect(useTestStore.getState().params.get('createdBy')).toBe('Nina Chen');
  });

  it('does not write back the URL it was just seeded from', () => {
    setLocation('search=matcher');
    render(<FilterStoreUrlSync store={useTestStore} />);

    flush();

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('defaults its tracked keys to the ones the store declared', () => {
    render(<FilterStoreUrlSync store={useTestStore} />);

    act(() => useTestStore.getState().setParam('sort', 'name'));
    flush();

    expect(mockPush).toHaveBeenCalledWith('/list?sort=name', { scroll: false });
  });

  it('preserves untracked params instead of rebuilding the URL from the store', () => {
    setLocation('dialog=addAiApp');
    render(<FilterStoreUrlSync store={useTestStore} />);

    act(() => useTestStore.getState().setParam('search', 'matcher'));
    flush();

    const [url] = mockPush.mock.calls[0];
    expect(url).toContain('dialog=addAiApp');
    expect(url).toContain('search=matcher');
  });

  it('drops a tracked param from the URL once it leaves the store', () => {
    setLocation('search=matcher&dialog=addAiApp');
    render(<FilterStoreUrlSync store={useTestStore} />);

    act(() => useTestStore.getState().setParam('search', undefined));
    flush();

    expect(mockPush).toHaveBeenCalledWith('/list?dialog=addAiApp', { scroll: false });
  });

  it('honours an explicit tracked list over the store’s own', () => {
    render(<FilterStoreUrlSync store={useTestStore} trackedParams={['search']} />);

    act(() => useTestStore.getState().setParam('sort', 'name'));
    flush(1000);

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('waits out the debounce for ordinary changes', () => {
    render(<FilterStoreUrlSync store={useTestStore} debounceTime={700} />);

    act(() => useTestStore.getState().setParam('search', 'matcher'));
    flush(300);
    expect(mockPush).not.toHaveBeenCalled();

    flush(400);
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it('syncs a clear immediately, and refreshes only when asked', () => {
    setLocation('search=matcher');
    act(() => useTestStore.getState().setAllParams(new URLSearchParams({ search: 'matcher' })));
    const { unmount } = render(<FilterStoreUrlSync store={useTestStore} debounceTime={700} refreshOnClear />);

    act(() => useTestStore.getState().clearParams());
    act(() => jest.advanceTimersByTime(0));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockRefresh).toHaveBeenCalledTimes(1);

    unmount();
    jest.clearAllMocks();
    setLocation('search=matcher');
    act(() => useTestStore.getState().setAllParams(new URLSearchParams({ search: 'matcher' })));
    render(<FilterStoreUrlSync store={useTestStore} debounceTime={700} />);

    act(() => useTestStore.getState().clearParams());
    act(() => jest.advanceTimersByTime(0));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  describe('history strategy', () => {
    it('writes with pushState and never touches the router', () => {
      const pushState = jest.spyOn(window.history, 'pushState');
      render(<FilterStoreUrlSync store={useTestStore} strategy="history" />);

      act(() => useTestStore.getState().setParam('search', 'matcher'));
      flush();

      expect(mockPush).not.toHaveBeenCalled();
      expect(pushState).toHaveBeenCalledWith(null, '', '/list?search=matcher');
      pushState.mockRestore();
    });

    it('re-reads the URL on popstate, since the router never sees its writes', () => {
      render(<FilterStoreUrlSync store={useTestStore} strategy="history" />);

      setLocation('search=from-back-button');
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      expect(useTestStore.getState().params.get('search')).toBe('from-back-button');
    });
  });
});
