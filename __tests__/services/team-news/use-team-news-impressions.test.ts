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
});
