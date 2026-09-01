/**
 * `jest.setup.js` replaces `useQuery` globally with a stub that returns a frozen
 * object and validates nothing. That stub is why this bug reached a browser: the
 * real `QueryObserver` rejects an `enabled` that is not a boolean, and no test in
 * the suite was ever running it. Unmocked here on purpose — the assertion IS that
 * react-query accepts what this hook hands it.
 */
jest.unmock('@tanstack/react-query');

import React from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useJobBoardViewer } from '@/components/page/jobs/hooks/useJobBoardViewer';
import type { IUserInfo } from '@/types/shared.types';

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

const render = (isLoggedIn: unknown, userInfo?: IUserInfo) =>
  renderHook(
    () => useJobBoardViewer({ isLoggedIn: isLoggedIn as boolean, userInfo, enabled: true }),
    { wrapper },
  );

describe('useJobBoardViewer feeding react-query', () => {
  /**
   * The shape that crashed `/teams/[id]` for logged-out visitors.
   *
   * `isLoggedIn` is typed `boolean` on the way in, but every caller sources it
   * from `getCookiesFromHeaders()`, which parses a header and is typed `any` —
   * logged out it is an empty string. `'' && memberUid` is `''`, not `false`,
   * and `useMemberExperience` defaults with `??`, which does not catch `''`.
   */
  it('survives an isLoggedIn that is falsy but not a boolean', () => {
    expect(() => render('')).not.toThrow();
  });

  it('survives the other shapes a parsed header can take', () => {
    expect(() => render(undefined)).not.toThrow();
    expect(() => render(0)).not.toThrow();
    expect(() => render(null)).not.toThrow();
  });

  it('still reads a genuine logged-out visitor as logged-out', () => {
    const { result } = render('');

    expect(result.current.viewer).toBe('logged-out');
    expect(result.current.memberUid).toBeUndefined();
  });

  it('does not break the signed-in path it guards', () => {
    const { result } = render(true, { uid: 'm1', name: 'Ada' } as IUserInfo);

    expect(result.current.memberUid).toBe('m1');
  });
});
