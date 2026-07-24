'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import DOMPurify from 'isomorphic-dompurify';

import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import { useCurrentUserStore } from '@/services/auth/store';
import type { ITeamNewsItem } from '@/types/team-news.types';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getTeamLogoFallback } from '../../utils/getTeamLogoFallback';
import { getEventTypeConfig } from '../../utils/getEventTypeConfig';
import { getNewsSourcesWithPrimaryFallback } from '../../utils/getNewsSources';

import { UpvoteButton } from '../NewsCard/components/UpvoteButton';
import { NewsShareMenu } from '../NewsShareMenu';

import newsCardStyles from '../NewsCard/NewsCard.module.scss';
import s from './NewsDetailModal.module.scss';

interface NewsDetailModalProps {
  /** Resolved from overlay-merged allItems — carries live viewerHasUpvoted/upvoteCount.
   *  The single source of truth; no separate viewer-state props that could disagree. */
  item: ITeamNewsItem;
  onClose: () => void;
  onUpvoteToggle: (item: ITeamNewsItem) => void;
}

const TITLE_ID = 'news-detail-modal-title';

// contentHtml comes from the AI enrichment pipeline — the least trusted markup
// in the app, and the app ships no CSP, so this sanitizer is the only defense
// layer (same rationale as PrdContent's). Enrichment output is 2–5 paragraphs
// with inline emphasis and the odd link/list — allow exactly that, nothing else.
const CONTENT_SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['p', 'strong', 'em', 'b', 'i', 'a', 'ul', 'ol', 'li', 'br'],
  ALLOWED_ATTR: ['href'],
  ALLOWED_URI_REGEXP: /^https?:/i,
};

// Registered once at module scope — DOMPurify hooks are global and stack if
// added per render. Forcing target/rel after sanitizing is the canonical
// cure53 pattern (before, they'd be stripped). Idempotent alongside the same
// hook registered by other consumers (PrdContent).
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.hasAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

/** Restores focus for the row that opened the modal. Scoped to role="button" —
 *  NewsCard also stamps data-story-uid, but only feed rows carry the button role.
 *  Deep-linked stories may have no row in the DOM (beyond the fold / collapsed
 *  cluster); fall back to the feed root rather than letting focus drop to <body>. */
function restoreFocusToRow(uid: string) {
  const row = document.querySelector<HTMLElement>(`[role="button"][data-story-uid="${CSS.escape(uid)}"]`);
  const target = row ?? document.querySelector<HTMLElement>('[data-news-feed-root]');
  target?.focus();
}

export function NewsDetailModal({ item, onClose, onUpvoteToggle }: NewsDetailModalProps) {
  const router = useRouter();
  const { currentUser, isHydrated } = useCurrentUserStore();
  // While the share popover is open, the Modal's own Escape/backdrop closers
  // are detached (its capture-phase document listener would otherwise swallow
  // Escape before the popover ever sees it, and a backdrop mousedown+click
  // gesture would dismiss both layers at once). First Escape/outside-click
  // closes the popover; the next one closes the modal.
  const [shareOpen, setShareOpen] = useState(false);

  // Move focus into the dialog on open. A callback ref, not a mount effect:
  // the shared Modal portals its children only after its own client-mount
  // effect, so this component's effects run before the button exists in the
  // DOM — the ref fires exactly when it attaches.
  const focusOnAttach = useCallback((node: HTMLButtonElement | null) => {
    node?.focus();
  }, []);

  // Synchronous restore in the close path, not an effect cleanup — Modal's
  // animated exit runs ~200ms and a late focus jump would yank the user away
  // from wherever they clicked next.
  const handleClose = () => {
    restoreFocusToRow(item.uid);
    onClose();
  };

  const handleUpvoteClick = () => {
    if (!currentUser) {
      // Constructed, not read from location.search — the URL write on open is
      // synchronous (history.replaceState), but building the target explicitly
      // keeps the login round-trip correct even if that ever changes.
      router.push(`/home?news=${encodeURIComponent(item.uid)}#login`);
      return;
    }
    onUpvoteToggle(item);
  };

  const { label: eventTypeLabel, dotClassName: eventTypeDotClassName } = getEventTypeConfig(item.eventType);
  const sources = getNewsSourcesWithPrimaryFallback(item);
  // Rich body from the API where present (older items fall back to the plain
  // summary until re-enriched server-side). Sanitized — never render raw.
  const sanitizedContentHtml = useMemo(
    () => (item.contentHtml ? DOMPurify.sanitize(item.contentHtml, CONTENT_SANITIZE_CONFIG) : null),
    [item.contentHtml],
  );

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
      {/* Sticky header: team identity on the left, standardized close button
          on the right — pinned above the scrolling body. */}
      <div className={s.head}>
        <div className={s.headIdentity}>
          {item.teamLogoUrl ? (
            <img className={newsCardStyles.logo} src={item.teamLogoUrl} alt="" loading="lazy" />
          ) : (
            <div className={newsCardStyles.logoFallback}>{getTeamLogoFallback(item.teamName)}</div>
          )}
          <a
            href={`/teams/${item.teamUid}`}
            target="_blank"
            rel="noopener noreferrer"
            className={newsCardStyles.teamName}
          >
            {item.teamName}
          </a>
        </div>
        <button ref={focusOnAttach} type="button" className={s.closeButton} aria-label="Close" onClick={handleClose}>
          <CloseIcon width={20} height={20} color="#0a0c11" />
        </button>
      </div>

      <div className={s.body}>
        <div className={newsCardStyles.meta}>
          <span className={newsCardStyles.eventType}>
            <span className={`${newsCardStyles.eventDot} ${eventTypeDotClassName}`} aria-hidden="true" />
            <span className={newsCardStyles.eventLabel}>{eventTypeLabel}</span>
          </span>
          <span className={newsCardStyles.sep} aria-hidden="true" />
          <span className={newsCardStyles.time}>{formatTimeAgo(item.eventDate)}</span>
        </div>

        <h3 id={TITLE_ID} className={s.title}>
          {item.title}
        </h3>

        {sanitizedContentHtml ? (
          <div className={s.content} dangerouslySetInnerHTML={{ __html: sanitizedContentHtml }} />
        ) : (
          item.summary && <p className={clsx(s.content, s.contentPlain)}>{item.summary}</p>
        )}

        {sources.length > 0 && (
          <>
            {/* Disclaimer and SOURCE hide together — "written by AI from the
                linked sources" reads wrong when there are zero valid links. */}
            <p className={s.disclaimer}>ⓘ This summary was written by AI from the linked sources.</p>
            <div className={s.sources}>
              <span className={s.sourcesLabel}>Source</span>
              {sources.map(({ domain, url }) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer" className={s.sourceLink}>
                  {domain}
                </a>
              ))}
            </div>
          </>
        )}
      </div>

      <div className={s.footer}>
        <span className={s.footerActions}>
          <NewsShareMenu item={item} source="news-modal" variant="button" side="top" onOpenChange={setShareOpen} />
          {/* Gated on hydration (like the feed rows) so a pre-hydration click on a
              deep-linked modal can't misread a signed-in viewer as a guest. */}
          {isHydrated && (
            <UpvoteButton
              count={item.upvoteCount ?? 0}
              voted={Boolean(item.viewerHasUpvoted)}
              onToggle={handleUpvoteClick}
            />
          )}
        </span>
      </div>
    </Modal>
  );
}
