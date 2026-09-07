'use client';

import clsx from 'clsx';

// Production's logged-out home banner, reused as-is: `components/page/home/Welcome`
// is what a signed-out visitor already meets at `/home` (app/home/page.tsx renders
// it behind `!isLoggedIn`), so the board wears the same surface, the same type and
// the same blue CTA rather than inventing a second sign-in look.
import welcome from '@/components/page/home/Welcome/Welcome.module.scss';

import { hasCriteria, type RoleCriteria } from './viewerState';
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
            {/* Reviewer's copy, replacing "and apply to hundreds of open roles
                with a single profile."

                It drops the "hundreds", which was the one number on this card
                nobody could check: the headline counts the rail (13 today) and
                this said hundreds, and the file's own note conceded it was "a
                claim about the network rather than about this list". A sentence
                that has to be defended by scope-switching is a sentence the
                reader has already stopped trusting.

                Two things it costs, both worth stating rather than discovering.
                Discovering roles is something this board lets you do signed out —
                nothing on it is gated — so the loudest promise in the ask now
                names something an account does not change. And "open roles
                across the network" is close to the headline directly above it
                ("Browse N open roles across M PL network teams"), so the two
                lines carry one fact between them where they used to carry two.
                See the note on the headline for the standing version of that
                tension. */}
            and discover open roles across the network.
          </>
        ) : (
          /* **No longer the same claim with the doors taken out, and that is a
             loose end rather than a decision.** This component exists so the two
             banners cannot drift: one argument, two audiences, doors or no
             doors. The logged-out half now offers discovery; this half still
             offers applying — which is right for *this* reader (a signed-in
             member with an empty profile, who has already discovered everything
             and is being asked for a profile), but it means the shared sentence
             is no longer shared.

             Left as it is deliberately. Rewriting it to match would tell a
             member to "discover open roles across the network" from inside a
             banner whose button says `Complete profile` — the one thing they are
             not being asked to do. The real question is whether these two are
             still one component; that is a decision, not a tidy-up. */
          'Apply to hundreds of open roles with a single profile.'
        )}
      </li>
      {/* The half a job board can't show you: the profile is not only how you
          apply, it's how you're found. Second because it is the payoff you get
          without doing anything else.

          **Shown to both audiences, and that is the settled answer.** It was
          briefly gated to signed-in only, on the reasoning that a visitor has no
          profile for founders to reach out about — so the line was selling the
          benefit of a thing they had not made yet. Reverted: that is exactly the
          reason to say it. The sentence above asks for an account and names what
          you can do with one; this one names what happens without you doing
          anything else, which is the better half of the offer and the half a
          board full of role rows cannot show. A visitor is the reader who most
          needs to hear it.

          "when they're hiring for what you do", not "when your profile matches
          the roles they're hiring for". Matching was removed from this board
          outright; leaving its vocabulary in the banner promises a mechanism
          that is gone. */}
      <li>Founders reach out when they&apos;re hiring for what you do.</li>
    </ul>
  );
}

/**
 * The logged-out banner, as the Figma "Logged out — Review job" frame draws it
 * (631:22545): a white card on a brand border — the headline counts the teams
 * hiring and says what the profile does for you, the sub-line says how, and
 * `Sign up` is a real button on the right. Under it, on a brand-soft strip, the
 * other door: "Already at a PL network team? Sign in".
 *
 * **Two doors, two ranks.** The pair used to sit inside the sentence as text
 * buttons, so the card read as a note rather than an offer. The design puts
 * Sign up back in a button and moves Sign in to its own strip — a stranger's
 * door and a member's door are not the same size of ask, and the strip's
 * question ("already at a team?") is what tells the two readers apart.
 *
 * The headline's count is the *filtered* team count, so narrowing the rail
 * narrows the claim rather than making it a lie. Narrowing also pins the card
 * under the header, as before — the strip holds its one line, the headline
 * clamps to one — so the offer stays in view while the person decides.
 *
 * `welcome.cta` for the button: the same class the sibling banners' buttons
 * wear (`ProfileNudgeBanner`, `PendingApprovalBanner`), so one slot has one
 * button across its states.
 */
export function SignInBanner({ criteria, roleCount, teamCount, onSignIn, onSignUp }: SignInBannerProps) {
  const filtersApplied = hasCriteria(criteria);

  return (
    <div className={clsx(s.slot, filtersApplied && s.pinned)}>
      <section className={clsx(s.card, filtersApplied && s.cardCondensed)}>
        <div className={s.cardBody}>
          <div className={s.cardText}>
            <p className={clsx(s.cardTitle, filtersApplied && s.oneLine)}>
              {roleCount > 0 ? (
                <>
                  <span className={s.cardCount}>{teamCount}</span> PL network {teamCount === 1 ? 'team is' : 'teams are'}{' '}
                  hiring. Let them find you.
                </>
              ) : (
                /* Zero is a filter result, not a smaller network — "0 teams are
                   hiring" is false, and the empty state below already says the
                   rail found nothing. The count drops out; the claim stays. */
                <>PL network teams are hiring. Let them find you.</>
              )}
            </p>
            <p className={clsx(s.cardSub, filtersApplied && s.oneLine)}>
              Founders reach out when your profile matches an open role.
            </p>
          </div>
          <button type="button" className={clsx(welcome.cta, s.cardCta)} onClick={onSignUp}>
            Sign up
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
        <p className={s.cardStrip}>
          Already at a PL network team?{' '}
          <button type="button" className={s.stripDoor} onClick={onSignIn}>
            Sign in
          </button>
        </p>
      </section>
    </div>
  );
}
