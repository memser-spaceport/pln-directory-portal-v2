'use client';

import { useEffect, useRef } from 'react';

import { scrollToFeedComment } from '../utils/feedCommentAnchor';

/**
 * Once per comment uid: after the modal thread is ready, scroll to that
 * comment (from `?comment=` on a notification deep link). Card surfaces pass
 * enabled=false — they only show a capped preview.
 */
export function useAnchorFeedComment({
  enabled,
  commentUid,
  ready,
}: {
  enabled: boolean;
  commentUid: string | null;
  ready: boolean;
}) {
  const scrolledForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !commentUid || !ready) return;
    if (scrolledForRef.current === commentUid) return;

    const timer = window.setTimeout(() => {
      if (scrollToFeedComment(commentUid)) {
        scrolledForRef.current = commentUid;
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [enabled, commentUid, ready]);
}
