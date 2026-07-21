'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

import type { ITeamNewsItem } from '@/types/team-news.types';
import { formatTimeAgo } from '@/utils/formatTimeAgo';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';
import { hasExistingDiscussion } from '@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton/utils/hasExistingDiscussion';
import { ArrowRight } from '@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton/components/Icons';
import { ArrowUpRightIcon, CheckIcon, CloseIcon } from '@/components/icons';
// Not re-exported from the icons barrel — import straight from the file.
import { MagicSparklesIcon } from '@/components/icons/MagicSparklesIcon';

// Reuse the production forum post-page card 1:1 as the modal card (badge, title,
// stats row, author block, post body).
import f from '@/components/page/forum/Post/Post.module.scss';
import { EVENT_TYPE_LABEL } from './eventMeta';
import { LikeButton } from './V0NewsCard';
import { NEWS_ARTICLES, UPVOTES, type NewsArticle, type NewsSource } from './mocks';
import local from './NewsfeedV0.module.scss';

// Decorative avatar backgrounds (not DS text tokens) — a stable color per source.
const AVATAR_COLORS = ['#1b4dff', '#0a9952', '#b54708', '#5925dc', '#0e7490', '#be123c', '#7c3aed', '#475467'];
function colorFor(label: string): string {
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function SourceAvatar({ label, size = 16 }: { label: string; size?: number }) {
  return (
    <span
      className={local.srcAvatar}
      style={{ width: size, height: size, background: colorFor(label), fontSize: Math.round(size * 0.56) }}
      aria-hidden
    >
      {label[0]?.toUpperCase()}
    </span>
  );
}

/** Inline citation pills at a paragraph's end: 1–2 sources render individually;
 *  3+ collapse into one pill with a "+N" count (e.g. "bbc +2"). */
function CiteChips({ sources }: { sources: NewsSource[] }) {
  if (!sources.length) return null;

  if (sources.length > 2) {
    const [first] = sources;
    return (
      <span className={local.citeGroup}>
        <a
          href={first.url}
          target="_blank"
          rel="noopener noreferrer"
          className={local.citeChip}
          title={`${sources.length} sources`}
        >
          <SourceAvatar label={first.label} size={14} />
          <span className={local.citeLabel}>{first.label}</span>
          <span className={local.citeMore}>+{sources.length - 1}</span>
        </a>
      </span>
    );
  }

  return (
    <span className={local.citeGroup}>
      {sources.map((src) => (
        <a key={src.label + src.url} href={src.url} target="_blank" rel="noopener noreferrer" className={local.citeChip}>
          <SourceAvatar label={src.label} size={14} />
          <span className={local.citeLabel}>{src.label}</span>
        </a>
      ))}
    </span>
  );
}

/** Build a one-paragraph article from the story's own fields when there's no
 *  richer generated article — the reader still works for every item. */
function articleFor(story: ITeamNewsItem): NewsArticle {
  const explicit = NEWS_ARTICLES[story.uid];
  if (explicit) return explicit;
  const sources: NewsSource[] = story.sourceDomain ? [{ label: story.sourceDomain, url: story.sourceUrl }] : [];
  return {
    sources,
    paragraphs: [{ text: story.summary ?? 'No AI summary was generated for this update yet.', cites: sources.length ? [0] : [] }],
  };
}

interface NewsReaderProps {
  story: ITeamNewsItem | null;
  onClose: () => void;
}

/**
 * The opened news reader, shown in a modal. The card reuses the production forum
 * post-page template (Post.module.scss): category badge, title, a Like/Comments
 * row, and the team as the "author" block — with the AI-generated article (inline
 * source pills), a Sources section, and share actions as the body. All mocked.
 */
export function NewsReader({ story, onClose }: NewsReaderProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState<null | 'link' | 'text'>(null);
  const [liked, setLiked] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  // Reset transient UI whenever a different story opens.
  useEffect(() => {
    setShareOpen(false);
    setCopied(null);
    setLiked(false);
  }, [story?.uid]);

  // Close the share popover on an outside click.
  useEffect(() => {
    if (!shareOpen) return;
    const onDown = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [shareOpen]);

  if (!story) return null;

  const article = articleFor(story);
  const existing = hasExistingDiscussion(story.discussion);
  const likes = (UPVOTES[story.uid] ?? 0) + (liked ? 1 : 0);
  const shareUrl = `https://directory.plnetwork.io/news/${story.uid}`;

  const flash = (kind: 'link' | 'text') => {
    setCopied(kind);
    setTimeout(() => setCopied((c) => (c === kind ? null : c)), 2000);
  };
  const copy = async (text: string, kind: 'link' | 'text') => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard may be unavailable in the preview frame — swallow */
    }
    flash(kind);
  };
  const articleText = `${story.title}\n\n${article.paragraphs.map((p) => p.text).join('\n\n')}\n\n${shareUrl}`;

  const shareTo = (href: string) => {
    window.open(href, '_blank', 'noopener,noreferrer,width=600,height=520');
    setShareOpen(false);
  };
  const shareText = encodeURIComponent(`${story.teamName}: ${story.title}`);
  const shareLink = encodeURIComponent(shareUrl);

  return (
    <Modal isOpen={!!story} onClose={onClose} className={local.readerModal}>
      <div className={clsx(f.root, local.readerRoot)}>
        <button type="button" className={local.detailClose} onClick={onClose} aria-label="Close">
          <CloseIcon width={16} height={16} />
        </button>

        <div className={clsx(f.content, local.readerHeadPad)}>
          <div className={f.topicBadge}>{EVENT_TYPE_LABEL[story.eventType]}</div>
        </div>

        <h1 className={f.title}>{story.title}</h1>

        <div className={f.sub}>
          <LikeButton count={likes} liked={liked} onToggle={() => setLiked((v) => !v)} />
          <div className={f.subItem}>
            <CommentIcon /> {story.discussion.count} Comments
          </div>
        </div>

        <div className={f.footer}>
          <span className={f.Avatar}>
            {story.teamLogoUrl ? (
              <img className={f.Image} src={story.teamLogoUrl} alt="" loading="lazy" />
            ) : (
              <span className={f.Fallback}>{getTeamLogoFallback(story.teamName)}</span>
            )}
          </span>
          <div className={f.col}>
            <div className={f.inline}>
              <a href={`/teams/${story.teamUid}`} target="_blank" rel="noopener noreferrer" className={f.name}>
                {story.teamName}
              </a>
            </div>
            <div className={f.time}>{formatTimeAgo(story.eventDate)}</div>
          </div>
        </div>

        <div className={local.detailByline}>
          <MagicSparklesIcon width={14} height={14} />
          AI-generated · reviewed across {article.sources.length} source{article.sources.length === 1 ? '' : 's'}
        </div>

        <div className={local.articleActions}>
          <div className={local.footerLeft}>
            <div className={local.shareWrap} ref={shareRef}>
              <button
                type="button"
                className={local.iconBtn}
                title="Share"
                aria-label="Share"
                onClick={() => setShareOpen((v) => !v)}
                aria-expanded={shareOpen}
              >
                <ShareIcon />
              </button>

              {shareOpen && (
                <div className={clsx(local.shareMenu, local.shareMenuDown)} role="menu">
                  <button type="button" className={local.shareItem} onClick={() => copy(shareUrl, 'link')}>
                    {copied === 'link' ? <CheckIcon width={16} height={16} /> : <LinkIcon />}
                    {copied === 'link' ? 'Link copied' : 'Copy link'}
                  </button>
                  <button
                    type="button"
                    className={local.shareItem}
                    onClick={() => shareTo(`https://twitter.com/intent/tweet?text=${shareText}&url=${shareLink}`)}
                  >
                    <XIcon />
                    Share on X
                  </button>
                  <button
                    type="button"
                    className={local.shareItem}
                    onClick={() => shareTo(`https://www.linkedin.com/sharing/share-offsite/?url=${shareLink}`)}
                  >
                    <LinkedInIcon />
                    Share on LinkedIn
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              className={local.iconBtn}
              title="Copy article"
              aria-label="Copy article"
              onClick={() => copy(articleText, 'text')}
            >
              {copied === 'text' ? <CheckIcon width={16} height={16} /> : <CopyIcon />}
            </button>
          </div>

          <Button style="link" variant="primary" type="button" className={local.detailDiscuss}>
            {existing ? 'Join discussion' : 'Discuss'}
            <ArrowRight />
          </Button>
        </div>

        <div className={local.postBody}>
          {article.paragraphs.map((p, i) => (
            <p key={i}>
              {p.text}
              {p.cites?.length ? <CiteChips sources={p.cites.map((idx) => article.sources[idx])} /> : null}
            </p>
          ))}
        </div>

        {article.sources.length > 0 && (
          <div className={local.sourcesList}>
            <div className={local.sourcesListLabel}>Sources</div>
            {article.sources.map((src, i) => (
              <a key={src.label + src.url} href={src.url} target="_blank" rel="noopener noreferrer" className={local.srcRow}>
                <span className={local.srcRowIndex}>{i + 1}</span>
                <SourceAvatar label={src.label} size={18} />
                <span className={local.srcRowLabel}>{src.label}</span>
                <ArrowUpRightIcon width={13} height={13} className={local.srcRowArrow} />
              </a>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

const CommentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M13.5 3H2.5C2.22 3 2 3.22 2 3.5v10c0 .43.5.66.85.4L5.15 12H13.5c.28 0 .5-.22.5-.5v-8c0-.28-.22-.5-.5-.5Z"
      stroke="#8897ae"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

const ShareIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="18" cy="5" r="2.6" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="6" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="18" cy="19" r="2.6" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8.3 10.75 15.7 6.4M8.3 13.25l7.4 4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M6.5 9.5a2.5 2.5 0 0 0 3.54 0l2-2a2.5 2.5 0 1 0-3.54-3.54l-.7.7M9.5 6.5a2.5 2.5 0 0 0-3.54 0l-2 2a2.5 2.5 0 1 0 3.54 3.54l.7-.7"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
    <path
      d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

const XIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <path d="M9.94 6.77 15.32 1h-1.27L9.38 6.01 5.64 1H1l5.64 8.04L1 15h1.27l4.94-5.28L11.16 15h4.64L9.94 6.77Zm-1.75 1.87-.57-.8L2.73 1.9h1.96l3.68 5.15.57.8 4.78 6.69h-1.96L8.19 8.64Z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <path d="M13.63 0H2.37A2.36 2.36 0 0 0 0 2.34v11.32A2.36 2.36 0 0 0 2.37 16h11.26A2.36 2.36 0 0 0 16 13.66V2.34A2.36 2.36 0 0 0 13.63 0ZM4.86 13.3H2.9V6.02h1.96v7.28ZM3.88 5.2a1.14 1.14 0 1 1 0-2.28 1.14 1.14 0 0 1 0 2.28Zm9.42 8.1h-1.96V9.7c0-.86-.02-1.96-1.2-1.96s-1.38.93-1.38 1.9v3.66H6.8V6.02h1.88v1h.03c.26-.5.9-1.02 1.86-1.02 1.98 0 2.35 1.3 2.35 3v4.3Z" />
  </svg>
);
