import '@testing-library/jest-dom';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useOneTimeCallout } from '@/hooks/useOneTimeCallout';
import { useCurrentUserStore } from '@/services/auth/store';
import { useDismissUiFlag, useUiFlags } from '@/services/members/hooks/useUiFlags';
import { getUiFlag, setUiFlag } from '@/utils/uiFlags';

jest.mock('@/utils/uiFlags', () => ({
  getUiFlag: jest.fn(),
  setUiFlag: jest.fn(),
}));

jest.mock('@/services/members/hooks/useUiFlags', () => ({
  useUiFlags: jest.fn(),
  useDismissUiFlag: jest.fn(),
}));

const mockGetUiFlag = getUiFlag as jest.MockedFunction<typeof getUiFlag>;
const mockSetUiFlag = setUiFlag as jest.MockedFunction<typeof setUiFlag>;
const mockUseUiFlags = useUiFlags as jest.MockedFunction<typeof useUiFlags>;
const mockUseDismissUiFlag = useDismissUiFlag as jest.MockedFunction<typeof useDismissUiFlag>;
const mockPush = jest.fn();

const KEY = 'help_callout';

/**
 * Waits for the local (IndexedDB) answer to have actually landed.
 *
 * `waitFor(() => expect(mockGetUiFlag).toHaveBeenCalled())` only proves the
 * read was *started*. Asserting `open === false` at that point passes whatever
 * the hook does, because the local answer is still `'pending'` and nothing can
 * be open yet — which is how a naive local-first regression slipped past an
 * earlier version of these tests.
 */
const localAnswerLands = async () => {
  await waitFor(() => expect(mockGetUiFlag).toHaveBeenCalled());
  await act(async () => {
    await Promise.resolve();
  });
};

/** The three server states the hook has to tell apart. */
const server = {
  pending: () => ({ data: undefined, isError: false }),
  says: (flags: Record<string, true>) => ({ data: flags, isError: false }),
  broken: () => ({ data: undefined, isError: true }),
};

function signedIn(uid = 'member-1') {
  useCurrentUserStore.setState({ currentUser: { uid } as never, isHydrated: true });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSetUiFlag.mockResolvedValue(undefined);
  mockUseDismissUiFlag.mockReturnValue({ mutate: mockPush } as never);
  mockUseUiFlags.mockReturnValue(server.pending() as never);
  signedIn();
});

