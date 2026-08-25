import { act, renderHook } from '@testing-library/react';

import { useTeamNewsImpressions } from '@/services/team-news/hooks/useTeamNewsImpressions';
import { recordTeamNewsImpressions, sendTeamNewsImpressionsBeacon } from '@/services/team-news/team-news.service';

jest.mock('@/services/team-news/team-news.service', () => ({
  recordTeamNewsImpressions: jest.fn(),
  sendTeamNewsImpressionsBeacon: jest.fn(),
}));

const recordMock = recordTeamNewsImpressions as jest.Mock;
const beaconMock = sendTeamNewsImpressionsBeacon as jest.Mock;

describe('useTeamNewsImpressions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    recordMock.mockReset().mockResolvedValue(undefined);
    beaconMock.mockReset().mockReturnValue(true);
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('flushes a queued uid after the 1000ms window, batched', () => {
    const { result } = renderHook(() => useTeamNewsImpressions());

    act(() => {
      result.current.recordVisible('n-1');
      result.current.recordVisible('n-2');
    });
    expect(recordMock).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(recordMock).toHaveBeenCalledTimes(1);
    expect(recordMock).toHaveBeenCalledWith(['n-1', 'n-2']);
  });

  it('dedupes: the same uid reported twice only records once', () => {
    const { result } = renderHook(() => useTeamNewsImpressions());

    act(() => {
      result.current.recordVisible('n-1');
      result.current.recordVisible('n-1');
      jest.advanceTimersByTime(1000);
    });

    expect(recordMock).toHaveBeenCalledWith(['n-1']);
  });

  it('flushes immediately once the queue hits the size threshold, without waiting for the timer', () => {
    const { result } = renderHook(() => useTeamNewsImpressions());
    const uids = Array.from({ length: 50 }, (_, i) => `n-${i}`);

    act(() => {
      uids.forEach((uid) => result.current.recordVisible(uid));
    });

    expect(recordMock).toHaveBeenCalledTimes(1);
    expect(recordMock).toHaveBeenCalledWith(uids);
  });

  it('does not reset the flush timer on each new arrival — a burst within the window still flushes on schedule', () => {
    const { result } = renderHook(() => useTeamNewsImpressions());

    act(() => {
      result.current.recordVisible('n-1');
    });
    act(() => {
      jest.advanceTimersByTime(600);
      result.current.recordVisible('n-2'); // arrives before the window closes
    });
    act(() => {
      jest.advanceTimersByTime(400); // window closes 1000ms after the first arrival, not the second
    });

    expect(recordMock).toHaveBeenCalledWith(['n-1', 'n-2']);
  });

  it('starts a fresh window after a flush — a later visible card is not silently dropped', () => {
    const { result } = renderHook(() => useTeamNewsImpressions());

    act(() => {
      result.current.recordVisible('n-1');
      jest.advanceTimersByTime(1000);
    });
    expect(recordMock).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.recordVisible('n-2');
      jest.advanceTimersByTime(1000);
    });
    expect(recordMock).toHaveBeenCalledTimes(2);
    expect(recordMock).toHaveBeenLastCalledWith(['n-2']);
  });

  it('flushes via sendBeacon when the tab becomes hidden, and drops the queue on success', () => {
    const { result } = renderHook(() => useTeamNewsImpressions());

    act(() => {
      result.current.recordVisible('n-1');
    });

    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(beaconMock).toHaveBeenCalledWith(['n-1']);
    // The regular timed flush must not also fire for the same uid.
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(recordMock).not.toHaveBeenCalled();
  });

  it('flushes via sendBeacon on unmount as a last resort', () => {
    const { result, unmount } = renderHook(() => useTeamNewsImpressions());

    act(() => {
      result.current.recordVisible('n-1');
    });
    unmount();

    expect(beaconMock).toHaveBeenCalledWith(['n-1']);
  });

  it('does nothing on unmount when the queue is already empty', () => {
    const { unmount } = renderHook(() => useTeamNewsImpressions());
    unmount();
    expect(beaconMock).not.toHaveBeenCalled();
  });

  describe('viewedUids — what the surface shows back', () => {
    it('starts empty and reports each uid it records', () => {
      const { result } = renderHook(() => useTeamNewsImpressions());

      expect(result.current.viewedUids.size).toBe(0);

      act(() => {
        result.current.recordVisible('n-1');
        result.current.recordVisible('n-2');
      });

      expect([...result.current.viewedUids]).toEqual(['n-1', 'n-2']);
    });

    it('reports exactly what was queued — the same uid twice is one view', () => {
      const { result } = renderHook(() => useTeamNewsImpressions());

      act(() => {
        result.current.recordVisible('n-1');
        result.current.recordVisible('n-1');
      });
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // The mirror and the POST have to agree, or the count on screen claims
      // something the server was never told.
      expect([...result.current.viewedUids]).toEqual(['n-1']);
      expect(recordMock).toHaveBeenCalledWith(['n-1']);
    });

    it('keeps recordVisible identity stable while recording', () => {
      const { result } = renderHook(() => useTeamNewsImpressions());
      const before = result.current.recordVisible;

      act(() => {
        result.current.recordVisible('n-1');
      });

      // Load-bearing. `useCardVisibilityTracking` lists this callback in its
      // effect deps, so a new identity here would tear down and rebuild EVERY
      // card's observer every time ANY card was seen — which is what would
      // happen if the dedup set became state that recordVisible had to read.
      expect(result.current.recordVisible).toBe(before);
    });

    it('hands back a new set only when something was actually recorded', () => {
      const { result } = renderHook(() => useTeamNewsImpressions());

      act(() => {
        result.current.recordVisible('n-1');
      });
      const afterFirst = result.current.viewedUids;

      act(() => {
        result.current.recordVisible('n-1'); // already seen
      });

      // Identity preserved on a no-op, so the feed's useMemo chain doesn't
      // recompute for a repeat sighting that changes nothing.
      expect(result.current.viewedUids).toBe(afterFirst);
    });
  });
});
