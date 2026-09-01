'use client';

import clsx from 'clsx';

import { Button } from '@/components/common/Button';

import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import local from './Newsfeed.module.scss';

interface ForYouBannerProps {
  onUpdateProfile: () => void;
}

/**
 * What the feed is made of, in one sentence, where it is being used.
 *
 * **"Your feed", not "For You" and not "This feed".** The pill's own name was
 * the subject until For You became the *default* view — a label that names the
 * filter reads as a note about a thing you switched to, which is exactly wrong
 * for the state you arrive in. "This feed" fixed that and stopped one step
 * short: it points at the object, where the whole sentence is about the reader's
 * relationship to it. "Your feed … your skills, your focus areas, and the teams
 * you follow" puts the possessive on both halves, so the claim and the thing you
 * can go change are in the same voice as the button under them.
 *
 * Only true *here*, note: `SignedOutBanner` names the pill outright ("and your
 * feed is based on…" under a Sign in / sign up sentence), because a visitor has
 * no feed yet and is being offered one. Same second half, different opening —
 * one of them is a label on what you are reading, the other is an offer.
 *
 * "based on", not "built from", for the same reason — *built* describes how the
 * thing was assembled, which is the machine's side of it.
 *
 * A personalized view that never states its inputs leaves the reader with no way
 * to tell a thin week from a thin profile — and no way to act on either. So the
 * sentence names the inputs and ends on the way to change them.
 *
 * **Three inputs, and the third one says *follow*.** The list read "focus areas,
 * skills, and teams" for a while, compressed from an earlier version that named
 * them as team relationships ("your teams, the teams you follow, and teams in
 * your focus areas") and printed the viewer's focus areas in parentheses. The
 * compression was right about the first two — naming them as profile fields
 * keeps the sentence in the reader's voice rather than the machine's — and it
 * dropped a fact on the third: **"your teams" reads as the teams you are on**,
 * and the input is the teams you *follow*. So the verb is back.
 *
 * **The order is where each one is changed.** Skills first: it is a field on the
 * settings page this button opens, so the button's promise is true of the first
 * thing the sentence names. Focus areas second — a true input, changed nowhere
 * (see below). Follows last, because the sentence then ends on the page the
 * reader is standing on: every card in the feed and the rail's "Teams to follow"
 * are that lever, and naming it is what makes them read as personalization
 * controls rather than as a bookmarking habit. That is also why there is no
 * second button here for it — the controls are already on screen, and following
 * one confirms the effect in the toast.
 *
 * Worth knowing: **focus areas are not member-editable today.** They exist on
 * teams (`manage-teams.tsx` copies `teamFocusAreas` onto `focusAreas`) and a
 * member inherits them, so someone who follows this button looking for a
 * focus-area control will not find one. Named here anyway because it is a true
 * input and the sentence's job is to say what the view is based on; the gap is
 * in the settings page, not in the sentence.
 *
 * The viewer's actual focus-area names went with the rewrite. They were the one
 * concrete thing in the line, but the note's job is to name the *inputs* — which
 * field, not which value — and the values made the sentence a list inside a list.
 *
 * **`local.pillNote`, not the `JobAlertShell` slab `SubscribeBanner` wears.**
 * This entry already has a treatment for "explain what a synthetic pill's view
 * is" — the note under the Deals pill, in the same row, saying the same kind of
 * thing about the same kind of pill. Two explanatory asides on one filter row
 * should not be two different objects, and the quieter of the two is the right
 * one: the subscribe slab is brand-blue with an icon and a headline because it
 * is an *offer* interrupting you, while this is a label on the feed you are
 * reading. That gap widened when For You became the default — an offer-shaped
 * slab on the view everyone lands in is an interruption on arrival, every time.
 *
 * **No dismiss**, unlike `SubscribeBanner`: that one appears whether or not you
 * wanted an offer, so it has to be closable. This one is the answer to "why
 * these stories?", which is worth as much on the second visit as the first —
 * and it is one quiet line, which is the reason it can afford to stay.
 *
 * **"Update profile", not "Edit profile"** — the job board's
 * `ProfileNudgeBanner` settled that wording for this exact button, and a
 * cross-surface CTA that reads differently per page is drift. It is a text
 * button rather than a bordered one because it sits *inside* a sentence: a boxed
 * control in a line of prose reads as a second object, and the note is one
 * object.
 *
 * **Arrow, no underline.** Same reasoning one step further: `ProfileNudgeBanner`
 * renders this CTA as text plus a 14px right arrow, so the arrow is transcribed
 * from it rather than picked. It points right, not up-right — this goes to a
 * settings page inside the app, and `ArrowUpRightIcon` is the product's mark for
 * leaving it. The underline came off because the arrow now carries the
 * affordance, and a line under a phrase that already ends in an arrow is two
 * signals for one link.
 */
export function ForYouBanner({ onUpdateProfile }: ForYouBannerProps) {
  return (
    <div
      className={clsx(
        v0.tabsConstrain,
        v0.tabsConstrainBanner,
        local.railGutterConstrain,
        local.pillNote,
        local.noteRow,
      )}
    >
      {/* Same three inputs `SignedOutBanner` names for a visitor. The wording
          differs because this is a label on a feed you already have. */}
      <span>Your feed is based on your skills, your focus areas, and the teams you follow.</span>
      <Button
        size="s"
        type="button"
        style="link"
        variant="primary"
        className={local.noteAction}
        onClick={onUpdateProfile}
      >
        Update profile
        {/* `ProfileNudgeBanner`'s arrow, verbatim — same 14px box, same path,
            same `currentColor` stroke, so the two CTAs are one control. */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Button>
    </div>
  );
}
