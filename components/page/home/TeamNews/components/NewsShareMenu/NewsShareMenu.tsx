'use client';

import { useEffect, useRef, useState } from 'react';
import { Menu } from '@base-ui-components/react/menu';

import { useTeamNewsAnalytics, type TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import type { ITeamNewsItem } from '@/types/team-news.types';
import type { IFeedForumPost } from '@/types/feed.types';

import { buildShareIntentUrl, type ShareIntentNetwork } from '../../utils/buildShareIntentUrl';

import s from './NewsShareMenu.module.scss';
import { CheckIcon } from '@/components/icons';

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="m8.7 10.7 6.6-4.4m-6.6 7.4 6.6 4.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

interface ShareMenuCoreProps {
  /** Canonical deep link — built, never read from location.href (the current
   *  URL may carry filters, utm params, or a different story's uid). Called
   *  lazily so window is only touched on interaction. */
  getShareLink: () => string;
  /** Text prefixed to the link in the LinkedIn/X intents. */
  shareText: string;
  ariaLabel: string;
  onShared: (network: ShareIntentNetwork | 'copy') => void;
  /** 'icon' — glyph-only trigger for feed rows; 'button' — quiet icon+"Share"
   *  trigger for the modal footer. One component, one popup, two triggers. */
  variant?: 'icon' | 'button';
  /** Which side of the trigger the popup opens on. The modal footer sits at
   *  the bottom edge of a clipped card, so it opens 'top'; feed rows keep the
   *  default 'bottom'. Base UI still collision-flips when there's no room. */
  side?: 'top' | 'bottom';
  /** Fires on every popup transition (base-ui guarantees self-initiated closes
   *  report too). The modal uses it to gate its own Escape/backdrop close so
   *  one gesture never dismisses both layers. */
  onOpenChange?: (open: boolean) => void;
}

/** Share popover shell: LinkedIn / X intents + copy link. Hardened adaptation
 *  of the jobs ReferMenu on base-ui Menu — portal, positioning, outside-press
 *  and Escape handling come from the library. Wrapped per share target below
 *  (news story, feed forum post); extract from THIS component for any new
 *  share surface, never from ReferMenu. */
function ShareMenuCore({
  getShareLink,
  shareText,
  ariaLabel,
  onShared,
  variant = 'icon',
  side = 'bottom',
  onOpenChange,
}: ShareMenuCoreProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const share = (network: ShareIntentNetwork) => {
    const shareUrl = buildShareIntentUrl(network, getShareLink(), shareText);
    // `noopener` must stay in the features string: a non-empty features list
    // grants window.opener unless explicitly denied (the anchor-default
    // implicit noopener does not apply to window.open with features).
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
    onShared(network);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareLink());
      // Restart the feedback window on every copy — a bare setTimeout would
      // let a previous timer snuff a fresh "Link copied!" mid-display.
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      setCopied(true);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 1500);
      onShared('copy');
    } catch {
      // Clipboard can be blocked (insecure context, permissions) — silent
      // no-op per the no-toasts-in-TeamNews convention.
    }
  };

  return (
    <Menu.Root modal={false} open={open} onOpenChange={handleOpenChange}>
      {/* stopPropagation everywhere: feed rows are click-to-open-modal buttons,
          so no share interaction may reach the layer beneath. */}
      <Menu.Trigger
        className={variant === 'button' ? s.buttonTrigger : s.iconTrigger}
        aria-label={ariaLabel}
        onClick={(e) => e.stopPropagation()}
      >
        <ShareIcon />
        {variant === 'button' && <span>Share</span>}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={s.positioner} side={side} align="end" sideOffset={6}>
          <Menu.Popup className={s.popup} onClick={(e) => e.stopPropagation()}>
            <div className={s.popupTitle}>Share</div>
            <Menu.Item className={s.item} onClick={() => share('linkedin')}>
              <img src="/icons/social-linkedin.svg" alt="" width={18} height={18} aria-hidden="true" />
              Share on LinkedIn
            </Menu.Item>
            <Menu.Item className={s.item} onClick={() => share('x')}>
              <img src="/icons/social-x.svg" alt="" width={18} height={18} aria-hidden="true" />
              Share on X
            </Menu.Item>
            <Menu.Item className={`${s.item} ${copied ? s.itemCopied : ''}`} closeOnClick={false} onClick={copyLink}>
              {copied ? (
                <span className={s.inline}>
                  <CheckIcon width={14} height={14} /> Link copied
                </span>
              ) : (
                <span className={s.inline}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path
                      d="M8.5 11.5a3 3 0 0 0 4.24 0l2.3-2.3a3 3 0 1 0-4.24-4.24l-1.1 1.1M11.5 8.5a3 3 0 0 0-4.24 0l-2.3 2.3a3 3 0 1 0 4.24 4.24l1.1-1.1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                  Copy link
                </span>
              )}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

interface NewsShareMenuProps {
  item: ITeamNewsItem;
  source: TeamNewsAnalyticsSource;
  variant?: 'icon' | 'button';
  side?: 'top' | 'bottom';
  onOpenChange?: (open: boolean) => void;
}

/** Share popover for a news story — /home?news=<uid> deep link. */
export function NewsShareMenu({ item, source, variant, side, onOpenChange }: NewsShareMenuProps) {
  const analytics = useTeamNewsAnalytics();
  return (
    <ShareMenuCore
      getShareLink={() => `${window.location.origin}/home?news=${encodeURIComponent(item.uid)}`}
      shareText={`${item.title} — ${item.teamName}`}
      ariaLabel={`Share ${item.title}`}
      onShared={(network) => analytics.onTeamNewsShared(item, network, source)}
      variant={variant}
      side={side}
      onOpenChange={onOpenChange}
    />
  );
}

interface FeedForumPostShareMenuProps {
  post: IFeedForumPost;
  source: TeamNewsAnalyticsSource;
  variant?: 'icon' | 'button';
  side?: 'top' | 'bottom';
  onOpenChange?: (open: boolean) => void;
}

/** Share popover for a feed forum post — shares the FEED deep link
 *  (/home?post=<uid>), not the NodeBB topic URL: the feed card (with its
 *  feed-only comments) is the thing being shared. Recipients without forum
 *  access see a plain /home (the server enforces the actual boundary). */
export function FeedForumPostShareMenu({ post, source, variant, side, onOpenChange }: FeedForumPostShareMenuProps) {
  const analytics = useTeamNewsAnalytics();
  return (
    <ShareMenuCore
      getShareLink={() => `${window.location.origin}/home?post=${encodeURIComponent(post.uid)}`}
      shareText={`${post.title} — ${post.author.name}`}
      ariaLabel={`Share ${post.title}`}
      onShared={(network) => analytics.onFeedForumPostShared(post, network, source)}
      variant={variant}
      side={side}
      onOpenChange={onOpenChange}
    />
  );
}
