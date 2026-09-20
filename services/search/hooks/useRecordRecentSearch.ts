import { useEffect } from 'react';

import { MIN_ASK_LENGTH } from '@/services/search/constants';
import { saveRecentSearch } from '@/services/search/hooks/useRecentSearch';

/**
 * Records a settled search term under Recent, for the legacy header search.
 *
 * DELETE WITH: the legacy header search (`LegacyApplicationSearch`). The dialog
 * does this inline, on its own debounced term — it does not use this hook.
 *
 * The legacy UI used to get this for free: `useFullApplicationSearch` called
 * `saveRecentSearch` inside its fetcher. That call was removed when the two
 * searches started sharing the hook, and rightly so — saving from inside a
 * query is what filled the three-item list with the prefix ladder of a single
 * query (`f`, `fi`, `fil`, `file`), the bug #3015 fixed. So the legacy UI now
 * asks for it explicitly instead of inheriting it from a shared fetcher.
 *
 * `term` is expected to have settled already: every caller reads it from a
 * `DebouncedInput`, which debounces internally. Collapsing any ladder that does
 * still arrive is `saveRecentSearch`'s job, not this hook's.
 *
 * A term is recorded whether or not the request behind it succeeded. That
 * differs from what `main` did — its call sat in the fetcher's ok-branch — and
 * matches the dialog: a search you ran and read is a search, and whether the
 * backend managed to answer it is a different question.
 */
export function useRecordRecentSearch(term: string) {
  useEffect(() => {
    const settled = term.trim();

    if (settled.length >= MIN_ASK_LENGTH) {
      saveRecentSearch(settled);
    }
  }, [term]);
}
