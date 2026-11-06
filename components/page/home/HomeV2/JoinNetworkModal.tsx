'use client';

import { Modal } from '@/components/common/Modal';

import { JOIN_FACES } from './constants';
import { JoinCard } from './JoinCard';
import s from './HomeV2.module.scss';

/**
 * The Home "Join the network" card, over the page. Thumbs-up on Home and News opens it
 * so a signed-out reader can choose Sign up or Sign in.
 */
export function JoinNetworkModal({
  onClose,
  onSignUp,
  onSignIn,
}: {
  onClose: () => void;
  onSignUp: () => void;
  onSignIn: () => void;
}) {
  return (
    <Modal isOpen onClose={onClose} ariaLabelledBy="home-join-modal-title" lockScroll className={s.joinModalShell}>
      <div className={s.joinModal}>
        <button type="button" className={s.joinModalClose} onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <JoinCard id="home-join-modal-title" onSignUp={onSignUp} onSignIn={onSignIn} faces={JOIN_FACES} />
      </div>
    </Modal>
  );
}
