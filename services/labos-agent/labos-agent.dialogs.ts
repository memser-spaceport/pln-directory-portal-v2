'use client';

import { useSyncExternalStore } from 'react';

/**
 * LAB-3302: which open dialogs stop the agent corner and Ctrl/⌘ J.
 *
 * The rule: a dialog stops the agent, except a dialog that is a page to read. The news story modal (`/?news=<uid>`)
 * is such a page: its URL is the agent's `news-story` context. It marks itself with an empty element that has
 * `data-labos-agent-passthrough`. Every other dialog stops the agent: forms, confirms, the share sheet over a story.
 * A dialog inside a passthrough modal (for example a share sheet) still stops the agent.
 */
export const AGENT_PASSTHROUGH_ATTR = 'data-labos-agent-passthrough';

/** The same set as `isAnyDialogOpen` (`shortcutKeys.ts`). `data-modal` marks the overlay of the common `Modal`. */
const DIALOG_SELECTOR = 'dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"], [data-modal]';

/** The dialog shells that hold a passthrough marker: the marker's dialog ancestors (container and overlay). */
function passthroughShells(): Set<Element> {
  const shells = new Set<Element>();
  document.querySelectorAll(`[${AGENT_PASSTHROUGH_ATTR}]`).forEach((marker) => {
    let shell = marker.parentElement?.closest(DIALOG_SELECTOR) ?? null;
    while (shell) {
      shells.add(shell);
      shell = shell.parentElement?.closest(DIALOG_SELECTOR) ?? null;
    }
  });
  return shells;
}

/** An open dialog that stops the agent. A passthrough modal (the news story) does not count. */
export function isBlockingDialogOpen(): boolean {
  const shells = passthroughShells();
  return Array.from(document.querySelectorAll(DIALOG_SELECTOR)).some((el) => !shells.has(el));
}

/** A passthrough modal (the news story) is open. The panel and the corner then go above it. */
export function isPassthroughModalOpen(): boolean {
  return passthroughShells().size > 0;
}

/** `Modal` portals its overlay as a child of `<body>`, so the body's child list is enough to watch. */
function subscribeBody(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.body, { childList: true });
  return () => observer.disconnect();
}

export function useIsPassthroughModalOpen(): boolean {
  return useSyncExternalStore(subscribeBody, isPassthroughModalOpen, () => false);
}

/**
 * `Modal` with `inertBackground` sets `inert` on the other children of `<body>` when it opens. The panel and the corner
 * portal in above a passthrough modal, so they take `inert` off their own node.
 */
export const keepInteractive = (el: HTMLElement | null) => {
  if (el) el.inert = false;
};
