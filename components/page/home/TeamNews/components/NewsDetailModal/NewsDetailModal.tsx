'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { Modal } from '@/components/common/Modal';
import { useCurrentUserStore } from '@/services/auth/store';
import type { ITeamNewsItem } from '@/types/team-news.types';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getTeamLogoFallback } from '../../utils/getTeamLogoFallback';
import { getEventTypeConfig } from '../../utils/getEventTypeConfig';
import { getNewsSourcesWithPrimaryFallback } from '../../utils/getNewsSources';

import { StartConversationButton } from '../NewsCard/components/StartConversationButton';
import { UpvoteButton } from '../NewsCard/components/UpvoteButton';

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
  // Richer multi-paragraph content is pending a BE contract (field TBD on
  // ITeamNewsItem); until it lands the modal renders the feed summary.
  const content = item.summary;

  return (
    <Modal isOpen onClose={handleClose} ariaLabelledBy={TITLE_ID} lockScroll inertBackground className={s.modal}>
      <div className={s.body}>
        <div className={s.head}>
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
          <button ref={focusOnAttach} type="button" className={s.close} aria-label="Close" onClick={handleClose}>
            ✕
          </button>
        </div>

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

        {content && <p className={s.content}>{content}</p>}

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
        {/* Gated on hydration (like the feed rows) so a pre-hydration click on a
            deep-linked modal can't misread a signed-in viewer as a guest. */}
        {isHydrated && (
          <UpvoteButton
            count={item.upvoteCount ?? 0}
            voted={Boolean(item.viewerHasUpvoted)}
            onToggle={handleUpvoteClick}
          />
        )}
        <span className={s.footerSpacer} />
        <StartConversationButton item={item} position={0} analyticsSource="news-modal" />
      </div>
    </Modal>
  );
}
