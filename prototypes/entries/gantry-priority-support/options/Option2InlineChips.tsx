'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { mockGantryItem, PRIORITY_LABELS, type MockPriority } from '../mocks';
import { AdminPreview } from '../shared/AdminPreview';
import { MockGantryCard } from '../shared/MockGantryCard';
import s from '../shared/SupportControls.module.scss';

const PRIORITIES: MockPriority[] = ['low', 'medium', 'high'];

/** Option 2 — Inline 3-chip selector, one tap to support + set priority. */
export function Option2InlineChips() {
  const [selected, setSelected] = useState<MockPriority | null>(null);
  const [count, setCount] = useState(mockGantryItem.upvoteCount);

  const pick = (priority: MockPriority) => {
    if (selected === priority) {
      setSelected(null);
      setCount((c) => c - 1);
      return;
    }
    const wasSupported = selected !== null;
    setSelected(priority);
    if (!wasSupported) setCount((c) => c + 1);
  };

  return (
    <MockGantryCard
      item={{ ...mockGantryItem, upvoteCount: count }}
      supportControl={
        <div>
          <div className={s.chipRow}>
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                className={clsx(
                  s.chip,
                  p === 'low' && s.chipLow,
                  p === 'high' && s.chipHigh,
                  selected === p && s.chipSelected,
                )}
                onClick={() => pick(p)}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
          <span className={s.viewerBadge}>
            {selected ? (
              <>
                Your pick: <span className={s.viewerBadgeStrong}>{PRIORITY_LABELS[selected]}</span>
              </>
            ) : (
              `${count} supporters`
            )}
          </span>
        </div>
      }
      adminPreview={<AdminPreview item={{ ...mockGantryItem, upvoteCount: count }} viewerPriority={selected} />}
    />
  );
}
