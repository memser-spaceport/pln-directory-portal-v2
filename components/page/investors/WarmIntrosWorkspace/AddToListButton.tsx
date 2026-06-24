'use client';

import { useEffect, useRef } from 'react';
import type { InvestorList } from '@/services/investors/types';
import { PlusIcon } from '@/components/icons';
import { useAddToList } from '@/services/investors/hooks/useAddToList';
import s from './WarmIntrosWorkspace.module.scss';

interface Props {
  lists: InvestorList[];
  investorIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToListButton({ lists, investorIds, open, onOpenChange }: Props) {
  const { mutate } = useAddToList();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOpenChange(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, onOpenChange]);

  const addAll = (listId: string) => {
    investorIds.forEach((investorId) => mutate({ listId, investorId }));
    onOpenChange(false);
  };

  return (
    <div className={s.addListWrap} ref={ref}>
      <button
        type="button"
        className={s.btn}
        disabled={investorIds.length === 0}
        onClick={() => onOpenChange(!open)}
      >
        <span className={s.addListTriggerInner}>
          <PlusIcon />
          Add to list{investorIds.length > 0 ? ` (${investorIds.length})` : ''}
        </span>
      </button>
      {open && (
        <div className={s.addListMenu}>
          <div className={s.addListHead}>Add to list</div>
          {lists.map((l) => (
            <button
              key={l.id}
              type="button"
              className={s.addListItem}
              onClick={() => addAll(l.id)}
            >
              {l.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
