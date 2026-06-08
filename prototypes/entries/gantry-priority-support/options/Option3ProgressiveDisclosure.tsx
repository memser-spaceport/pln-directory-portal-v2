'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { mockGantryItem, PRIORITY_LABELS, type MockPriority } from '../mocks';
import { AdminPreview } from '../shared/AdminPreview';
import { MockGantryCard } from '../shared/MockGantryCard';
import { PriorityModal } from '../shared/PriorityModal';
import s from '../shared/SupportControls.module.scss';

/** Option 3 — Progressive disclosure: quick support at Medium, optional refine. */
export function Option3ProgressiveDisclosure() {
  const [supported, setSupported] = useState(false);
  const [priority, setPriority] = useState<MockPriority>('medium');
  const [refineOpen, setRefineOpen] = useState(false);
  const [count, setCount] = useState(mockGantryItem.upvoteCount);

  const quickSupport = () => {
    if (supported) {
      setSupported(false);
      setPriority('medium');
      setCount((c) => c - 1);
      return;
    }
    setSupported(true);
    setPriority('medium');
    setCount((c) => c + 1);
  };

  const confirmRefine = () => {
    setRefineOpen(false);
  };

  return (
    <>
      <MockGantryCard
        item={{ ...mockGantryItem, upvoteCount: count }}
        supportControl={
          <div>
            <button type="button" className={clsx(s.needThis, supported && s.needThisActive)} onClick={quickSupport}>
              {supported ? `Supported · ${PRIORITY_LABELS[priority]}` : 'I need this'}
            </button>
            {supported && (
              <button type="button" className={s.refineButton} onClick={() => setRefineOpen(true)}>
                Refine priority
              </button>
            )}
            {!supported && <span className={s.viewerBadge}>Defaults to Important</span>}
          </div>
        }
        adminPreview={
          <AdminPreview
            item={{ ...mockGantryItem, upvoteCount: count }}
            viewerPriority={supported ? priority : null}
            extra={supported && priority === 'medium' ? 'Note: many users may stay at default Medium' : undefined}
          />
        }
      />
      {refineOpen && (
        <PriorityModal
          title="Refine your priority"
          hint="Optional — only if Important is not accurate."
          value={priority}
          onChange={setPriority}
          onConfirm={confirmRefine}
          onCancel={() => setRefineOpen(false)}
          confirmLabel="Save"
        />
      )}
    </>
  );
}
