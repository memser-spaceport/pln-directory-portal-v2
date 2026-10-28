import type { ITeamNewsGroupedResponse, ITeamNewsItem } from '@/types/team-news.types';
import { buildNewsPromptQuestion, NEWS_PROMPT_COUNT, selectNewsPrompts } from '@/services/team-news/newsPrompts';

const item = (uid: string, overrides: Partial<ITeamNewsItem> = {}): ITeamNewsItem =>
  ({
    uid,
    teamUid: `team-${uid}`,
    teamName: `Team ${uid}`,
    teamLogoUrl: null,
    eventType: 'LAUNCH',
    eventDate: '2026-10-01T00:00:00.000Z',
    title: `Story ${uid}`,
    summary: null,
    sourceUrl: `https://example.com/${uid}`,
    sourceDomain: 'example.com',
    tags: [],
    focusAreas: [],
    subFocusAreas: [],
    createdAt: '2026-10-01T00:00:00.000Z',
    discussion: null,
    editorialRank: null,
    ...overrides,
  }) as unknown as ITeamNewsItem;

const response = (items: ITeamNewsItem[], extra: ITeamNewsItem[] = []): ITeamNewsGroupedResponse => ({
  windowDays: 14,
  generatedAt: '2026-10-28T00:00:00.000Z',
  groups: [{ focusArea: {} as any, total: items.length, items }],
  allTabExtraItems: extra,
});

describe('selectNewsPrompts', () => {
  it('puts the Top Stories picks first, in editorial order', () => {
    const prompts = selectNewsPrompts(
      response([
        item('a', { eventDate: '2026-10-27T00:00:00.000Z' }),
        item('b', { editorialRank: 2 }),
        item('c', { editorialRank: 1 }),
      ]),
    );

    expect(prompts.map((p) => p.uid)).toEqual(['c', 'b', 'a']);
  });

  it('fills the rest with the newest stories, from every group and the extra items', () => {
    const prompts = selectNewsPrompts(
      response(
        [
          item('old', { eventDate: '2026-10-01T00:00:00.000Z' }),
          item('new', { eventDate: '2026-10-20T00:00:00.000Z' }),
        ],
        [item('newest', { eventDate: '2026-10-25T00:00:00.000Z' })],
      ),
    );

    expect(prompts.map((p) => p.uid)).toEqual(['newest', 'new', 'old']);
  });

  it(`shows at most ${NEWS_PROMPT_COUNT} prompts and each story once`, () => {
    const shared = item('shared', { editorialRank: 1 });
    const prompts = selectNewsPrompts(response([shared, item('a'), item('b'), item('c'), item('d')], [shared]));

    expect(prompts).toHaveLength(NEWS_PROMPT_COUNT);
    expect(prompts.filter((p) => p.uid === 'shared')).toHaveLength(1);
  });

  it('skips stories without a title', () => {
    const prompts = selectNewsPrompts(response([item('a', { title: '   ' }), item('b')]));

    expect(prompts.map((p) => p.uid)).toEqual(['b']);
  });

  it('returns no prompts when there is no news or the request failed', () => {
    expect(selectNewsPrompts(null)).toEqual([]);
    expect(selectNewsPrompts(response([]))).toEqual([]);
    expect(selectNewsPrompts({} as ITeamNewsGroupedResponse)).toEqual([]);
  });

  it('builds the prompt as a question about the story', () => {
    const [prompt] = selectNewsPrompts(
      response([item('a', { teamName: 'Saturn Grid', title: 'Saturn Grid ships v2' })]),
    );

    expect(prompt.question).toBe(buildNewsPromptQuestion({ teamName: 'Saturn Grid', title: 'Saturn Grid ships v2' }));
    expect(prompt.question).toBe('What is the news from Saturn Grid: "Saturn Grid ships v2"?');
  });
});
