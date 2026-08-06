import { act, renderHook } from '@testing-library/react';

import { useDelayedHideFollowedSuggestions } from '@/components/page/home/TeamNews/components/NewsRail/useSuggestionsModule';
import type { ISuggestedTeam } from '@/types/team-news.types';

const team = (uid: string, name: string): ISuggestedTeam => ({
  uid,
  name,
  logo: null,
  reason: 'Storage · 1.2k followers',
});

const names = (result: { current: ISuggestedTeam[] }) => result.current.map((t) => t.name);

// This behaviour used to be verified through NewsRail. It moved into its own
// hook when the follow module gained a second surface (the sub-desktop
// scroller) — TeamNews owns the list now so both surfaces share one confirm
// timer, and testing it here is more direct than through either renderer.
describe('useDelayedHideFollowedSuggestions', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const suggestions = [team('t1', 'Banyan Storage'), team('t2', 'Helia Labs')];

  it('keeps a newly followed suggestion visible for the confirm window, then removes it', () => {
    const { result, rerender } = renderHook(
      ({ followed }) => useDelayedHideFollowedSuggestions(suggestions, followed),
      { initialProps: { followed: new Set<string>() } },
    );

    expect(names(result)).toEqual(['Banyan Storage', 'Helia Labs']);

    rerender({ followed: new Set(['t1']) });
    expect(names(result)).toEqual(['Banyan Storage', 'Helia Labs']);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(names(result)).toEqual(['Helia Labs']);
  });

  it('hides a team already followed on first sight, with no confirm flash', () => {
    const { result } = renderHook(() => useDelayedHideFollowedSuggestions(suggestions, new Set(['t1'])));

    expect(names(result)).toEqual(['Helia Labs']);
  });

  // Unfollowing inside the confirm window cancels the pending removal — the row
  // was never meant to disappear, so it must not disappear two seconds later.
  it('restores a row when the follow is undone before the timer fires', () => {
    const { result, rerender } = renderHook(
      ({ followed }) => useDelayedHideFollowedSuggestions(suggestions, followed),
      { initialProps: { followed: new Set<string>() } },
    );

    rerender({ followed: new Set(['t1']) });
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    rerender({ followed: new Set<string>() });
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(names(result)).toEqual(['Banyan Storage', 'Helia Labs']);
  });

  it('leaves an empty suggestion list empty', () => {
    const { result } = renderHook(() => useDelayedHideFollowedSuggestions([], new Set()));

    expect(result.current).toEqual([]);
  });
});
