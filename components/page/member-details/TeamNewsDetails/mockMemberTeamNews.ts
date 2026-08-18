import type { ITeamNewsByTeamResponse, ITeamNewsItem } from '@/types/team-news.types';

/**
 * Dev-only: render the card with fixture stories when the dev API has none.
 *
 * Flip to `true` locally to see the card on any profile whose member has a
 * primary team, then flip back before committing. A code-level constant rather
 * than an env var because this card fetches CLIENT-side: `MOCK_TEAM_NEWS`
 * (services/team-news.service.ts) is absent from next.config.mjs's `env` block,
 * so `process.env` reads for it are `undefined` in the browser. Same shape as
 * SHOW_TEAM_NEWS_COUNT_CHIP / SHOW_HIRING_NEWS, which exist because this repo
 * has no runtime flag system.
 *
 * Gates the WORK, not the render: useMemberTeamNews disables the query entirely
 * when this is on, so no request is made and nothing can overwrite the fixture.
 */
export const MOCK_MEMBER_TEAM_NEWS = false;

const daysAgo = (days: number): string => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

function mockItem(partial: Pick<ITeamNewsItem, 'uid' | 'title' | 'eventType' | 'eventDate'> & Partial<ITeamNewsItem>) {
  return {
    teamUid: 'mock-team',
    teamName: 'Mock Team',
    teamLogoUrl: null,
    summary: null,
    sourceUrl: 'https://example.com',
    sourceDomain: 'example.com',
    tags: [],
    focusAreas: [],
    subFocusAreas: [],
    createdAt: partial.eventDate,
    discussion: { count: 0, latestTopicUrl: null },
    upvoteCount: 0,
    viewerHasUpvoted: false,
    ...partial,
  } as ITeamNewsItem;
}

/**
 * Four stories against a three-row card, so the slice is visible while mocking.
 * The last one is deliberately months old — the card applies no time window, and
 * that decision should be visible rather than inferred.
 */
export function buildMockMemberTeamNews(teamUid: string, teamName: string): ITeamNewsByTeamResponse {
  const items: ITeamNewsItem[] = [
    mockItem({
      uid: 'mock-news-1',
      title: `${teamName} closes a $12M round to scale decentralized storage`,
      eventType: 'FUNDING',
      eventDate: daysAgo(2),
      summary: 'Led by an existing investor, with participation from the network.',
      contentHtml: '<p>A mock story body, rendered by the detail modal.</p>',
      upvoteCount: 8,
      viewCount: 142,
    }),
    mockItem({
      uid: 'mock-news-2',
      title: 'New storage provider tier ships to mainnet',
      eventType: 'LAUNCH',
      eventDate: daysAgo(9),
      summary: 'Lower minimums and a faster onboarding path for new providers.',
      upvoteCount: 3,
      viewCount: 61,
    }),
    mockItem({
      uid: 'mock-news-3',
      title: 'Partnership announced with a research consortium',
      eventType: 'PARTNERSHIP',
      eventDate: daysAgo(23),
      upvoteCount: 1,
      viewCount: 24,
    }),
    mockItem({
      uid: 'mock-news-4',
      title: 'This fourth story should never render — the card shows three',
      eventType: 'ANNOUNCEMENT',
      eventDate: daysAgo(240),
    }),
  ].map((item) => ({ ...item, teamUid, teamName }));

  return { teamUid, teamName, page: 1, limit: items.length, total: items.length, items };
}
