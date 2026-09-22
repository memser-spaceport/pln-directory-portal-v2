'use client';

import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';

import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { ConfirmDialog } from '@/components/page/demo-day/FounderPendingView/components/ConfirmDialog';
import { CloseIcon, CommentIcon, PencilSimpleLineIcon } from '@/components/icons';
import { AnnotationCanvas, DEFAULT_DRAW_COLOR, DRAW_COLORS, type AnnotatorTool } from './AnnotationCanvas';
import { emptyAnnotations, type AnnotationState } from './types';

import s from './AnnotatorModal.module.scss';

interface Props {
  imageSrc: string;
  onDiscard: () => void;
  onAdd: (annotations: AnnotationState) => void;
  onToolSelected?: (tool: AnnotatorTool) => void;
  /**
   * What this capture already carries, when it is being reopened to edit.
   *
   * Absent for a fresh capture. Present, it is the history's FLOOR rather than
   * its first change: undo walks back to the state the editor opened on and
   * stops, because everything before that belongs to a session that was already
   * saved and is not this editor's to undo.
   */
  initialAnnotations?: AnnotationState;
}

type History = {
  entries: AnnotationState[];
  index: number;
};

export function AnnotatorModal({ imageSrc, onDiscard, onAdd, onToolSelected, initialAnnotations }: Props) {
  /* Reopened rather than fresh — the two differ only in what the footer promises
     and where the history starts. */
  const isEditing = Boolean(initialAnnotations);
  const [tool, setTool] = useState<AnnotatorTool>('draw');
  const [strokeColor, setStrokeColor] = useState<(typeof DRAW_COLORS)[number]>(DEFAULT_DRAW_COLOR);
  /* Lazy, and seeded once: a later render must not reset an edit in progress,
     and `emptyAnnotations()` allocates. */
  const [history, setHistory] = useState<History>(() => ({
    entries: [initialAnnotations ?? emptyAnnotations()],
    index: 0,
  }));
  const annotations = history.entries[history.index];
  const canUndo = history.index > 0;
  const canRedo = history.index < history.entries.length - 1;
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  /**
   * Whether discarding would actually throw anything away.
   *
   * The same test as `canUndo`, and deliberately so: index 0 is the state this
   * editor opened on, so anyone who has undone their way back to it has nothing
   * left to lose either. Asking them to confirm would be asking about nothing —
   * and a dialog that fires when nothing is at stake is one people learn to
   * dismiss without reading, which is the habit that loses real work later.
   */
  const hasUnsavedWork = history.index > 0;

  const requestDiscard = () => {
    if (hasUnsavedWork) {
      setConfirmingDiscard(true);
      return;
    }
    onDiscard();
  };

  const selectTool = (next: AnnotatorTool) => {
    if (next === tool) return;
    setTool(next);
    onToolSelected?.(next);
  };

  const push = (next: AnnotationState) => {
    setHistory((prev) => ({
      entries: [...prev.entries.slice(0, prev.index + 1), next],
      index: prev.index + 1,
    }));
  };

  const undo = useCallback(() => {
    setHistory((prev) => (prev.index === 0 ? prev : { ...prev, index: prev.index - 1 }));
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => (prev.index >= prev.entries.length - 1 ? prev : { ...prev, index: prev.index + 1 }));
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('textarea, input, [contenteditable="true"]')) return;
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      const key = event.key.toLowerCase();
      if (key === 'z' && event.shiftKey) {
        event.preventDefault();
        redo();
        return;
      }
      if (key === 'z') {
        event.preventDefault();
        undo();
        return;
      }
      if (key === 'y') {
        event.preventDefault();
        redo();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  return (
    <Modal
      isOpen
      onClose={requestDiscard}
      closeOnBackdropClick={false}
      closeOnEscape={false}
      lockScroll
      overlayClassname={s.overlay}
      className={s.container}
      ariaLabelledBy="ai-app-screenshot-annotator-title"
    >
      <div className={s.root}>
        <div className={s.header}>
          <h2 id="ai-app-screenshot-annotator-title" className={s.title}>
            Annotate screenshot
          </h2>
          <button type="button" className={s.close} onClick={requestDiscard} aria-label="Discard screenshot">
            <CloseIcon width={16} height={16} />
          </button>
        </div>

        <div className={s.toolbar} role="toolbar" aria-label="Annotation tools">
          <button
            type="button"
            className={clsx(s.tool, tool === 'comment' && s.toolActive)}
            aria-pressed={tool === 'comment'}
            onClick={() => selectTool('comment')}
          >
            <CommentIcon />
            Comment
          </button>
          <button
            type="button"
            className={clsx(s.tool, tool === 'draw' && s.toolActive)}
            aria-pressed={tool === 'draw'}
            onClick={() => selectTool('draw')}
          >
            <PencilSimpleLineIcon width={16} height={16} />
            Draw
          </button>
          <button
            type="button"
            className={clsx(s.tool, tool === 'rect' && s.toolActive)}
            aria-pressed={tool === 'rect'}
            onClick={() => selectTool('rect')}
          >
            <BoxIcon />
            Box
          </button>
          <button
            type="button"
            className={clsx(s.tool, tool === 'ellipse' && s.toolActive)}
            aria-pressed={tool === 'ellipse'}
            onClick={() => selectTool('ellipse')}
          >
            <OvalIcon />
            Oval
          </button>

          <div className={s.colors} role="group" aria-label="Draw color">
            {DRAW_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={clsx(s.swatch, strokeColor === color && s.swatchActive)}
                style={{ background: color }}
                aria-label={`Draw in ${color}`}
                aria-pressed={strokeColor === color}
                onClick={() => {
                  setStrokeColor(color);
                  /* Only the comment tool draws nothing, so only it has to be
                     swapped out to make the new color mean something. Reaching
                     for a color while Box is active is choosing the box's color,
                     not asking to go back to freehand. */
                  if (tool === 'comment') selectTool('draw');
                }}
              />
            ))}
          </div>

          <div className={s.history}>
            <button type="button" className={s.iconTool} onClick={undo} disabled={!canUndo} aria-label="Undo">
              <UndoIcon />
            </button>
            <button type="button" className={s.iconTool} onClick={redo} disabled={!canRedo} aria-label="Redo">
              <RedoIcon />
            </button>
          </div>
        </div>

        <div className={s.stage}>
          <AnnotationCanvas
            imageSrc={imageSrc}
            annotations={annotations}
            onChange={push}
            tool={tool}
            strokeColor={strokeColor}
          />
        </div>

        <div className={s.footer}>
          {/* "Discard" alone is honest for a fresh capture and a lie for an edit:
              it throws away the changes, not the screenshot, which stays in the
              feedback either way. Not "Cancel" — the dialog underneath has one,
              and two Cancels on screen do not say which thing is being
              cancelled. */}
          <Button style="border" variant="neutral" onClick={requestDiscard}>
            {isEditing ? 'Discard changes' : 'Discard'}
          </Button>
          <Button onClick={() => onAdd(annotations)}>{isEditing ? 'Save changes' : 'Add to feedback'}</Button>
        </div>
      </div>

      {/* Rendered INSIDE the modal on purpose. `Modal` portals its children to
          the body, so from here the confirmation lands inside the annotator's
          own stacking context and paints above it. Hoisted out to page level it
          would sit under the overlay — visible through nothing, clickable by
          nobody.

          "Yes, discard" rather than "Discard": the footer button underneath
          already says that, and nothing here hides it from the accessibility
          tree while the confirmation is up. Two buttons, one name, opposite
          consequences. */}
      <ConfirmDialog
        isOpen={confirmingDiscard}
        title={isEditing ? 'Discard changes?' : 'Discard screenshot?'}
        message={
          isEditing
            ? 'Your changes will be lost. The screenshot itself stays in your feedback.'
            : 'The screenshot and everything you have drawn on it will be lost.'
        }
        confirmText="Yes, discard"
        cancelText="Keep editing"
        onConfirm={() => {
          setConfirmingDiscard(false);
          onDiscard();
        }}
        onCancel={() => setConfirmingDiscard(false)}
      />
    </Modal>
  );
}

function BoxIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2.7" y="4" width="10.6" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function OvalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <ellipse cx="8" cy="8" rx="5.3" ry="4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M5.5 5.5H3.5L6 3M3.5 5.5 6 8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3.5 5.5h6.25a3.25 3.25 0 1 1 0 6.5H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M10.5 5.5h2L10 3m2.5 2.5L10 8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12.5 5.5H6.25a3.25 3.25 0 1 0 0 6.5H10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
