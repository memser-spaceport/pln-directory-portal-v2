import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockUseJobsFilters = jest.fn(() => ({ data: undefined as { saved?: number } | undefined }));
jest.mock('@/services/jobs/hooks/useJobsQueries', () => ({
  useJobsFilters: () => mockUseJobsFilters(),
}));

import { SavedJobsFilter } from '@/components/page/jobs/JobsFilterBody/components/SavedJobsFilter/SavedJobsFilter';
import { useJobsFilterStore, useJobsFilterCount } from '@/services/jobs/store';

const savedParam = () => useJobsFilterStore.getState().params.get('saved');

const withSaved = (howMany: number) => mockUseJobsFilters.mockReturnValue({ data: { saved: howMany } });

beforeEach(() => {
  useJobsFilterStore.setState({ params: new URLSearchParams() });
  mockUseJobsFilters.mockReturnValue({ data: undefined });
});

describe('SavedJobsFilter', () => {
  it('starts unticked, and ticking it narrows the board', () => {
    render(<SavedJobsFilter />);

    expect(screen.getByRole('checkbox')).not.toBeChecked();

    fireEvent.click(screen.getByText('Saved'));
    expect(savedParam()).toBe('true');
  });

  it('unticking removes the param rather than setting it false', () => {
    useJobsFilterStore.setState({ params: new URLSearchParams('saved=true') });
    render(<SavedJobsFilter />);

    expect(screen.getByRole('checkbox')).toBeChecked();

    fireEvent.click(screen.getByText('Saved'));
    expect(savedParam()).toBeNull();
  });

  it('counts the saves the facets report for the current filters', () => {
    withSaved(7);
    const { container } = render(<SavedJobsFilter />);

    expect(container.textContent).toBe('Saved7');
  });

  /* Absent for a signed-out visitor, and while the facets are in flight — a
     flashed 0 would read as "you have none". */
  it('shows no count when the facets carry none', () => {
    const { container } = render(<SavedJobsFilter />);

    expect(container.textContent).toBe('Saved');
  });
});

describe('the Saved filter among the others', () => {
  /* It is an ordinary filter, so the two behaviours every filter has come for
     free — and a reader should be able to see that they really do. */
  it('counts towards the applied-filters badge', () => {
    const { result } = renderFilterCount();
    expect(result()).toBe(0);

    useJobsFilterStore.getState().setParam('saved', 'true');
    expect(result()).toBe(1);
  });

  it('is cleared by Clear All', () => {
    useJobsFilterStore.getState().setParam('saved', 'true');
    useJobsFilterStore.getState().setParam('q', 'engineer');

    useJobsFilterStore.getState().clearParams();

    expect(savedParam()).toBeNull();
  });
});

/** `useJobsFilterCount` is a hook; this reads it through a host component so
 *  the assertion sees what the filter panel's badge sees. */
function renderFilterCount() {
  let latest = 0;
  function Probe() {
    latest = useJobsFilterCount();
    return null;
  }
  const view = render(<Probe />);
  return {
    result: () => {
      view.rerender(<Probe />);
      return latest;
    },
  };
}
