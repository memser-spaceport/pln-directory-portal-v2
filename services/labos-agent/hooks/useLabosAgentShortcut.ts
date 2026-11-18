'use client';

import { useEffect } from 'react';

import { isAnyDialogOpen } from '@/components/page/ai-apps/shortcutKeys';

/** The agent panel's `<aside aria-label="Agent">`. Ctrl/⌘ J in its composer closes the panel. */
const AGENT_PANEL_SELECTOR = 'aside[aria-label="Agent"]';

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

/**
 * Ctrl/⌘ J, without Shift or Alt (LAB-3302). Not a match:
 * - a held key, an IME composition or an event that something else already handled;
 * - a text field outside the agent panel (the field keeps the key);
 * - an open dialog, except the feedback drawer, which gives the slot to the agent.
 */
export function isAgentShortcut(event: KeyboardEvent, options: { feedbackOpen: boolean }): boolean {
  if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return false;
  if (event.code !== 'KeyJ' && event.key.toLowerCase() !== 'j') return false;
  if (event.repeat || event.isComposing || event.defaultPrevented) return false;
  const inPanel = event.target instanceof Element && !!event.target.closest(AGENT_PANEL_SELECTOR);
  if (isTypingTarget(event.target) && !inPanel) return false;
  if (!options.feedbackOpen && !inPanel && isAnyDialogOpen()) return false;
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
