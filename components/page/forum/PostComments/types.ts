import { TopicResponse } from '@/services/forum/hooks/useForumPost';

type Comment = TopicResponse['posts'][0];

/**
 * A post plus its nested replies.
 *
 * `replies` is Omit-ed from the NodeBB post first: NodeBB already ships a
 * `replies` field on every post, but it's reply *metadata*
 * (`{count, hasMore, users, …}`), not the replies themselves. Intersecting the
 * two produced a type nothing could satisfy, which is why the nesting code used
 * to be typed as `any`. The nested array is what every consumer actually reads
 * (`item.replies.length`, `item.replies.map`), so it wins the name outright.
 */
export type NestedComment = Omit<Comment, 'replies'> & { replies: NestedComment[] };
