'use client';

import clsx from 'clsx';

// The same surface production's home page shows a signed-out visitor
// (`components/page/home/Welcome`) — the board wears the same card rather than
// inventing a second sign-in look. Three asks sit in this slot (sign in, finish
// your profile, wait for approval) and they are one ask at three stages, so they
// share one slot and mostly one card. What this file overrides on top of it is
// the slot's own surface and type scale (`.brandSurface`, `.bannerTitle`,
// `.bannerSub`), applied to every state so the slot doesn't appear to change
// component when the reader's situation changes.
import welcome from '@/components/page/home/Welcome/Welcome.module.scss';
// Demo Day's quiet info card, for the pending state that has no action in it.
import alert from '@/components/page/demo-day/FounderPendingView/components/Alert/Alert.module.scss';

import type { BoardViewerState } from '@/services/jobs/job-board-viewer';
import type { IJobAlertFilterState } from '@/types/job-alerts.types';
import { hasActiveFilters } from '@/utils/job-alerts.utils';

import s from './JobBoardBanner.module.scss';

interface JobBoardBannerProps {
  viewer: BoardViewerState;
  /** Filtered counts — the banner counts what's on screen, so narrowing the rail
   *  narrows the number rather than making it a lie. */
  roleCount: number;
  teamCount: number;
  filterState: IJobAlertFilterState;
  profileComplete: boolean;
  /** Job Aspirant — signed up from the board, not already on a network team. */
  isJobAspirant?: boolean;
  /** Every fillable profile section has a value. The JA banner stays until this
   *  is true; a member's banner still splits on `viewer` / Apply-completeness. */
  allSectionsFilled?: boolean;
  onSignIn: () => void;
  onSignUp: () => void;
  onUpdateProfile: () => void;
}

/**
 * The board's one banner slot, promoted from the job-board prototype
 * (`SignInBanner.tsx` + `BoardBanners.tsx`).
 *
 * Renders nothing for `resolving` (the sub-state queries haven't settled —
 * banner-absence is already the `profile-ready` presentation, so nothing can
 * flash wrong), nothing for `rejected` (the pending copy would promise an
 * approval that will not come), and nothing for `profile-ready` — except a
 * Job Aspirant whose sections are still empty.
 */
export function JobBoardBanner(props: JobBoardBannerProps) {
  const { viewer, isJobAspirant = false, allSectionsFilled = false } = props;

  switch (viewer) {
    case 'logged-out':
      return <SignInBanner {...props} />;
    case 'profile-incomplete':
      return (
        <ProfileNudgeBanner variant={isJobAspirant ? 'aspirant' : 'member'} onUpdateProfile={props.onUpdateProfile} />
      );
    case 'profile-ready':
      return isJobAspirant && !allSectionsFilled ? (
        <ProfileNudgeBanner variant="aspirant" onUpdateProfile={props.onUpdateProfile} />
      ) : null;
    case 'pending-approval':
      return <PendingApprovalBanner profileComplete={props.profileComplete} onUpdateProfile={props.onUpdateProfile} />;
    case 'resolving':
    case 'rejected':
      return null;
  }
}

const ArrowGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M5 12h14M13 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * The logged-out banner: how many teams are hiring, what a profile buys you,
 * Sign up as the door, and Sign in in the footer for people already on a
 * network team.
 *
 * Narrowing the rail pins it — the standing offer stays in view without
 * blocking anything. The team count is the filtered one, so the headline
 * stays true of the list under it.
 */
function SignInBanner({ filterState, teamCount, onSignIn, onSignUp }: JobBoardBannerProps) {
  const filtersApplied = hasActiveFilters(filterState);

  return (
    <div className={clsx(s.slot, filtersApplied && s.pinned)}>
      <section className={clsx(s.signedOut, filtersApplied && s.condensed)}>
        <div className={s.pitch}>
          <div className={welcome.text}>
            <p className={clsx(welcome.title, s.bannerTitle, filtersApplied && s.oneLine)}>
              {teamCount > 0 ? (
                <>
                  <span className={welcome.titleHighlight}>{teamCount}</span> PL network{' '}
                  {teamCount === 1 ? 'team is' : 'teams are'} hiring. Let them find you.
                </>
              ) : (
                /* Zero is a filter result, not a smaller board — the count drops
                   out and the standing claim stays. */
                <>PL network teams are hiring. Let them find you.</>
              )}
            </p>
            <p className={clsx(welcome.sub, s.bannerSub, filtersApplied && s.oneLine)}>
              Founders reach out when your profile matches an open role.
            </p>
          </div>
          <div className={s.ctaGroup}>
            <button type="button" className={welcome.cta} onClick={onSignUp}>
              Sign up
              <ArrowGlyph />
            </button>
          </div>
        </div>
        <p className={clsx(welcome.sub, s.bannerSub, s.footer)}>
          Already at a PL network team?{' '}
          <button type="button" className={s.inlineDoor} onClick={onSignIn}>
            Sign in
          </button>
        </p>
      </section>
    </div>
  );
}

