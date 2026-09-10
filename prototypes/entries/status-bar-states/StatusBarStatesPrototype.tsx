'use client';

import { useRef, useState, useSyncExternalStore } from 'react';

import { Button } from '@/components/common/Button';

// The object under review, both ways it is drawn: the floating card the
// profile pages use, and the row the job board drawer puts in its footer.
import { EditorStatusRow, FloatingEditorBar } from '../profile-shared/FloatingEditorControls';
import type { ImportWait } from '../profile-shared/ExperienceImport/ImportWait';
// The drawer's own footer chrome, so the row is seen where it lives — the
// sticky bar, its inner row, the status slot, the hint and Continue.
import d from '../job-board-profile-step/JobApplyFlowDrawer.module.scss';

import { FLOATING_STATES, FOOTER_STATES, overdueWait } from './mocks';
import s from './StatusBarStatesPrototype.module.scss';

/**
 * **A states sheet for the status bar** — *"Create a separate tab with all
 * status bar states (arrow down, arrow up, loader etc)."*
 *
 * Every state the bar can be in, laid out one under another so it can be
 * read like a spec rather than produced by scrolling a card away at the
 * right moment. Nothing here is a copy: each frame is the real component
 * told the state directly — `FloatingEditorBar` is the bar without its
 * fixed position, `EditorStatusRow` is what the drawer's footer mounts —
 * so the sheet cannot drift from the hosts.
 *
 * Two things are told, not shown. The bar only exists while the open card
 * is out of view, so "card in view" is an absence on the profile pages and
 * the footer's own hint on the drawer; the sheet draws the second. And the
 * phone layouts are viewport rules (the bar stacks, the footer becomes a
 * column), which a frame on a wide page cannot trigger — see them by
 * narrowing the window on the real hosts.
 */
const subscribeToNothing = () => () => {};
const isClient = () => true;
const isServer = () => false;

export default function StatusBarStatesPrototype() {
  /* Client-only: the overdue read carries a clock made from `Date.now()`,
     and the progress it paints would differ between the server's render and
     the first client render. The gate is the store pattern rather than an
     effect that sets state, which the hooks rule rejects; the clock is made
     once, on the client, by the state initialiser. */
  const mounted = useSyncExternalStore(subscribeToNothing, isClient, isServer);
  const [overdue] = useState<ImportWait>(overdueWait);

  /* The row's presses scroll to and submit the open card. There is no card
     on this sheet, so they are given nothing to find and do nothing. */
  const noCard = useRef<HTMLElement | null>(null);
  const noop = () => {};

  const resolveWait = (wait: ImportWait | 'overdue' | null | undefined): ImportWait | null =>
    wait === 'overdue' ? overdue : (wait ?? null);

  if (!mounted) return <div className={s.root} />;

  return (
    <div className={s.root}>
      <header className={s.header}>
        <h1 className={s.title}>Status bar — every state</h1>
        <p className={s.description}>
          The bar for an open card that has been scrolled out of view, in both the shapes the product draws it. Each
          frame is the real component told its state; none of them is a picture.
        </p>
      </header>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Floating bar — profile pages</h2>
        <p className={s.note}>
          Onboarding and the member profile. Centred at the bottom of the viewport, on the page. Absent while the card
          is in view.
        </p>
        <div className={s.frames}>
          {FLOATING_STATES.map((state) => (
            <figure key={state.label} className={s.frame}>
              <figcaption className={s.caption}>{state.label}</figcaption>
              <div className={s.stage}>
                <FloatingEditorBar
                  away={state.away}
                  canSave={state.canSave}
                  status={state.status}
                  saveLabel={state.saveLabel}
                  importWait={resolveWait(state.wait)}
                  onBack={noop}
                  onSave={noop}
                />
              </div>
            </figure>
          ))}
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Footer row — job board drawer</h2>
        <p className={s.note}>
          The apply drawer&apos;s profile step. The same object as a row in the drawer&apos;s sticky footer, beside
          Continue, taking the hint&apos;s place once the card is away.
        </p>
        <div className={s.frames}>
          {FOOTER_STATES.map((state) => (
            <figure key={state.label} className={s.frame}>
              <figcaption className={s.caption}>{state.label}</figcaption>
              <div className={s.drawerFrame}>
                <div className={d.footer}>
                  <div className={d.footerInner}>
                    <div className={d.footerStatus}>
                      <EditorStatusRow
                        target={noCard}
                        away={state.away}
                        canSave={state.canSave}
                        status={state.status}
                        saveLabel={state.saveLabel}
                        importWait={resolveWait(state.wait)}
                      />
                    </div>
                    <p className={d.footerHint}>Save this card to continue.</p>
                    <Button type="button" variant="primary" style="fill" size="m" className={d.footerAction} disabled>
                      Continue to apply
                    </Button>
                  </div>
                </div>
              </div>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
