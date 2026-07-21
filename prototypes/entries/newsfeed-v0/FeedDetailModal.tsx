'use client';

import clsx from 'clsx';
import { useEffect, useState } from 'react';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';
import { Modal } from '@/components/common/Modal';

import type { NewsSource } from './mocks';
import { LikeButton } from './FeedActions';
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
}

interface Props {
  detail: FeedDetail | null;
  onClose: () => void;
  likeCount: number;
  liked: boolean;
  onToggleLike: () => void;
}

/**
 * News/forum detail modal (V1): the full AI summary or post body, the story's
 * sources as clickable badges, a Share action, and the same Like control the
 * card carries. No production news-detail modal exists — this reuses the common
 * `Modal` shell and the feed's token+fallback palette.
 */
export function FeedDetailModal({ detail, onClose, likeCount, liked, onToggleLike }: Props) {
  const [copied, setCopied] = useState(false);

  // Reset the "copied" flash whenever a different item opens.
  useEffect(() => setCopied(false), [detail?.id]);

  const share = () => {
    const url = detail?.readUrl ?? (typeof window !== 'undefined' ? window.location.href : '');
    try {
      void navigator.clipboard?.writeText(url);
    } catch {
      /* clipboard unavailable — the flash still signals intent in the prototype */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sources = detail?.sources?.length
    ? detail.sources
    : detail?.readUrl && detail.kind === 'news'
      ? [{ domain: hostOf(detail.readUrl), url: detail.readUrl }]
      : [];

  return (
    <Modal isOpen={Boolean(detail)} onClose={onClose}>
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

          {detail.kicker && (
            <span className={s.kicker} style={detail.kickerColor ? { color: detail.kickerColor } : undefined}>
              {detail.kicker}
            </span>
          )}

          <h2 className={s.title}>{detail.title}</h2>

          {detail.summary ? (
            <p className={s.summary}>{detail.summary}</p>
          ) : (
            <p className={s.summary}>No summary available for this update yet.</p>
          )}

          <div className={s.metaRow}>
            <span>{formatTimeAgo(detail.time)}</span>
          </div>

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

          <div className={s.footer}>
            <span className={s.footerActions}>
              <LikeButton count={likeCount} liked={liked} onToggle={onToggleLike} />
              <button type="button" className={clsx(s.share, copied && s.shareCopied)} onClick={share}>
                {copied ? <CheckIcon /> : <ShareIcon />}
                {copied ? 'Link copied' : 'Share'}
              </button>
            </span>
            {detail.readUrl && (
              <a href={detail.readUrl} target="_blank" rel="noopener noreferrer" className={s.readLink}>
                {detail.readLabel ?? 'Read full article'}
                <ArrowIcon />
              </a>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

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

const ShareIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M11.5 5.5a2 2 0 1 0-1.9-2.6L6.4 4.6a2 2 0 1 0 0 2.8l3.2 1.7a2 2 0 1 0 .5-.9L6.9 6.5a2 2 0 0 0 0-.9l3.2-1.7a2 2 0 0 0 1.4.6Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M13 4.5 6.25 11.5 3 8.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M4 12L12 4M6 4h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
