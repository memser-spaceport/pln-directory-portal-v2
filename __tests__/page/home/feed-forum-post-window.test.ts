import type { ForumPostUid, IFeedForumPost } from '@/types/feed.types';
import {
  feedWindowCutoffIso,
  withinFeedWindow,
  createdWithinWindow,
} from '@/components/page/home/TeamNews/utils/feedForumPostWindow';

const NOW = Date.parse('2026-07-31T12:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number): string {
  return new Date(NOW - days * DAY).toISOString();
}

function post(uid: string, createdAt: string, lastActivityAt = createdAt): IFeedForumPost {
  return {
    uid: uid as ForumPostUid,
    tid: 1,
    mainPid: 10,
    title: `Post ${uid}`,
    body: 'Body',
    author: { memberUid: 'm1', name: 'Mira Chen', avatarUrl: null, role: null },
    focusAreas: [],
    category: 'Compute',
    createdAt,
    lastActivityAt,
    forumTopicUrl: null,
    commentCount: 0,
    likeCount: 0,
    viewCount: 0,
    viewerHasLiked: false,
  };
}

describe('feedWindowCutoffIso', () => {
  it('is exactly N days before the supplied instant', () => {
    expect(feedWindowCutoffIso(14, NOW)).toBe('2026-07-17T12:00:00.000Z');
  });
});

describe('withinFeedWindow', () => {
  const cutoff = feedWindowCutoffIso(14, NOW);

  it('keeps a recently created topic', () => {
    expect(withinFeedWindow([post('fp_1', daysAgo(2))], cutoff)).toHaveLength(1);
  });

  it('drops a topic whose last activity predates the window', () => {
    expect(withinFeedWindow([post('fp_1', daysAgo(40))], cutoff)).toEqual([]);
  });

  // The reason the window measures lastActivityAt at all: /api/recent surfaces
  // this topic BECAUSE it is being discussed, so creation date must not evict it.
  it('keeps an old topic that was replied to inside the window', () => {
    const revived = post('fp_1', daysAgo(40), daysAgo(2));

    expect(withinFeedWindow([revived], cutoff)).toEqual([revived]);
  });

  it('includes a post sitting exactly on the boundary', () => {
    expect(withinFeedWindow([post('fp_1', cutoff)], cutoff)).toHaveLength(1);
  });

  it('excludes a post one millisecond older than the boundary', () => {
    const justOutside = new Date(Date.parse(cutoff) - 1).toISOString();

    expect(withinFeedWindow([post('fp_1', justOutside)], cutoff)).toEqual([]);
  });

  it('preserves the order /api/recent returned', () => {
    const kept = [post('fp_1', daysAgo(1)), post('fp_2', daysAgo(5)), post('fp_3', daysAgo(3))];
    const result = withinFeedWindow([kept[0], post('fp_old', daysAgo(90)), kept[1], kept[2]], cutoff);

    expect(result?.map((p) => p.uid)).toEqual(['fp_1', 'fp_2', 'fp_3']);
  });

  // undefined means "news-only feed" — collapsing it to [] would read as
  // "loaded, and there are none", which drives a different empty state.
  it('passes undefined through rather than returning an empty list', () => {
    expect(withinFeedWindow(undefined, cutoff)).toBeUndefined();
  });
});

describe('createdWithinWindow', () => {
  const cutoff = feedWindowCutoffIso(7, NOW);

  it('keeps a post created inside the window', () => {
    expect(createdWithinWindow([post('fp_1', daysAgo(2))], cutoff)).toHaveLength(1);
  });

  it('drops a post created before the window even if it was replied to inside it', () => {
    const revived = post('fp_1', daysAgo(10), daysAgo(1));

    expect(createdWithinWindow([revived], cutoff)).toEqual([]);
  });

  it('includes a post sitting exactly on the boundary', () => {
    expect(createdWithinWindow([post('fp_1', cutoff)], cutoff)).toHaveLength(1);
  });

  it('passes undefined through rather than returning an empty list', () => {
    expect(createdWithinWindow(undefined, cutoff)).toBeUndefined();
  });
});
