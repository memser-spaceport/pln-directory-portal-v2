'use client';

/**
 * What a visitor with no account is told about the feed under this banner.
 *
 * **Why this slot and this card.** `app/home/page.tsx` already renders
 * `Welcome` behind `!isLoggedIn`, as the first child of `.home__cn`, directly
 * above the same `TeamNews` section this prototype reproduces — and this route
 * *is* Home. So the surface a signed-out visitor meets here is the surface they
 * already meet, in the place they already meet it, rather than a second
 * sign-in look invented for the feed.
 *
 * **Why it is a transcription and not an import.** The same reason job-board's
 * `SignInBanner` gives: `Welcome`'s CTA is `LoginBtn`, which pushes `#login`
 * and hands the page to the real Privy modal — which would lose the thing this
 * prototype is about. Everything visual is production's own stylesheet; only
 * the copy and the click targets are local.
 *
 * ---
 *
 * **The gap this exists to close.** Production tells a signed-out visitor
 * nothing about personalization, and not by choice — it falls out of two rules
 * meeting. `ForYouHint` ("For you: Curated based on your profile and primary
 * team attributes") renders only while the For You pill is active; the pill
 * renders only when `forYouTeamUids` is non-empty; and `forYouTeamUids` comes
 * back empty without an auth token. So the one sentence in the product that
 * says the feed can be about you is unreachable by exactly the people who have
 * not yet decided to have a feed. The hint is also the wrong shape for them
 * even if they could see it — it is a *label* on a view you are reading, and
 * they are being made an *offer*.
 *
 * **Headline is the inventory; the offer is the line under it.** Job-board's
 * `SignInBanner` settled that split and it holds here for the same reason: one
 * of the two lines has to orient and the other has to ask, and a headline that
 * asks leaves the sub-line repeating it. The count is what is on screen — the
 * week's stream, not a database total — so it stays true as the feed changes
 * under it.
 *
 * **"Welcome to LabOS" is gone, deliberately** — again job-board's call, and
 * the argument transfers unchanged: a greeting is not an offer, and someone who
 * has just arrived on a page with the logo in its header does not need to be
 * told which product they opened. Production's platform pitch ("the
 * collaboration platform for the Protocol Labs network… 3,000+ members") went
 * with it, because it is a claim about the company where the reader needs a
 * claim about the page.
 *
 * **The doors are inside the sentence**, as `SignInBanner.inlineDoor` text
 * buttons rather than production's boxed `welcome.cta`. Two reasons, both
 * borrowed rather than re-derived: the navbar renders its own Sign up / Sign in
 * pair one row above this card, so a boxed pair here is the second copy of the
 * same cluster in one viewport; and a control with a box inside a line of prose
 * reads as a second object beside the sentence rather than as part of it. Both
 * doors, never just one — "Sign in" alone tells the likeliest reader of a
 * sign-in banner, someone with no account, that the offer is not for them.
 *
 * **The sentence's second half is `ForYouBanner`'s, verbatim.** A visitor is
 * promised "your skills, your focus areas, and the teams you follow"; a member
 * standing on For You is told the feed is based on those same three, in the
 * same words. Two surfaces describing one mechanism is exactly where copy
 * drifts, and the drift is invisible because nobody sees both states.
 */

// Production's signed-out home banner, worn 1:1 — see the note above.
import welcome from '@/components/page/home/Welcome/Welcome.module.scss';

// The doors. Imported from the job board rather than re-typed here so the
// prototypes' two signed-out asks cannot end up as two different-looking
// controls; `.inlineDoor` is `font: inherit`, so it takes this card's 16px
// instead of carrying the board's size across.
import jb from '../job-board/SignInBanner.module.scss';

interface SignedOutBannerProps {
  /** Updates in the week's stream — what is on screen, not a network total. */
  updateCount: number;
  /** How many teams they come from. */
  teamCount: number;
  onSignIn: () => void;
  /** A separate door on purpose — see `PrototypeNavBar`'s `onSignUp`. */
  onSignUp: () => void;
}

export function SignedOutBanner({ updateCount, teamCount, onSignIn, onSignUp }: SignedOutBannerProps) {
  return (
    <section className={welcome.welcome}>
      <div className={welcome.text}>
        <p className={welcome.title}>
          Browse{' '}
          <span className={welcome.titleHighlight}>
            {updateCount} {updateCount === 1 ? 'update' : 'updates'}
          </span>{' '}
          from {teamCount} PL network {teamCount === 1 ? 'team' : 'teams'}
        </p>
        <p className={welcome.sub}>
          <button type="button" className={jb.inlineDoor} onClick={onSignIn}>
            Sign in
          </button>{' '}
          or{' '}
          <button type="button" className={jb.inlineDoor} onClick={onSignUp}>
            sign up
          </button>{' '}
          and your feed is based on your skills, your focus areas, and the teams you follow.
        </p>
      </div>
    </section>
  );
}
