import { topicReplies } from '@/services/forum/topicReplies';

describe('topicReplies', () => {
  it('splits off the opening post and leaves out deleted replies', () => {
    const { mainPost, replies } = topicReplies({
      postcount: 4,
      posts: [{ pid: 1 }, { pid: 2 }, { pid: 3, deleted: 1 }, { pid: 4, deleted: true }],
    });

    expect(mainPost).toEqual({ pid: 1 });
    expect(replies.map((post) => post.pid)).toEqual([2]);
  });

  it('takes the deleted replies on the page off the count: NodeBB’s postcount keeps soft-deleted posts', () => {
    // LAB-3145: Roman deleted pid 18 through an agent; the thread kept saying 7 replies over 6
    expect(topicReplies({ postcount: 4, posts: [{ pid: 1 }, { pid: 2 }, { pid: 3, deleted: 1 }] }).replyCount).toBe(2);
  });

  it('keeps the replies NodeBB did not send in the count, for a thread longer than one page', () => {
    expect(topicReplies({ postcount: 51, posts: [{ pid: 1 }, { pid: 2 }, { pid: 3, deleted: 0 }] }).replyCount).toBe(
      50,
    );
  });

  it('answers an empty thread for a topic that has not loaded', () => {
    expect(topicReplies(undefined)).toEqual({ mainPost: undefined, replies: [], replyCount: 0 });
    expect(topicReplies({ postcount: 1, posts: null })).toEqual({ mainPost: undefined, replies: [], replyCount: 0 });
  });
});
