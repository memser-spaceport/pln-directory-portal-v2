'use client';

import clsx from 'clsx';
import { useMemo } from 'react';
import parse from 'html-react-parser';

import { convertMarkdownImagesToHtml } from '@/utils/decode';
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
 * Pipeline order is deliberate, and each step depends on the one before it:
 * convert markdown images, THEN linkify, THEN sanitize. NodeBB stores a
 * comment's images as `![alt](src)` in otherwise plain text, so converting
 * first is what makes them images at all — and it puts the image URL inside a
 * `src`, where linkifyHtml (which only rewrites text outside tags) can't turn
 * it into an anchor. Sanitizing last means both of the earlier steps' markup is
 * checked, including convertMarkdownImagesToHtml's uninterpolated `alt`.
 * Sanitizing first would leave the anchors linkify adds unchecked.
 *
 * Old comments predate all of this and are plain text. They need no special
 * case: a stray `<` is escaped by the sanitizer, and `.text` has never set
 * `white-space: pre-wrap`, so their line breaks collapsed before too.
 */

/**
 * Would this comment render as a visible body?
 *
 * Must be asked of the string this component will actually render — converted
 * AND sanitized — because both steps move the answer, in opposite directions.
 * Unconverted, a comment that is only an image looks like content (the raw
 * markdown is text). Converted but judged by isBlankHtml alone, it looks like
 * nothing: an `<img>` carries no text, and that verdict would send the caller
 * to the "shared an image or file" fallback INSTEAD of rendering the image.
 *
 * So: blank means blank once an image counts as something you can see.
 */
export function hasRenderableContent(html: string): boolean {
  const rendered = sanitizeCommentHtml(convertMarkdownImagesToHtml(html ?? ''));
  return !isBlankHtml(rendered) || /<img\b/i.test(rendered);
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
  const nodes = useMemo(() => parse(sanitizeCommentHtml(linkifyHtml(convertMarkdownImagesToHtml(html ?? '')))), [html]);

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
