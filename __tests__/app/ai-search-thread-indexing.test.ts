/**
 * LAB-3457: `/ai-search/<threadId>` is a private chat (or a guest's shared link): noindex. `/ai-search` itself keeps
 * its title and stays indexable.
 */
jest.mock('@/services/husky.service', () => ({ getHuskyThreadById: jest.fn() }));
jest.mock('@/utils/next-helpers', () => ({ getCookiesFromHeaders: jest.fn() }));
jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('@/components/page/husky/Chat', () => ({ Chat: () => null }));
jest.mock('@/components/page/husky/AiSearchThreadBody/AiSearchThreadBody', () => ({ AiSearchThreadBody: () => null }));
jest.mock('@/components/page/husky/AppSidebar', () => ({ AppSidebar: () => null }));
jest.mock('@/components/page/husky/SidebarProvider', () => ({ SidebarProvider: () => null }));

import { metadata as threadMetadata } from '@/app/ai-search/[id]/page';
import { metadata as layoutMetadata } from '@/app/ai-search/layout';

describe('LAB-3457: AI search thread pages are not indexed', () => {
  it('a thread page asks robots not to index or follow it, and keeps the layout title', () => {
    expect(threadMetadata.robots).toEqual({ index: false, follow: false });
    expect(threadMetadata.title).toBeUndefined();
  });

  it('/ai-search keeps its title and sets no noindex', () => {
    expect(layoutMetadata.title).toBe('AI Search | Protocol Labs Directory');
    expect(layoutMetadata.robots).toBeUndefined();
  });
});
