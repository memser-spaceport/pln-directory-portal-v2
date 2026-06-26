'use client';

import { useState } from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { useGetInvestorListsForInvestor } from '@/services/investors/hooks/useGetInvestorListsForInvestor';
import { useAddToList } from '@/services/investors/hooks/useAddToList';
import { useRemoveFromList } from '@/services/investors/hooks/useRemoveFromList';
import { useInvestorsAnalytics } from '@/analytics/investors.analytics';
import type { InvestorList } from '@/services/investors/types';
import s from './AddToListMenu.module.scss';

interface Props {
  investorId: string;
  /** Gated on investor_db.edit. */
  canEdit: boolean;
  className?: string;
}

/** "Add to list" action from the All Investors row / drawer. Lists are the
 *  pre-created target sets (Lists IA). Gated on investor_db.edit. */
export function AddToListMenu({ investorId, canEdit, className }: Props) {
  const { data: lists, isLoading } = useGetInvestorListsForInvestor(investorId, canEdit);
  const addToList = useAddToList();
  const removeFromList = useRemoveFromList();
  const { trackAddedToList, trackRemovedFromList } = useInvestorsAnalytics();
  const [pendingListId, setPendingListId] = useState<string | null>(null);

  if (!canEdit) return null;

  const isPending = addToList.isPending || removeFromList.isPending;

  const onToggle = async (list: InvestorList) => {
    if (isPending) return;
    setPendingListId(list.id);
    try {
      if (list.is_member) {
        const ok = await removeFromList.mutateAsync({ listId: list.id, investorId });
        if (ok) trackRemovedFromList({ listId: list.id, investorId });
      } else {
        const result = await addToList.mutateAsync({ listId: list.id, investorId });
        if (result === 'ok' || result === 'conflict') {
          trackAddedToList({ listId: list.id, investorId });
        }
      }
    } finally {
      setPendingListId(null);
    }
  };

  return (
    <Popover.Root>
      <Popover.Trigger className={className ?? s.trigger}>+ Add to list</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className={s.positioner} align="end" sideOffset={4}>
          <Popover.Popup className={s.popup}>
            <div className={s.header}>Add to list</div>
            {isLoading ? (
              <div className={s.empty}>Loading lists…</div>
            ) : !lists || lists.length === 0 ? (
              <div className={s.empty}>No lists available</div>
            ) : (
              lists.map((list) => {
                const inList = list.is_member === true;
                const rowPending = pendingListId === list.id;
                return (
                  <button
                    key={list.id}
                    type="button"
                    className={inList ? `${s.option} ${s.inList}` : s.option}
                    disabled={rowPending}
                    onClick={() => onToggle(list)}
                  >
                    <span className={s.optName}>{list.name}</span>
                    {rowPending ? (
                      <span className={s.pending}>…</span>
                    ) : inList ? (
                      <span className={s.inListBadge} title="Click to remove">
                        <span className={s.inListLabel}>✓ In list</span>
                        <span className={s.removeHint}>− Remove</span>
                      </span>
                    ) : (
                      <span className={s.plus}>+</span>
                    )}
                  </button>
                );
              })
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
