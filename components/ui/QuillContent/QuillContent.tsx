'use client';

import clsx from 'clsx';
import { useMemo } from 'react';
import 'react-quill-new/dist/quill.snow.css';

import { SafeHtml } from '@/components/ui/SafeHtml';
import { linkifyHtml } from '@/utils/html';
import type { SanitizeProfileName } from '@/utils/html/sanitizeProfiles';

import s from './QuillContent.module.scss';

interface Props {
  html: string;
  className?: string;
  /**
   * Allowlist for the final sanitize pass. linkifyHtml emits markup of its own, so sanitizing runs after it and what
   * reaches the DOM is exactly sanitizer output.
   */
  profile?: SanitizeProfileName;
}

export function QuillContent(props: Props) {
  const { html, className, profile = 'richText' } = props;

  const linkifiedHtml = useMemo(() => {
    // Quill stores content with white-space:pre-wrap, which means it uses &nbsp;
    // in place of regular spaces to prevent collapse. In read-only view mode we
    // use white-space:normal, so those &nbsp; create unbreakable text runs that
    // cause text to overflow without wrapping. Replace them before rendering.
    const normalized = (html ?? '').replace(/&nbsp;/gi, ' ');
    return linkifyHtml(normalized);
  }, [html]);

  return <SafeHtml html={linkifiedHtml} profile={profile} className={clsx('ql-editor', s.content, className)} />;
}
