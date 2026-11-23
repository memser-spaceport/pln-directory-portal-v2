'use client';

import clsx from 'clsx';

import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import dealModal from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';

import s from './DigestSignInPrompt.module.scss';

export type DigestSignInAsk = {
  /** Names the press: "Sign in to read this thread". */
  title: string;
  /** Why the press needs an account. */
  line: string;
};

type Props = {
  ask: DigestSignInAsk;
  onSignUp: () => void;
  onSignIn: () => void;
  onClose: () => void;
};

/**
 * The digest page's one sign-in prompt (LAB-3347, Polina 2026-11-20): every press that needs an account opens it
 * instead of the login itself, so the reader learns why. The house modal (common `Modal` with SubmitDealModal's
 * chrome) at 440px: the title names the press, one line says why, and the footer has Sign up (bordered) then Sign in
 * (filled), the navbar's order and ranking. Both doors, because a public digest link can reach someone with no
 * account. Nothing is saved before sign-in; signing in finishes the press (the page carries it in the address).
 */
export function DigestSignInPrompt({ ask, onSignUp, onSignIn, onClose }: Props) {
  return (
    <Modal isOpen onClose={onClose} ariaLabelledBy="digest-sign-in-title" lockScroll inertBackground>
      <div className={clsx(dealModal.root, s.root)}>
        <div className={clsx(dealModal.header, s.header)}>
          <div className={dealModal.headerText}>
            <h2 id="digest-sign-in-title" className={dealModal.title}>
              {ask.title}
            </h2>
            <p className={dealModal.subtitle}>{ask.line}</p>
          </div>
          <button type="button" className={dealModal.closeButton} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <div className={clsx(dealModal.footer, s.footer)}>
          <div className={dealModal.footerActions}>
            <Button size="s" style="border" variant="neutral" onClick={onSignUp}>
              Sign up
            </Button>
            <Button size="s" onClick={onSignIn}>
              Sign in
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
