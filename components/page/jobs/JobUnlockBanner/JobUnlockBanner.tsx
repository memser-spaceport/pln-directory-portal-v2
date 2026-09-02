'use client';

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
 * **The claims are not new.** Both sentences are the ones already argued
 * through in `prototypes/entries/job-board/SignInBanner.tsx` as
 * `ApplyValueBullets` — they never survived promotion into `JobBoardBanner`,
 * which renders a single line and a button, so the wording has been sitting
 * unused rather than untested. Reusing it keeps this component out of a fresh
 * copy debate, and more importantly keeps it out of the trap the whole apply
 * flow has been walking around: neither line promises a notification or a
 * ranking, because nothing in the code delivers either.
 *
 * **Numbers, against a prior decision.** That prototype chose plain discs for
 * these two lines and said so — "two lines of the banner's own sub-copy is not
 * a feature grid". The design asks for numbered badges here, which is a fair
 * reversal for a standalone card rather than two lines inside a strip. The one
 * place to watch it is a logged-out visitor on a Protocol Labs role, where the
 * three-step rail is *not* withheld and this list sits below it — see
 * `ApplyFlowSteps`, which argues that two circle-bearing rails in one viewport
 * read as one journey drawn twice. These circles are 20px and solid where the
 * rail's are 32px and outlined, which is what keeps them reading as a list.
 *
 * Shown only to logged-out visitors. The gate is the drawer's, not this
 * component's — see `JobApplyFlowDrawer`.
 */

const TITLE_ID = 'job-unlock-banner-title';

const ITEMS = [
  {
    head: 'Get discovered without applying',
    body: "Founders reach out when they're hiring for what you do.",
  },
  {
    head: 'Apply without starting over',
    body: 'Apply to hundreds of open roles with a single profile.',
  },
];

export function JobUnlockBanner() {
  return (
    <section className={s.root} aria-labelledby={TITLE_ID}>
      <h2 id={TITLE_ID} className={s.title}>
        What your profile unlocks
      </h2>
      {/* `role="list"` because `list-style: none` strips list semantics in
          Safari/VoiceOver, and the ordering is the only thing telling a screen
          reader these are two of a set — the badges cannot, being decorative. */}
      <ol role="list" className={s.list}>
        {ITEMS.map((item, index) => (
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
    </section>
  );
}
