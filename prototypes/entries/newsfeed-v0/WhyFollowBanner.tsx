'use client';

import { TeamsIcon } from '@/components/core/navbar/components/icons';

// Reuse the FollowWhyCard styling (card shell + head); local module for the icon badge.
import s from '../follow-shared/FollowWhyCard.module.scss';
import local from './NewsfeedV0.module.scss';

/**
 * Static rail explainer: why follow teams. Sits above the digest banner in the
 * banner-mode rail. Scoped to the one thing following actually does today —
 * surface more of a team's news in the feed — so it doesn't over-promise the
 * forum / events / hiring signals that aren't wired up yet.
 */
export function WhyFollowBanner() {
  return (
    <section className={s.card} aria-label="Why follow teams">
      <span className={local.railIconBadge} aria-hidden="true">
        <TeamsIcon />
      </span>
      <header className={s.head}>
        <p className={local.railBlockTitle}>Stay in the loop</p>
        <p className={s.lede}>Follow a team to pull its latest news and updates to the top of your feed.</p>
      </header>
    </section>
  );
}
