'use client';

import clsx from 'clsx';
import { useMemo } from 'react';
import parse from 'html-react-parser';

import { isBlankHtml, linkifyHtml, sanitizeCommentHtml } from '@/utils/html';

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
}

export function FeedCommentContent({ html, className }: FeedCommentContentProps) {
  const nodes = useMemo(() => parse(sanitizeCommentHtml(linkifyHtml(html ?? ''))), [html]);

  return <div className={clsx(s.text, s.richText, className)}>{nodes}</div>;
}
