'use client';

import { Spinner } from '@/components/ui/Spinner';

import { PrdContent } from '../PrdContent';

import s from './PrdViewerBody.module.scss';

interface Props {
  isLoading: boolean;
  error: string | null;
  content: string | null;
}

/**
 * Renders the one-pager's loading/error/content states on a white "document
 * page" — shared by the modal viewer and the full-page viewer so both stay
 * visually consistent as the same underlying `PrdContent` renderer evolves.
 */
export function PrdViewerBody({ isLoading, error, content }: Props) {
  if (isLoading) {
    return <Spinner />;
  }

  if (error || content === null) {
    return <p className={s.errorText}>{error ?? 'One-pager could not be loaded'}</p>;
  }

  return (
    <div className={s.page}>
      <PrdContent prd={content} />
    </div>
  );
}
