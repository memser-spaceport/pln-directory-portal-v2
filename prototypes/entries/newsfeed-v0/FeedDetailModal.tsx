'use client';

import clsx from 'clsx';
import { useRef, type ReactNode } from 'react';
import MarkdownToJSX from 'markdown-to-jsx';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
// Reuse the production "Discuss" (StartConversationButton) treatment + arrow, so
// the modal's Discuss link matches the one on the feed cards 1:1.
import discussStyles from '@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton/StartConversationButton.module.scss';
import { ArrowRight } from '@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton/components/Icons';

import type { NewsSource, FeedComment } from './mocks';
import { LikeButton, CommentCount } from './FeedActions';
import { CommentsThread } from './CommentsThread';
import { ShareMenu } from './ShareMenu';
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
  /** Outlets covering the story (news, when aggregated). */
  sources?: NewsSource[];
  /** Primary read-out link (news article / forum thread). */
  readUrl?: string;
  readLabel?: string;
  /** Modal body as markdown with inline `[n](url)` citations (multi-source news only). */
  citedBody?: string;
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
  /** Comments version: show the thread (see + leave comments) instead of Discuss. */
  showComments?: boolean;
  comments?: FeedComment[];
  onAddComment?: (text: string) => void;
}

/**
 * News/forum detail modal (V1): the full AI summary or post body, the story's
 * sources as clickable badges, a Share action, and the same Like control the
 * card carries. No production news-detail modal exists — this reuses the common
 * `Modal` shell and the feed's token+fallback palette.
 */
export function FeedDetailModal({
  detail,
  onClose,
  likeCount,
  liked,
  onToggleLike,
  citationStyle,
  showComments = false,
  comments = [],
  onAddComment,
}: Props) {
  const commentsRef = useRef<HTMLDivElement>(null);

  const scrollToComments = () => commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Per-claim citations render only when the story actually has a cited body
  // (multi-source news) and the viewer hasn't turned them off.
  const cited = detail?.kind === 'news' && detail.citedBody && citationStyle !== 'off' ? detail.citedBody : null;

  const sources = detail?.sources?.length
    ? detail.sources
    : detail?.readUrl && detail.kind === 'news'
      ? [{ domain: hostOf(detail.readUrl), url: detail.readUrl }]
      : [];

  // Share opens a destination menu (LinkedIn / X / Copy link). Rendered on the
  // left (Discuss version) or pushed to the far right (Comments version).
  const shareButton = <ShareMenu variant="modal" url={detail?.readUrl} align="left" />;

  return (
    <Modal
      isOpen={Boolean(detail)}
      onClose={onClose}
      overlayClassname={s.mobileOverlay}
      className={s.mobileContainer}
    >
      {detail && (
        <div className={s.card}>
          <button type="button" className={s.close} aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>

          <div className={s.head}>
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

          {cited ? (
            // Superscript style: `[n](url)` → a raised ¹ marker with a hover/tap
            // source popover.
            <div className={s.summaryBody}>
              <MarkdownToJSX options={{ overrides: { a: { component: SupAnchor } } }}>{cited}</MarkdownToJSX>
            </div>
          ) : detail.summary ? (
            <p className={s.summary}>{detail.summary}</p>
          ) : (
            <p className={s.summary}>No summary available for this update yet.</p>
          )}

          {/* Small disclosure — news summaries are machine-written from the sources
              (forum posts are the author's own words, so it's news-only). */}
          {detail.kind === 'news' && detail.summary && (
            <p className={s.aiNote}>
              <InfoIcon />
              This summary was written by AI from the linked sources.
            </p>
          )}

          {sources.length > 0 && (
            <div className={s.sources}>
              <span className={s.sourcesLabel}>{sources.length > 1 ? 'Sources' : 'Source'}</span>
              <div className={s.badgeRow}>
                {sources.map((src) => (
                  <a
                    key={src.domain}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={s.badge}
                  >
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

          {/* Comments version: see + leave comments right in the news modal. */}
          {detail.kind === 'news' && showComments && (
            <div ref={commentsRef}>
              <CommentsThread comments={comments} onAddComment={onAddComment ?? (() => {})} />
            </div>
          )}
          </div>

          <div className={s.footer}>
            {/* Share leads, then Like (+ comment count in the Comments version).
                Discuss version keeps the Discuss link on the right. */}
            <span className={s.footerActions}>
              {shareButton}
              <LikeButton count={likeCount} liked={liked} onToggle={onToggleLike} />
              {showComments && <CommentCount count={comments.length} onClick={scrollToComments} />}
            </span>
            {!showComments && detail.kind === 'news' && (
              <Button
                size="xs"
                style="link"
                variant="primary"
                className={discussStyles.discussLink}
                title="Start a conversation on the forum"
                onClick={(e) => e.stopPropagation()}
              >
                Discuss
                <ArrowRight />
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
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

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// Info circle (ⓘ) — the disclosure glyph for the AI-summary note.
const InfoIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.2" />
    <path d="M8 7.25v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="8" cy="5.15" r="0.85" fill="currentColor" />
  </svg>
);
