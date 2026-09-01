import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FilterSearchInput } from '@/components/common/filters/FilterSearchInput';
import { createFilterStore } from '@/services/filters';

const useTestStore = createFilterStore({ namespace: 'test', trackedParams: ['search', 'q'] });

const reset = () => act(() => useTestStore.getState().setAllParams(new URLSearchParams()));

describe('FilterSearchInput', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    reset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const flushDebounce = (ms = 700) => act(() => jest.advanceTimersByTime(ms));

  it('writes the debounced, trimmed value to the store', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<FilterSearchInput filterStore={useTestStore} placeholder="Search" />);

    await user.type(screen.getByPlaceholderText('Search'), '  Matcher  ');
    expect(useTestStore.getState().params.get('search')).toBeNull();

    flushDebounce();
    expect(useTestStore.getState().params.get('search')).toBe('Matcher');
  });

  it('writes to a custom param key when asked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<FilterSearchInput filterStore={useTestStore} placeholder="Search" paramKey="q" debounceMs={100} />);

    await user.type(screen.getByPlaceholderText('Search'), 'intro');
    flushDebounce(100);

    expect(useTestStore.getState().params.get('q')).toBe('intro');
    expect(useTestStore.getState().params.get('search')).toBeNull();
  });

  it('seeds the field from an already-filtered store', () => {
    act(() => useTestStore.getState().setAllParams(new URLSearchParams({ search: 'seeded' })));
    render(<FilterSearchInput filterStore={useTestStore} placeholder="Search" />);

    expect(screen.getByPlaceholderText('Search')).toHaveValue('seeded');
  });

  it('empties the field when the store is cleared elsewhere ("Clear All")', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<FilterSearchInput filterStore={useTestStore} placeholder="Search" />);

    await user.type(screen.getByPlaceholderText('Search'), 'matcher');
    flushDebounce();
    expect(screen.getByPlaceholderText('Search')).toHaveValue('matcher');

    act(() => useTestStore.getState().clearParams());

    expect(screen.getByPlaceholderText('Search')).toHaveValue('');
    expect(useTestStore.getState().params.get('search')).toBeNull();
  });

  it('clears the param immediately from the clear button, without waiting out the debounce', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<FilterSearchInput filterStore={useTestStore} placeholder="Search" />);

    await user.type(screen.getByPlaceholderText('Search'), 'matcher');
    flushDebounce();

    await user.click(screen.getByRole('button', { name: /clear search/i }));

    expect(useTestStore.getState().params.get('search')).toBeNull();
    expect(screen.getByPlaceholderText('Search')).toHaveValue('');
  });

  it('renders the label only when one is given', () => {
    const { rerender } = render(<FilterSearchInput filterStore={useTestStore} placeholder="Search" />);
    expect(screen.queryByText('Search for an app')).not.toBeInTheDocument();

    rerender(<FilterSearchInput filterStore={useTestStore} placeholder="Search" label="Search for an app" />);
    expect(screen.getByText('Search for an app')).toBeInTheDocument();
  });
});
