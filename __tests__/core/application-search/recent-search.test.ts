import {
  MAX_RECENT_SEARCHES,
  RECENT_SEARCH_STORAGE_KEY,
  saveRecentSearch,
} from '@/services/search/hooks/useRecentSearch';

/**
 * Recent is written from the *debounced* term, because the dialog has no submit
 * gesture to hang it on: results appear as you type and `Enter` asks the AI. So
 * the keystroke ladder behind one query — `f`, `fi`, `fil`, `filecoin` — arrives
 * here as four separate saves, and collapsing it is this function's job.
 *
 * Getting that wrong is what produced the original bug: one typed query filled
 * a three-item list on its own, so a long question evicted every real search.
 */
const stored = () => JSON.parse(localStorage.getItem(RECENT_SEARCH_STORAGE_KEY) || '[]') as string[];
const seed = (items: string[]) => localStorage.setItem(RECENT_SEARCH_STORAGE_KEY, JSON.stringify(items));

beforeEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});

describe('saveRecentSearch', () => {
  it('records a search', () => {
    saveRecentSearch('filecoin');

    expect(stored()).toEqual(['filecoin']);
  });

  // The regression the whole design exists to prevent.
  it('collapses the keystrokes a query was typed through into one entry', () => {
    for (const term of ['f', 'fi', 'fil', 'file', 'filecoin']) {
      saveRecentSearch(term);
    }

    expect(stored()).toEqual(['filecoin']);
  });

  it('leaves unrelated searches alone while collapsing', () => {
    seed(['zero knowledge']);

    saveRecentSearch('fil');
    saveRecentSearch('filecoin');

    expect(stored()).toEqual(['filecoin', 'zero knowledge']);
  });

  // A step backwards through the same query, not a new one.
  it('ignores a term already covered by a longer one', () => {
    seed(['filecoin']);

    saveRecentSearch('fil');

    expect(stored()).toEqual(['filecoin']);
  });

  it('moves a repeated search to the front rather than listing it twice', () => {
    seed(['zk', 'filecoin', 'ipfs']);

    saveRecentSearch('filecoin');

    expect(stored()).toEqual(['filecoin', 'zk', 'ipfs']);
  });

  it('treats casing as the same search but keeps what was typed', () => {
    seed(['filecoin']);

    saveRecentSearch('Filecoin');

    expect(stored()).toEqual(['Filecoin']);
  });

  it(`keeps at most ${MAX_RECENT_SEARCHES}, evicting the oldest`, () => {
    saveRecentSearch('one');
    saveRecentSearch('two');
    saveRecentSearch('three');
    saveRecentSearch('four');

    expect(stored()).toEqual(['four', 'three', 'two']);
    expect(stored()).toHaveLength(MAX_RECENT_SEARCHES);
  });

  it('records nothing for an empty or whitespace term', () => {
    saveRecentSearch('');
    saveRecentSearch('   ');

    expect(stored()).toEqual([]);
  });

  it('stores the trimmed term', () => {
    saveRecentSearch('  filecoin  ');

    expect(stored()).toEqual(['filecoin']);
  });

  /* Private mode, blocked storage: failing to remember a search must never
     interfere with making one. */
  it('does not throw when storage is unavailable', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => saveRecentSearch('filecoin')).not.toThrow();
  });

  it('survives a corrupted list rather than taking the search down with it', () => {
    localStorage.setItem(RECENT_SEARCH_STORAGE_KEY, 'not json');
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => saveRecentSearch('filecoin')).not.toThrow();
  });
});
