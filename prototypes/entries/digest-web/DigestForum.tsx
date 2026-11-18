'use client';

import ev from './DigestEvents.module.scss';
import { DIGEST_FORUM_POSTS } from './mocks';
import s from './DigestForum.module.scss';

/**
 * "From the forum" (Polina, 2026-11-17, from a reference crop): a numbered list of the
 * week's top threads, title and reply count, then "Open the forum". Replaces the byline +
 * excerpt blocks. Built on the Upcoming events section's head, list and row classes, so the
 * three lower sections (More from the network, Upcoming events, From the forum) read as one
 * system. On the page a row opens Home's forum modal; in the email it links to the forum.
 */
export function DigestForum({
  asEmail,
  id,
  onOpenPost,
  extraReplies,
}: {
  asEmail: boolean;
  id: string;
  onOpenPost: (postId: string) => void;
  /** Replies added on this page (the modal's comments), on top of the thread's count. */
  extraReplies: (postId: string) => number;
}) {
  return (
    <section id={id} className={`${ev.section} ${asEmail ? ev.sectionEmail : ''}`} aria-labelledby={`${id}-title`}>
      <div className={ev.head}>
        <h2 id={`${id}-title`} className={ev.title}>
          From the forum
        </h2>
        <p className={ev.subtitle}>Top threads since last week’s digest.</p>
      </div>

      <ol className={ev.list}>
        {DIGEST_FORUM_POSTS.map((post, i) => {
          const replies = post.replies + extraReplies(post.id);
          const content = (
            <>
              <span className={s.num}>{i + 1}.</span>
              <span className={`${ev.name} ${s.title}`}>{post.title}</span>
              <span className={s.replies}>
                {replies} {replies === 1 ? 'reply' : 'replies'}
              </span>
            </>
          );
          return (
            <li key={post.id}>
              {asEmail ? (
                <a href="/forum" className={`${ev.row} ${s.row}`}>
                  {content}
                </a>
              ) : (
                <button type="button" className={`${ev.row} ${s.row}`} onClick={() => onOpenPost(post.id)}>
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ol>

      <a href="/forum" className={s.open}>
        Open the forum →
      </a>
    </section>
  );
}
