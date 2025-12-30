import { TopicResponse } from '@/services/forum/hooks/useForumPost';

type Comment = TopicResponse['posts'][0];

export type NestedComment = Comment & { replies: Comment[] };
