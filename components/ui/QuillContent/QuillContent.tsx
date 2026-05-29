'use client';

import clsx from 'clsx';
import { useMemo } from 'react';
import 'react-quill-new/dist/quill.snow.css';

import s from './QuillContent.module.scss';

interface Props {
  html: string;
  className?: string;
}

const URL_REGEX = /(https?:\/\/[^\s<]+)/g;
// Trailing characters that are almost always punctuation, not part of the URL
// (e.g. a sentence-ending period or a closing bracket around the link).
const TRAILING_PUNCTUATION = /[.,;:!?)\]]+$/;

/**
 * Wrap bare URLs in anchor tags so links typed into the editor (which Quill
 * leaves as plain text) render as clickable links. Only text outside of
 * existing tags and existing <a> elements is touched, so already-linked URLs
 * and tag attributes are left untouched.
 */
function linkifyHtml(html: string): string {
  let anchorDepth = 0;

  return html
    .split(/(<[^>]+>)/g)
    .map((part) => {
      if (part.startsWith('<')) {
        if (/^<a[\s>]/i.test(part)) anchorDepth += 1;
        else if (/^<\/a>/i.test(part)) anchorDepth = Math.max(0, anchorDepth - 1);
        return part;
      }

      if (anchorDepth > 0) return part;

      return part.replace(URL_REGEX, (url) => {
        const trailing = url.match(TRAILING_PUNCTUATION)?.[0] ?? '';
        const href = trailing ? url.slice(0, -trailing.length) : url;
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${href}</a>${trailing}`;
      });
    })
    .join('');
}

export function QuillContent(props: Props) {
  const { html, className } = props;

  const linkifiedHtml = useMemo(() => linkifyHtml(html ?? ''), [html]);

  return (
    <div
      className={clsx('ql-editor', s.content, className)}
      dangerouslySetInnerHTML={{ __html: linkifiedHtml }}
    />
  );
}
