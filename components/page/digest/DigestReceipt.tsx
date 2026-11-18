import { Check } from '@phosphor-icons/react';

import type { DigestChoice } from '@/services/digest/digest.types';

import s from './DigestPage.module.scss';

/** The confirmation inside a card after a saved More or Less, with Undo. */
export function DigestReceipt({ choice, onUndo }: { choice: DigestChoice; onUndo: () => void }) {
  return (
    <div className={s.receipt} role="status">
      <span className={s.receiptMark}>
        <Check size={12} weight="bold" />
      </span>
      <span className={s.receiptText}>
        {choice === 'more' ? 'You’ll get more stories like this' : 'You’ll get fewer stories like this'}
      </span>
      <button type="button" className={s.receiptUndo} onClick={onUndo}>
        Undo
      </button>
    </div>
  );
}