describe('useOneTimeCallout', () => {
  describe('deciding whether to show', () => {
    it('stays shut, without waiting for the network, when this browser already knows', async () => {
      mockGetUiFlag.mockResolvedValue(true);
      mockUseUiFlags.mockReturnValue(server.pending() as never);

      const { result } = renderHook(() => useOneTimeCallout(KEY));

      await localAnswerLands();
      expect(result.current.open).toBe(false);
    });

    // The whole reason the hook is not naively local-first. Opening on the
    // local answer alone would show the callout to a member who dismissed it
    // on another device, then snatch it away when the server answer landed.
    it('does not open while the server answer is still in flight', async () => {
      mockGetUiFlag.mockResolvedValue(false);
      mockUseUiFlags.mockReturnValue(server.pending() as never);

      const { result, rerender } = renderHook(() => useOneTimeCallout(KEY));

      await localAnswerLands();
      expect(result.current.open).toBe(false);

      // ...and it was the wait holding it shut, not something else: the same
      // hook opens the moment the server answer arrives.
      mockUseUiFlags.mockReturnValue(server.says({}) as never);
      rerender();
      await waitFor(() => expect(result.current.open).toBe(true));
    });

    it('opens once both answers say the member has not seen it', async () => {
      mockGetUiFlag.mockResolvedValue(false);
      mockUseUiFlags.mockReturnValue(server.says({}) as never);

      const { result } = renderHook(() => useOneTimeCallout(KEY));

      await waitFor(() => expect(result.current.open).toBe(true));
    });

    it('stays shut when the member dismissed it on another device', async () => {
      mockGetUiFlag.mockResolvedValue(false);
      mockUseUiFlags.mockReturnValue(server.says({ [KEY]: true }) as never);

      const { result } = renderHook(() => useOneTimeCallout(KEY));

      await localAnswerLands();
      expect(result.current.open).toBe(false);
    });

    // A flags endpoint that is down must not take the callout down with it.
    it('falls back to the local answer when the flags call fails', async () => {
      mockGetUiFlag.mockResolvedValue(false);
      mockUseUiFlags.mockReturnValue(server.broken() as never);

      const { result } = renderHook(() => useOneTimeCallout(KEY));

      await waitFor(() => expect(result.current.open).toBe(true));
    });

    it('ignores a flag belonging to a different callout', async () => {
      mockGetUiFlag.mockResolvedValue(false);
      mockUseUiFlags.mockReturnValue(server.says({ gantry_boost_tip: true }) as never);

      const { result } = renderHook(() => useOneTimeCallout(KEY));

      await waitFor(() => expect(result.current.open).toBe(true));
    });
  });

  describe('before the session store hydrates', () => {
    // `currentUser: null, isHydrated: false` is the store's starting state and
    // is NOT "signed out". Acting on it would read the anonymous local key for
    // a signed-in member and skip the server read entirely.
    it('reads nothing at all', async () => {
      useCurrentUserStore.setState({ currentUser: null, isHydrated: false });
      mockGetUiFlag.mockResolvedValue(false);
      mockUseUiFlags.mockReturnValue(server.says({}) as never);

      const { result } = renderHook(() => useOneTimeCallout(KEY));

      await waitFor(() => expect(result.current.open).toBe(false));
      expect(mockGetUiFlag).not.toHaveBeenCalled();
    });

    it('does not ask the API for a member it cannot name yet', () => {
      useCurrentUserStore.setState({ currentUser: null, isHydrated: false });

      renderHook(() => useOneTimeCallout(KEY));

      expect(mockUseUiFlags).toHaveBeenCalledWith(undefined);
    });
  });

  describe('signed-out visitors', () => {
    beforeEach(() => {
      useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
    });

    // `customFetch` with no refresh token logs the visitor out and reloads the
    // page, so passing a uid-less query through would be a visible bug.
    it('never asks the API', () => {
      mockGetUiFlag.mockResolvedValue(false);

      renderHook(() => useOneTimeCallout(KEY));

      expect(mockUseUiFlags).toHaveBeenCalledWith(undefined);
    });

    it('still shows and still remembers, under the anonymous key', async () => {
      mockGetUiFlag.mockResolvedValue(false);

      const { result } = renderHook(() => useOneTimeCallout(KEY));

      await waitFor(() => expect(result.current.open).toBe(true));
      expect(mockGetUiFlag).toHaveBeenCalledWith('help_callout_dismissed_anon');

      result.current.dismiss();

      expect(mockSetUiFlag).toHaveBeenCalledWith('help_callout_dismissed_anon');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('dismissing', () => {
    beforeEach(() => {
      mockGetUiFlag.mockResolvedValue(false);
      mockUseUiFlags.mockReturnValue(server.says({}) as never);
    });

    it('closes the callout, writes locally and pushes to the member record', async () => {
      const { result } = renderHook(() => useOneTimeCallout(KEY));
      await waitFor(() => expect(result.current.open).toBe(true));

      result.current.dismiss();

      await waitFor(() => expect(result.current.open).toBe(false));
      expect(mockSetUiFlag).toHaveBeenCalledWith('help_callout_dismissed_member-1');
      expect(mockPush).toHaveBeenCalledWith({ uid: 'member-1', keys: [KEY] });
    });

    // A failing push is silent by construction: `mutate` does not throw, and
    // nothing here subscribes to the error. What must survive it is the part
    // the member can see — the callout closes, and this browser remembers.
    // The push itself is retried by the upgrade write on the next visit.
    it('closes and records locally even though the push never lands', async () => {
      mockPush.mockImplementation(() => {
        /* fire-and-forget: the mutation rejects internally and nothing here observes it */
      });

      const { result } = renderHook(() => useOneTimeCallout(KEY));
      await waitFor(() => expect(result.current.open).toBe(true));

      result.current.dismiss();

      await waitFor(() => expect(result.current.open).toBe(false));
      expect(mockSetUiFlag).toHaveBeenCalledWith('help_callout_dismissed_member-1');
      // The server answer never changed, so the next session sees
      // local=dismissed / server=fresh — exactly the upgrade-write condition.
      expect(mockUseUiFlags).toHaveBeenCalledWith('member-1');
    });
  });

  describe('reconciliation', () => {
    // The cutover migration: members who dismissed before any of this shipped
    // must not be shown the callout a second time. It doubles as the retry for
    // a dismissal whose PATCH never landed, which leaves the same state.
    it('pushes up a dismissal this browser knows about but the record does not', async () => {
      mockGetUiFlag.mockResolvedValue(true);
      mockUseUiFlags.mockReturnValue(server.says({}) as never);

      renderHook(() => useOneTimeCallout(KEY));

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith({ uid: 'member-1', keys: [KEY] }));
    });

    // The window this guards is real: between the upgrade PATCH going out and
    // its response landing in the query cache, the server still answers
    // "not dismissed". Any re-render in that window that changes an effect
    // dependency would fire a second push. An unstable `mutate` identity is the
    // easiest way for that to happen, so that is what is simulated here — a
    // plain `rerender()` changes no dependency and would prove nothing.
    it('pushes that upgrade exactly once, even when the mutation is not memoised', async () => {
      mockGetUiFlag.mockResolvedValue(true);
      mockUseUiFlags.mockReturnValue(server.says({}) as never);
      mockUseDismissUiFlag.mockImplementation(() => ({ mutate: (...args: unknown[]) => mockPush(...args) }) as never);

      const { rerender } = renderHook(() => useOneTimeCallout(KEY));

      await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
      rerender();
      rerender();
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    it('does not push when the record already agrees', async () => {
      mockGetUiFlag.mockResolvedValue(true);
      mockUseUiFlags.mockReturnValue(server.says({ [KEY]: true }) as never);

      renderHook(() => useOneTimeCallout(KEY));

      await localAnswerLands();
      expect(mockPush).not.toHaveBeenCalled();
    });

    // Caching the other device's answer is what buys the wait-free path on
    // every later load here.
    it('caches a dismissal that happened on another device', async () => {
      mockGetUiFlag.mockResolvedValue(false);
      mockUseUiFlags.mockReturnValue(server.says({ [KEY]: true }) as never);

      renderHook(() => useOneTimeCallout(KEY));

      await waitFor(() => expect(mockSetUiFlag).toHaveBeenCalledWith('help_callout_dismissed_member-1'));
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('writes nothing anywhere when both sides already agree it is fresh', async () => {
      mockGetUiFlag.mockResolvedValue(false);
      mockUseUiFlags.mockReturnValue(server.says({}) as never);

      const { result } = renderHook(() => useOneTimeCallout(KEY));

      await waitFor(() => expect(result.current.open).toBe(true));
      expect(mockSetUiFlag).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('local keys', () => {
    // Server keys drop the uid because it is in the URL path; local keys must
    // keep it, or a shared browser hands one member's dismissals to the next.
    it('keeps the member uid on the local key', async () => {
      signedIn('member-42');
      mockGetUiFlag.mockResolvedValue(false);

      renderHook(() => useOneTimeCallout('gantry_boost_tip'));

      await waitFor(() => expect(mockGetUiFlag).toHaveBeenCalledWith('gantry_boost_tip_dismissed_member-42'));
    });
  });
});
