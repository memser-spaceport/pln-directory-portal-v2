import { createFilterStore } from '@/services/filters';

/* The filter store's analytics debounce: the default batches changes; 0 reports each change at once. */

type Store = ReturnType<typeof createFilterStore> & {
  getState: () => { setParam: (key: string, value?: string) => void };
  setAnalyticsCallback: (cb: (key: string, value: string | undefined) => void) => void;
};

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('keeps only the last change of a batch by default', () => {
  const store = createFilterStore({ namespace: 'default-debounce', trackedParams: ['city', 'event'] }) as Store;
  const cb = jest.fn();
  store.setAnalyticsCallback(cb);
  store.getState().setParam('city', 'Paris');
  store.getState().setParam('event', 'e1');
  jest.advanceTimersByTime(300);
  expect(cb.mock.calls.map(([key]) => key)).toEqual(['event']);
});

it('reports every change at once with a debounce of 0', () => {
  const store = createFilterStore({
    namespace: 'no-debounce',
    trackedParams: ['city', 'event'],
    analyticsDebounceMs: 0,
  }) as Store;
  const cb = jest.fn();
  store.setAnalyticsCallback(cb);
  store.getState().setParam('city', 'Paris');
  store.getState().setParam('event', 'e1');
  expect(cb.mock.calls.map(([key, value]) => [key, value])).toEqual([
    ['city', 'Paris'],
    ['event', 'e1'],
  ]);
});
