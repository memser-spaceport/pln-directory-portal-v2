'use client';

import clsx from 'clsx';
import { useMemo } from 'react';
import 'react-quill-new/dist/quill.snow.css';

import { linkifyHtml } from '@/utils/html';

import s from './QuillContent.module.scss';

interface Props {
  html: string;
  className?: string;
  /**
   * Final pass over the markup right before it is rendered. linkifyHtml emits markup of its own, so callers that
   * render untrusted HTML pass their sanitizer here to make what reaches the DOM exactly sanitizer output.
   */
  sanitize?: (html: string) => string;
}

export function QuillContent(props: Props) {
  const { html, className, sanitize } = props;

  const linkifiedHtml = useMemo(() => {
    // Quill stores content with white-space:pre-wrap, which means it uses &nbsp;
    // in place of regular spaces to prevent collapse. In read-only view mode we
    // use white-space:normal, so those &nbsp; create unbreakable text runs that
    // cause text to overflow without wrapping. Replace them before rendering.
    const normalized = (html ?? '').replace(/&nbsp;/gi, ' ');
    const linkified = linkifyHtml(normalized);
    return sanitize ? sanitize(linkified) : linkified;
  }, [html, sanitize]);

  return (
    <div className={clsx('ql-editor', s.content, className)} dangerouslySetInnerHTML={{ __html: linkifiedHtml }} />
  );
}
