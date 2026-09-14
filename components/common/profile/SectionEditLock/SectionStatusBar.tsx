'use client';

import { type MouseEvent, type RefObject, type SVGProps, useEffect, useState } from 'react';

import { Button } from '@/components/common/Button';
import { EditIcon } from '@/components/icons';
import { useIsBelowTabletLandscape } from '@/hooks/useIsBelowTabletLandscape';

import { type OpenSectionEdit, useSectionEditLock } from './SectionEditLockContext';

import s from './SectionStatusBar.module.scss';

/**
 * **The status bar for an open section — what is pending, and the way back.**
 *
 * The other half of `SectionEditLock`: with the rest of the page muted the only
 * other thing to do is scroll, and someone who does — to check a date on
 * another card — has left an open form behind. Once the card is mostly out of
 * view this names it ("Editing Office Hours"), carries "Keep editing", which
 * goes back with the first field focused, and — once there is something to save
 * — says so and adds the Save, which submits the open form from where they are.
 *
 * Two shapes, one object. The profile page has no row for it to join, so it
 * floats at the bottom of the viewport (`SectionStatusBar`). The apply drawer
 * already ends in a sticky footer holding Continue, so there the same presses
 * are a row in that footer beside it (`SectionStatusRow`) — a floating bar over
 * a footer would be a second bar standing on the first.
 *
 * **Only above tablet-landscape.** Below it an open editor is a fixed,
 * full-screen takeover (`DetailsSection.editView`) with its own close and Save:
 * there is no page left to scroll away on, and nothing for the bar to say.
 */

export type ScrollDirection = 'up' | 'down';

/** The editor's head: its title row and the first field's label and box. */
const HEAD_PX = 160;

interface AwayOptions {
  /** Sticky chrome that covers the top of the view while the card scrolls under it. */
  topOcclusion?: RefObject<HTMLElement | null>;
  /** How much of the card can remain visible, once its head is gone, before the bar appears. */
  visibleRatioThreshold?: number;
}

/**
 * **Whether the open section has been scrolled away** — `null` while it is in
 * view, or nothing is open, and the direction it went otherwise.
 *
 * "Out of view" means both of: the card's head — its title and first field, the
 * top `HEAD_PX` — is off screen, *and* less than half of what could be on screen
 * is on screen (half the card, or half the viewport for a card taller than the
 * viewport). "None of the card is visible" would never be true on a tall
 * monitor, where a mid-page card on a short page cannot be scrolled fully away;
 * the head clause is what keeps the fix from nagging, since someone who can read
 * the editor's title is still at it however little of the body they can see.
 *
 * Keyed on the open section, so a value left over from the last card can never
 * show the bar for the next one.
 */
