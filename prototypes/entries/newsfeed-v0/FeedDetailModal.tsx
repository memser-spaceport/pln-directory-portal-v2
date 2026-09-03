'use client';

import clsx from 'clsx';
import { useRef, type ReactNode } from 'react';
import MarkdownToJSX from 'markdown-to-jsx';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';
import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
// Reuse the production modal chrome (sticky header divider, rounded close button,
// scrolling content, sticky footer) 1:1 — the same shell the Gantry "Create item"
// modal standardizes on — so this detail modal matches the rest of the app.
import dealModal from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';
// Production Back button styling (chevron + "Back"), for the drill-in-place header.
import bb from '@/components/ui/BackButton/BackButton.module.scss';

import type { NewsSource, FeedComment, NewsVideo } from './mocks';
import { LikeButton, CommentCount, ViewCount } from './FeedActions';
import { CommentsThread } from './CommentsThread';
import { ShareMenu } from './ShareMenu';
import { VideoPlayer } from './NewsVideo';
import s from './FeedDetailModal.module.scss';

/**
 * Normalized detail payload for one feed item — news story or forum post — built
 * by the card and consumed by the modal. Keeps the modal agnostic of the two
 * source shapes (ITeamNewsItem vs ForumPost).
 */
export interface FeedDetail {
  id: string;
  kind: 'news' | 'forum';
  title: string;
  /** Team name (news) or author name (forum). */
  name: string;
  /** Author role (forum only). */
  sub?: string;
  /** Team logo url (news). */
  logoUrl?: string | null;
  /** Render the header image as a round avatar seeded from the author (forum). */
  avatarSeed?: string;
  /** Event label (news) or forum category. */
  kicker?: string;
  /** Event-dot hex for the kicker (news). */
  kickerColor?: string;
  summary: string | null;
  /** ISO date. */
  time: string;
  /** Read count — the first of the forum's Views · Likes · Comments trio. */
  views?: number;
  /** Outlets covering the story (news, when aggregated). */
  sources?: NewsSource[];
  /** Primary read-out link (news article / forum thread). */
  readUrl?: string;
  readLabel?: string;
  /** Modal body as markdown with inline `[n](url)` citations (multi-source news only). */
  citedBody?: string;
  /** YouTube video attached to the story (news only) — the modal's hero. */
  video?: NewsVideo;
  /** Open with the video already playing (the card's poster was the click target). */
  autoplayVideo?: boolean;
  /** Protocol Labs update — carries the same brand accent as its feed card. */
  isProtocolLabs?: boolean;
  /**
   * Written by the team itself (posted from its profile), not enriched from
   * coverage. Swaps the AI disclosure for a "Posted by" line in the same slot —
   * both answer "who wrote this" — and lets a post with no body show just its
   * headline rather than "No summary available".
   */
  authored?: boolean;
  /**
   * The author's formatted body (team-posted news), as the editor's HTML.
   * Rendered as-is here because this prototype's own editor produced it;
   * production sanitizes `contentHtml` before rendering (see NewsDetailModal).
   */
  bodyHtml?: string;
}

/** Whether the modal renders per-claim citations (superscript markers). */
export type CitationStyle = 'off' | 'superscript';

interface Props {
  detail: FeedDetail | null;
  onClose: () => void;
  likeCount: number;
  liked: boolean;
  onToggleLike: () => void;
  citationStyle: CitationStyle;
  /** Show the inline comment thread + count (the "with comments" version). */
  showComments?: boolean;
  comments?: FeedComment[];
  onAddComment?: (text: string, parentUid?: string) => void;
  /** Like state for comments and replies, keyed by comment uid. */
  isCommentLiked?: (commentUid: string) => boolean;
  onToggleCommentLike?: (commentUid: string) => void;
  /**
   * Extra action beside Share, for surfaces that opened this modal from somewhere
   * else — the job board puts its "Open in newsfeed" link here. The footer's left
   * side is where outbound actions live, so it joins them rather than inventing a
   * slot.
   */
  footerAction?: ReactNode;
}

/**
 * News/forum detail modal (V1): the full AI summary or post body, the story's
 * sources as clickable badges, a Share action, and the same Like control the
 * card carries. No production news-detail modal exists — this reuses the common
 * `Modal` shell and the feed's token+fallback palette.
 *
 * A thin wrapper over `FeedDetailBody`, which is the same content minus the
 * overlay — see there for why the two are separate.
 */
export function FeedDetailModal({ detail, onClose, ...rest }: Props) {
  return (
    <Modal isOpen={Boolean(detail)} onClose={onClose} overlayClassname={s.mobileOverlay} className={s.container}>
      {detail && <FeedDetailBody detail={detail} onClose={onClose} {...rest} />}
    </Modal>
  );
}

