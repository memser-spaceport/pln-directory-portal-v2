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
  /** How many roles the board is currently showing — the banner counts what's on
   *  screen, so narrowing the rail narrows the number rather than making it a lie. */
  roleCount: number;
  /** How many teams those roles are spread across — the second half of the
   *  headline's claim, filtered for the same reason `roleCount` is. */
  teamCount: number;
  onSignIn: () => void;
  /** The other door, and a genuinely different one: it opens `JobSignUpModal`,
   *  the form that creates the account — the same form Apply opens for a
   *  logged-out visitor. Sign in, next to it, just signs the mock in. */
  onSignUp: () => void;
}

/**
 * The logged-out sign-in banner. A transcription of `Welcome`, not an import of
 * it, for one reason: `Welcome`'s CTA is `LoginBtn`, which pushes `#login` and
 * hands the page to the real Privy modal — which would lose the thing this
 * prototype is about. Everything visual comes from `Welcome.module.scss`; only
 * the click target and the copy are local.
 *
 * **The headline is the inventory; the case for signing in is the two bullets
 * under it.** It used to be the other way round — "Sign in to apply for 34 open
 * roles with one click" — which spent the loudest line on an ask the two buttons
 * in the same row already make, in the product's own auth vocabulary. What the
 * line says now is what the board holds and how far it spreads: "Browse 34 open
 * roles across 6 PL network teams", the role count in `welcome.titleHighlight`
 * (a colour swap to the brand blue, nothing more) because it is the number worth
 * reading first. Under it, `ApplyValueBullets` makes the argument for a profile
 * in two claims — one profile applies everywhere, and founders come to you — and
 * that component is shared with the signed-in nudge banner so the two states
 * cannot end up making different promises.
 *
 * **"Welcome to LabOS" is gone, deliberately.** A greeting is not an offer, and
 * this strip is the board's one standing sign-in ask; spending its loudest line
 * on hello demotes the ask to the sub-line, where it reads as a footnote to an
 * introduction. Someone scrolling a list of jobs does not need to be told which
 * product they opened.
 *
 * **The count is what's on screen, not what's in the database.** `roleCount` is
 * the filtered length, so narrowing the rail narrows the number. A banner still
 * claiming 34 above a list showing 6 is contradicted by the six rows under it.
 *
 * **Narrowing the rail also pins it.** Filtering *is* the statement of intent, so
 * the ask escalates when it's earned, and it escalates by staying in view rather
 * than by blocking: the person keeps browsing, and the offer is still there when
 * they decide. Nothing is taken hostage to get a login. Pinned, the supporting
 * line reads their own selection back — the same stash-sign-in-replay shape
 * production's `JobAlertBanner` uses — so the offer names the roles in front of
 * them instead of opening with a generic pitch.
 *
 * The pinned state used to drop the title and run on the sub alone. It can't any
 * more: the count lives in the title, so the title is what survives, the bullets
 * give way to the one-line read-back, and `s.oneLine` rides on both lines — a
 * wrapped headline, or a long selection
 * ("Engineering · Senior · Lead · Remote · Berlin"), would grow a strip that is
 * pinned over the list it's supposed to ride along with. The switch happens on
 * filter, not on scroll, so nothing reflows under the reader.
 *
 * **This is the only sign-in ask on the board.** A timed dwell modal used to sit
 * on top of it, opening itself after 20s and splitting the work: the banner as
 * the standing offer, the modal as the one moment it stepped forward. It's gone.
 * Once every role row grew a real Apply button, the ask was already being made
 * at the moment of intent, thirteen times over — and an interstitial that
 * interrupts to repeat what the page says in two other places is a toll, not an
 * offer. What's left costs nothing to ignore and is still there when the person
 * decides, which is the whole argument for a standing ask.
 */
/**
 * The two things a profile buys you, in the reviewer's own words — one line each.
 *
 * Two banners now say this: the logged-out one (below) and `ProfileNudgeBanner`,
 * which asks a signed-in member with an empty profile for the same thing. It is
 * the same argument in both places — the account is not the point, the profile
 * is — so it is one component rather than two sentences that will drift. The
 * only difference is the door: signed out, the first bullet names signing in,
 * because that is the step in front of them.
 *
 * A real `<ul>`, not two sentences with a `<br />` between them. They are two
 * independent claims of equal weight, and prose runs them together — which is
 * exactly what the earlier one-paragraph version did, and why it read as a
 * single long sentence about nothing in particular.
 */
