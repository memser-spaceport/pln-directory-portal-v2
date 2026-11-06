import clsx from 'clsx';
import type { ReactNode } from 'react';

import { PL_CONTEXT } from '@/components/page/explore-pl-network/data/content';
import ei from '@/components/page/explore-pl-network/EditorialIntro/EditorialIntro.module.scss';

import { JoinCard } from './JoinCard';
import s from './HomeV2.module.scss';

/** Marketing's About text up to "Organizations collaborate across…" (its first sentence). */
const INTRO_ABOUT = PL_CONTEXT.about.split(' Organizations collaborate')[0];

/**
 * The signed-out Home's hero (prototype `StoryIntro`, home-v2/StoryIntro.tsx): EditorialIntro's header, left-aligned,
 * beside the Join the network card. 2026-11-02 design standup: no overline and no "The Protocol Labs Network" title;
 * the mission is the page's one H1, then who the network is, cut before "Organizations collaborate across…".
 */
export function HomeHero({
  onSignIn,
  onSignUp,
  faces,
  facts,
}: {
  onSignIn: () => void;
  onSignUp: () => void;
  faces: string[];
  /** Phones only (LAB-3174): the figures between the copy and the Join card, so they show before Sign up / Sign in. */
  facts?: ReactNode;
}) {
  return (
    <section className={s.introGrid} aria-labelledby="home-intro-title">
      <header className={clsx(ei.edHeader, s.introHeader)}>
        <h1 id="home-intro-title" className={clsx(ei.edTitle, s.introTitle)}>
          {PL_CONTEXT.mission}
        </h1>
        <div className={clsx(ei.edBody, s.introBody)}>
          <p>{INTRO_ABOUT}</p>
        </div>
      </header>

      {facts && <div className={s.introFacts}>{facts}</div>}

      <JoinCard id="home-join-title" onSignIn={onSignIn} onSignUp={onSignUp} faces={faces} />
    </section>
  );
}
