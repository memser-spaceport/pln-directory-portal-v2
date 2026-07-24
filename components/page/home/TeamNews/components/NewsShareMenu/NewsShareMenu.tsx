'use client';

import { useEffect, useRef, useState } from 'react';
import { Menu } from '@base-ui-components/react/menu';

import { useTeamNewsAnalytics, type TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import type { ITeamNewsItem } from '@/types/team-news.types';

import { buildShareIntentUrl, type ShareIntentNetwork } from '../../utils/buildShareIntentUrl';

import s from './NewsShareMenu.module.scss';

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

interface NewsShareMenuProps {
  item: ITeamNewsItem;
  source: TeamNewsAnalyticsSource;
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

/** Share popover for a news story: LinkedIn / X intents + copy link.
 *  Hardened adaptation of the jobs ReferMenu (which is prototype-only and
 *  jobs-typed) on base-ui Menu — portal, positioning, outside-press and
 *  Escape handling come from the library. If a third share surface appears,
 *  extract from THIS component, not ReferMenu.
 *  The /home?news= URL construction is this component's only home-page
 *  coupling — make the link a prop before reusing it elsewhere. */
export function NewsShareMenu({ item, source, variant = 'icon', side = 'bottom', onOpenChange }: NewsShareMenuProps) {
  const analytics = useTeamNewsAnalytics();
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

  // Canonical deep link — built, never read from location.href (the current
  // URL may carry filters, utm params, or a different story's uid).
  const getShareLink = () => `${window.location.origin}/home?news=${encodeURIComponent(item.uid)}`;

  const share = (network: ShareIntentNetwork) => {
    const shareUrl = buildShareIntentUrl(network, getShareLink(), `${item.title} — ${item.teamName}`);
    // `noopener` must stay in the features string: a non-empty features list
    // grants window.opener unless explicitly denied (the anchor-default
    // implicit noopener does not apply to window.open with features).
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
    analytics.onTeamNewsShared(item, network, source);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareLink());
      // Restart the feedback window on every copy — a bare setTimeout would
      // let a previous timer snuff a fresh "Link copied!" mid-display.
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      setCopied(true);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 1500);
      analytics.onTeamNewsShared(item, 'copy', source);
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
        aria-label={`Share ${item.title}`}
        onClick={(e) => e.stopPropagation()}
      >
        <ShareIcon />
        {variant === 'button' && <span>Share</span>}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={s.positioner} side={side} align="end" sideOffset={6}>
          <Menu.Popup className={s.popup} onClick={(e) => e.stopPropagation()}>
            <Menu.Item className={s.item} onClick={() => share('linkedin')}>
              <img src="/icons/social-linkedin.svg" alt="" width={18} height={18} aria-hidden="true" />
              Share on LinkedIn
            </Menu.Item>
            <Menu.Item className={s.item} onClick={() => share('x')}>
              <img src="/icons/social-x.svg" alt="" width={18} height={18} aria-hidden="true" />
              Share on X
            </Menu.Item>
            <Menu.Item className={`${s.item} ${copied ? s.itemCopied : ''}`} closeOnClick={false} onClick={copyLink}>
              {copied ? '✓ Link copied!' : 'Copy link'}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