export function ApplyValueBullets({ signedOut = false }: { signedOut?: boolean }) {
  return (
    <ul className={`${welcome.sub} ${s.valueBullets}`}>
      <li>
        {signedOut ? 'Sign in and apply' : 'Apply'} to hundreds of startup teams across the network with a single
        profile.
      </li>
      {/* The half a job board can't show you: the profile is not only how you
          apply, it's how you're found. Stated second because it's the payoff you
          get without doing anything else. */}
      <li>Founders reach out when your profile matches the roles they&apos;re hiring for.</li>
    </ul>
  );
}

export function SignInBanner({ criteria, roleCount, teamCount, onSignIn, onSignUp }: SignInBannerProps) {
  const filtersApplied = hasCriteria(criteria);

  return (
    <div className={clsx(s.slot, filtersApplied && s.pinned)}>
      <section className={clsx(welcome.welcome, filtersApplied && s.condensed)}>
        <div className={welcome.text}>
          {/* The headline is what the board *is*, counted: how much there is and
              how far it spreads. It used to be the offer ("Sign in to apply for
              13 open roles with one click"), which put the ask in the loudest
              line and the inventory nowhere — but the two buttons to the right
              already are the ask, in the product's own auth vocabulary, so the
              headline was spending itself on something the row states anyway.
              The case for signing in moves down one line, where it is two
              bullets that can each be read on their own.

              Both numbers are the *filtered* ones, so narrowing the rail narrows
              the claim rather than making it a lie. */}
          <p className={clsx(welcome.title, filtersApplied && s.oneLine)}>
            {roleCount > 0 ? (
              <>
                Browse{' '}
                <span className={welcome.titleHighlight}>
                  {roleCount} open {roleCount === 1 ? 'role' : 'roles'}
                </span>{' '}
                across {teamCount} PL network {teamCount === 1 ? 'team' : 'teams'}
              </>
            ) : (
              /* Zero is a filter result, not a smaller board: "browse 0 open
                 roles" is an invitation to do nothing, and the empty state
                 directly below already says there's nothing there. The counts
                 drop out and the standing claim stays, so it's already in place
                 when the person widens the rail again. */
              <>Browse every open role across the PL network</>
            )}
          </p>
          {filtersApplied || roleCount === 0 ? (
            <p className={clsx(welcome.sub, filtersApplied && s.oneLine)}>
              {roleCount === 0 ? (
                /* No selection read-back at zero. Repeating a narrowing that
                   returned nothing back at the person is rubbing it in, and the
                   empty state owns that message. */
                <>
                  Your profile goes with every application, so when a role does fit, applying is a cover letter and
                  nothing else.
                </>
              ) : (
                <>
                  Looking for <strong className={s.criteria}>{summariseCriteria(criteria)}</strong>? Your profile goes
                  with the application, so all you write is a cover letter.
                </>
              )}
            </p>
          ) : (
            /* Unfiltered, the strip is at full height and can carry the two
               claims as a list. Filtered it is pinned and clamped to one line
               each, so the read-back above stands in — a two-item list truncated
               to one line is a list with something missing. */
            <ApplyValueBullets signedOut />
          )}
        </div>
        {/* Both doors, in the navbar's order and with the navbar's ranking: Sign
            up quiet and bordered, Sign in filled. The header two rows above shows
            exactly this pair, so an auth cluster reads the same wherever it turns
            up — and a person who reached the board without an account is not
            asked to work out that "Sign in" was meant to include them.

            The shape is the banner's, not the header's. The navbar pair are 40px
            pills; `welcome.cta` is an 8px-radius rectangle, and two radii in one
            cluster reads as two unrelated controls. So geometry comes from the
            CTA it stands beside and only the tone — neutral text, slate border,
            white fill — is taken from `Signup.module.scss`. See `.ctaSecondary`.

            `LoginBtn` renders a bare `<button className={className}>`, so a plain
            button wearing the same class is pixel-identical to production's. */}
        <div className={s.ctaGroup}>
          <button type="button" className={s.ctaSecondary} onClick={onSignUp}>
            Sign up
          </button>
          {/* Sentence case, per the auth-copy standard the rest of these prototypes
              hold to (production's Welcome still says "Sign In"; `LoginBtn`'s own
              default already says "Sign in"). */}
          <button type="button" className={welcome.cta} onClick={onSignIn}>
            Sign in
            {/* The arrow stays on Sign in alone. It marks the action the headline
                names, and on both buttons it would mark neither. */}
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
        </div>
      </section>
    </div>
  );
}
