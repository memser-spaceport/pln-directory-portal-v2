import { resolveForumPostLike } from '@/components/page/home/TeamNews/utils/resolveForumPostLike';

/** Only the like fields matter here; the rest of the post rides along. */
const post = { uid: 'fp_96', likeCount: 5, viewerHasLiked: false, title: 'Willow Is Live!' };

describe('resolveForumPostLike', () => {
  it('falls back to the post’s own fields when nothing better is known', () => {
    expect(resolveForumPostLike(post, undefined, undefined)).toEqual(post);
  });

  it('takes the topic’s state over the listing’s blind default', () => {
    // /api/recent can't say whether the viewer liked it; the topic can.
    const resolved = resolveForumPostLike(post, { likeCount: 7, viewerHasLiked: true }, undefined);

    expect(resolved).toEqual(expect.objectContaining({ likeCount: 7, viewerHasLiked: true }));
  });

  it('takes the viewer’s own toggle over the topic — it is newer than any fetch', () => {
    const resolved = resolveForumPostLike(
      post,
      { likeCount: 7, viewerHasLiked: true },
      { likeCount: 6, viewerHasLiked: false },
    );

    expect(resolved).toEqual(expect.objectContaining({ likeCount: 6, viewerHasLiked: false }));
  });

  it('keeps every other field on the post untouched', () => {
    const resolved = resolveForumPostLike(post, { likeCount: 7, viewerHasLiked: true }, undefined);

    expect(resolved.title).toBe('Willow Is Live!');
    expect(resolved.uid).toBe('fp_96');
  });

  it('does not mutate the post it was given', () => {
    resolveForumPostLike(post, { likeCount: 7, viewerHasLiked: true }, undefined);

    expect(post.likeCount).toBe(5);
    expect(post.viewerHasLiked).toBe(false);
  });
});
