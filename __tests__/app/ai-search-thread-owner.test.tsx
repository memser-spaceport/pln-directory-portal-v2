import type { ReactElement } from 'react';

/**
 * LAB-3457: inside the agent gate, only the member's own AI search thread (under their account) opens on the agent.
 * Another member's shared link and a chat the member started as a guest (`guestId` cookie) keep today's page: the
 * page tells the body which one it is.
 */
const getHuskyThreadById = jest.fn();
const getCookiesFromHeaders = jest.fn();
const guestCookie = jest.fn();
jest.mock('@/services/husky.service', () => ({ getHuskyThreadById: (...a: unknown[]) => getHuskyThreadById(...a) }));
jest.mock('@/utils/next-helpers', () => ({ getCookiesFromHeaders: () => getCookiesFromHeaders() }));
jest.mock('next/headers', () => ({ cookies: async () => ({ get: () => guestCookie() }) }));
jest.mock('next/navigation', () => ({ notFound: jest.fn() }));
jest.mock('@/components/page/husky/Chat', () => ({ Chat: () => null }));
jest.mock('@/components/page/husky/AiSearchThreadBody/AiSearchThreadBody', () => ({ AiSearchThreadBody: () => null }));

import Page from '@/app/ai-search/[id]/page';
import { AiSearchThreadBody } from '@/components/page/husky/AiSearchThreadBody/AiSearchThreadBody';

type BodyProps = { threadId: string; fallback: unknown; ownedByMember: boolean };

async function bodyProps(): Promise<BodyProps> {
  const tree = (await Page({ params: Promise.resolve({ id: 't-1' }) })) as ReactElement<{ children: ReactElement }>;
  const body = tree.props.children as ReactElement<BodyProps>;
  expect(body.type).toBe(AiSearchThreadBody);
  return body.props;
}

beforeEach(() => {
  jest.clearAllMocks();
  getCookiesFromHeaders.mockResolvedValue({ isLoggedIn: true, authToken: 'token' });
  guestCookie.mockReturnValue(undefined);
});

describe('LAB-3457: whose AI search thread it is', () => {
  it('the member’s own thread (isOwner) is theirs: the agent opens it', async () => {
    getHuskyThreadById.mockResolvedValue({ isOwner: true, chats: [], guestUserId: null });
    const props = await bodyProps();
    expect(props.ownedByMember).toBe(true);
    expect(props.fallback).not.toBeNull();
  });

  it('another member’s shared link is not: today’s “Shared by” page', async () => {
    getHuskyThreadById.mockResolvedValue({ isOwner: false, name: 'Ada', chats: [], guestUserId: 'g-other' });
    const props = await bodyProps();
    expect(props.ownedByMember).toBe(false);
    expect(props.fallback).not.toBeNull();
  });

  it('a chat the member started as a guest (guestId cookie) is not under their account: today’s page', async () => {
    guestCookie.mockReturnValue({ value: 'g-me' });
    getHuskyThreadById.mockResolvedValue({ isOwner: false, chats: [], guestUserId: 'g-me' });
    const props = await bodyProps();
    expect(props.ownedByMember).toBe(false);
  });

  it('no AI search thread: no fallback, the agent decides (agent threads)', async () => {
    getHuskyThreadById.mockResolvedValue({ isError: true });
    const props = await bodyProps();
    expect(props.fallback).toBeNull();
    expect(props.ownedByMember).toBe(false);
  });
});
