/**
 * @jest-environment node
 */
/**
 * LAB-3091: /forum answered a temporary redirect, had no title, canonical or h1, and its server HTML was five copies
 * of a made-up post. The forum is for signed-in members, so the listing is noindex and answers at its own address.
 */
const mockRedirect = jest.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`);
});
jest.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
  RedirectType: { replace: 'replace' },
}));
const mockCookies = jest.fn();
jest.mock('@/utils/next-helpers', () => ({ getCookiesFromHeaders: async () => mockCookies() }));
jest.mock('@/components/page/forum/LoggedOutView', () => ({ LoggedOutView: () => null }));
jest.mock('@/components/page/forum/Feed', () => ({ Feed: () => null }));
jest.mock('@/components/page/forum/ForumAccessGate/ForumAccessGate', () => ({ ForumAccessGate: () => null }));

import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactElement } from 'react';
import ForumPage from '@/app/forum/page';
import { metadata } from '@/app/forum/layout';

const props = (searchParams: Record<string, string>) => ({ searchParams: Promise.resolve(searchParams) });

beforeEach(() => {
  mockRedirect.mockClear();
});

describe('/forum', () => {
  it('is noindex, follow, with a title of its own', () => {
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.title).toBe('Forum | Protocol Labs Directory');
  });

  it('answers a signed-out visitor at /forum itself, with one h1', async () => {
    mockCookies.mockReturnValue({ isLoggedIn: false });

    const html = renderToStaticMarkup((await ForumPage(props({}))) as ReactElement);

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain('Protocol Labs Forum');
  });

  it('still sends a signed-in member to the first category, which the feed reads', async () => {
    mockCookies.mockReturnValue({ isLoggedIn: true });

    await expect(ForumPage(props({}))).rejects.toThrow('NEXT_REDIRECT /forum?cid=0');
  });
});
