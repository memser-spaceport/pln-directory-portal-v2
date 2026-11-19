'use client';

import clsx from 'clsx';
import dynamic from 'next/dynamic';
import Link from 'next/link';

import { useDigestAnalytics } from '@/analytics/digest.analytics';
import type { DigestForumPost } from '@/services/digest/digest.types';

import { useDigestForumModal } from './useDigestForumModal';

import ev from './DigestEvents.module.scss';
import s from './DigestForum.module.scss';

/** Loaded on the first open, as Home does with its feed modals, so readers who never open one don't ship it. */
const ForumPostModal = dynamic(
  () =>
    import('@/components/page/home/TeamNews/components/ForumPostModal/ForumPostModal').then((m) => m.ForumPostModal),
  { ssr: false },
);

type Props = {
  posts: DigestForumPost[];
  /** Undefined until the auth store hydrates. */
  signedIn: boolean | undefined;
};

const replies = (count: number) => `${count} ${count === 1 ? 'reply' : 'replies'}`;

/**
 * "From the forum" (LAB-3293, the digest-web prototype's DigestForum): the email's top threads of the week, numbered,
 * each with "N replies", then "Open the forum". Built on the Upcoming events section's head, list and rows. A row
 * opens Home's forum post modal (the full post, likes, comments) for a signed-in member with forum access; otherwise,
 * or for a thread the member's feed doesn't have, it links to the thread in the forum. Each row keeps `post-<tid>`,
 * so links from older emails still land on it.
 */
export function DigestForum({ posts, signedIn }: Props) {
  const analytics = useDigestAnalytics();
  const modal = useDigestForumModal(signedIn);

  return (
    <section className={ev.section} aria-labelledby="digest-forum-title">
      <div className={ev.head}>
        <h2 id="digest-forum-title" className={ev.title}>
          From the forum
        </h2>
        <p className={ev.subtitle}>Top threads from the past week.</p>
      </div>

      <ol className={ev.list}>
        {posts.map((post, position) => {
          const feedPost = modal.feedPostFor(post.tid);
          const content = (
            <>
              <span className={s.num}>{position + 1}.</span>
              <span className={clsx(ev.name, s.title)}>{post.title}</span>
              <span className={s.replies}>{replies(post.replyCount)}</span>
            </>
          );
          return (
            <li key={post.tid} id={`post-${post.tid}`} className={s.item}>
              {feedPost ? (
                <button
                  type="button"
                  className={clsx(ev.row, s.row)}
                  data-post-uid={feedPost.uid}
                  onClick={() => {
                    analytics.onForumThreadClicked({ topicId: post.tid, position, opens: 'modal' });
                    modal.open(feedPost);
                  }}
                >
                  {content}
                </button>
              ) : (
                <a
                  href={post.url}
                  className={clsx(ev.row, s.row)}
                  onClick={() => analytics.onForumThreadClicked({ topicId: post.tid, position, opens: 'forum' })}
                >
                  {content}
                </a>
              )}
            </li>
          );
        })}
      </ol>

      <Link href="/forum" className={s.open} onClick={() => analytics.onForumOpenClicked()}>
        Open the forum →
      </Link>

      {modal.openPost && (
        <ForumPostModal
          post={modal.openPost}
          isOwnPost={modal.isOwnPost}
          onClose={modal.close}
          onLikeToggle={modal.toggleLike}
        />
      )}
    </section>
  );
}
