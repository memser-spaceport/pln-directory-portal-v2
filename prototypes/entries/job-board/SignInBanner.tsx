'use client';

import clsx from 'clsx';

// Production's logged-out home banner, reused as-is: `components/page/home/Welcome`
// is what a signed-out visitor already meets at `/home` (app/home/page.tsx renders
// it behind `!isLoggedIn`), so the board wears the same surface, the same type and
// the same blue CTA rather than inventing a second sign-in look.
import welcome from '@/components/page/home/Welcome/Welcome.module.scss';

import { hasCriteria, summariseCriteria, type RoleCriteria } from './viewerState';
import s from './SignInBanner.module.scss';

/** The two doors, when the banner is the one offering them. Absent on the
 *  signed-in banners, where there is nothing to sign into. */
interface Doors {
  onSignIn: () => void;
  onSignUp: () => void;
}

interface SignInBannerProps {
  /** What the rail is narrowed to — the intent the visitor has already expressed. */
  criteria: RoleCriteria;
  /** How many roles the board is currently showing — the banner counts what's on
   *  screen, so narrowing the rail narrows the number rather than making it a lie. */
  roleCount: number;
  /** How many teams those roles are spread across — the second half of the
   *  headline, filtered for the same reason `roleCount` is. */
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
 * **The headline is the inventory; the offer is the first bullet.** "Browse 34
 * open roles across 6 PL network teams", the role count in
 * `welcome.titleHighlight` (a colour swap to the brand blue, nothing more).
 *
 * The two swapped jobs for a while — headline as the offer, bullets as support —
 * and swapped back when the reviewer set the bullet copy: *"Sign in or sign up
 * and apply to hundreds of open roles with a single profile."* A headline
 * reading "Apply to 34 open roles with one profile" over that is the same
 * sentence twice, forty pixels apart, at two different counts. Only one of them
 * can be the offer, and the bullet is the one that names the doors.
 *
 * Worth knowing, since it is the standing tension in this card: the headline
 * counts what is *on screen* while the bullet claims *hundreds*, and the list
 * header forty pixels lower repeats the headline's two numbers as "Job Board (34
 * roles across 6 teams)". Both were raised and both are the reviewer's call —
 * the bullet's "hundreds" is a claim about the network rather than about this
 * filtered list.
 *
 * `ApplyValueBullets` carries the two claims, and — since the CTA pair went —
 * the two doors as well, as text buttons inside the first bullet. It is shared
 * with the signed-in `ProfileNudgeBanner` so the two states cannot end up
 * promising different things; only the doors differ, because a member who is
 * already signed in has none.
 *
 * **20 over 14, not `Welcome`'s 24/16.** See `s.bannerTitle` — one scale across
 * all four states of this slot.
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
 * more: the count lives in the title, so the title is what survives, the value
 * line gives way to the read-back, and `s.oneLine` rides on both lines — a
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
 * What a profile buys you.
 *
 * Two banners say it: the logged-out one below, and `ProfileNudgeBanner`, which
 * asks a signed-in member with an empty profile for the same thing. Same
 * argument in both places — the account is not the point, the profile is — so it
 * is one component rather than two sentences that will drift. Only the doors
 * differ: a member reading the signed-in one is already through both.
 *
 * The first bullet is the reviewer's copy, verbatim. Note the door order — sign
 * in, then sign up — which is the reverse of the navbar's pair and deliberate
 * here: this reads as a sentence rather than as a control cluster, and the
 * sentence names the commoner case first.
 */
