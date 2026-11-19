import { act, renderHook } from '@testing-library/react';

import type { LabosAgentClient, LabosAgentMentionsResponse } from '@/types/labos-agent.types';

const searchMentions = jest.fn();
const client: LabosAgentClient = {
  chat: jest.fn(),
  confirmAction: jest.fn(),
  getAccess: async () => ({ enabled: true }),
  searchMentions,
};

jest.mock('@/services/labos-agent/labos-agent.service', () => ({
  ...jest.requireActual('@/services/labos-agent/labos-agent.service'),
  getLabosAgentClient: () => client,
}));

import { useLabosAgentMentionSearch } from '@/services/labos-agent/hooks/useLabosAgentMentionSearch';

const body = (q: string): LabosAgentMentionsResponse => ({
  q,
  members: [],
  teams: [{ type: 'team', uid: `t-${q}`, name: `Mock ${q}`, logoUrl: null, shortDescription: null }],
  news: [],
});

describe('LAB-3318 S6-F8: the picker search debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    searchMentions.mockReset();
  });
  afterEach(() => jest.useRealTimers());

  it('calls C4 300 ms after the last key: 2 fast queries give 1 call', async () => {
    searchMentions.mockImplementation(async ({ q }) => body(q));
    const { result, rerender } = renderHook(({ q }: { q: string | null }) => useLabosAgentMentionSearch(q), {
      initialProps: { q: 'a' as string | null },
    });
    act(() => jest.advanceTimersByTime(200));
    rerender({ q: 'ad' });
    act(() => jest.advanceTimersByTime(299));
    expect(searchMentions).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(searchMentions).toHaveBeenCalledTimes(1);
    expect(searchMentions.mock.calls[0][0]).toEqual({ q: 'ad' });
    expect(result.current.status).toBe('ready');
    expect(result.current.response?.q).toBe('ad');
  });

  it('shows only the response for the current query', async () => {
    let resolveOld: (v: LabosAgentMentionsResponse) => void = () => {};
    searchMentions
      .mockImplementationOnce(() => new Promise((r) => (resolveOld = r)))
      .mockImplementation(async ({ q }) => body(q));
    const { result, rerender } = renderHook(({ q }: { q: string | null }) => useLabosAgentMentionSearch(q), {
      initialProps: { q: 'a' as string | null },
    });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    rerender({ q: 'ab' });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await act(async () => resolveOld(body('a')));
    expect(result.current.response?.q).toBe('ab');
  });

  it('drops a response whose q is not the current query', async () => {
    searchMentions.mockResolvedValue(body('other'));
    const { result } = renderHook(() => useLabosAgentMentionSearch('mock'));
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current.response).toBeNull();
  });

  it('S6-F16: a failed call gives `error`', async () => {
    searchMentions.mockRejectedValue(new Error('503'));
    const { result } = renderHook(() => useLabosAgentMentionSearch('mock'));
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current.status).toBe('error');
  });

  it('a closed picker (null) makes no call', () => {
    renderHook(() => useLabosAgentMentionSearch(null));
    act(() => jest.advanceTimersByTime(1000));
    expect(searchMentions).not.toHaveBeenCalled();
  });
});
