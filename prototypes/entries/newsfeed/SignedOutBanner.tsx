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
 * **Headline is the offer; the line under it is the mechanism.** "Updates from
 * N teams, ordered around your work" names what is on screen and what an
 * account changes, in that order. The count is the week's stream rather than a
 * database total, so it stays true as the feed changes under it. The line under
 * it is the ask plus the three inputs that do the ordering.
 *
 * **"Welcome to LabOS" is gone, deliberately** — again job-board's call, and
 * the argument transfers unchanged: a greeting is not an offer, and someone who
 * has just arrived on a page with the logo in its header does not need to be
 * told which product they opened. Production's platform pitch ("the
 * collaboration platform for the Protocol Labs network… 3,000+ members") went
 * with it, because it is a claim about the company where the reader needs a
 * claim about the page.
 *
 * **Sign in is the only door in the card's own CTA slot**, which is where
 * production's `Welcome` puts its one button. Create account used to sit
 * beside it as the bordered twin of the navbar pair; it was cut so this card
 * and production's `Welcome` offer the same one door, and the navbar still
 * carries Sign up.
 *
 * **The arrow on Sign in is production's, not a decoration.** `welcome.cta`
 * reserves a 6px gap for it and `Welcome` fills that gap with a right-pointing
 * chevron-and-rule; the transcription is at the call site. It marks the door
 * that continues into the app.
 *
 * Geometry for the button is production's `welcome.cta`.
 *
 * **The three inputs are skills, your team's work, and the teams you follow.**
 * Same mechanism `ForYouBanner` names; different words, because a visitor is
 * being told what will move, not labelled on a view they already have.
 */

// Production's signed-out home banner, worn 1:1 — see the note above.
import welcome from '@/components/page/home/Welcome/Welcome.module.scss';

// Local: the card's height. Everything else — including the button's geometry
// and the CTA slot — is production's sheet.
import local from './Newsfeed.module.scss';

interface SignedOutBannerProps {
  /** Teams the week's stream comes from — what is on screen, not a network
   *  total. */
  teamCount: number;
  onSignIn: () => void;
}

export function SignedOutBanner({ teamCount, onSignIn }: SignedOutBannerProps) {
  return (
    <section className={`${welcome.welcome} ${local.signedOutBanner}`}>
      <div className={welcome.text}>
        <p className={welcome.title}>
          Updates from{' '}
          <span className={welcome.titleHighlight}>
            {teamCount.toLocaleString('en-US')} {teamCount === 1 ? 'team' : 'teams'}
          </span>
          , ordered around your work
        </p>
        <p className={welcome.sub}>
          Sign in and the updates matching your skills, your team&apos;s work, and the teams you follow show first.
        </p>
      </div>

      <div className={welcome.ctas}>
        <button type="button" className={welcome.cta} onClick={onSignIn}>
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
      </div>
    </section>
  );
}