function useSectionAway(
  getElement: (() => HTMLElement | null) | undefined,
  activeKey: string | null,
  { topOcclusion, visibleRatioThreshold = 0.5 }: AwayOptions = {},
): ScrollDirection | null {
  const [away, setAway] = useState<{ key: string; direction: ScrollDirection } | null>(null);

  useEffect(() => {
    const card = getElement?.();
    if (!activeKey || !card) return;
    /* Thresholds every 5% of the card, so the crossing is caught wherever it
       falls — "half of what could be on screen" is half the *viewport* for a
       card taller than it, which is some fraction of the card that depends on
       both heights. */
    const observer = new IntersectionObserver(
      ([entry]) => {
        const rect = entry.boundingClientRect;
        const rootTop = entry.rootBounds?.top ?? 0;
        const rootBottom = entry.rootBounds?.bottom ?? window.innerHeight;
        const rootHeight = rootBottom - rootTop;
        const occlusionBottom = topOcclusion?.current?.getBoundingClientRect().bottom ?? rootTop;
        const visibleTop = Math.min(Math.max(rootTop, occlusionBottom), rootBottom);
        const visible = Math.max(0, Math.min(rect.bottom, rootBottom) - Math.max(rect.top, visibleTop));
        const couldBeVisible = Math.min(rect.height, Math.max(1, rootHeight - (visibleTop - rootTop)));
        const headVisible = rect.top < rootBottom && rect.top + HEAD_PX > visibleTop;
        const isAway = !headVisible && visible < couldBeVisible * visibleRatioThreshold;
        const direction: ScrollDirection = rect.top >= rootBottom ? 'down' : 'up';
        setAway(isAway ? { key: activeKey, direction } : null);
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, [activeKey, getElement, topOcclusion, visibleRatioThreshold]);

  if (!activeKey || !away || away.key !== activeKey) return null;
  return away.direction;
}

/** What the bar reports: which card is open, and whether it has anything to save. */
function statusOf(open: OpenSectionEdit) {
  return open.dirty ? `Unsaved changes in ${open.name}` : `Editing ${open.name}`;
}

/**
 * The bar's Save — the card's own Save at a distance, including while it is in
 * flight. The card's row disables itself and says so on submit; a remote copy
 * that stayed pressable would take a second submit for a form that is already
 * saving, and would be the only thing on screen claiming nothing is happening.
 */
function SaveButton({ open, onSave }: { open: OpenSectionEdit; onSave: () => void }) {
  return (
    <Button type="button" style="fill" size="m" className={s.btn} disabled={open.submitting} onClick={onSave}>
      {open.submitting ? 'Saving...' : 'Save changes'}
    </Button>
  );
}

/** The two presses, for the card the lock is held on. */
function sectionActions(open: OpenSectionEdit, topOcclusion?: RefObject<HTMLElement | null>) {
  const back = () => {
    const el = open.getElement();
    if (!el) return;
    const occlusionBottom = topOcclusion?.current?.getBoundingClientRect().bottom ?? 0;
    scrollToSectionStart(el, occlusionBottom > 0 ? occlusionBottom + 12 : 0);
    /* `preventScroll`, or the focus jump fights the smooth scroll and the card
       lands wherever the browser's own focus-scroll put it. */
    const field = el.querySelector<HTMLElement>('input:not([type="hidden"]), textarea, [contenteditable="true"]');
    field?.focus({ preventScroll: true });
  };

  const save = () => {
    /* The open form's own submit, so the same validation and the same
       `onSubmit` run as for the card's own Save. `requestSubmit` rather than
       `submit()`: the latter skips both. */
    open.getElement()?.querySelector('form')?.requestSubmit();
  };

  return { back, save };
}

/** The floating bar — for a profile page, which has no row of its own to join. */
export function SectionStatusBar() {
  const lock = useSectionEditLock();
  const open = lock?.open ?? null;
  const isBelowTabletLandscape = useIsBelowTabletLandscape();
  const away = useSectionAway(open?.getElement, open?.id ?? null);

  if (!open || !away || isBelowTabletLandscape) return null;

  const { back, save } = sectionActions(open);
  const status = statusOf(open);

  const onBarClick = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    back();
  };

  return (
    <div className={s.wrap}>
      <div className={s.bar} onClick={onBarClick}>
        {/* The live region is the sentence, not the bar: a screen reader should
            hear what became pending, and buttons do not belong inside a status
            region. It leads with a direction arrow, so the bar says where the
            open section is before the person presses it. */}
        <span className={s.status} role="status">
          <ScrollArrowIcon className={s.directionMark} direction={away} aria-hidden />
          <span className={s.statusText}>{status}</span>
        </span>
        <div className={s.actions}>
          <Button type="button" style="border" variant="neutral" size="m" className={s.btn} onClick={back}>
            <EditIcon className={s.btnIcon} aria-hidden />
            Keep editing
          </Button>
          {open.dirty && <SaveButton open={open} onSave={save} />}
        </div>
      </div>
    </div>
  );
}

/**
 * The same presses as a row in a bar the host already has — the apply drawer's
 * sticky footer, beside Continue.
 *
 * No sentence: the row shares its width with that button, so the sentence
 * truncated before it said which card. The direction arrow rides on the way
 * back instead, and the sentence survives as its tooltip.
 *
 * Renders nothing when there is nothing to say, so the footer's slot can
 * collapse (`:empty`) and Continue keeps its end of the bar.
 */
export function SectionStatusRow({ topOcclusion }: { topOcclusion?: RefObject<HTMLElement | null> }) {
  const lock = useSectionEditLock();
  const open = lock?.open ?? null;
  const isBelowTabletLandscape = useIsBelowTabletLandscape();
  /* 0.75 rather than the page's half: the drawer's column is a third of the
     screen wide and its cards are correspondingly tall, so half of one still
     leaves the person a long way from the Save they cannot see. */
  const away = useSectionAway(open?.getElement, open?.id ?? null, { topOcclusion, visibleRatioThreshold: 0.75 });

  if (!open || !away || isBelowTabletLandscape) return null;

  const { back, save } = sectionActions(open, topOcclusion);

  return (
    <div className={s.row}>
      <Button
        type="button"
        style="border"
        variant="neutral"
        size="m"
        className={s.btn}
        onClick={back}
        title={statusOf(open)}
      >
        <ScrollArrowIcon className={s.btnIcon} direction={away} aria-hidden />
        Keep editing
      </Button>
      {open.dirty && <SaveButton open={open} onSave={save} />}
    </div>
  );
}

function ScrollArrowIcon({ direction, ...props }: { direction: ScrollDirection } & SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g transform={direction === 'up' ? 'rotate(180 8 8)' : undefined}>
        <path
          d="M8 3.5V12.5M8 12.5L4.5 9M8 12.5L11.5 9"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/**
 * Scrolls whatever actually scrolls the card — the drawer's column, or the page
 * — so the card's top lands `topOffset` below the top of the view.
 *
 * The page case is the one that bites: this app scrolls its `<body>` (the root
 * layout gives it the overflow), not the document, so a walk that stopped short
 * of `body` would find nothing and fall back to a `window.scrollTo` that moves
 * the document — a no-op here.
 */
function scrollToSectionStart(target: HTMLElement, topOffset: number) {
  const scrollHost = findScrollableParent(target) ?? document.scrollingElement ?? document.documentElement;
  /* The document's scroller has no box that moves with its content, so its
     origin is the viewport's top; any other scroller's is its own rect. */
  const hostTop = scrollHost === document.scrollingElement ? 0 : scrollHost.getBoundingClientRect().top;
  const nextTop = scrollHost.scrollTop + target.getBoundingClientRect().top - hostTop - topOffset;
  scrollHost.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
}

function findScrollableParent(target: HTMLElement): HTMLElement | null {
  let node = target.parentElement;
  while (node) {
    const overflowY = window.getComputedStyle(node).overflowY;
    if (/(auto|scroll|overlay)/.test(overflowY) && node.scrollHeight > node.clientHeight) return node;
    node = node.parentElement;
  }
  return null;
}
