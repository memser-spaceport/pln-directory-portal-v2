'use client';

import clsx from 'clsx';
import { useMemo } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import parse from 'html-react-parser';

import { isBlankHtml, linkifyHtml } from '@/utils/html';

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

// A no-toolbar composer can only produce paragraphs, breaks and anchors, so
// that is the whole allowlist. Deliberately narrower than NewsDetailModal's,
// and narrower than what NodeBB may send — a forum post's images and headings
// are dropped here rather than rendered inside a feed card.
const COMMENT_SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'a'],
  // NewsDetailModal allows `href` alone. A mention keeps its identity in
  // `class` + `data-uid` (see RichTextEditor's MentionBlot), so both have to
  // survive or the mention renders as an ordinary link.
  ALLOWED_ATTR: ['href', 'class', 'target', 'rel', 'data-uid', 'data-name', 'data-external-id'],
  // NewsDetailModal's /^https?:/i would reject a mention's own relative
  // /members/<uid> href. Anything outside these three schemes — `javascript:`
  // above all — still goes.
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/members\/)/i,
};

// Registered at module scope: DOMPurify hooks are global and stack if added
// per render. Identical to the hook NewsDetailModal and PrdContent register,
// and idempotent alongside them — setting the same two attributes twice is a
// no-op. Registering it here as well means this component does not depend on
// one of those modules happening to be loaded first.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.hasAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

/**
 * Would this comment render as a visible body?
 *
 * Must be asked of the SANITIZED string, not the raw one: a forum comment that
 * was only an image is a perfectly truthy `<img src=…>` that this allowlist
 * drops to nothing. Callers use it to choose the "shared an image or file"
 * fallback instead of rendering a blank row.
 */
export function hasRenderableContent(html: string): boolean {
  return !isBlankHtml(DOMPurify.sanitize(html ?? '', COMMENT_SANITIZE_CONFIG));
}

interface FeedCommentContentProps {
  /** Raw stored content: HTML for anything written since mentions shipped,
   *  plain text for everything older. */
  html: string;
  className?: string;
}

export function FeedCommentContent({ html, className }: FeedCommentContentProps) {
  const nodes = useMemo(() => parse(DOMPurify.sanitize(linkifyHtml(html ?? ''), COMMENT_SANITIZE_CONFIG)), [html]);

  return <div className={clsx(s.text, s.richText, className)}>{nodes}</div>;
}
