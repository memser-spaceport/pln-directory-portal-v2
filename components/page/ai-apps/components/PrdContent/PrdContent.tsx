'use client';

import DOMPurify from 'isomorphic-dompurify';
import ReactMarkdown from 'react-markdown';

import s from './PrdContent.module.scss';

/**
 * Only full-document markers route to the HTML path. Anything ambiguous
 * (Markdown with inline tags, bare fragments) renders as Markdown, where
 * react-markdown escapes embedded HTML instead of executing it — the safe
 * failure mode is odd-looking output, never live markup.
 */
const HTML_DOCUMENT_RE = /^\s*(<!doctype|<html|<head|<body)/i;

export function isHtmlDocument(prd: string): boolean {
  return HTML_DOCUMENT_RE.test(prd);
}

// The app ships no CSP header, so this sanitizer is the only defense layer for
// user-authored HTML. Beyond DOMPurify's defaults (scripts, iframes, event
// handlers, javascript: URLs), drop: SVG/MathML (mutation vectors), CSS
// (overlay spoofing / exfiltration), form controls (phishing UI inside a
// trusted modal), id/name (DOM clobbering), and data:/relative URLs.
const SANITIZE_CONFIG = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['style', 'form', 'input', 'button', 'base', 'meta', 'link'],
  FORBID_ATTR: ['style', 'id', 'name'],
  SANITIZE_NAMED_PROPS: true,
  ALLOWED_URI_REGEXP: /^(?:https?|mailto|tel):/i,
};

// Registered once at module scope — DOMPurify hooks are global and stack if
// added per render. Forcing target/rel here (after sanitize) is the canonical
// cure53 pattern; setting them before sanitizing would get them stripped.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.hasAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

function MarkdownLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {props.children}
    </a>
  );
}

interface Props {
  /** One-pager text — Markdown or a full HTML document. */
  prd: string;
}

/** Renders a user-authored one-pager safely, whichever format it arrived in. */
export function PrdContent({ prd }: Props) {
  if (isHtmlDocument(prd)) {
    return <div className={s.root} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(prd, SANITIZE_CONFIG) }} />;
  }

  return (
    <div className={s.root}>
      <ReactMarkdown components={{ a: MarkdownLink }}>{prd}</ReactMarkdown>
    </div>
  );
}
