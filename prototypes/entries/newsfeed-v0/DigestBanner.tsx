'use client';

import { Button } from '@/components/common/Button';
import { ArrowRight } from '@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton/components/Icons';

import local from './NewsfeedV0.module.scss';

interface Props {
  /** Whether this user already gets the digest — drives which banner renders. */
  subscribed: boolean;
  onToggle: () => void;
}

/**
 * Rail module: the network-news email digest, in two states.
 *  - Not subscribed → a low-key subscribe banner: soft brand tint, dark
 *    title/subtitle, and a full-width filled-brand "Subscribe" DS
 *    button that carries the emphasis (toned down from the original loud
 *    brand-blue gradient promo).
 *  - Already subscribed → the same banner shape, greyed out, pointing to
 *    Settings (production's real digest control lives in Settings › email
 *    preferences) — no pitch spent on something they already have.
 * Fills the banner-mode rail so the feed section spans the full width.
 */
export function DigestBanner({ subscribed, onToggle }: Props) {
  if (subscribed) {
    return (
      <section className={local.digestGrey} aria-label="You're subscribed to the news digest">
        <span className={local.railIconBadge} aria-hidden="true">
          <MailIcon />
        </span>
        <div className={local.digestPromoText}>
          <p className={local.railBlockTitle}>You&apos;re subscribed to the Digest</p>
          <p className={local.digestGreyBody}>Change frequency or unsubscribe anytime in Settings.</p>
        </div>
        <Button
          size="xs"
          style="link"
          variant="secondary"
          underline={false}
          className={local.digestManageBtn}
          onClick={onToggle}
        >
          <span>Manage in Settings</span>
          <ArrowRight />
        </Button>
      </section>
    );
  }

  return (
    <section className={local.digestPromo} aria-label="Subscribe to the news digest">
      <div className={local.digestPromoText}>
        <p className={local.digestPromoTitle}>Get network news Digest</p>
        <p className={local.digestPromoBody}>
          A news digest covering raises, launches, and milestones across the network, straight to your inbox.
        </p>
      </div>
      <Button
        size="s"
        style="fill"
        variant="primary"
        underline={false}
        className={local.digestPromoBtn}
        onClick={onToggle}
      >
        <span>Subscribe</span>
      </Button>
    </section>
  );
}

const MailIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 6l7 5 7-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
