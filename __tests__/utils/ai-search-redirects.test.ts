import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match';
import { compile } from 'next/dist/compiled/path-to-regexp';
import { AI_SEARCH_REDIRECTS } from '@/utils/ai-search-redirects';

/** Resolves a pathname through the redirect list the way Next.js does: first matching source wins. */
const redirectFor = (pathname: string) => {
  for (const rule of AI_SEARCH_REDIRECTS) {
    const params = getPathMatch(rule.source, { removeUnnamedParams: true })(pathname);
    if (params) {
      return { destination: compile(rule.destination, { validate: false })(params), permanent: rule.permanent };
    }
  }
  return null;
};

describe('LAB-2772: old /husky URLs redirect to /ai-search', () => {
  it.each([
    ['/husky', '/ai-search'],
    ['/husky/chat', '/ai-search'],
    ['/husky/chat/abc-123', '/ai-search/abc-123'],
    ['/husky/anything/else', '/ai-search'],
  ])('%s redirects permanently to %s', (from, to) => {
    expect(redirectFor(from)).toEqual({ destination: to, permanent: true });
  });

  it('leaves the new /ai-search URLs alone', () => {
    expect(redirectFor('/ai-search')).toBeNull();
    expect(redirectFor('/ai-search/abc-123')).toBeNull();
  });
});
