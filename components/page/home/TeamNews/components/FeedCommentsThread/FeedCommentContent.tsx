'use client';

import clsx from 'clsx';
import { useMemo } from 'react';
import parse from 'html-react-parser';

import { classifyAnchor, isBlankHtml, linkifyHtml, sanitizeCommentHtml, type AnchorTarget } from '@/utils/html';

import s from './FeedCommentsThread.module.scss';

/**
 * A feed comment's body.
 *
 * Comment content is HTML now, from two sources that are equally untrusted:
 * member-authored directory comments, and real NodeBB posts (which the forum's
 * own composer wrote, and which the feed used to flatten with stripHtml). The
 * app ships no CSP, so this sanitizer is the only defense layer — same
 * rationale as NewsDetailModal's and PrdContent's.
 *
 * Pipeline order is deliberate: linkify FIRST, then sanitize. linkifyHtml emits
 * markup, and running the sanitizer over its output means a malformed URL can
 * never smuggle an attribute through. Sanitizing first would leave the anchors
 * it adds unchecked.
 *
 * Old comments predate all of this and are plain text. They need no special
 * case: a stray `<` is escaped by the sanitizer, and `.text` has never set
 * `white-space: pre-wrap`, so their line breaks collapsed before too.
 */

/**
 * Would this comment render as a visible body?
 *
 * Must be asked of the SANITIZED string, not the raw one: a forum comment that
 * was only an image is a perfectly truthy `<img src=…>` that this allowlist
 * drops to nothing. Callers use it to choose the "shared an image or file"
 * fallback instead of rendering a blank row.
 */
export function hasRenderableContent(html: string): boolean {
  return !isBlankHtml(sanitizeCommentHtml(html));
}

interface FeedCommentContentProps {
  /** Raw stored content: HTML for anything written since mentions shipped,
   *  plain text for everything older. */
  html: string;
  className?: string;
  /** Someone followed a link or a mention in this comment. A callback rather
   *  than analytics here, so this component stays a renderer and never needs
   *  to know which feed item, surface or kind it is inside. */
  onAnchorClick?: (target: AnchorTarget) => void;
}

export function FeedCommentContent({ html, className, onAnchorClick }: FeedCommentContentProps) {
  const nodes = useMemo(() => parse(sanitizeCommentHtml(linkifyHtml(html ?? ''))), [html]);

  // One delegated handler on this element, not one per anchor: the content is
  // parsed HTML, so per-anchor handlers would mean rewriting nodes during the
  // parse. Scoped HERE rather than on the thread, which also contains the
  // "more comments on the forum" and "view it on the forum" links — those are
  // chrome, not something a member wrote.
  //
  // auxclick as well as click, or every middle-click "open in new tab" — a
  // very normal way to follow a link — would be invisible. Never
  // preventDefault: this observes, it does not intercept.
  const handleAnchorClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onAnchorClick) return;
    const anchor = (event.target as HTMLElement | null)?.closest?.('a');
    if (!anchor) return;
    const target = classifyAnchor(anchor as HTMLAnchorElement);
    if (target.kind !== 'skip') onAnchorClick(target);
  };

  return (
    <div
      className={clsx(s.text, s.richText, className)}
      onClick={onAnchorClick ? handleAnchorClick : undefined}
      onAuxClick={onAnchorClick ? handleAnchorClick : undefined}
    >
      {nodes}
    </div>
  );
}
