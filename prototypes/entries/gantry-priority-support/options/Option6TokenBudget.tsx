'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { mockGantryItem, PRIORITY_LABELS, TOKEN_BUDGET_TOTAL, TOKEN_COST, type MockPriority } from '../mocks';
import { AdminPreview } from '../shared/AdminPreview';
import { MockGantryCard } from '../shared/MockGantryCard';
import s from '../shared/SupportControls.module.scss';

/** Option 6 — Weighted token budget: allocate points across items. */
export function Option6TokenBudget() {
  const [budget, setBudget] = useState(TOKEN_BUDGET_TOTAL);
  const [allocated, setAllocated] = useState(0);
  const [priority, setPriority] = useState<MockPriority | null>(null);
  const [count, setCount] = useState(mockGantryItem.upvoteCount);

  const apply = (next: MockPriority) => {
    if (priority === next) {
      setBudget((b) => b + TOKEN_COST[next]);
      setAllocated((a) => a - TOKEN_COST[next]);
      setPriority(null);
      setCount((c) => c - 1);
      return;
    }

    const prevCost = priority ? TOKEN_COST[priority] : 0;
    const nextCost = TOKEN_COST[next];
    const delta = nextCost - prevCost;

    if (budget < delta) return;

    if (!priority) setCount((c) => c + 1);
    setBudget((b) => b - delta);
    setAllocated((a) => a + delta);
    setPriority(next);
  };

  const canAfford = (p: MockPriority) => {
    const prevCost = priority ? TOKEN_COST[priority] : 0;
    return budget >= TOKEN_COST[p] - prevCost;
  };

  return (
    <MockGantryCard
      item={{ ...mockGantryItem, upvoteCount: count }}
      supportControl={
        <div>
          <div className={s.tokenBar}>
            <span className={s.tokenPill}>{budget} pts left</span>
            <span>of {TOKEN_BUDGET_TOTAL} this quarter</span>
          </div>
          <div className={s.chipRow}>
            {(['low', 'medium', 'high'] as MockPriority[]).map((p) => (
              <button
                key={p}
                type="button"
                disabled={!canAfford(p) && priority !== p}
                className={clsx(s.chip, p === 'high' && s.chipHigh, priority === p && s.chipSelected)}
                onClick={() => apply(p)}
              >
                {PRIORITY_LABELS[p]} ({TOKEN_COST[p]}pt)
              </button>
            ))}
          </div>
          {!canAfford('high') && priority !== 'high' && (
            <span className={s.tokenWarning}>Not enough points for Blocker</span>
          )}
        </div>
      }
      adminPreview={
        <AdminPreview
          item={{ ...mockGantryItem, upvoteCount: count }}
          viewerPriority={priority}
          extra={`Weighted score from you: ${allocated} pts allocated`}
        />
      }
    />
  );
}
