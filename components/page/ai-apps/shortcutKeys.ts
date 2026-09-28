'use client';

import { useSyncExternalStore } from 'react';

export type ShortcutLabels = {
  mod: string;
  enter: string;
  open: string;
  sendAria: string;
  openAria: string;
  undoAria: string;
  redoAria: string;
  shift: string;
  screenshotAria: string;
};

const WINDOWS: ShortcutLabels = {
  mod: 'Ctrl',
  enter: 'Enter',
  open: 'Alt+Ctrl+Enter',
  sendAria: 'Control+Enter',
  openAria: 'Control+Alt+Enter',
  undoAria: 'Control+Z',
  redoAria: 'Shift+Control+Z Control+Y',
  shift: 'Shift',
  screenshotAria: 'Control+Shift+S',
};

const MAC: ShortcutLabels = {
  mod: '⌘',
  enter: '↩',
  open: '⌥⌘↩',
  sendAria: 'Meta+Enter',
  openAria: 'Alt+Meta+Enter',
  undoAria: 'Meta+Z',
  redoAria: 'Shift+Meta+Z',
  shift: '⇧',
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

export function isScreenshotChord(event: KeyboardEvent): boolean {
  return event.key.toLowerCase() === 's' && hasPrimaryMod(event) && event.shiftKey && !event.altKey;
}
