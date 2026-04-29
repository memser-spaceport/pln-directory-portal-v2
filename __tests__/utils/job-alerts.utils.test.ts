import {
  jobAlertFilterStateFromURL,
  hasActiveFilters,
  filterStateToHashKey,
  filterStateToURLSearchParams,
  summarizeFilterState,
} from '@/utils/job-alerts.utils';

describe('jobAlertFilterStateFromURL', () => {
  it('reads roleCategory, seniority, focus, location from URL params', () => {
    const sp = new URLSearchParams('roleCategory=Design&roleCategory=Product&seniority=Mid+(L3)&focus=Web3&location=Remote');
    const state = jobAlertFilterStateFromURL(sp);
    expect(state.roleCategory).toEqual(['Design', 'Product']);
    expect(state.seniority).toEqual(['Mid (L3)']);
    expect(state.focus).toEqual(['Web3']);
    expect(state.location).toEqual(['Remote']);
  });

  it('expands workplaceType to API workMode values', () => {
    const sp = new URLSearchParams('workplaceType=remote');
    const state = jobAlertFilterStateFromURL(sp);
    expect(state.workMode.sort()).toEqual(['distributed', 'remote']);
  });

  it('handles workplaceType=hybrid as itself (no expansion)', () => {
    const sp = new URLSearchParams('workplaceType=hybrid');
    const state = jobAlertFilterStateFromURL(sp);
    expect(state.workMode).toEqual(['hybrid']);
  });

  it('preserves trimmed q', () => {
    const sp = new URLSearchParams('q=  rust  ');
    const state = jobAlertFilterStateFromURL(sp);
    expect(state.q).toBe('rust');
  });

  it('returns empty arrays when no params', () => {
    const state = jobAlertFilterStateFromURL(new URLSearchParams(''));
    expect(state.q).toBeUndefined();
    expect(state.roleCategory).toEqual([]);
    expect(state.workMode).toEqual([]);
  });

  it('handles pipe-separated mobile fallback', () => {
    const sp = new URLSearchParams('roleCategory=Design%7CProduct');
    const state = jobAlertFilterStateFromURL(sp);
    expect(state.roleCategory.sort()).toEqual(['Design', 'Product']);
  });
});

describe('hasActiveFilters', () => {
  const empty = { roleCategory: [], seniority: [], focus: [], location: [], workMode: [] };

  it('returns false when nothing is set', () => {
    expect(hasActiveFilters({ ...empty })).toBe(false);
  });

  it('returns true when q is non-empty', () => {
    expect(hasActiveFilters({ ...empty, q: 'rust' })).toBe(true);
  });

  it('returns true when any filter array has values', () => {
    expect(hasActiveFilters({ ...empty, roleCategory: ['Design'] })).toBe(true);
    expect(hasActiveFilters({ ...empty, workMode: ['remote'] })).toBe(true);
  });
});

describe('filterStateToHashKey', () => {
  const empty = { roleCategory: [], seniority: [], focus: [], location: [], workMode: [] };

  it('produces the same hash regardless of array order', () => {
    const a = filterStateToHashKey({ ...empty, roleCategory: ['Design', 'Engineering'] });
    const b = filterStateToHashKey({ ...empty, roleCategory: ['Engineering', 'Design'] });
    expect(a).toBe(b);
  });

  it('lowercases values for case-insensitive comparison', () => {
    const a = filterStateToHashKey({ ...empty, q: 'Rust' });
    const b = filterStateToHashKey({ ...empty, q: 'RUST' });
    expect(a).toBe(b);
  });

  it('produces different hashes for different filters', () => {
    const a = filterStateToHashKey({ ...empty, roleCategory: ['Design'] });
    const b = filterStateToHashKey({ ...empty, roleCategory: ['Design', 'Product'] });
    expect(a).not.toBe(b);
  });

  it('returns empty string for empty filter state', () => {
    expect(filterStateToHashKey({ ...empty })).toBe('');
  });
});

describe('filterStateToURLSearchParams', () => {
  const empty = { roleCategory: [], seniority: [], focus: [], location: [], workMode: [] };

  it('emits q, roleCategory, seniority, focus, location as pipe-joined values on a single key', () => {
    const params = filterStateToURLSearchParams({
      ...empty,
      q: 'rust',
      roleCategory: ['Design', 'Product'],
      seniority: ['Senior (L4)'],
    });
    expect(params.get('q')).toBe('rust');
    expect(params.get('roleCategory')).toBe('Design|Product');
    expect(params.getAll('roleCategory')).toEqual(['Design|Product']);
    expect(params.get('seniority')).toBe('Senior (L4)');
  });

  it('emits workMode as collapsed workplaceType (remote+distributed → remote)', () => {
    const params = filterStateToURLSearchParams({ ...empty, workMode: ['remote', 'distributed'] });
    expect(params.get('workplaceType')).toBe('remote');
  });

  it('passes hybrid and in-office through as pipe-joined workplaceType', () => {
    const params = filterStateToURLSearchParams({ ...empty, workMode: ['hybrid', 'in-office'] });
    expect(params.get('workplaceType')?.split('|').sort()).toEqual(['hybrid', 'in-office']);
  });
});

describe('summarizeFilterState', () => {
  const empty = { roleCategory: [], seniority: [], focus: [], location: [], workMode: [] };

  it('joins major filters with " · "', () => {
    expect(summarizeFilterState({ ...empty, roleCategory: ['Design'], seniority: ['Mid (L3)'] })).toBe('Design · Mid');
  });

  it('joins all values within a multi-value filter category', () => {
    expect(
      summarizeFilterState({ ...empty, roleCategory: ['Design', 'Product'], seniority: ['Mid (L3)', 'Senior (L4)'] }),
    ).toBe('Design, Product · Mid, Senior');
  });

  it('falls back to "Job alert" when nothing is selected', () => {
    expect(summarizeFilterState({ ...empty })).toBe('Job alert');
  });

  it('includes location in summary', () => {
    expect(summarizeFilterState({ ...empty, location: ['Remote'] })).toBe('Remote');
  });

  it('quotes the search query', () => {
    expect(summarizeFilterState({ ...empty, q: 'rust' })).toBe('"rust"');
  });
});
