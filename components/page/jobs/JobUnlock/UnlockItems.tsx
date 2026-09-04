'use client';

import clsx from 'clsx';

import { UNLOCK_ITEMS } from './unlockCopy';
import s from './UnlockItems.module.scss';

/**
 * The two numbered reasons, at one of two sizes.
 *
 * Lifted out of `JobUnlockBanner` when the footer popover and its mobile modal
 * became second and third readers of the same list. The chrome around it — the
 * `<section>`, the heading, the tinted surface — stayed behind with the banner,
 * because that part genuinely differs between a card in the body of a step and a
 * popup anchored to a caption.
 *
 * **Numbers, against a prior decision.** `SignInBanner` in `prototypes/` makes a
 * two-item case for a profile as plain discs and argues for it — "two lines of
 * the banner's own sub-copy is not a feature grid". The design asks for numbered
 * badges here, which is a fair reversal for a standalone card rather than two
 * lines inside a strip. The one place to watch it is a logged-out visitor on a
 * Protocol Labs role, where the three-step rail is *not* withheld and the body
 * card sits below it — see `ApplyFlowSteps`, which argues that two circle-bearing
 * rails in one viewport read as one journey drawn twice. The full size's circles
 * are 20px and solid where the rail's are 32px and outlined, which is what keeps
 * them reading as a list.
 */
export function UnlockItems({ size = 'full' }: { size?: 'full' | 'compact' }) {
  return (
    /* `role="list"` because `list-style: none` strips list semantics in
       Safari/VoiceOver, and the ordering is the only thing telling a screen
       reader these are two of a set — the badges cannot, being decorative. */
    <ol role="list" className={clsx(s.list, size === 'compact' && s.compact)}>
      {UNLOCK_ITEMS.map((item, index) => (
        <li key={item.head} className={s.item}>
          {/* Decorative. The <ol> already conveys "1 of 2"; announcing the
              digit as content would say it twice. */}
          <span className={s.badge} aria-hidden="true">
            {index + 1}
          </span>
          <p className={s.itemHead}>{item.head}</p>
          <p className={s.itemBody}>{item.body}</p>
        </li>
      ))}
    </ol>
  );
}
