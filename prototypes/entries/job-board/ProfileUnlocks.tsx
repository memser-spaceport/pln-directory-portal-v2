'use client';

import { useEffect, useRef } from 'react';
import clsx from 'clsx';

import { CloseIcon } from '@/components/icons';

import s from './ProfileUnlocks.module.scss';

/**
 * What a job profile buys a visitor who has none — said in two places on the
 * logged-out reading step, and in the same words.
 *
 * Traced from the Figma "Logged out — Review job" frame (631:23299) and its
 * popover twin (682:11192). The card sits in the drawer body under the role's
 * masthead; the popover opens from the footer's "What your profile unlocks?"
 * link, for a reader who has scrolled the card out of view and is looking at
 * the button that asks for the profile. Same two claims, one list.
 */
const UNLOCKS: Array<{ title: string; body: string }> = [
  {
    title: 'Get discovered',
    body: 'We surface your profile to founders whose open roles match your background.',
  },
  {
    title: 'Signal interest',
    body: 'Signal interest in specific roles to multiply your visibility',
  },
];

function UnlocksList({ compact }: { compact?: boolean }) {
  return (
    <ol className={clsx(s.list, compact && s.listCompact)}>
      {UNLOCKS.map((item, index) => (
        <li key={item.title} className={s.item}>
          <span className={s.itemHead}>
            <span className={s.number} aria-hidden="true">
              {index + 1}
            </span>
            <span className={s.itemTitle}>{item.title}</span>
          </span>
          <span className={s.itemBody}>{item.body}</span>
        </li>
      ))}
    </ol>
  );
}

/** The inline card, between the masthead and the description. */
export function ProfileUnlocksCard() {
  return (
    <section className={s.card} aria-label="What your profile unlocks">
      <h2 className={s.cardTitle}>What your profile unlocks</h2>
      <UnlocksList />
    </section>
  );
}

/**
 * The same list, floated above the footer link that opened it.
 *
 * Closes on Escape, on a press outside, and — on a phone, where it covers the
 * body rather than floating beside it — on its own ✕. The caller positions it:
 * it is rendered inside the footer bar so `bottom: 100%` lands it directly
 * above the link.
 */
export function ProfileUnlocksPopover({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    const onPress = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    /* Capture, so the Escape closes this and not the drawer under it. */
    document.addEventListener('keydown', onKey, true);
    /* Deferred a tick so the press that opened it does not also close it. */
    const id = window.setTimeout(() => document.addEventListener('mousedown', onPress), 0);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      window.clearTimeout(id);
      document.removeEventListener('mousedown', onPress);
    };
  }, [onClose]);

  return (
    <div ref={ref} className={s.popover} role="dialog" aria-label="What your profile unlocks">
      <div className={s.popoverHead}>
        <h2 className={s.popoverTitle}>What your profile unlocks</h2>
        <button type="button" className={s.popoverClose} onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
      </div>
      <UnlocksList compact />
    </div>
  );
}
