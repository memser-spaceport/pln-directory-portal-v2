'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import DOMPurify from 'isomorphic-dompurify';

import { ArrowBackIcon, CloseIcon } from '@/components/icons';
import { useCurrentUserStore } from '@/services/auth/store';
import { FollowButton } from '@/components/ui/FollowButton';
import type { TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import type { ITeamNewsItem } from '@/types/team-news.types';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getTeamLogoFallback } from '../../utils/getTeamLogoFallback';
import { getEventTypeConfig } from '../../utils/getEventTypeConfig';
import { getNewsSourcesWithPrimaryFallback } from '../../utils/getNewsSources';

import { UpvoteButton } from '../NewsCard/components/UpvoteButton';
import { NewsShareMenu } from '../NewsShareMenu';
import { ViewCount } from '../ViewCount/ViewCount';
import { FeedCommentsThread } from '../FeedCommentsThread/FeedCommentsThread';

import newsCardStyles from '../NewsCard/NewsCard.module.scss';
import s from './NewsDetailModal.module.scss';

export const TITLE_ID = 'news-detail-modal-title';

interface NewsDetailBodyProps {
  /** Resolved from overlay-merged items — carries live viewerHasUpvoted/upvoteCount.
   *  The single source of truth; no separate viewer-state props that could disagree. */
  item: ITeamNewsItem;
  onClose: () => void;
  /** Leads the header with Back when a shell drills IN PLACE rather than opening
   *  its own overlay (the team profile's news archive). Absent on /home, where
   *  the modal is the only layer and there is nothing behind it to go back to. */
  onBack?: () => void;
  onUpvoteToggle: (item: ITeamNewsItem) => void;
  isFollowing?: boolean;
  /** Omitted on a team profile — the page is that team, and it carries its own
   *  follow block; a second control for the same thing would be two answers. */
  onFollowToggle?: (teamUid: string, teamName: string, isCurrentlyFollowing: boolean) => void;
  /** Attribution for the thread and share menu. /home reads 'news-modal'; the team
   *  profile passes where the reader was when they opened the story. */
  source?: TeamNewsAnalyticsSource;
  /** Where a guest is sent to sign in. /home builds `/home?news=<uid>#login` so the
   *  round-trip restores the story; other surfaces fall back to the current URL,
   *  which keeps the reader on the page they were reading. */
  loginHref?: string;
  /** Lifted: while the share popover is open the SHELL detaches its own
   *  Escape/backdrop closers, so the first Escape closes the popover, not the modal. */
  onShareOpenChange?: (open: boolean) => void;
}

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

/**
 * One story, in full — header, body and footer actions, as three siblings for
 * whatever shell wraps them.
 *
 * Presentational on purpose: /home's `NewsDetailModal` puts it in its own
 * overlay, while the team profile's archive renders it INSIDE the box the list
 * was in, so clicking a row drills rather than stacking a second modal on the
 * first. Both shells are flex columns, so head/body/footer land the same way in
 * each and a story reads identically wherever it's opened.
 */
export function NewsDetailBody({
  item,
  onClose,
  onBack,
  onUpvoteToggle,
  isFollowing = false,
  onFollowToggle,
  source = 'news-modal',
  loginHref,
  onShareOpenChange,
}: NewsDetailBodyProps) {
  const router = useRouter();
  const { currentUser, isHydrated } = useCurrentUserStore();

  // Move focus into the newly rendered view — Back when the shell drilled in
  // place (the way out of where you just arrived), Close otherwise. A callback
  // ref, not a mount effect: the shared Modal portals its children only after
  // its own client-mount effect, so this component's effects run before the
  // button exists in the DOM — the ref fires exactly when it attaches.
  const focusOnAttach = useCallback((node: HTMLButtonElement | null) => {
    node?.focus();
  }, []);

  const gateGuest = () => {
    // Constructed, not read from location.href — /home's URL write on open is
    // synchronous (history.replaceState), but building the target explicitly
    // keeps the login round-trip correct even if that ever changes. Elsewhere
    // there is no ?news= param to carry, so the current URL is the target.
    const href = loginHref ?? `${window.location.pathname}${window.location.search}#login`;
    // scroll: false — Next resolves this push as a real navigation (its
    // canonicalUrl never learned the ?news= param, since useNewsDeepLink
    // writes it via raw history.replaceState) and would otherwise reset
    // the feed's scroll position to the top on every guest login-gate.
    router.push(href, { scroll: false });
  };

  const handleFollowClick = () => {
    if (!currentUser) {
      gateGuest();
      return;
    }
    onFollowToggle?.(item.teamUid, item.teamName, isFollowing);
  };

  const handleUpvoteClick = () => {
    if (!currentUser) {
      gateGuest();
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
    <>
      {/* Sticky header: Back (when drilled) + team identity on the left,
          standardized close button on the right — pinned above the scrolling body. */}
      <div className={s.head}>
        <div className={s.headIdentity}>
          {onBack && (
            <button
              ref={focusOnAttach}
              type="button"
              className={s.backButton}
              onClick={onBack}
              aria-label="Back to the news list"
            >
              <ArrowBackIcon width={18} height={18} />
              <span>Back</span>
            </button>
          )}
          {item.teamLogoUrl ? (
            <img className={newsCardStyles.logo} src={item.teamLogoUrl} alt="" loading="lazy" />
          ) : (
            <div className={newsCardStyles.logoFallback}>{getTeamLogoFallback(item.teamName)}</div>
          )}
          <a href={`/teams/${item.teamUid}`} target="_blank" rel="noopener noreferrer" className={newsCardStyles.teamName}>
            {item.teamName}
          </a>
          {isHydrated && onFollowToggle && (
            <FollowButton following={isFollowing} onClick={handleFollowClick} name={item.teamName} size="compact" />
          )}
        </div>
        <button
          ref={onBack ? undefined : focusOnAttach}
          type="button"
          className={s.closeButton}
          aria-label="Close"
          onClick={onClose}
        >
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

        {/* Always expanded in the modal (prototype's FeedDetailModal parity). */}
        <FeedCommentsThread itemUid={item.uid} kind="news" source={source} />
      </div>

      <div className={s.footer}>
        <span className={s.footerActions}>
          <NewsShareMenu item={item} source={source} variant="button" side="top" onOpenChange={onShareOpenChange} />
          <ViewCount count={item.viewCount} exact />
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
    </>
  );
}
