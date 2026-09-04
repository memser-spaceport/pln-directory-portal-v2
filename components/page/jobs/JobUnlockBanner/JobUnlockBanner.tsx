'use client';

import { UNLOCK_TITLE } from '@/components/page/jobs/JobUnlock/unlockCopy';
import { UnlockItems } from '@/components/page/jobs/JobUnlock/UnlockItems';

import s from './JobUnlockBanner.module.scss';

/**
 * The case for a profile, made in the body of the review step rather than in
 * the footer.
 *
 * **Why it moved.** This argument used to be one sentence in a tinted note
 * inside the sticky footer bar, sharing 66px of height with two buttons. The
 * board's whole proposition to a stranger is that a profile is what gets
 * founders to come to them, and it was being made in the least room the drawer
 * has. Here it gets to be two reasons instead of one clause, and the footer
 * goes back to being a footer.
 *
 * **What is left here is the chrome.** The words and the numbered list moved out
 * again — to `JobUnlock/`, shared with the footer's popover and that popover's
 * mobile modal — the moment this stopped being their only reader. What stayed is
 * the part that is genuinely this component's: a labelled section, a heading at
 * the body's size, and the tinted surface that marks it as a message rather than
 * content.
 *
 * **The footer still speaks, and that is not a duplicate.** The design draws this
 * card *and* a "What your profile unlocks?" control under the footer's primary
 * button, in the same viewport (Figma 682:10187). It looks like the same thing
 * twice and is not: this card is for someone reading the top of a role, and the
 * popover is for someone who has scrolled a thousand pixels past it to reach the
 * buttons. Confirmed with the design. Do not collapse one into the other.
 *
 * Shown only to logged-out visitors. The gate is the drawer's, not this
 * component's — see `JobApplyFlowDrawer`.
 */

const TITLE_ID = 'job-unlock-banner-title';

export function JobUnlockBanner() {
  return (
    <section className={s.root} aria-labelledby={TITLE_ID}>
      <h2 id={TITLE_ID} className={s.title}>
        {UNLOCK_TITLE}
      </h2>
      <UnlockItems size="full" />
    </section>
  );
}
