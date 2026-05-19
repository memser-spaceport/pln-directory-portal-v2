'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { useInvestorMutationOverlay } from '@/services/investors/store';
import s from './TagsCell.module.scss';

interface Props {
  investorId: string;
  tags: string[];
  /** When true, renders an inline add control (drawer / detail use). Default false (table cell). */
  editable?: boolean;
  /** Max chips to show inline before "+N more". Ignored when editable. */
  maxChips?: number;
  /** When true, applies cell-style sizing (smaller). Used inside table rows. */
  compact?: boolean;
  className?: string;
}

/**
 * Display + edit user-applied tags. In V1 this writes to the local mutation
 * overlay store (zustand + localStorage). When backend lands, swap to a
 * useUpdateInvestorTags mutation.
 */
export function TagsCell({ investorId, tags, editable = false, maxChips = 3, compact = false, className }: Props) {
  const [draft, setDraft] = useState('');
  const addTag = useInvestorMutationOverlay((s) => s.actions.addTag);
  const removeTag = useInvestorMutationOverlay((s) => s.actions.removeTag);

  const handleAdd = () => {
    const t = draft.trim();
    if (!t) return;
    addTag(investorId, t);
    setDraft('');
  };

  if (!editable) {
    if (!tags || tags.length === 0) return <span className={s.empty}>—</span>;
    const visible = tags.slice(0, maxChips);
    const overflow = tags.length - visible.length;
    return (
      <span className={clsx(s.row, compact && s.compact, className)}>
        {visible.map((t) => (
          <span key={t} className={s.chip}>
            {t}
          </span>
        ))}
        {overflow > 0 && (
          <span className={s.overflow} title={tags.slice(maxChips).join(', ')}>
            +{overflow}
          </span>
        )}
      </span>
    );
  }

  return (
    <div className={clsx(s.editable, className)}>
      <div className={s.row}>
        {tags.map((t) => (
          <span key={t} className={s.chip}>
            {t}
            <button
              type="button"
              className={s.remove}
              onClick={() => removeTag(investorId, t)}
              aria-label={`Remove tag ${t}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className={s.input_row}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Add a tag and press Enter..."
          className={s.input}
        />
        {draft && (
          <button type="button" onClick={handleAdd} className={s.add_btn}>
            Add
          </button>
        )}
      </div>
    </div>
  );
}
