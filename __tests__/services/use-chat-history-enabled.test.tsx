import React from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider, QueryObserver } from '@tanstack/react-query';

/* The global mock in `jest.setup.js` replaces `useQuery` wholesale, which would
   skip the very validation under test here. This file needs the real thing. */
jest.unmock('@tanstack/react-query');
jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));

jest.mock('@/utils/third-party.helper', () => ({ getCookiesFromClient: () => ({ authToken: null }) }));
jest.mock('@/services/husky.service', () => ({ getHuskyHistory: jest.fn().mockResolvedValue([]) }));

import { useChatHistory } from '@/services/search/hooks/useChatHistory';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

/**
 * Regression: clicking the navbar search icon while signed out crashed the app
 * with `Expected enabled to be a boolean or a callback that returns a boolean`.
 *
 * `AiSearchHistorySection` passes `isLoggedIn` straight into `enabled`, and for
 * a signed-out visitor that value was `''` — `getParsedValue` answers `''` for
 * an absent header. React Query v5 validates `enabled` and throws, so a falsy
 * non-boolean took down the whole tree instead of simply not fetching.
 *
 * The real fix is the coercion in `getCookiesFromHeaders`; this pins the hook
 * so a differently-sourced value can never crash the dialog again.
 */
describe('useChatHistory enabled validation', () => {
  it('throws for a raw empty string, proving the hazard is real', () => {
    // Guards the test itself: if React Query ever stops validating this, the
    // test below would start passing for the wrong reason.
    const client = new QueryClient();
    // `QueryObserver.setOptions` is where the reported crash came from.
    expect(() => new QueryObserver(client, { queryKey: ['probe'], enabled: '' } as never)).toThrow(/enabled/i);
    expect(() => new QueryObserver(client, { queryKey: ['probe'], enabled: false })).not.toThrow();
  });

  it('does not throw when handed the signed-out empty string', () => {
    expect(() => renderHook(() => useChatHistory({ enabled: '' as unknown as boolean }), { wrapper })).not.toThrow();
  });

  it('does not fetch when signed out', () => {
    const { result } = renderHook(() => useChatHistory({ enabled: '' as unknown as boolean }), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('still fetches for a signed-in member', () => {
    const { result } = renderHook(() => useChatHistory({ enabled: true }), { wrapper });

    expect(result.current.fetchStatus).not.toBe('idle');
  });
});