interface BodyProps extends Omit<Props, 'detail'> {
  detail: FeedDetail;
  /**
   * Replaces the header's close button with a Back control. For shells that
   * drill in place rather than stacking a second overlay — the team profile's
   * news archive swaps its own body to a story and offers Back to the list,
   * because a modal opened over a modal gives the reader two close buttons and
   * an Escape key that means two things.
   */
  onBack?: () => void;
  /** Drop the modal card's own height/shadow/radius when a shell supplies them. */
  className?: string;
}

/**
 * The story itself, with no overlay around it.
 *
 * Split out of `FeedDetailModal` so a surface that is *already* an overlay can
 * render a story inside its own box. The modal above is now just this plus a
 * `Modal`; every existing caller goes through that path unchanged.
 */
export function FeedDetailBody({
  detail,
  onClose,
  likeCount,
  liked,
  onToggleLike,
  citationStyle,
  showComments = true,
  comments = [],
  onAddComment,
  isCommentLiked,
  onToggleCommentLike,
  footerAction,
  onBack,
  className,
}: BodyProps) {
  const commentsRef = useRef<HTMLDivElement>(null);

  const scrollToComments = () => commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Per-claim citations render only when the story actually has a cited body
  // (multi-source news) and the viewer hasn't turned them off.
  const cited = detail.kind === 'news' && detail.citedBody && citationStyle !== 'off' ? detail.citedBody : null;

  const sources = detail.sources?.length
    ? detail.sources
    : detail.readUrl && detail.kind === 'news'
      ? [{ domain: hostOf(detail.readUrl), url: detail.readUrl }]
      : [];

  // Share opens a destination menu (LinkedIn / X / Copy link). It sits on the left
  // of the footer, so the menu aligns left — opening upward and inward, never off
  // the clipped card edge.
  const shareButton = <ShareMenu variant="modal" url={detail.readUrl} align="left" />;

  return (
    <div className={clsx(s.card, detail.isProtocolLabs && s.plCard, className)}>
      {/* Sticky header: author/team identity on the left, standardized close
              button on the right, with the shared bottom divider.
              When a shell drills in place it passes `onBack`, and Back leads the
              row instead — the shell keeps its own Close, so the two meanings
              stay on two controls. */}
      <div className={clsx(dealModal.header, s.head)}>
        {onBack && (
          // Production BackButton's chevron + label, so Back reads the same
          // here as everywhere else in the app.
          <button type="button" className={clsx(bb.backBtn, s.backBtn)} onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M12.5 15L7.5 10l5-5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </button>
        )}
        <div className={s.headIdentity}>
          {detail.avatarSeed ? (
            <img className={clsx(s.logo, s.avatar)} src={getDefaultAvatar(detail.avatarSeed)} alt="" />
          ) : detail.logoUrl ? (
            <img className={s.logo} src={detail.logoUrl} alt="" />
          ) : (
            <div className={s.logoFallback}>{getTeamLogoFallback(detail.name)}</div>
          )}
          <span className={s.headText}>
            <span className={s.name}>{detail.name}</span>
            {detail.sub && <span className={s.sub}>{detail.sub}</span>}
          </span>
        </div>
        {/* Close stays put even when Back is present: Back returns to the
                list, Close leaves the archive. Two meanings, two controls —
                overloading one button is how a reader ends up pressing it twice
                to get out and losing the list instead. */}
        <button type="button" className={dealModal.closeButton} aria-label="Close" onClick={onClose}>
          <CloseIcon width={20} height={20} color="#0a0c11" />
        </button>
      </div>

      <div className={s.body}>
        <div className={s.kickerRow}>
          {detail.kicker && (
            <>
              <span className={s.kicker} style={detail.kickerColor ? { color: detail.kickerColor } : undefined}>
                {detail.kicker}
              </span>
              <span className={s.kickerSep} aria-hidden>
                ·
              </span>
            </>
          )}
          <span className={s.kickerTime}>{formatTimeAgo(detail.time)}</span>
        </div>

        <h2 className={s.title}>{detail.title}</h2>

        {/* Video sits under the headline and above the body — the poster only
              becomes a player on click (or straight away when the card's poster
              opened this modal). Keyed so switching stories resets playback. */}
        {detail.video && (
          <VideoPlayer key={detail.id} video={detail.video} title={detail.title} autoplay={detail.autoplayVideo} />
        )}

        {cited ? (
          // Superscript style: `[n](url)` → a raised ¹ marker with a hover/tap
          // source popover.
          <div className={s.summaryBody}>
            <MarkdownToJSX options={{ overrides: { a: { component: SupAnchor } } }}>{cited}</MarkdownToJSX>
          </div>
        ) : detail.bodyHtml ? (
          // Team-posted news: the author's own formatting (bold, lists,
          // links) — the same paragraph treatment the cited body wears.
          <div className={s.summaryBody} dangerouslySetInnerHTML={{ __html: detail.bodyHtml }} />
        ) : detail.summary ? (
          <p className={s.summary}>{detail.summary}</p>
        ) : detail.authored ? null : (
          <p className={s.summary}>No summary available for this update yet.</p>
        )}

        {/* Small disclosure — news summaries are machine-written from the sources
              (forum posts are the author's own words, so it's news-only). A post
              the team wrote itself takes the same slot for the same question,
              with the opposite answer. */}
        {detail.kind === 'news' && detail.authored ? (
          <p className={s.aiNote}>
            <InfoIcon />
            Posted by {detail.name}.
          </p>
        ) : (
          detail.kind === 'news' &&
          detail.summary && (
            <p className={s.aiNote}>
              <InfoIcon />
              This summary was written by AI from the linked sources.
            </p>
          )
        )}

        {sources.length > 0 && (
          <div className={s.sources}>
            <span className={s.sourcesLabel}>{sources.length > 1 ? 'Sources' : 'Source'}</span>
            <div className={s.badgeRow}>
              {sources.map((src) => (
                <a key={src.domain} href={src.url} target="_blank" rel="noopener noreferrer" className={s.badge}>
                  <img
                    className={s.favicon}
                    src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=32`}
                    alt=""
                    aria-hidden
                  />
                  {src.domain}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* "With comments" version: see + leave comments right in the news modal. */}
        {detail.kind === 'news' && showComments && (
          <div ref={commentsRef}>
            <CommentsThread
              heading
              comments={comments}
              onAddComment={onAddComment ?? (() => {})}
              isCommentLiked={isCommentLiked ?? (() => false)}
              onToggleCommentLike={onToggleCommentLike ?? (() => {})}
            />
          </div>
        )}
      </div>

      <div className={clsx(dealModal.footer, s.footer, s.footerSplit)}>
        {/* Same footer grammar as the forum post modal: the outbound action on
                the left, the read/like/comment metrics on the right. */}
        <span className={s.footerActions}>
          {shareButton}
          {footerAction}
        </span>
        <span className={s.forumMeta}>
          {detail.views != null && <ViewCount count={detail.views} />}
          <LikeButton count={likeCount} liked={liked} onToggle={onToggleLike} />
          {detail.kind === 'news' && showComments && (
            <CommentCount count={comments.length} onClick={scrollToComments} />
          )}
        </span>
      </div>
    </div>
  );
}

// Markdown `a` override for the superscript style: a numeric link child (from
// `[n](url)`) becomes a raised ¹ citation chip; any non-numeric link stays a
// normal link.
const SupAnchor = (props: { href?: string; children?: ReactNode }) => {
  // markdown-to-jsx can hand the link text as an array (e.g. ["1"]), so coerce
  // before deciding whether this is a numeric citation marker.
  const raw = Array.isArray(props.children) ? props.children.join('') : props.children;
  const text = String(raw ?? '').trim();
  const isNumeric = text !== '' && !Number.isNaN(Number(text));
  if (!isNumeric) {
    return (
      <a href={props.href} target="_blank" rel="noopener noreferrer">
        {props.children}
      </a>
    );
  }
  // The source is on the marker: hover (desktop) or tap (mobile → opens the
  // outlet) reveals which outlet this claim came from, so you never scroll to
  // the Sources list to decode a citation. Popover modeled on the feed's
  // SourceList popover.
  const domain = hostOf(props.href ?? '');
  return (
    <span className={s.citeWrap}>
      <a
        href={props.href}
        target="_blank"
        rel="noopener noreferrer"
        className={s.citeLink}
        aria-label={`Source ${text}: ${domain}`}
      >
        <sup className={s.cite}>{text}</sup>
      </a>
      <span className={s.citePop} role="tooltip">
        <img
          className={s.favicon}
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
          alt=""
          aria-hidden
        />
        <span className={s.citePopDomain}>{domain}</span>
      </span>
    </span>
  );
};

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// Info circle (ⓘ) — the disclosure glyph for the AI-summary note.
const InfoIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.2" />
    <path d="M8 7.25v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="8" cy="5.15" r="0.85" fill="currentColor" />
  </svg>
);