function ProfileNudgeBanner({
  variant,
  onUpdateProfile,
}: {
  variant: 'member' | 'aspirant';
  onUpdateProfile: () => void;
}) {
  return (
    <div className={s.slot}>
      <section className={clsx(welcome.welcome, s.brandSurface)}>
        <div className={welcome.text}>
          <p className={clsx(welcome.title, s.bannerTitle)}>
            {variant === 'member'
              ? 'Interested in a role here? Your profile is what the team sees when you reach out.'
              : 'The more complete your profile, the better teams can find you.'}
          </p>
        </div>
        <div className={s.ctaGroup}>
          <button type="button" className={welcome.cta} onClick={onUpdateProfile}>
            Update profile
            <ArrowGlyph />
          </button>
        </div>
      </section>
    </div>
  );
}

/**
 * Signed up, waiting on the PL team. While the profile is incomplete this wears
 * the Welcome card with a live button — finishing the profile is the one useful
 * thing the wait allows. Once it's done there is nothing to press, so that
 * state gets Demo Day's quiet Alert instead of a card with an empty action
 * slot. Neither claims an application happened.
 */
function PendingApprovalBanner({
  profileComplete,
  onUpdateProfile,
}: {
  profileComplete: boolean;
  onUpdateProfile: () => void;
}) {
  if (!profileComplete) {
    return (
      <div className={s.slot}>
        <section className={clsx(welcome.welcome, s.brandSurface)}>
          <div className={welcome.text}>
            <p className={clsx(welcome.title, s.bannerTitle)}>Profile under review</p>
            {/* Two sentences, two lines — and two different kinds of thing,
                which is why they are separate `<p>`s rather than one broken with
                a `<br />`. The first is a status: the review is running, we will
                tell you. The second is the one move that is theirs, and it is
                what the button beside it does. Run together they read as one
                paragraph about waiting, and the instruction gets lost in the
                middle of it.

                No new CSS: `welcome.text` is already a 4px-gap column, so a
                second `<p>` lands on the next line at the card's own rhythm.

                The second line used to end "so you can apply the moment it is",
                which was the reason to finish a profile while approval was the
                thing standing in the way. It no longer is — applying works now —
                so the reason had to change with it: a profile is what the
                application carries, and that is true whether or not anyone is
                reviewing the account. */}
            <p className={clsx(welcome.sub, s.bannerSub)}>We&apos;ll notify you once approved.</p>
            <p className={clsx(welcome.sub, s.bannerSub)}>
              You can apply meanwhile — finish your profile so it goes with a full picture of you.
            </p>
          </div>
          <div className={s.ctaGroup}>
            <button type="button" className={welcome.cta} onClick={onUpdateProfile}>
              Complete profile
              <ArrowGlyph />
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={clsx(s.slot, s.pendingSlot)}>
      <div className={clsx(alert.alert, s.alertBrand)}>
        <div className={alert.alertContent}>
          <div className={alert.alertIcon}>
            <InfoIcon />
          </div>
          <div className={alert.alertText}>
            {/* The second sentence names what is and isn't available, because
                "under review" alone leaves someone guessing whether the board
                itself is half-working.

                It used to end "applying unlocks as soon as your account is
                approved" — the truth while approval gated applying. It doesn't
                any more, and this is the state where getting that wrong would
                cost the most: a finished profile with nothing left to do, being
                told to wait for something that isn't holding them up. Now the
                sentence says the board is entirely open and leaves the review as
                what it is — a fact about the account, running in the
                background. */}
            <p>
              Profile under review — we&apos;ll notify you once approved. Nothing here is waiting on it: browse and
              apply as normal.
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
