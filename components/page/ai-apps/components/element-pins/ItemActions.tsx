'use client';

import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/common/Button/Button';
import { FEEDBACK_COMMENT_MAX_LENGTH } from '@/services/ai-app-feedback/ai-app-feedback.service';

import s from './CommentMode.module.scss';

type MenuProps = {
  /** "Actions for your comment", "Actions for this reply"… */
  label: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

/**
 * The ⋮ on a comment or reply (prototype ai-apps-comments): Edit and Delete on
 * your own, Delete only on someone else's for an admin. Esc closes the menu —
 * and only the menu: comment mode reads Esc too, and skips a handled one.
 */
export function ItemActionsMenu({ label, onEdit, onDelete }: MenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  if (!onEdit && !onDelete) return null;

  const choose = (action?: () => void) => () => {
    setOpen(false);
    action?.();
  };

  return (
    <div
      ref={rootRef}
      className={s.itemActions}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault();
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        className={s.itemActionsTrigger}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <circle cx="8" cy="3.5" r="1.3" fill="currentColor" />
          <circle cx="8" cy="8" r="1.3" fill="currentColor" />
          <circle cx="8" cy="12.5" r="1.3" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div className={s.itemActionsMenu} role="menu" aria-label={label}>
          {onEdit && (
            <button type="button" role="menuitem" className={s.itemActionsItem} onClick={choose(onEdit)}>
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              role="menuitem"
              className={clsx(s.itemActionsItem, s.itemActionsDanger)}
              onClick={choose(onDelete)}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

type EditProps = {
  initial: string;
  label: string;
  onCancel: () => void;
  onSave: (text: string) => void;
};

/** Inline edit (prototype): the text in a field, then Cancel / Save. Esc cancels, ⌘↵ saves. */
export function InlineEdit({ initial, label, onCancel, onSave }: EditProps) {
  const [text, setText] = useState(initial);
  const trimmed = text.trim();
  const canSave = trimmed.length > 0 && trimmed.length <= FEEDBACK_COMMENT_MAX_LENGTH && trimmed !== initial.trim();
  const save = () => canSave && onSave(trimmed);
  return (
    <div className={s.inlineEdit}>
      <textarea
        className={clsx(s.composerField, s.inlineEditField)}
        aria-label={label}
        maxLength={FEEDBACK_COMMENT_MAX_LENGTH}
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            save();
          }
        }}
      />
      <div className={s.inlineEditButtons}>
        <Button style="border" variant="neutral" size="xs" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="xs" disabled={!canSave} onClick={save}>
          Save
        </Button>
      </div>
    </div>
  );
}

type ConfirmProps = {
  question: string;
  detail?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** "Delete comment?" in place, as replies already ask it. */
export function ConfirmDelete({ question, detail, onConfirm, onCancel }: ConfirmProps) {
  return (
    <div className={s.replyConfirm} role="group" aria-label={question}>
      <span>
        {question}
        {detail && <span className={s.confirmDetail}> {detail}</span>}
      </span>
      <button type="button" className={s.linkButtonDanger} onClick={onConfirm}>
        Delete
      </button>
      <button type="button" className={s.linkButton} onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

/** "· edited", with when in its tooltip. */
export function EditedMark({ at }: { at: string | null | undefined }) {
  if (!at) return null;
  return (
    <span className={s.edited} title={`Edited ${new Date(at).toLocaleString()}`}>
      {' '}
      · edited
    </span>
  );
}
