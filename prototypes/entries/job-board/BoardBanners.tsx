'use client';

import clsx from 'clsx';

// The same surface `SignInBanner` wears — production's signed-out home banner.
// Three asks now sit in this slot (sign in, finish your profile, wait for
// approval) and they are one ask at three stages, not three features, so they
// get one card. Swapping the card per stage would make the board look like it
// had changed rather than the reader's situation.
import welcome from '@/components/page/home/Welcome/Welcome.module.scss';

// Demo Day's quiet info card, for the state that has no action in it. The `Alert`
// component hardcodes its own sentence, so the stylesheet is worn with different
// text and its icon copied in.
import a from '@/components/page/demo-day/FounderPendingView/components/Alert/Alert.module.scss';

import { ApplyValueBullets } from './SignInBanner';
import s from './SignInBanner.module.scss';

/**
 * The signed-in asks, in `SignInBanner`'s slot.
 *
 * **Why not more props on `SignInBanner`.** That component is about the two
 * doors — it owns the Sign up / Sign in pair, the criteria read-back and the
 * pinned condensed state, none of which apply once there is an account. Folding
 * three unrelated states into it would have left every branch reading around the
 * other two.
 */

/**
 * Signed in, profile empty.
 *
 * The headline is the ask the user asked for, verbatim: **"Update your profile to
 * apply"**.
 *
 * **The sub-line is the signed-out banner's, exactly.** It used to be a
 * count-led sentence of its own ("one experience entry is all it takes, and you
 * can then apply to any of 13 open roles"), which meant the two banners argued
 * for the same thing in two different ways — and a member who read the case for
 * a profile while logged out, signed in, and then met a different case for the
 * same profile has been given two reasons where there is one. `ApplyValueBullets`
 * is that one reason, shared. Only the first bullet changes, and it changes
 * because the door behind it has: signing in is done.
 *
 * One button, not two: there is nothing to choose between here. The action is
 * the same one every Apply button on the page performs, so it opens the same
 * drawer rather than going anywhere new.
 */
