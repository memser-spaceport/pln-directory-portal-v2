'use client';

import { type RefObject, useEffect, useRef } from 'react';

import { ANNOTATOR_TOOL_KEYS, useChordLabels } from './shortcutPlatform';

import local from './GiveFeedbackDialog.module.scss';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** The header button that toggles the panel — a press on it is not an outside click. */
  triggerRef: RefObject<HTMLElement | null>;
}

/**
 * The feedback dialog's shortcut reference (LAB-2700): a small panel dropped
 * from the header's "Shortcuts" button, listing every chord the dialog and the
 * annotator answer — the ones shipped in LAB-2672, read off production's
 * `shortcutKeys.ts` and `AnnotatorModal`, not re-decided here.
 *
 * Two groups, because the chords live in two places: the dialog, and the
 * annotator that opens over it after a capture. Each chord is one pill.
 *
 * Esc and an outside press close it; the dialog stops listening for its own
 * Esc while this is open (see the dialog's `closeOnEscape`), so the first Esc
 * closes the panel and the second closes the dialog.
 */
export function KeyboardShortcutsPanel({ isOpen, onClose, triggerRef }: Props) {
  const keys = useChordLabels();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      onClose();
    };

    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const dialogRows = [
    { label: 'Open feedback', key: keys.open },
    { label: 'Take screenshot', key: keys.screenshot },
    { label: 'Send feedback', key: keys.send },
    { label: 'Close', key: keys.close },
  ];
  const annotatorRows = [
    ...ANNOTATOR_TOOL_KEYS,
    { label: 'Undo', key: keys.undo },
    { label: 'Redo', key: keys.redo },
    { label: 'Add to feedback', key: keys.send },
    { label: 'Discard', key: keys.close },
  ];

  return (
    <div
      ref={panelRef}
      id="feedback-shortcuts-panel"
      className={local.shortcutsPanel}
      role="dialog"
      aria-label="Keyboard shortcuts"
    >
      <ShortcutGroup title="Feedback" rows={dialogRows} />
      <ShortcutGroup title="Annotating a screenshot" rows={annotatorRows} />
    </div>
  );
}

function ShortcutGroup({ title, rows }: { title: string; rows: { label: string; key: string }[] }) {
  return (
    <div className={local.shortcutsGroup}>
      <p className={local.shortcutsGroupTitle}>{title}</p>
      <dl className={local.shortcutsList}>
        {rows.map((row) => (
          <div key={row.label} className={local.shortcutsRow}>
            <dt>{row.label}</dt>
            <dd>
              <kbd className={local.chord}>{row.key}</kbd>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
