import { act, renderHook } from '@testing-library/react';

import { useAnchorFeedComment } from '@/components/page/home/TeamNews/hooks/useAnchorFeedComment';
import { scrollToFeedComment } from '@/components/page/home/TeamNews/utils/feedCommentAnchor';

jest.mock('@/components/page/home/TeamNews/utils/feedCommentAnchor', () => {
  const actual = jest.requireActual('@/components/page/home/TeamNews/utils/feedCommentAnchor');
  return {
    ...actual,
    scrollToFeedComment: jest.fn(),
  };
});

const scrollToFeedCommentMock = scrollToFeedComment as jest.Mock;

describe('useAnchorFeedComment', () => {
  beforeEach(() => {
    scrollToFeedCommentMock.mockReset();
    scrollToFeedCommentMock.mockReturnValue(true);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('scrolls once per comment uid after ready (modal)', () => {
    const { rerender } = renderHook(
      ({ ready }: { ready: boolean }) =>
        useAnchorFeedComment({ enabled: true, commentUid: 'c-1', ready }),
      { initialProps: { ready: false } },
    );

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(scrollToFeedCommentMock).not.toHaveBeenCalled();

    rerender({ ready: true });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(scrollToFeedCommentMock).toHaveBeenCalledTimes(1);
    expect(scrollToFeedCommentMock).toHaveBeenCalledWith('c-1');

    rerender({ ready: true });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(scrollToFeedCommentMock).toHaveBeenCalledTimes(1);
  });

  it('does not scroll in card mode (enabled=false)', () => {
    renderHook(() => useAnchorFeedComment({ enabled: false, commentUid: 'c-1', ready: true }));
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(scrollToFeedCommentMock).not.toHaveBeenCalled();
  });

  it('does not lock the uid when the row is missing (no-op)', () => {
    scrollToFeedCommentMock.mockReturnValue(false);

    const { rerender } = renderHook(
      ({ ready }: { ready: boolean }) =>
        useAnchorFeedComment({ enabled: true, commentUid: 'c-missing', ready }),
      { initialProps: { ready: true } },
    );

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(scrollToFeedCommentMock).toHaveBeenCalledTimes(1);

    scrollToFeedCommentMock.mockReturnValue(true);
    rerender({ ready: false });
    rerender({ ready: true });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(scrollToFeedCommentMock).toHaveBeenCalledTimes(2);
  });
});
