import { normalizeChatBody } from '@/services/labos-agent/labos-agent.service';
import { sourceLinkKey, visibleWebSources } from '@/services/labos-agent/labos-agent.source-dedupe';

/**
 * LAB-3298 (D2, Oleg's QA): a source showed twice, once as a C1 ref and once as a web source. The panel guard drops
 * the second copy and drops web sources on the app's own origin. Jest runs on `http://localhost`.
 */
describe('LAB-3298 D2: sources show once', () => {
  it('drops a news web source on the app origin that the news ref already lists', () => {
    const refs = [{ type: 'news', title: 'A story', directoryLink: '/?news=n-1' }];
    expect(visibleWebSources(['http://localhost/?news=n-1'], refs)).toEqual([]);
  });

  it('drops any web source on the app origin, with or without www', () => {
    expect(visibleWebSources(['http://localhost/teams/t-1', 'http://www.localhost/members/m-1'], [])).toEqual([]);
  });

  it('drops a web source that a team ref already lists as externalUrl (www and trailing slash do not matter)', () => {
    const refs = [{ type: 'team', title: 'Textile', directoryLink: '/teams/t-1', externalUrl: 'https://textile.io' }];
    expect(visibleWebSources(['https://www.textile.io/', 'https://example.com/other'], refs)).toEqual([
      'https://example.com/other',
    ]);
  });

  it('keeps one copy of a web source that comes twice, and keeps the order', () => {
    expect(
      visibleWebSources(
        ['https://b.example/x', 'https://a.example/y/', 'https://b.example/x#top', 'https://a.example/y'],
        [],
      ),
    ).toEqual(['https://b.example/x', 'https://a.example/y/']);
  });

  it('keeps pages that differ in the query, and drops values that are not http(s) links', () => {
    expect(
      visibleWebSources(['https://a.example/?p=1', 'https://a.example/?p=2', 'javascript:alert(1)', ''], []),
    ).toEqual(['https://a.example/?p=1', 'https://a.example/?p=2']);
  });

  it('sourceLinkKey compares a full URL and a relative path on the app origin as the same page', () => {
    expect(sourceLinkKey('http://localhost/?news=n-1')).toBe(sourceLinkKey('/?news=n-1'));
    expect(sourceLinkKey('https://www.Textile.io/blog/')).toBe(sourceLinkKey('https://textile.io/blog'));
    expect(sourceLinkKey('//evil.example/x')).not.toBe(sourceLinkKey('/x'));
  });

  it('normalizeChatBody applies the guard to the C1 body', () => {
    const body = normalizeChatBody({
      content: 'An answer.',
      sources: ['http://localhost/?news=n-1', 'https://textile.io/', 'https://example.com/page'],
      sourceRefs: [
        { type: 'news', title: 'A story', directoryLink: '/?news=n-1' },
        { type: 'team', title: 'Textile', directoryLink: '/teams/t-1', externalUrl: 'https://www.textile.io' },
      ],
    });
    expect(body.sources).toEqual(['https://example.com/page']);
    expect(body.sourceRefs).toHaveLength(2);
  });
});