export function ApplyValueBullets({ className, doors }: { className?: string; doors?: Doors }) {
  return (
    <ul className={clsx(welcome.sub, s.valueBullets, className)}>
      <li>
        {doors ? (
          <>
            {/* Both doors, still — the pair moved out of the CTA slot, not out
                of the banner. "Sign in" alone would tell the likeliest reader of
                a sign-in banner, someone with no account, that the offer isn't
                for them. */}
            <button type="button" className={s.inlineDoor} onClick={doors.onSignIn}>
              Sign in
            </button>{' '}
            or{' '}
            <button type="button" className={s.inlineDoor} onClick={doors.onSignUp}>
              sign up
            </button>{' '}
            and apply to hundreds of open roles with a single profile.
          </>
        ) : (
          /* The same claim with the doors taken out — a member reading this one
             is already signed in, so the sentence starts at what the profile
             does rather than at how to get one. */
          'Apply to hundreds of open roles with a single profile.'
        )}
      </li>
      {/* The half a job board can't show you: the profile is not only how you
          apply, it's how you're found. Second because it is the payoff you get
          without doing anything else.

          "when they're hiring for what you do", not "when your profile matches
          the roles they're hiring for". Matching was removed from this board
          outright; leaving its vocabulary in the banner promises a mechanism
          that is gone. */}
      <li>Founders reach out when they&apos;re hiring for what you do.</li>
    </ul>
  );
}

export function SignInBanner({ criteria, roleCount, teamCount, onSignIn, onSignUp }: SignInBannerProps) {
  const filtersApplied = hasCriteria(criteria);

  return (
    <div className={clsx(s.slot, filtersApplied && s.pinned)}>
      <section className={clsx(welcome.welcome, s.brandSurface, filtersApplied && s.condensed)}>
        <div className={welcome.text}>
          {/* The headline is the inventory; the offer is the bullet under it.

              It was briefly the offer instead — "Apply to 13 open roles with one
              profile" — which stopped working the moment the first bullet became
              "…and apply to hundreds of open roles with a single profile". Those
              are the same sentence twice, forty pixels apart, at two different
              counts. One of them had to stop being the offer, and the headline is
              the one that can orient instead.

              Both numbers are the *filtered* ones, so narrowing the rail narrows
              the claim rather than making it a lie. The bullet's "hundreds" is a
              claim about the network rather than about this list — deliberate,
              and the reviewer's own copy. */}
          <p className={clsx(welcome.title, s.bannerTitle, filtersApplied && s.oneLine)}>
            {roleCount > 0 ? (
              <>
                Browse{' '}
                <span className={welcome.titleHighlight}>
                  {roleCount} open {roleCount === 1 ? 'role' : 'roles'}
                </span>{' '}
                across {teamCount} PL network {teamCount === 1 ? 'team' : 'teams'}
              </>
            ) : (
              /* Zero is a filter result, not a smaller board — "browse 0 open
                 roles" is an invitation to do nothing, and the empty state
                 directly below already says there is nothing there. The counts
                 drop out and the standing claim remains, so it is already in
                 place when the person widens the rail again. */
              <>Browse every open role across the PL network</>
            )}
          </p>
          {filtersApplied || roleCount === 0 ? (
            <p className={clsx(welcome.sub, s.bannerSub, filtersApplied && s.oneLine)}>
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
            /* Unfiltered, the standing claim. Filtered, the read-back above
               replaces it: pinned, both lines are clamped to one, and the
               selection the person just made is the more specific thing to say
               back to them. */
            <ApplyValueBullets className={s.bannerSub} doors={{ onSignIn, onSignUp }} />
          )}
        </div>
        {/* No CTA slot. The banner used to end in a Sign up / Sign in pair
            wearing `welcome.cta` — a boxed auth cluster, which made this an
            *offer* card in the same viewport as two other copies of the same
            offer: the navbar's own pair one row above, and the sign-up form that
            Apply opens for a logged-out visitor at the moment of intent. Three
            asks for one account, and this was the one nobody arrived for.

            What is left is a note: it says what the board is worth to you and
            names the two doors inline, in the sentence, as text buttons. That is
            the treatment for an aside that carries an action — a boxed control
            inside a sentence reads as a second object. The doors did not
            disappear, they stopped being furniture. */}
      </section>
    </div>
  );
}
