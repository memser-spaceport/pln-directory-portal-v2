'use client';

import clsx from 'clsx';
import { useMemo } from 'react';
import 'react-quill-new/dist/quill.snow.css';

import { linkifyHtml } from '@/utils/html';

import s from './QuillContent.module.scss';

interface Props {
  html: string;
  className?: string;
}

export function QuillContent(props: Props) {
  const { html, className } = props;

  const linkifiedHtml = useMemo(() => {
    // Quill stores content with white-space:pre-wrap, which means it uses &nbsp;
    // in place of regular spaces to prevent collapse. In read-only view mode we
    // use white-space:normal, so those &nbsp; create unbreakable text runs that
    // cause text to overflow without wrapping. Replace them before rendering.
    const normalized = (html ?? '').replace(/&nbsp;/gi, ' ');
    return linkifyHtml(normalized);
  }, [html]);

  return (
    <div className={clsx('ql-editor', s.content, className)} dangerouslySetInnerHTML={{ __html: linkifiedHtml }} />
  );
}
