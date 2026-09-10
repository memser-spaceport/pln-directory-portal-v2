'use client';

import { useEffect, useState } from 'react';
import { autoUpdate, flip, offset, shift, useFloating, FloatingPortal } from '@floating-ui/react';

import s from './UnsavedEditPopup.module.scss';

/**
 * "Verify and save your changes" — said next to the button that does it.
 *
 * Shown when someone tried to leave a step with this form half-edited. The
 * refusal on its own is the worst version of this: a button that does nothing
 * reads as broken. So the move is refused, the form is scrolled to, and this
 * says why, beside the thing to press.
 *
 * **Anchored to the controls row, not to the Save button itself.** On a phone
 * `.controls` is `display: none` — the Save button lives in a separate sticky
 * bar at the bottom (`EditFormMobileControls`) — so a popup pinned to it would
 * be positioned against a zero-size hidden element and land in the corner. The
 * row is visible in both, and `bottom-end` against it puts the popup directly
 * under Save on desktop, since Save is the last thing on that row.
 *
 * **Portalled and `fixed`.** It hangs off a form inside a scrolling drawer;
 * rendered in place it would be clipped by the first `overflow` ancestor.
 */

/** Long enough to read twice, short enough not to outlive the press. */
const DISMISS_MS = 6_000;

interface Props {
  anchor: HTMLElement | null;
  onDismiss: () => void;
}

export function UnsavedEditPopup({ anchor, onDismiss }: Props) {
  /* Both elements are handed in rather than collected through floating-ui's own
     `refs`. A state setter as the `ref` is a plain callback, where
     `refs.setFloating` is a ref read during render — which `react-hooks/refs`
     rejects, and rightly: this is the API floating-ui offers for exactly this. */
  const [floatingEl, setFloatingEl] = useState<HTMLElement | null>(null);

  const { floatingStyles } = useFloating({
    placement: 'bottom-end',
    strategy: 'fixed',
    elements: { reference: anchor, floating: floatingEl },
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    /* The timer is the *backstop*, not the mechanism. The popup already
       disappears the moment the form stops being dirty — saved or cancelled —
       because the caller only renders it while both are true. This is only for
       the person who walks away mid-thought. */
    const timer = setTimeout(onDismiss, DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <FloatingPortal>
      <div
        ref={setFloatingEl}
        style={floatingStyles}
        className={s.popup}
        /* `status`, not `alert`: this is the answer to a button the person just
           pressed, so it is expected — an assertive interruption would talk over
           them. `polite` lets it land after whatever the press already said. */
        role="status"
        aria-live="polite"
      >
        Verify and save your changes to continue.
      </div>
    </FloatingPortal>
  );
}
