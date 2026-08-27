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
 * **Headline is the offer; the line under it is the mechanism.** This used to
 * run the other way — "Browse N updates from M PL network teams" over "Sign in
 * and the feed reorders…" — on job-board's rule that the headline orients and
 * the sub-line asks. That rule was answering a problem this banner does not
 * have. On the board, the bullet under the headline *is* an offer, so a headline
 * that also asked was the same sentence twice; here the second line describes a
 * mechanism, and nothing was competing for the ask.
 *
 * What the old order cost: "Browse N updates" described the page the visitor was
 * already looking at and could already read, so the loudest line in the banner
 * named something an account does not change. "Personalize your updates" names
 * the thing it does. The count stays in the headline as the teams those updates
 * come from — still what is on screen, the week's stream rather than a database
 * total, so it stays true as the feed changes under it.
 *
 * **"Welcome to LabOS" is gone, deliberately** — again job-board's call, and
 * the argument transfers unchanged: a greeting is not an offer, and someone who
 * has just arrived on a page with the logo in its header does not need to be
 * told which product they opened. Production's platform pitch ("the
 * collaboration platform for the Protocol Labs network… 3,000+ members") went
 * with it, because it is a claim about the company where the reader needs a
 * claim about the page.
 *
 * **The doors are a boxed pair in the card's own CTA slot**, which is where
 * production's `Welcome` puts its one button.
 *
 * They were inline text buttons inside the sentence for a round, borrowed from
 * job-board's `SignInBanner` — which had moved them there because that board
 * makes the same ask three times in one viewport (navbar, banner, and the
 * sign-up form every Apply opens) and a fourth boxed cluster was noise. **That
 * argument does not transfer.** This page makes the ask once. The banner is
 * also 1200px wide holding a 700px sentence, so hiding the controls in prose
 * left the right half of the strip empty and the offer with nothing to press.
 *
 * **Sign in is the primary, Create account the bordered twin — the navbar's
 * ranking, one row above.** This ran the other way for a round, on the argument
 * that a banner only a logged-out visitor can see is talking to the group that
 * mostly has no account yet, so the navbar's ordering (Sign up bordered, Sign in
 * filled) shouldn't carry across. It carries. The pair sits eight rows under the
 * navbar's pair in the same viewport, and two clusters offering the same two
 * doors with the emphasis flipped between them makes the reader price the same
 * decision twice — which is the cost the divergence never priced. Production's
 * `Welcome`, this card's own source, also puts Sign in in the filled button.
 *
 * Both doors are still offered, which is the half that matters — "Sign in" alone
 * tells the likeliest reader of a sign-in banner, someone with no account, that
 * the offer is not for them. And the order follows the ranking: the bordered
 * door first, the filled one last, exactly as the navbar reads.
 *
 * **The arrow on Sign in is production's, not a decoration.** `welcome.cta`
 * reserves a 6px gap for it and `Welcome` fills that gap with a right-pointing
 * chevron-and-rule; the transcription is at the call site. It marks the door
 * that continues into the app, which is why only the filled one carries it —
 * an arrow on both would mark nothing.
 *
 * Geometry for both buttons is production's `welcome.cta`; only the secondary's
 * tone is local. Geometry belongs to the host, tone to the source — a bordered
 * twin drawn from scratch would put two radii in one cluster.
 *
 * **The sentence's tail is `ForYouBanner`'s, verbatim.** A visitor is promised
 * "your skills, your focus areas, and the teams you follow"; a member standing
 * on For You is told the feed is based on those same three, in the same words.
 * Two surfaces describing one mechanism is exactly where copy drifts, and the
 * drift is invisible because nobody sees both states. Only the opening differs,
 * because only one of them has a feed yet.
 *
 * **And the tail no longer opens with "Sign in and".** The doors are two
 * buttons in the same card and the headline's verb is already the ask, so
 * naming the door a third time priced one decision three ways. What is left is
 * the plain claim about what the feed does, which is the half the buttons
 * cannot say.
 */

// Production's signed-out home banner, worn 1:1 — see the note above.
import welcome from '@/components/page/home/Welcome/Welcome.module.scss';

// Local: the card's height, the CTA row, and the secondary button's tone.
// Everything else — including both buttons' geometry — is production's sheet.
import local from './Newsfeed.module.scss';

interface SignedOutBannerProps {
  /** Teams the week's stream comes from — what is on screen, not a network
   *  total. The banner's only number since the headline became the offer. */
  teamCount: number;
  onSignIn: () => void;
  /** A separate door on purpose — see `PrototypeNavBar`'s `onSignUp`. */
  onSignUp: () => void;
}

export function SignedOutBanner({ teamCount, onSignIn, onSignUp }: SignedOutBannerProps) {
  return (
    <section className={`${welcome.welcome} ${local.signedOutBanner}`}>
      <div className={welcome.text}>
        {/* The highlight sits on the count phrase, which is where both the
            production banner and job-board's put it: `Welcome` accents its
            subject ("LabOS"), `SignInBanner` accents its inventory ("13 open
            roles"). Here the inventory is the teams. */}
        <p className={welcome.title}>
          Personalize your updates from{' '}
          <span className={welcome.titleHighlight}>
            {teamCount} PL network {teamCount === 1 ? 'team' : 'teams'}
          </span>
        </p>
        {/* The mechanism, in `ForYouBanner`'s words from "your skills" on. No
            door named here — the two buttons carry that, and the headline
            already asked. */}
        <p className={welcome.sub}>
          The feed reorders around your skills, your focus areas, and the teams you follow.
        </p>
      </div>

      <div className={local.bannerCtas}>
        <button type="button" className={`${welcome.cta} ${local.ctaSecondary}`} onClick={onSignUp}>
          Create account
        </button>
        <button type="button" className={welcome.cta} onClick={onSignIn}>
          Sign in
          {/* Production's own `Welcome` CTA, transcribed: the same 14px glyph on
              the same 24-unit viewBox, `currentColor` at 2px with round caps, in
              the 6px gap `welcome.cta` already reserves for it. Not an invented
              arrow and not `ArrowUpRightIcon`, which the product uses for leaving
              the app — this door stays here. */}
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
