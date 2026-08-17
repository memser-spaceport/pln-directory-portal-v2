'use client';

import clsx from 'clsx';

// Production's logged-out home banner, reused as-is: `components/page/home/Welcome`
// is what a signed-out visitor already meets at `/home` (app/home/page.tsx renders
// it behind `!isLoggedIn`), so the board wears the same surface, the same type and
// the same blue CTA rather than inventing a second sign-in look.
import welcome from '@/components/page/home/Welcome/Welcome.module.scss';

import { hasCriteria, summariseCriteria, type RoleCriteria } from './viewerState';
import s from './SignInBanner.module.scss';

interface SignInBannerProps {
  /** What the rail is narrowed to — the intent the visitor has already expressed. */
  criteria: RoleCriteria;
  onSignIn: () => void;
}

/**
 * The logged-out sign-in banner. A transcription of `Welcome`, not an import of
 * it, for one reason: `Welcome`'s CTA is `LoginBtn`, which pushes `#login` and
 * hands the page to the real Privy modal — which would lose the thing this
 * prototype is about. Everything visual comes from `Welcome.module.scss`; only
 * the click target and the second line are local.
 *
 * The second line carries the intent. Once the rail is narrowed the visitor has
 * already said what they want, so the banner reads it back and offers to keep it
 * — the same stash-sign-in-replay shape production's `JobAlertBanner` uses —
 * rather than opening with a generic pitch on a page where the person is clearly
 * already looking for something specific.
 *
 * **Narrowing the rail also pins it.** Filtering *is* the statement of intent,
 * and the four axes the rail collects are exactly the four the preferences modal
 * wants — so the ask escalates when it's earned, and it escalates by staying in
 * view rather than by blocking: the person keeps browsing, and the offer is
 * still there when they decide. Nothing is taken hostage to get a login.
 *
 * `SignInPromptModal` now sits on top of this as the timed ask, and the two split
 * the work rather than competing: this one is the standing offer that is always
 * there and costs nothing to ignore, the modal is the single moment it steps
 * forward. That's also why the modal is once per session — every other second on
 * the page, the banner is the ask.
 *
 * The pinned state drops the "Welcome to LabOS" title and runs as one line. An
 * introduction is for someone who just arrived; someone filtering has arrived.
 * It also has to be short enough to ride along without eating the list. The
 * switch happens on filter, not on scroll, so nothing reflows under the reader.
 */
export function SignInBanner({ criteria, onSignIn }: SignInBannerProps) {
  const filtersApplied = hasCriteria(criteria);

  return (
    <div className={clsx(s.slot, filtersApplied && s.pinned)}>
      <section className={clsx(welcome.welcome, filtersApplied && s.condensed)}>
        <div className={welcome.text}>
          {!filtersApplied && (
            <p className={welcome.title}>
              Welcome to <span className={welcome.titleHighlight}>LabOS</span>
            </p>
          )}
          <p className={clsx(welcome.sub, filtersApplied && s.oneLine)}>
            {filtersApplied ? (
              <>
                Looking for <strong className={s.criteria}>{summariseCriteria(criteria)}</strong>? Sign in to save it
                and sort the board around it.
              </>
            ) : (
              <>
                Every open role across the Protocol Labs network. Sign in to tell us what you&apos;re looking for —
                we&apos;ll sort the board around it and let hiring teams find you.
              </>
            )}
          </p>
        </div>
        {/* `LoginBtn` renders a bare `<button className={className}>`, so a plain
            button wearing the same class is pixel-identical to production's. */}
        <button type="button" className={welcome.cta} onClick={onSignIn}>
          {/* Sentence case, per the auth-copy standard the rest of these prototypes
              hold to (production's Welcome still says "Sign In"; `LoginBtn`'s own
              default already says "Sign in"). */}
          Sign in
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </section>
    </div>
  );
}
