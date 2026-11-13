'use client';

import { Menu } from '@base-ui-components/react/menu';
import { useEffect, useRef, useState } from 'react';

import { CheckIcon } from '@/components/icons';
import { buildShareIntentUrl, type ShareIntentNetwork } from '@/components/page/home/TeamNews/utils/buildShareIntentUrl';
// Production styles, read-only: the same trigger, popup and items as the feed.
import ps from '@/components/page/home/TeamNews/components/NewsShareMenu/NewsShareMenu.module.scss';

/**
 * Share menu for a digest story. It copies the look and items of the product
 * NewsShareMenu (components/page/home/TeamNews/components/NewsShareMenu): a quiet
 * icon + "Share" trigger, the title "Share", then LinkedIn, X and Copy link.
 *
 * Why a copy and not an import: NewsShareMenu needs an ITeamNewsItem and fires
 * team-news analytics, and its inner ShareMenuCore is not exported. Production
 * should reuse NewsShareMenu with the real news item (variant="button").
 *
 * Mock handlers: LinkedIn and X build the real intent URL but do not open a
 * window; the page shows a toast. Copy link writes the real deep link.
 */

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

interface Props {
  /** Path of the news item in LabOS: `/home?news=<uid>`. */
  sharePath: string;
  /** Text before the link in the X intent: "<title> — <team>". */
  shareText: string;
  ariaLabel: string;
  /** Mock: called with the network and the intent URL instead of window.open. */
  onMockShare: (network: ShareIntentNetwork, intentUrl: string) => void;
}

export function StoryShareMenu({ sharePath, shareText, ariaLabel, onMockShare }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const link = () => `${window.location.origin}${sharePath}`;

  const share = (network: ShareIntentNetwork) => onMockShare(network, buildShareIntentUrl(network, link(), shareText));

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link());
    } catch {
      // The clipboard can be blocked in the preview frame. Show the state anyway.
    }
    if (timer.current) clearTimeout(timer.current);
    setCopied(true);
    timer.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Menu.Root modal={false}>
      <Menu.Trigger className={ps.buttonTrigger} aria-label={ariaLabel}>
        <ShareIcon />
        <span>Share</span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={ps.positioner} side="bottom" align="start" sideOffset={6}>
          <Menu.Popup className={ps.popup}>
            <div className={ps.popupTitle}>Share</div>
            <Menu.Item className={ps.item} onClick={() => share('linkedin')}>
              <img src="/icons/social-linkedin.svg" alt="" width={18} height={18} aria-hidden="true" />
              Share on LinkedIn
            </Menu.Item>
            <Menu.Item className={ps.item} onClick={() => share('x')}>
              <img src="/icons/social-x.svg" alt="" width={18} height={18} aria-hidden="true" />
              Share on X
            </Menu.Item>
            <Menu.Item className={`${ps.item} ${copied ? ps.itemCopied : ''}`} closeOnClick={false} onClick={copyLink}>
              {copied ? (
                <span className={ps.inline}>
                  <CheckIcon width={14} height={14} /> Link copied
                </span>
              ) : (
                <span className={ps.inline}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path
                      d="M8.5 11.5a3 3 0 0 0 4.24 0l2.3-2.3a3 3 0 1 0-4.24-4.24l-1.1 1.1M11.5 8.5a3 3 0 0 0-4.24 0l-2.3 2.3a3 3 0 1 0 4.24 4.24l1.1-1.1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
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
