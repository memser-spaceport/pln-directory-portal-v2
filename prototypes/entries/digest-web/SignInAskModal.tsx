'use client';

/**
 * The digest page's one sign-in prompt for a signed-out reader (LAB-3347, 2026-11-20). Every
 * action that needs a member opens it: More / Less like this, a forum thread, Open the forum, a
 * topic chip, See all topics, Follow, Comments. The title names what the press was for, the one
 * line says why it needs an account, and signing in finishes that press (mocked: the page flips to
 * signed in and does it), so the reader never presses twice.
 *
 * Shell: the gantry "standard modal" (Modal + SubmitDealModal.module.scss), narrowed. Both doors,
 * in the navbar's order and ranking: Sign up bordered, Sign in filled (prototypes/AUTH-COPY-AUDIT).
 * The digest can be opened from a public link, so the reader may have no account yet.
 */

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CloseIcon } from '@/components/icons';
import m from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';

import s from './SignInAskModal.module.scss';

export function SignInAskModal({
  ask,
  onClose,
  onSignIn,
  onSignUp,
}: {
  ask: { title: string; body: string } | null;
  onClose: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
}) {
  return (
    <Modal isOpen={!!ask} onClose={onClose} ariaLabelledBy="digest-signin-title" lockScroll>
      {ask && (
        <div className={`${m.root} ${s.root}`}>
          <div className={`${m.header} ${s.header}`}>
            <div className={m.headerText}>
              <h2 id="digest-signin-title" className={m.title}>
                {ask.title}
              </h2>
              <p className={m.subtitle}>{ask.body}</p>
            </div>
            <button type="button" className={m.closeButton} onClick={onClose} aria-label="Close">
              <CloseIcon width={20} height={20} color="#0a0c11" />
            </button>
          </div>
          <div className={`${m.footer} ${s.footer}`}>
            <div className={m.footerActions}>
              <Button style="border" variant="neutral" size="s" onClick={onSignUp}>
                Sign up
              </Button>
              <Button style="fill" variant="primary" size="s" onClick={onSignIn}>
                Sign in
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
