'use client';

import { useState } from 'react';
import clsx from 'clsx';

import { Modal } from '@/components/common/Modal';
import type { TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import type { ITeamNewsItem } from '@/types/team-news.types';

import { NewsDetailBody, TITLE_ID } from './NewsDetailBody';

import s from './NewsDetailModal.module.scss';

interface NewsDetailModalProps {
  /** Resolved from overlay-merged allItems — carries live viewerHasUpvoted/upvoteCount.
   *  The single source of truth; no separate viewer-state props that could disagree. */
  item: ITeamNewsItem;
  onClose: () => void;
  onUpvoteToggle: (item: ITeamNewsItem) => void;
  isFollowing?: boolean;
  onFollowToggle?: (teamUid: string, teamName: string, isCurrentlyFollowing: boolean) => void;
  /** Passed through to NewsDetailBody — see its props for both. */
  source?: TeamNewsAnalyticsSource;
  loginHref?: string;
}

/** Restores focus for the row that opened the modal. Scoped to role="button" —
 *  NewsCard also stamps data-story-uid, but only rows that open a dialog carry
 *  the button role. Deep-linked stories may have no row in the DOM (beyond the
 *  fold / collapsed cluster); fall back to the feed root rather than letting
 *  focus drop to <body>. */
function restoreFocusToRow(uid: string) {
  const row = document.querySelector<HTMLElement>(`[role="button"][data-story-uid="${CSS.escape(uid)}"]`);
  const target = row ?? document.querySelector<HTMLElement>('[data-news-feed-root]');
  target?.focus();
}

/**
 * One story in its own overlay — the shell /home and the team profile's news
 * rail open. The story itself is `NewsDetailBody`, which the profile's archive
 * renders without this shell so a row click drills in place instead of stacking
 * a second modal (two close buttons, one ambiguous Escape).
 */
export function NewsDetailModal({
  item,
  onClose,
  onUpvoteToggle,
  isFollowing = false,
  onFollowToggle,
  source,
  loginHref,
}: NewsDetailModalProps) {
  // While the share popover is open, the Modal's own Escape/backdrop closers
  // are detached (its capture-phase document listener would otherwise swallow
  // Escape before the popover ever sees it, and a backdrop mousedown+click
  // gesture would dismiss both layers at once). First Escape/outside-click
  // closes the popover; the next one closes the modal.
  const [shareOpen, setShareOpen] = useState(false);

  // Synchronous restore in the close path, not an effect cleanup — Modal's
  // animated exit runs ~200ms and a late focus jump would yank the user away
  // from wherever they clicked next.
  const handleClose = () => {
    restoreFocusToRow(item.uid);
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={handleClose}
      ariaLabelledBy={TITLE_ID}
      lockScroll
      inertBackground
      closeOnEscape={!shareOpen}
      closeOnBackdropClick={!shareOpen}
      overlayClassname={s.mobileOverlay}
      className={clsx(s.container, s.modal)}
    >
      <NewsDetailBody
        item={item}
        onClose={handleClose}
        onUpvoteToggle={onUpvoteToggle}
        isFollowing={isFollowing}
        onFollowToggle={onFollowToggle}
        source={source}
        loginHref={loginHref}
        onShareOpenChange={setShareOpen}
      />
    </Modal>
  );
}
