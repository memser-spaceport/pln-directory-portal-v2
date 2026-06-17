'use client';

import { Modal } from '@/components/common/Modal';
import s from './DiscardDraftDialog.module.scss';

interface Props {
  readonly isOpen: boolean;
  readonly draftTitle: string;
  readonly onKeep: () => void;
  readonly onDiscard: () => void;
}

export function DiscardDraftDialog({ isOpen, draftTitle, onKeep, onDiscard }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onKeep} closeOnBackdropClick closeOnEscape>
      <div className={s.content} role="dialog" aria-modal aria-labelledby="discard-draft-title">
        <h2 id="discard-draft-title" className={s.title}>Discard draft?</h2>
        <p className={s.body}>
          You&apos;ll lose &ldquo;{draftTitle}&rdquo;. This can&apos;t be undone.
        </p>
        <div className={s.actions}>
          <button type="button" className={s.keepBtn} onClick={onKeep}>
            Keep draft
          </button>
          <button type="button" className={s.discardBtn} onClick={onDiscard}>
            Discard draft
          </button>
        </div>
      </div>
    </Modal>
  );
}
