'use client';

import { useState } from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { useGetInvestorLists } from '@/services/investors/hooks/useGetInvestorLists';
import { useAddToList } from '@/services/investors/hooks/useAddToList';
import { useInvestorsAnalytics } from '@/analytics/investors.analytics';
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
  const { data: lists } = useGetInvestorLists(canEdit);
  const addToList = useAddToList();
  const { trackAddedToList } = useInvestorsAnalytics();
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

  if (!canEdit) return null;

  const onAdd = async (listId: string) => {
    const ok = await addToList.mutateAsync({ listId, investorId });
    if (ok) {
      setAddedTo((prev) => new Set(prev).add(listId));
      trackAddedToList({ listId, investorId });
    }
  };

  return (
    <Popover.Root>
      <Popover.Trigger className={className ?? s.trigger}>＋ Add to list</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className={s.positioner} align="end" sideOffset={4}>
          <Popover.Popup className={s.popup}>
            {!lists || lists.length === 0 ? (
              <div className={s.empty}>No lists available</div>
            ) : (
              lists.map((list) => {
                const added = addedTo.has(list.id);
                return (
                  <button
                    key={list.id}
                    type="button"
                    className={s.option}
                    disabled={added || addToList.isPending}
                    onClick={() => onAdd(list.id)}
                  >
                    <span className={s.optName}>{list.name}</span>
                    {added ? <span className={s.added}>✓ Added</span> : <span className={s.plus}>＋</span>}
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
