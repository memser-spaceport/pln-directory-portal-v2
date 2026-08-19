import { isOwnForumPost } from '@/components/page/home/TeamNews/utils/isOwnForumPost';

function post(memberUid: string) {
  return { author: { memberUid, name: 'Author', avatarUrl: null, role: null } };
}

describe('isOwnForumPost', () => {
  it('is true when the author is the signed-in member', () => {
    expect(isOwnForumPost(post('m-1'), 'm-1')).toBe(true);
  });

  it('is false for someone else’s post', () => {
    expect(isOwnForumPost(post('m-2'), 'm-1')).toBe(false);
  });

  it('is false when the post has no author link, even for a signed-out viewer', () => {
    // toFeedForumPost defaults an unlinked NodeBB author to ''. Matching '' to
    // a missing viewer uid would disable Like on every unattributed post.
    expect(isOwnForumPost(post(''), undefined)).toBe(false);
    expect(isOwnForumPost(post(''), null)).toBe(false);
    expect(isOwnForumPost(post(''), '')).toBe(false);
  });

  it('is false while identity is still hydrating', () => {
    expect(isOwnForumPost(post('m-1'), undefined)).toBe(false);
    expect(isOwnForumPost(post('m-1'), null)).toBe(false);
  });

  it('is false for a post whose author link is missing but the viewer is known', () => {
    expect(isOwnForumPost(post(''), 'm-1')).toBe(false);
  });
});
