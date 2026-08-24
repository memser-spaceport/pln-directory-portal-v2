'use client';

import { formatTimeAgo } from '@/utils/formatTimeAgo';

import { linkifyPostText, type BlueskyPost } from './activityMocks';
import s from './BlueskyPostCard.module.scss';

interface Props {
  post: BlueskyPost;
}

/**
 * A Bluesky post rendered as a post — linkified body, media, an unfurled link
 * card, a quoted post, and the reply/repost/like row.
 *
 * Built here rather than assembled from production parts because none of those
 * content shapes exist in this codebase: the forum card has a title and a
 * teaser, and nothing in the product unfurls a link or embeds a quote. What is
 * borrowed is the colour and type layer — every value is a token/fallback pair
 * copied from the neighbouring member-detail modules, so the card reads as ours
 * even though the anatomy is Bluesky's.
 *
 * It only ever renders in the 300px rail, so there is no per-post author line:
 * `BlueskyRailCard`'s header names the account once, and repeating it on each
 * card is the one thing that width genuinely cannot afford. (A wider variant
 * existed while the Activity-tab placement was still on the table. That
 * placement is gone, so the variant went with it rather than staying as an
 * unreachable branch.)
 */
export function BlueskyPostCard({ post }: Props) {
  const segments = linkifyPostText(post.text);

  // The card is a div, not an anchor: it contains real links (mentions, the
  // unfurled URL, the link card), and an anchor inside an anchor is invalid.
  // role="link" + keydown is the pattern production's NewsCard already uses for
  // exactly this reason.
  const open = () => window.open(post.url, '_blank', 'noopener,noreferrer');

  return (
    <div
      role="link"
      tabIndex={0}
      className={`${s.card} ${s.rail}`}
      onClick={open}
      onKeyDown={(e) => {
        // Only the card itself — Enter on an inner link must not also open the post.
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
    >
      <p className={`${s.body} ${s.bodyClamped}`}>
        {segments.map((seg, i) =>
          seg.href ? (
            <a
              key={i}
              className={s.inlineLink}
              href={seg.href}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {seg.value}
            </a>
          ) : (
            <span key={i}>{seg.value}</span>
          ),
        )}
      </p>

      {post.images && post.images.length > 0 && (
        <div className={post.images.length > 1 ? `${s.media} ${s.mediaGrid}` : s.media}>
          {post.images.map((img) => (
            <img key={img.url} className={s.mediaImg} src={img.url} alt={img.alt} loading="lazy" />
          ))}
        </div>
      )}

      {post.link && (
        <a
          className={s.linkCard}
          href={post.link.url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <img className={s.linkThumb} src={post.link.thumb} alt="" loading="lazy" />
          <div className={s.linkBody}>
            <span className={s.linkTitle}>{post.link.title}</span>
            <span className={s.linkDesc}>{post.link.description}</span>
            <span className={s.linkDomain}>{post.link.domain}</span>
          </div>
        </a>
      )}

      {post.quote && (
        <div className={s.quote}>
          <div className={s.quoteAuthor}>
            <img className={s.quoteAvatar} src={post.quote.avatar} alt="" />
            <span className={s.quoteName}>{post.quote.author}</span>
            <span className={s.quoteHandle}>@{post.quote.handle}</span>
          </div>
          <p className={s.quoteText}>{post.quote.text}</p>
        </div>
      )}

      {/* Replies / reposts / likes. Drawn as one 16px set rather than mixing the
          product's CommentIcon with two strangers — the design system has no
          repost or heart, and three icons on one row have to agree on weight.
          A heart, not our ThumbsUpIcon: the count belongs to Bluesky and
          relabelling its affordance would misreport what the number is. */}
      <div className={s.stats}>
        {/* With no author line, the time leads the meta row — the same place
            MemberTeamUpdates puts it one card down the rail. */}
        <span className={s.railTime}>{formatTimeAgo(post.timestamp)}</span>
        <span className={s.stat}>
          <ReplyIcon /> {post.replies}
        </span>
        <span className={s.stat}>
          <RepostIcon /> {post.reposts}
        </span>
        <span className={s.stat}>
          <HeartIcon /> {post.likes}
        </span>
      </div>
    </div>
  );
}

const ReplyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-3.8-.9L3 20.5l1.6-4.6A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4Z" />
  </svg>
);

const RepostIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 2.5 20.5 6 17 9.5" />
    <path d="M20.5 6H7a3.5 3.5 0 0 0-3.5 3.5V11" />
    <path d="M7 21.5 3.5 18 7 14.5" />
    <path d="M3.5 18H17a3.5 3.5 0 0 0 3.5-3.5V13" />
  </svg>
);

const HeartIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinejoin="round"
  >
    <path d="M12 20.3 4.2 12.8a4.8 4.8 0 0 1 6.8-6.8l1 1 1-1a4.8 4.8 0 0 1 6.8 6.8Z" />
  </svg>
);
