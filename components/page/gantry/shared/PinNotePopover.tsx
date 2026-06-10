'use client';

import { useEffect, useRef, useState } from 'react';
import { PushPinIcon } from '@/components/icons/PushPinIcon';
import { CloseIcon } from '@/components/icons/CloseIcon';
import s from './PinNotePopover.module.scss';

const MAX_NOTE = 500;

interface Props {
  readonly uid: string;
  readonly pos: { top: number; left: number };
  readonly onSave: (uid: string, note: string) => void;
}

export function PinNotePopover({ uid, pos, onSave }: Props) {
  const [note, setNote] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    taRef.current?.focus();
  }, []);

  const save = (text: string) => onSave(uid, text);

  return (
    <>
      <div className={s.backdrop} onClick={() => save(note)} />
      <div className={s.popover} style={{ top: pos.top, left: pos.left }}>
        <div className={s.head}>
          <span className={s.pinIconWrap} aria-hidden>
            <PushPinIcon width={16} height={16} />
          </span>
          <div className={s.headText}>
            <h4 className={s.title}>Pinned — nice.</h4>
            <p className={s.sub}>Add a one-line why-now? (optional)</p>
          </div>
          <button type="button" className={s.closeBtn} onClick={() => save(note)} aria-label="Close">
            <CloseIcon width={14} height={14} />
          </button>
        </div>

        <div className={s.body}>
          <textarea
            ref={taRef}
            className={s.textarea}
            maxLength={MAX_NOTE}
            placeholder="Why now? e.g. blocking my work, needed for a launch…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
          <div className={s.charCount}>{note.length} / {MAX_NOTE}</div>
        </div>

        <div className={s.actions}>
          <button type="button" className={s.skipBtn} onClick={() => save('')}>Skip</button>
          <button type="button" className={s.saveBtn} onClick={() => save(note)}>Save note</button>
        </div>

        <div className={s.footer}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Anonymous to members · only the product team sees your name + note.</span>
        </div>
      </div>
    </>
  );
}
