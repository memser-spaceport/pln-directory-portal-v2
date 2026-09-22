'use client';

import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import s from './ConfirmLayer.module.scss';

/**
 * Hosts a confirmation above the dialog it is asking about.
 *
 * `ConfirmDialog` positions itself `fixed`, which sounds like it would cover the
 * viewport from anywhere — but a `fixed` element is laid out against its nearest
 * TRANSFORMED ancestor, not the viewport, and `Modal` animates its container
 * with framer-motion. Any transform left on it, `scale(1)` included, confines
 * the confirmation to the modal's own box: tolerable over the full-width
 * annotator, visibly broken over the small anchored feedback popover, where a
 * 560px dialog would be trapped in a ~420px panel.
 *
 * Whether a transform survives the animation is not something to build on:
 * `Modal` already documents framer-motion 12.16 on React 19 failing to finish
 * what it starts. Portalling to the body sidesteps the question — there is no
 * transformed ancestor left to be caught by.
 *
 * The layer carries the z-index because `ConfirmDialog`'s own is 1000, below the
 * annotator overlay's 10001. As a stacking context, this wrapper lifts the whole
 * subtree in one place rather than editing a component five other features use.
 */
export function ConfirmLayer({ isOpen, children }: { isOpen: boolean; children: ReactNode }) {
  /* No mounted flag needed: `isOpen` only goes true in response to a click, so
     server and first client render agree on `null` and there is nothing to
     mismatch. The document check is just for the portal's target. */
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(<div className={s.layer}>{children}</div>, document.body);
}
