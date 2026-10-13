import { JobsQueryKey } from '@/services/jobs/constants';
import { isSavedScopeBoardQuery } from '@/services/jobs/hooks/savedJobs/utils/isSavedScopeBoardQuery';
import { toggleSavedJobInCache } from '@/services/jobs/hooks/savedJobs/utils/toggleSavedJobInCache';
import type { ISavedJob } from '@/types/jobs.types';

/**
 * The two decisions a bookmark press makes, tested as pure transforms rather
 * than through `useToggleSavedJob` — the global jest setup stubs `useMutation`
 * and `useQueryClient`, so a hook test would assert against those stubs. Same
 * reasoning as `team-interest-cache.test.ts`.
 */

const saved = (jobUid: string, savedAt = '2026-09-01T00:00:00.000Z'): ISavedJob => ({ jobUid, savedAt });

describe('toggleSavedJobInCache', () => {
  it('puts a new save at the front, where the server would', () => {
    const next = toggleSavedJobInCache([saved('b'), saved('c')], 'a', false);

    expect(next.map((entry) => entry.jobUid)).toEqual(['a', 'b', 'c']);
  });

  it('stamps the new row, so the Saved tab clock has a date before the server answers', () => {
    const next = toggleSavedJobInCache([], 'a', false);

    expect(Number.isFinite(new Date(next[0].savedAt).getTime())).toBe(true);
    expect(next[0].jobUid).toBe('a');
  });

  it('drops exactly the unsaved role', () => {
    const next = toggleSavedJobInCache([saved('a'), saved('b'), saved('c')], 'b', true);

    expect(next.map((entry) => entry.jobUid)).toEqual(['a', 'c']);
  });

  it('is a no-op when unsaving something that was never there', () => {
    const current = [saved('a')];

    expect(toggleSavedJobInCache(current, 'zzz', true).map((entry) => entry.jobUid)).toEqual(['a']);
  });

  /* React Query compares references to decide what re-renders, and `onError`
     restores the snapshot taken before this ran — a mutated input would make
     the rollback restore the already-changed list. */
  it('leaves the list it was given untouched', () => {
    const current = [saved('a'), saved('b')];

    toggleSavedJobInCache(current, 'a', true);
    toggleSavedJobInCache(current, 'c', false);

    expect(current.map((entry) => entry.jobUid)).toEqual(['a', 'b']);
  });
});

describe('isSavedScopeBoardQuery', () => {
  it('matches the list and the facets of the Saved tab', () => {
    expect(isSavedScopeBoardQuery([JobsQueryKey.List, 'saved=true&page=1'])).toBe(true);
    expect(isSavedScopeBoardQuery([JobsQueryKey.Filters, 'saved=true'])).toBe(true);
    expect(isSavedScopeBoardQuery([JobsQueryKey.List, 'q=engineer&saved=true&sort=newest'])).toBe(true);
  });

  it('leaves the unscoped board alone — a bookmark does not change it', () => {
    expect(isSavedScopeBoardQuery([JobsQueryKey.List, ''])).toBe(false);
    expect(isSavedScopeBoardQuery([JobsQueryKey.List, 'q=engineer'])).toBe(false);
    expect(isSavedScopeBoardQuery([JobsQueryKey.List])).toBe(false);
  });

  it('leaves the saved map alone — the press already corrected it', () => {
    expect(isSavedScopeBoardQuery([JobsQueryKey.SavedJobs])).toBe(false);
  });

  it('does not touch unrelated queries that happen to be scoped', () => {
    expect(isSavedScopeBoardQuery([JobsQueryKey.BaseFilters, 'saved=true'])).toBe(false);
    expect(isSavedScopeBoardQuery([JobsQueryKey.ApplicationStatuses, 'saved=true'])).toBe(false);
  });

  /* Parsed, not substring-matched: `'unsaved=true'.includes('saved=true')` is
     true, and an earlier version of this invalidated on it. */
  it('reads the param rather than the spelling of the key', () => {
    expect(isSavedScopeBoardQuery([JobsQueryKey.List, 'unsaved=true'])).toBe(false);
    expect(isSavedScopeBoardQuery([JobsQueryKey.List, 'saved=false'])).toBe(false);
    expect(isSavedScopeBoardQuery([JobsQueryKey.List, 'q=saved%3Dtrue'])).toBe(false);
  });
});
