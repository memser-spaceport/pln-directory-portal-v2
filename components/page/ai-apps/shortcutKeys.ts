'use client';

import { useSyncExternalStore } from 'react';

export type ShortcutLabels = {
  mod: string;
  enter: string;
  open: string;
  openAlt: string;
  sendAria: string;
  openAria: string;
  undoAria: string;
  redoAria: string;
  send: string;
  screenshot: string;
  undo: string;
  redo: string;
  redoAlt: string;
  prevField: string;
  screenshotAria: string;
};

const WINDOWS: ShortcutLabels = {
  mod: 'Ctrl',
  enter: 'Enter',
  open: 'Alt+F',
  openAlt: 'Ctrl+Alt+Enter',
  sendAria: 'Control+Enter',
  openAria: 'Alt+F Control+Alt+Enter',
  undoAria: 'Control+Z',
  redoAria: 'Shift+Control+Z Control+Y',
  send: 'Ctrl+Enter',
  screenshot: 'Ctrl+Shift+S',
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Shift+Z',
  redoAlt: 'Ctrl+Y',
  prevField: 'Shift+Tab',
  screenshotAria: 'Control+Shift+S',
};

const MAC: ShortcutLabels = {
  mod: '⌘',
  enter: '↩',
  open: 'Option+F',
  openAlt: '⌥⌘↩',
  sendAria: 'Meta+Enter',
  openAria: 'Alt+F Alt+Meta+Enter',
  undoAria: 'Meta+Z',
  redoAria: 'Shift+Meta+Z Meta+Y',
  send: '⌘↩',
  screenshot: '⌘⇧S',
  undo: '⌘Z',
  redo: '⇧⌘Z',
  redoAlt: '⌘Y',
  prevField: '⇧Tab',
  screenshotAria: 'Meta+Shift+S',
};

const subscribe = () => () => {};

function currentLabels(): ShortcutLabels {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ? MAC : WINDOWS;
}

/** Server snapshot is the Windows label so hydration matches, then the client corrects it. */
export function useShortcutLabels(): ShortcutLabels {
  return useSyncExternalStore(subscribe, currentLabels, () => WINDOWS);
}

function hasPrimaryMod(event: KeyboardEvent): boolean {
  return (event.metaKey || event.ctrlKey) && !event.isComposing;
}

export function isSendChord(event: KeyboardEvent): boolean {
  return event.key === 'Enter' && hasPrimaryMod(event) && !event.altKey && !event.shiftKey;
}

export function isOpenFeedbackChord(event: KeyboardEvent): boolean {
  return event.key === 'Enter' && hasPrimaryMod(event) && event.altKey && !event.shiftKey;
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

/** `data-modal` marks `Modal`'s overlay, which carries no dialog role unless it is labelled. */
export function isAnyDialogOpen(): boolean {
  return Boolean(
    document.querySelector('dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"], [data-modal]'),
  );
}

/** Alt+F by physical key (on a Mac, Option+F reports `key` as "ƒ"), or ⌥⌘↩, which types nothing and so works from a field too. */
export function isOpenFeedbackKey(event: KeyboardEvent): boolean {
  if (event.repeat || event.defaultPrevented || isAnyDialogOpen()) return false;
  if (isOpenFeedbackChord(event)) return true;
  return (
    event.code === 'KeyF' &&
    event.altKey &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.isComposing &&
    !isTypingTarget(event.target)
  );
}

export function isShortcutsKey(event: KeyboardEvent): boolean {
  return (
    event.key === '?' &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.isComposing &&
    !isTypingTarget(event.target)
  );
}

export function isScreenshotChord(event: KeyboardEvent): boolean {
  return event.key.toLowerCase() === 's' && hasPrimaryMod(event) && event.shiftKey && !event.altKey;
}
