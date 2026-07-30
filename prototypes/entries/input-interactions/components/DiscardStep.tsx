'use client';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

import s from '../styles.module.scss';

interface Props {
  isOpen: boolean;
  /** What the member loses, in their words — "your comment", "this feedback". */
  subject: string;
  onKeep: () => void;
  onDiscard: () => void;
}

/**
 * Generalises production's `DiscardDraftDialog`, which today lives under
 * `page/gantry/ideas/` and hardcodes draft-title copy ("You'll lose '{title}'").
 * Every surface in the audit needs this step, so the recommendation is to lift
 * it to `components/common/` with `subject` as a prop — this is that shape.
 *
 * Note the button order: Keep is primary and sits on the right. The destructive
 * action is present but never the path of least resistance.
 */
export function DiscardStep({ isOpen, subject, onKeep, onDiscard }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onKeep} closeOnBackdropClick closeOnEscape className={s.modalContainer}>
      <div className={s.discardRoot} role="dialog" aria-modal aria-labelledby="proto-discard-title">
        <h2 id="proto-discard-title" className={s.discardTitle}>
          Discard {subject}?
        </h2>
        <p className={s.discardBody}>
          Your draft is saved right now. Discarding removes it for good — this can&apos;t be undone.
        </p>
        <div className={s.discardActions}>
          <Button style="border" variant="error" size="s" onClick={onDiscard}>
            Discard
          </Button>
          <Button size="s" onClick={onKeep}>
            Keep editing
          </Button>
        </div>
      </div>
    </Modal>
  );
}