export function ProfileNudgeBanner({ onUpdateProfile }: { onUpdateProfile: () => void }) {
  return (
    <div className={s.slot}>
      <section className={welcome.welcome}>
        <div className={welcome.text}>
          <p className={welcome.title}>Update your profile to apply</p>
          <ApplyValueBullets />
        </div>
        <div className={s.ctaGroup}>
          <button type="button" className={welcome.cta} onClick={onUpdateProfile}>
            Update profile
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

/**
 * Signed up, waiting on the PL team.
 *
 * **Two cards, because there are two situations.** The waiting window is dead
 * time only if there is nothing left to fill in — and for a brand-new account
 * there almost always is. So while the profile is incomplete this wears the
 * `Welcome` card with a live button: the review is running in the background,
 * and the one thing the person can usefully do meanwhile is finish the profile
 * that the application will carry. That is the only CTA this state has, and it
 * is a real one — the drawer saves while approval is pending; only *applying*
 * waits (see `JobProfileDrawer`, where the footer says so).
 *
 * Once the profile is done there genuinely is nothing to press, and a card whose
 * shape is "a claim next to a button" would then have an empty action slot,
 * which reads as a control that failed to load. Demo Day's `Alert` is the
 * product's existing shape for "here is a fact about your account, there is
 * nothing to do" — same card it uses to say a founder's fundraising profile
 * stays private until launch — so that state gets that card.
 *
 * Both open on production's own sentence, from the navbar's `CompleteYourProfile`
 * strip (`MESSAGES.VERIFIED`): *"Profile under review — we'll notify you once
 * approved"*. Reused rather than rewritten so a member who sees the global strip
 * and then this one is told the same thing twice, not two things. What follows
 * it differs, because what is true next differs.
 */
export function PendingApprovalBanner({
  profileComplete,
  onUpdateProfile,
}: {
  /** Whether there is anything left for them to do while they wait. */
  profileComplete: boolean;
  onUpdateProfile: () => void;
}) {
  if (!profileComplete) {
    return (
      <div className={s.slot}>
        <section className={welcome.welcome}>
          <div className={welcome.text}>
            <p className={welcome.title}>Profile under review</p>
            {/* Names the wait, then hands back the one move that is theirs. "so
                you can apply the moment it's approved" is the whole reason to do
                it now rather than later — without it, filling in a profile
                during a wait reads as busywork the product invented. */}
            <p className={welcome.sub}>
              We&apos;ll notify you once approved. Complete your profile in the meantime, so you can apply the moment it
              is.
            </p>
          </div>
          <div className={s.ctaGroup}>
            <button type="button" className={welcome.cta} onClick={onUpdateProfile}>
              Complete profile
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

  return (
    <div className={clsx(s.slot, s.pendingSlot)}>
      <div className={a.alert}>
        <div className={a.alertContent}>
          <div className={a.alertIcon}>
            <InfoIcon />
          </div>
          <div className={a.alertText}>
            {/* The second sentence names what is and isn't available, because
                "under review" alone leaves someone guessing whether the board
                itself is half-working. Browsing is untouched and the profile is
                done, so applying is the only thing left waiting — and saying so
                is what makes the wait finite. */}
            <p>
              Profile under review — we&apos;ll notify you once approved. Your profile is ready and every role is open
              to browse; applying unlocks as soon as your account is approved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo Day `Alert`'s own info circle, copied because its stylesheet is worn but
// its component hardcodes the sentence.
const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M10 0.25C8.07164 0.25 6.18657 0.821828 4.58319 1.89317C2.97982 2.96451 1.73013 4.48726 0.992179 6.26884C0.254225 8.05042 0.061142 10.0108 0.437348 11.9021C0.813554 13.7934 1.74215 15.5307 3.10571 16.8943C4.46928 18.2579 6.20656 19.1865 8.09787 19.5627C9.98919 19.9389 11.9496 19.7458 13.7312 19.0078C15.5127 18.2699 17.0355 17.0202 18.1068 15.4168C19.1782 13.8134 19.75 11.9284 19.75 10C19.7473 7.41498 18.7192 4.93661 16.8913 3.10872C15.0634 1.28084 12.585 0.25273 10 0.25ZM9.625 4.75C9.84751 4.75 10.065 4.81598 10.25 4.9396C10.435 5.06321 10.5792 5.23891 10.6644 5.44448C10.7495 5.65005 10.7718 5.87625 10.7284 6.09448C10.685 6.31271 10.5778 6.51316 10.4205 6.6705C10.2632 6.82783 10.0627 6.93498 9.84448 6.97838C9.62625 7.02179 9.40005 6.99951 9.19449 6.91436C8.98892 6.82922 8.81322 6.68502 8.6896 6.50002C8.56598 6.31501 8.5 6.0975 8.5 5.875C8.5 5.57663 8.61853 5.29048 8.82951 5.0795C9.04049 4.86853 9.32664 4.75 9.625 4.75ZM10.75 15.25C10.3522 15.25 9.97065 15.092 9.68934 14.8107C9.40804 14.5294 9.25 14.1478 9.25 13.75V10C9.05109 10 8.86033 9.92098 8.71967 9.78033C8.57902 9.63968 8.5 9.44891 8.5 9.25C8.5 9.05109 8.57902 8.86032 8.71967 8.71967C8.86033 8.57902 9.05109 8.5 9.25 8.5C9.64783 8.5 10.0294 8.65804 10.3107 8.93934C10.592 9.22064 10.75 9.60218 10.75 10V13.75C10.9489 13.75 11.1397 13.829 11.2803 13.9697C11.421 14.1103 11.5 14.3011 11.5 14.5C11.5 14.6989 11.421 14.8897 11.2803 15.0303C11.1397 15.171 10.9489 15.25 10.75 15.25Z"
      fill="#0A0C11"
    />
  </svg>
);
