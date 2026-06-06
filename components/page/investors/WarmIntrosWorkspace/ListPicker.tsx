'use client';

import type { InvestorList } from '@/services/investors/types';
import s from './ListPicker.module.scss';

interface Props {
  lists: InvestorList[] | undefined;
  selectedId: string;
  onSelect: (list: InvestorList) => void;
}

/** Target-list picker (dropdown). Proximity is only meaningful within a graphed
 *  list, so non-graphed lists carry an inline hint. */
export function ListPicker({ lists, selectedId, onSelect }: Props) {
  if (!lists || lists.length === 0) {
    return <div className={s.empty}>No target lists available yet.</div>;
  }
  const selected = lists.find((l) => l.id === selectedId);
  return (
    <div className={s.wrap}>
      <select
        className={s.select}
        value={selectedId}
        onChange={(e) => {
          const next = lists.find((l) => l.id === e.target.value);
          if (next) onSelect(next);
        }}
      >
        {lists.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name} · {l.member_count.toLocaleString()} {l.member_count === 1 ? 'member' : 'members'}
            {l.is_graphed ? '' : ' · not graphed'}
          </option>
        ))}
      </select>
      {selected && !selected.is_graphed && (
        <span className={s.hint}>⚠ Proximity not yet computed for this list (needs a graph run).</span>
      )}
    </div>
  );
}
