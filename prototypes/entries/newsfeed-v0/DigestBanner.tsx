'use client';

import { useState } from 'react';

import { Button } from '@/components/common/Button';

import local from './NewsfeedV0.module.scss';

/**
 * Rail module: the network-news email digest, in two states (self-managed).
 *  - Not subscribed → a low-key subscribe banner: soft brand tint, dark
 *    title/subtitle, and a full-width filled-brand "Subscribe" DS button.
 *  - Already subscribed → the same banner shape, greyed out, pointing to
 *    Settings (production's real digest control lives in Settings › email
 *    preferences).
 */
export function DigestBanner() {
  const [subscribed, setSubscribed] = useState(false);
  const onToggle = () => setSubscribed((v) => !v);

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

// Inlined from the production StartConversationButton's Icons.tsx, which was
// deleted along with the Discuss affordance — this banner was its last consumer.
const ArrowRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="10" viewBox="0 0 11 10" fill="none">
    <path
      d="M10.7455 5.06028L6.80805 8.99778C6.68476 9.12106 6.51755 9.19032 6.3432 9.19032C6.16885 9.19032 6.00164 9.12106 5.87836 8.99778C5.75508 8.8745 5.68582 8.70729 5.68582 8.53294C5.68582 8.35859 5.75508 8.19138 5.87836 8.06809L8.69531 5.25223H0.65625C0.482202 5.25223 0.315282 5.18309 0.192211 5.06002C0.0691404 4.93695 0 4.77003 0 4.59598C0 4.42193 0.0691404 4.25501 0.192211 4.13194C0.315282 4.00887 0.482202 3.93973 0.65625 3.93973H8.69531L5.87945 1.12223C5.75617 0.998948 5.68691 0.831738 5.68691 0.657388C5.68691 0.483038 5.75617 0.315829 5.87945 0.192544C6.00274 0.0692602 6.16995 1.83708e-09 6.3443 0C6.51865 -1.83708e-09 6.68586 0.0692602 6.80914 0.192544L10.7466 4.13004C10.8078 4.19109 10.8564 4.26363 10.8894 4.34349C10.9225 4.42335 10.9395 4.50895 10.9394 4.59539C10.9393 4.68183 10.9221 4.76739 10.8888 4.84717C10.8556 4.92695 10.8069 4.99937 10.7455 5.06028Z"
      fill="currentColor"
    />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 6l7 5 7-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
