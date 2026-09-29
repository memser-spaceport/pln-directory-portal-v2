'use client';

import { useSyncExternalStore } from 'react';

import { useShortcutLabels } from '@/components/page/ai-apps/shortcutKeys';

/**
 * Keyboard-shortcut labels for the feedback dialog, one string per chord.
 *
 * Production's `useShortcutLabels` hands out the parts (`mod`, `shift`,
 * `enter`) and the dialog renders each in its own <kbd> — "⌘" "⇧" "S" as three
 * pills. LAB-2700 asks for one pill per chord, so this module joins them:
 * Apple's glyph run on a Mac (modifier order ⌃⌥⇧⌘, the order production already
 * uses for `open`: "⌥⌘↩"), and "+"-joined words everywhere else, the order
 * production's Windows `open` uses ("Alt+Ctrl+Enter").
 *
 * The OS is production's detection (its `mod` is "⌘" on a Mac) unless the
 * prototype's review switch overrides it, so both spellings can be judged on
 * one machine. The override is a module-level store rather than props because
 * the switch lives in the masthead and the dialog is mounted two levels down.
 *
 * Deliberately not covered: the annotator is imported from production and
 * reads production's hook, so the switch does not reach its tool/Undo labels.
 */

export type ShortcutPlatform = 'mac' | 'windows';

export type ChordLabels = {
  platform: ShortcutPlatform;
  open: string;
  screenshot: string;
  send: string;
  close: string;
  undo: string;
  redo: string;
};

const MAC: ChordLabels = {
  platform: 'mac',
  open: '⌥⌘↩',
  screenshot: '⇧⌘S',
  send: '⌘↩',
  close: 'Esc',
  undo: '⌘Z',
  redo: '⇧⌘Z',
};

const WINDOWS: ChordLabels = {
  platform: 'windows',
  open: 'Alt+Ctrl+Enter',
  screenshot: 'Ctrl+Shift+S',
  send: 'Ctrl+Enter',
  close: 'Esc',
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Shift+Z',
};

let override: ShortcutPlatform | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setShortcutPlatform(platform: ShortcutPlatform) {
  override = platform;
  listeners.forEach((listener) => listener());
}

function useOverride(): ShortcutPlatform | null {
  return useSyncExternalStore(
    subscribe,
    () => override,
    () => null,
  );
}

/** The platform the labels are drawn for: the review switch, else the detected OS. */
export function useShortcutPlatform(): ShortcutPlatform {
  const detected: ShortcutPlatform = useShortcutLabels().mod === '⌘' ? 'mac' : 'windows';
  return useOverride() ?? detected;
}

export function useChordLabels(): ChordLabels {
  return useShortcutPlatform() === 'mac' ? MAC : WINDOWS;
}

/** The annotator's single-key tools, in its toolbar order. */
export const ANNOTATOR_TOOL_KEYS: { label: string; key: string }[] = [
  { label: 'Comment', key: 'C' },
  { label: 'Draw', key: 'P' },
  { label: 'Box', key: 'R' },
  { label: 'Oval', key: 'O' },
  { label: 'Arrow', key: 'A' },
];
