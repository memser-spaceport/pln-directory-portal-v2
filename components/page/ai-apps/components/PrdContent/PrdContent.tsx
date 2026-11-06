'use client';

import ReactMarkdown from 'react-markdown';

import { SafeHtml } from '@/components/ui/SafeHtml';

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
    return <SafeHtml className={s.root} profile="prd" html={prd} />;
  }

  return (
    <div className={s.root}>
      <ReactMarkdown components={{ a: MarkdownLink }}>{prd}</ReactMarkdown>
    </div>
  );
}
