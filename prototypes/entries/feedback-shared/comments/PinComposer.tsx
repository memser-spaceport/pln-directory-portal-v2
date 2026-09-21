'use client';

import { clsx } from 'clsx';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/common/Button/Button';
// The feedback dialog's card (radius, shadow) and its footer rule.
import fd from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog.module.scss';

import pt from './PinThread.module.scss';
import s from './PinComposer.module.scss';

const MAX_LENGTH = 5000;

interface Props {
  text: string;
  onText: (text: string) => void;
  onCancel: () => void;
  /** Queues the note; nothing is sent from here. */
  onAdd: () => void;
  style?: React.CSSProperties;
  flip: boolean;
}

/**
 * The note you write on a pin you just dropped — beside the thing it is about,
 * which is where every pinned-comment tool puts the writing. It is deliberately
 * small: a field and two presses. The button says "Add comment", not "Send",
 * because the note joins the set you review and send together; the screenshot
 * is looked at (and marked up) there, not here.
 */
export function PinComposer({ text, onText, onCancel, onAdd, style, flip }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const canAdd = text.trim().length > 0;

  return (
    <div
      className={clsx(fd.root, pt.card, flip && pt.flip)}
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={s.field}>
        <textarea
          ref={ref}
          className={pt.textarea}
          rows={3}
          maxLength={MAX_LENGTH}
          placeholder="What worked, what didn’t, and what would make this more useful?"
          value={text}
          onChange={(e) => onText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canAdd) onAdd();
          }}
        />
      </div>
      <div className={clsx(fd.footer, pt.footer)}>
        <Button style="border" variant="neutral" size="xs" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="xs" disabled={!canAdd} onClick={onAdd}>
          Add comment
        </Button>
      </div>
    </div>
  );
}
