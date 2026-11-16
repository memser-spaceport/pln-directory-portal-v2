import { SafeHtml } from '@/components/ui/SafeHtml';
import type { DigestForumPost as DigestForumPostData } from '@/services/digest/digest.types';

import s from './DigestPage.module.scss';

/** One forum post, in full. Posts have no More / Less. */
export function DigestForumPost({ post }: { post: DigestForumPostData }) {
  const role = [post.authorRole, post.authorTeam ? `@${post.authorTeam}` : null].filter(Boolean).join(' ');

  return (
    <section id={`post-${post.tid}`} className={s.post}>
      <div className={s.spacer} />
      <div className={s.byline}>
        {post.authorAvatarUrl ? (
          <img src={post.authorAvatarUrl} alt="" className={s.avatar} width={32} height={32} />
        ) : (
          <span aria-hidden className={`${s.avatar} ${s.avatarFallback}`}>
            {post.authorName.charAt(0).toUpperCase()}
          </span>
        )}
        <span className={s.bylineName}>by {post.authorName}</span>
        {role && <span className={s.bylineRole}>· {role}</span>}
      </div>
      <div className={s.postBody}>
        <h3 className={s.postTitle}>{post.title}</h3>
        <SafeHtml html={post.contentHtml} className={`${s.postText} ${s.html}`} demoteHeadings />
        <a href={post.url} className={s.postLink}>
          Reply in the forum
        </a>
      </div>
    </section>
  );
}
