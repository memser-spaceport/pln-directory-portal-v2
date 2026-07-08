import { computeMockSuggestions, type CandidateTeam } from '@/services/follow/suggested-teams.mock-data';
import type { ITeamNewsItem } from '@/types/team-news.types';

const newsItem = (
  partial: Partial<ITeamNewsItem> & Pick<ITeamNewsItem, 'uid' | 'teamUid' | 'focusAreas'>,
): ITeamNewsItem => ({
  teamName: 'Team',
  teamLogoUrl: null,
  eventType: 'ANNOUNCEMENT',
  eventDate: '2026-07-07T00:00:00.000Z',
  title: 'Story',
  summary: null,
  sourceUrl: 'https://example.com',
  sourceDomain: 'example.com',
  tags: [],
  subFocusAreas: [],
  createdAt: '2026-07-07T00:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null },
  ...partial,
});

describe('computeMockSuggestions', () => {
  const SEED = '2026-07-08:user-1';

  it('returns [] when there are no candidates', () => {
    expect(computeMockSuggestions([], null, [], [], SEED)).toEqual([]);
  });

  it('excludes already-followed teams', () => {
    const candidates: CandidateTeam[] = [{ id: 'followed-team', name: 'Followed', industryTags: [] }];
    const news = [newsItem({ uid: 'n1', teamUid: 'followed-team', focusAreas: ['AI'] })];
    expect(computeMockSuggestions(candidates, null, ['followed-team'], news, SEED)).toEqual([]);
  });

  it("excludes the member's own team", () => {
    const candidates: CandidateTeam[] = [{ id: 'my-team', name: 'My Team', industryTags: [] }];
    const news = [newsItem({ uid: 'n1', teamUid: 'my-team', focusAreas: ['AI'] })];
    expect(computeMockSuggestions(candidates, 'my-team', [], news, SEED)).toEqual([]);
  });

  it('excludes candidates with no recent news', () => {
    const candidates: CandidateTeam[] = [{ id: 'quiet-team', name: 'Quiet Team', industryTags: [] }];
    expect(computeMockSuggestions(candidates, null, [], [], SEED)).toEqual([]);
  });

  it('suggests a candidate sharing a focus area with a followed team, with reasonType focus-area', () => {
    const candidates: CandidateTeam[] = [{ id: 'candidate', name: 'Candidate Team', industryTags: [] }];
    const news = [
      newsItem({ uid: 'n1', teamUid: 'followed-team', focusAreas: ['Storage'] }),
      newsItem({ uid: 'n2', teamUid: 'candidate', focusAreas: ['Storage'] }),
    ];
    const result = computeMockSuggestions(candidates, null, ['followed-team'], news, SEED);
    expect(result).toEqual([
      { uid: 'candidate', name: 'Candidate Team', logoUrl: null, reason: 'Storage', reasonType: 'focus-area' },
    ]);
  });

  it('falls back to a shared industry tag when there is no shared focus area', () => {
    const sharedTag = { uid: 'tag-defi', title: 'DeFi' };
    const candidates: CandidateTeam[] = [
      { id: 'followed-team', name: 'Followed', industryTags: [sharedTag] },
      { id: 'candidate', name: 'Candidate Team', industryTags: [sharedTag] },
    ];
    const news = [
      newsItem({ uid: 'n1', teamUid: 'followed-team', focusAreas: ['Storage'] }),
      newsItem({ uid: 'n2', teamUid: 'candidate', focusAreas: ['Networking'] }),
    ];
    const result = computeMockSuggestions(candidates, null, ['followed-team'], news, SEED);
    expect(result).toEqual([
      { uid: 'candidate', name: 'Candidate Team', logoUrl: null, reason: 'DeFi', reasonType: 'industry-tag' },
    ]);
  });

  it('excludes candidates with no shared focus area or industry tag', () => {
    const candidates: CandidateTeam[] = [
      { id: 'followed-team', name: 'Followed', industryTags: [{ uid: 'tag-a', title: 'A' }] },
      { id: 'candidate', name: 'Candidate Team', industryTags: [{ uid: 'tag-b', title: 'B' }] },
    ];
    const news = [
      newsItem({ uid: 'n1', teamUid: 'followed-team', focusAreas: ['Storage'] }),
      newsItem({ uid: 'n2', teamUid: 'candidate', focusAreas: ['Networking'] }),
    ];
    expect(computeMockSuggestions(candidates, null, ['followed-team'], news, SEED)).toEqual([]);
  });

  it('produces the same order for the same seed (stable within a day)', () => {
    const candidates: CandidateTeam[] = [
      { id: 'a', name: 'A', industryTags: [] },
      { id: 'b', name: 'B', industryTags: [] },
      { id: 'c', name: 'C', industryTags: [] },
    ];
    const news = [
      newsItem({ uid: 'n1', teamUid: 'followed-team', focusAreas: ['Storage'] }),
      newsItem({ uid: 'n2', teamUid: 'a', focusAreas: ['Storage'] }),
      newsItem({ uid: 'n3', teamUid: 'b', focusAreas: ['Storage'] }),
      newsItem({ uid: 'n4', teamUid: 'c', focusAreas: ['Storage'] }),
    ];
    const first = computeMockSuggestions(candidates, null, ['followed-team'], news, SEED).map((t) => t.uid);
    const second = computeMockSuggestions(candidates, null, ['followed-team'], news, SEED).map((t) => t.uid);
    expect(first).toEqual(second);
  });
});
