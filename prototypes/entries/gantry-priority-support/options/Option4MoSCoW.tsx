'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { mockGantryItem, MOSCow_LABELS, type MockMoSCoW } from '../mocks';
import { AdminPreview } from '../shared/AdminPreview';
import { MockGantryCard } from '../shared/MockGantryCard';
import s from '../shared/SupportControls.module.scss';

const LEVELS: MockMoSCoW[] = ['could', 'should', 'must'];

const toPriority = (level: MockMoSCoW): 'low' | 'medium' | 'high' =>
  level === 'could' ? 'low' : level === 'should' ? 'medium' : 'high';

/** Option 4 — MoSCoW labels (Could / Should / Must have). */
export function Option4MoSCoW() {
  const [selected, setSelected] = useState<MockMoSCoW | null>(null);
  const [count, setCount] = useState(mockGantryItem.upvoteCount);

  const pick = (level: MockMoSCoW) => {
    if (selected === level) {
      setSelected(null);
      setCount((c) => c - 1);
      return;
    }
    const wasSupported = selected !== null;
    setSelected(level);
    if (!wasSupported) setCount((c) => c + 1);
  };

  return (
    <MockGantryCard
      item={{ ...mockGantryItem, upvoteCount: count }}
      supportControl={
        <div>
          <div className={s.chipRow}>
            {LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                className={clsx(
                  s.chip,
                  level === 'could' && s.chipLow,
                  level === 'must' && s.chipHigh,
                  selected === level && s.chipSelected,
                )}
                onClick={() => pick(level)}
              >
                {MOSCow_LABELS[level]}
              </button>
            ))}
          </div>
          <span className={s.viewerBadge}>
            {selected ? (
              <>
                Your need: <span className={s.viewerBadgeStrong}>{MOSCow_LABELS[selected]}</span>
              </>
            ) : (
              'Pick how much you need this'
            )}
          </span>
        </div>
      }
      adminPreview={
        <AdminPreview
          item={{ ...mockGantryItem, upvoteCount: count }}
          viewerPriority={selected ? toPriority(selected) : null}
          extra={selected ? `MoSCoW: ${MOSCow_LABELS[selected]}` : undefined}
        />
      }
    />
  );
}
