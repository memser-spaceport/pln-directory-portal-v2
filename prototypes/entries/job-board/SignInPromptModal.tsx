'use client';

import { Modal } from '@/components/common/Modal';
import { CloseIcon, NotePencilIcon } from '@/components/icons';

// Same chrome as JobPreferencesModal, which is the modal this one hands over to:
// Demo Day's "Make an intro" card (24px radius, centred icon / title / desc, twin
// full-width footer actions). Two dialogs in one flow that looked like different
// products would read as two unrelated interruptions.
import intro from '@/components/page/demo-day/ActiveView/components/TeamsList/components/ReferCompanyModal/ReferCompanyModal.module.scss';

import { hasCriteria, summariseCriteria, type RoleCriteria } from './viewerState';
import s from './SignInPromptModal.module.scss';

interface SignInPromptModalProps {
  open: boolean;
  /** What the rail is narrowed to, if anything — read back so the ask is about them. */
  criteria: RoleCriteria;
  /** Dismiss. Settles the prompt for the session; the banner keeps the offer alive. */
  onClose: () => void;
  onSignIn: () => void;
}

/**
 * The dwell prompt. Requested explicitly: a sign-in popup after the visitor has
 * spent some time on the board.
 *
 * It replaces nothing — `SignInBanner` still carries the standing offer in the
 * flow, and this is the one moment it steps forward. What keeps a timed
 * interstitial honest is the exits, so it has all of them: a close button, a
 * "Not now" that settles it for the rest of the session, backdrop dismissal, and
 * no consequence for ignoring it. Nothing on the board is taken away to make it
 * matter — Apply still works logged out, exactly as before.
 *
 * Three rules the timer obeys, all in the caller:
 *  - logged-out only, once per session (sessionStorage), and never re-armed after
 *    a dismissal — a second interruption is how a prompt turns into a toll gate;
 *  - the clock counts *visible* time, so a tab left open in the background
 *    doesn't earn a modal nobody was reading toward;
 *  - it never opens over another dialog.
 *
 * The copy is the requested line. Where it can be more specific it is: a visitor
 * who has already narrowed the rail gets their own selection read back, because
 * they have answered the question the next modal is about to ask and being asked
 * again reads as not listening.
 */
export function SignInPromptModal({ open, criteria, onClose, onSignIn }: SignInPromptModalProps) {
  const filtersApplied = hasCriteria(criteria);

  return (
    /* Backdrop click closes, unlike the preferences modal: that one is work in
       progress worth protecting, this one is an interruption the person didn't
       ask for, so every way out is a way out. */
    <Modal isOpen={open} onClose={onClose} lockScroll>
      <div className={`${intro.modal} ${s.modal}`}>
        <button type="button" className={intro.closeButton} onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>

        <div className={intro.iconWrapper}>
          <NotePencilIcon width={26} height={26} className={s.icon} />
        </div>

        <h2 className={intro.title}>Sign in and update your profile to increase your chances to match</h2>

        <p className={intro.desc}>
          {filtersApplied ? (
            <>
              You&apos;re looking for <strong className={s.criteria}>{summariseCriteria(criteria)}</strong>. Sign in to
              save it, and add what you do so teams hiring for it can find you.
            </>
          ) : (
            <>
              Tell us what you&apos;re looking for and we&apos;ll sort the board around it. Add what you do, and teams
              hiring for it can find you.
            </>
          )}
        </p>

        {/* Says out loud that nothing was taken. The prompt arrives uninvited, so
            it should be obvious that ignoring it costs nothing. */}
        <p className={s.footnote}>Applying never needs an account.</p>

        <div className={intro.actions}>
          <button type="button" className={intro.cancelButton} onClick={onClose}>
            Not now
          </button>
          <button type="button" className={intro.submitButton} onClick={onSignIn}>
            Sign in
          </button>
        </div>
      </div>
    </Modal>
  );
}
