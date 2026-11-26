'use client';

import { useCallback } from 'react';

/**
 * LAB-3457: the height of the chat composer pinned at the foot of AI search and AI agent chat, on `<html>`. Below
 * 960px the floating corner (the agent corner and the feedback button) sits above it, so it does not cover Send. The
 * wrapper carries `data-pinned-composer`, which the corner's styles look for.
 *
 * A callback ref: the pinned composer mounts when a new chat becomes a thread, and goes away with it.
 */
export const PINNED_COMPOSER_HEIGHT_VAR = '--pinned-composer-height';

export function usePinnedComposerHeight() {
  return useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const style = document.documentElement.style;
    const publish = () => style.setProperty(PINNED_COMPOSER_HEIGHT_VAR, `${el.offsetHeight}px`);
    publish();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(publish);
    observer?.observe(el);
    return () => {
      observer?.disconnect();
      style.removeProperty(PINNED_COMPOSER_HEIGHT_VAR);
    };
  }, []);
}
