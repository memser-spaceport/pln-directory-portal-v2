'use client';

import { useEffect, useSyncExternalStore } from 'react';

import { isBlockingDialogOpen } from '../labos-agent.dialogs';

/** The agent panel's `<aside aria-label="Agent">`. Ctrl/⌘ J in its composer closes the panel. */
const AGENT_PANEL_SELECTOR = 'aside[aria-label="Agent"]';

/** An editable element the browser can see. jsdom has no `isContentEditable`, so the attribute check comes too. */
const EDITABLE_SELECTOR = '[contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return true;
  return target.isContentEditable || !!target.closest(EDITABLE_SELECTOR);
}

/**
 * Ctrl/⌘ J, without Shift or Alt (LAB-3302). Not a match:
 * - a held key, an IME composition or an event that something else already handled;
 * - a text field outside the agent panel (the field keeps the key);
 * - an open dialog that stops the agent (`isBlockingDialogOpen`): the news story modal does not, and the feedback
 *   drawer gives the slot to the agent.
 */
export function isAgentShortcut(event: KeyboardEvent, options: { feedbackOpen: boolean }): boolean {
  if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return false;
  if (event.code !== 'KeyJ' && event.key.toLowerCase() !== 'j') return false;
  if (event.repeat || event.isComposing || event.defaultPrevented) return false;
  const inPanel = event.target instanceof Element && !!event.target.closest(AGENT_PANEL_SELECTOR);
  if (isTypingTarget(event.target) && !inPanel) return false;
  if (!options.feedbackOpen && !inPanel && isBlockingDialogOpen()) return false;
  return true;
}

/**
 * Listens for Ctrl/⌘ J while `isEnabled`. The caller passes `isEnabled` only for a member with agent access, so the
 * browser keeps Ctrl+J (Chrome downloads on Windows) for everyone else. `preventDefault` runs only on a match.
 */
export function useLabosAgentShortcut(input: { isEnabled: boolean; feedbackOpen: boolean; onToggle: () => void }) {
  const { isEnabled, feedbackOpen, onToggle } = input;

  useEffect(() => {
    if (!isEnabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (!isAgentShortcut(event, { feedbackOpen })) return;
      event.preventDefault();
      onToggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isEnabled, feedbackOpen, onToggle]);
}

/** The key hint text: "⌘J" on a Mac, "Ctrl J" on other systems. `mod` comes from `useShortcutLabels`. */
export function agentShortcutHint(mod: string): string {
  return mod === '⌘' ? '⌘J' : 'Ctrl J';
}

/**
 * A mouse or trackpad and a screen at least tablet-portrait wide (640, `styles/media.scss`). A phone or a bare tablet
 * has no keys to press, so the corner shows no key hint there.
 */
export const KEY_HINT_QUERY = '(any-pointer: fine) and (min-width: 640px)';

function subscribeKeyHint(onChange: () => void) {
  const mql = window.matchMedia?.(KEY_HINT_QUERY);
  mql?.addEventListener?.('change', onChange);
  return () => mql?.removeEventListener?.('change', onChange);
}

/** Server snapshot is `false`: a phone never gets a flash of the hint before hydration. */
export function useShowsKeyHint(): boolean {
  return useSyncExternalStore(
    subscribeKeyHint,
    () => Boolean(window.matchMedia?.(KEY_HINT_QUERY).matches),
    () => false,
  );
}
