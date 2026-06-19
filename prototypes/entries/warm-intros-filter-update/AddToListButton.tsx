'use client';

import { useEffect, useRef, useState } from 'react';
import type { InvestorList } from '@/services/investors/types';
import { PlusIcon } from '@/components/icons';
// Trigger uses the workspace .btn so it's the exact same size as the Export button.
import s from '@/components/page/investors/WarmIntrosWorkspace/WarmIntrosWorkspace.module.scss';
import x from './WarmIntrosImprovements.module.scss';

interface Props {
  lists: InvestorList[];
  onAdd: (listId: string) => void;
  /**
   * Remove the subject from a list. When provided, in-list rows become a
   * clickable toggle (remove); when omitted, they stay disabled with a check.
   */
  onRemove?: (listId: string) => void;
  /** Lists the subject already belongs to — shown disabled with a check. */
  memberOf?: string[];
  disabled?: boolean;
  label?: string;
  /** Open the menu upward (for use in the drawer footer at the bottom). */
  openUp?: boolean;
}

/**
 * Small popover that adds the subject(s) to a chosen list. Used as a bulk action
 * over the selected table rows and inside the drawer for a single investor.
 */
export function AddToListButton({ lists, onAdd, onRemove, memberOf = [], disabled, label = 'Add to list', openUp }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className={x.addListWrap} ref={ref}>
      <button type="button" className={s.btn} disabled={disabled} onClick={() => setOpen((o) => !o)}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <PlusIcon />
          {label}
        </span>
      </button>
      {open && (
        <div className={openUp ? `${x.addListMenu} ${x.addListMenuUp}` : x.addListMenu}>
          <div className={x.addListHead}>Add to list</div>
          {lists.map((l) => {
            const already = memberOf.includes(l.id);
            // Removable when the subject is already in the list and a remove
            // handler is wired up — the row then toggles membership off.
            const removable = already && !!onRemove;
            return (
              <button
                key={l.id}
                type="button"
                className={removable ? `${x.addListItem} ${x.addListItemToggle}` : x.addListItem}
                disabled={already && !removable}
                onClick={() => {
                  if (removable) onRemove!(l.id);
                  else onAdd(l.id);
                  // Keep the popover open so users can toggle several lists, then
                  // dismiss it themselves (outside-click or the trigger).
                }}
              >
                <span>{l.name}</span>
                {removable ? (
                  <span className={x.addListToggle}>
                    <span className={x.addListToggleIn}>✓ In list</span>
                    <span className={x.addListToggleRemove}>Remove</span>
                  </span>
                ) : already ? (
                  <span className={x.addListIn}>✓ in list</span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
