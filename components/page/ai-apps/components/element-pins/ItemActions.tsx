'use client';

import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/common/Button/Button';
import { FEEDBACK_COMMENT_MAX_LENGTH } from '@/services/ai-app-feedback/ai-app-feedback.service';

import s from './CommentMode.module.scss';

type MenuProps = {
  /** "Actions for your comment", "Actions for this reply"… */
  label: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

/** Room the menu needs below its button; with less, it opens upward. */
const MENU_ROOM = 96;

type MenuPlacement = { right: number } & ({ top: number } | { bottom: number });

function placeMenu(trigger: HTMLElement): MenuPlacement {
  const r = trigger.getBoundingClientRect();
  const right = window.innerWidth - r.right;
  return r.bottom + MENU_ROOM > window.innerHeight
    ? { right, bottom: window.innerHeight - r.top + 4 }
    : { right, top: r.bottom + 4 };
}

/**
 * The ⋮ on a comment or reply (prototype ai-apps-comments): Edit and Delete on
 * your own, Delete only on someone else's for an admin.
 *
 * The menu is portalled to the body at a fixed spot beside its button: inside
 * the thread card it was clipped by the card's scroll area. It closes on any
 * scroll or resize rather than drifting from the button. Esc closes the menu —
 * and only the menu: comment mode reads Esc too, and skips a handled one (React
 * events bubble out of the portal to the root below).
 */
export function ItemActionsMenu({ label, onEdit, onDelete }: MenuProps) {
  const [placement, setPlacement] = useState<MenuPlacement | null>(null);
  const open = placement !== null;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setPlacement(null);
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) close();
    };
    document.addEventListener('pointerdown', onPointer);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  if (!onEdit && !onDelete) return null;

  const choose = (action?: () => void) => () => {
    setPlacement(null);
    action?.();
  };

  return (
    <div
      className={s.itemActions}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault();
          setPlacement(null);
          triggerRef.current?.focus();
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={s.itemActionsTrigger}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => setPlacement(open ? null : placeMenu(event.currentTarget))}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <circle cx="8" cy="3.5" r="1.3" fill="currentColor" />
          <circle cx="8" cy="8" r="1.3" fill="currentColor" />
          <circle cx="8" cy="12.5" r="1.3" fill="currentColor" />
        </svg>
      </button>
      {placement &&
        createPortal(
          <div ref={menuRef} className={s.itemActionsMenu} style={placement} role="menu" aria-label={label}>
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
          </div>,
          document.body,
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

/**
 * "Delete comment?" in place. The question gets its own line and the two
 * buttons stay together under it: in one wrapping row, "Also deletes N
 * replies." pushed Cancel onto a line of its own.
 */
export function ConfirmDelete({ question, detail, onConfirm, onCancel }: ConfirmProps) {
  return (
    <div className={s.replyConfirm} role="group" aria-label={question}>
      <p className={s.confirmText}>
        {question}
        {detail && <span className={s.confirmDetail}> {detail}</span>}
      </p>
      <div className={s.confirmButtons}>
        <button type="button" className={s.linkButtonDanger} onClick={onConfirm}>
          Delete
        </button>
        <button type="button" className={s.linkButton} onClick={onCancel}>
          Cancel
        </button>
      </div>
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
