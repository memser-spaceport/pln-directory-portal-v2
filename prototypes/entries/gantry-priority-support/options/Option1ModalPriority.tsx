'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { mockGantryItem, PRIORITY_LABELS, type MockPriority } from '../mocks';
import { AdminPreview } from '../shared/AdminPreview';
import { MockGantryCard } from '../shared/MockGantryCard';
import { PriorityModal } from '../shared/PriorityModal';
import s from '../shared/SupportControls.module.scss';

/** Option 1 — Modal with priority dropdown on support. */
export function Option1ModalPriority() {
  const [supported, setSupported] = useState(false);
  const [priority, setPriority] = useState<MockPriority>('medium');
  const [modalOpen, setModalOpen] = useState(false);
  const [count, setCount] = useState(mockGantryItem.upvoteCount);

  const openSupport = () => {
    if (supported) {
      setSupported(false);
      setCount((c) => c - 1);
      return;
    }
    setModalOpen(true);
  };

  const confirm = () => {
    setSupported(true);
    setCount((c) => c + 1);
    setModalOpen(false);
  };

  return (
    <>
      <MockGantryCard
        item={{ ...mockGantryItem, upvoteCount: count }}
        supportControl={
          <div>
            <button type="button" className={clsx(s.needThis, supported && s.needThisActive)} onClick={openSupport}>
              {supported ? `Supported · ${PRIORITY_LABELS[priority]}` : 'I need this'}
            </button>
            {supported && (
              <button type="button" className={s.refineButton} onClick={() => setModalOpen(true)}>
                Change priority
              </button>
            )}
          </div>
        }
        adminPreview={
          <AdminPreview item={{ ...mockGantryItem, upvoteCount: count }} viewerPriority={supported ? priority : null} />
        }
      />
      {modalOpen && (
        <PriorityModal
          title="How important is this for you?"
          hint="This helps the team prioritize — not a vote count."
          value={priority}
          onChange={setPriority}
          onConfirm={confirm}
          onCancel={() => setModalOpen(false)}
          confirmLabel={supported ? 'Update' : 'Support'}
        />
      )}
    </>
  );
}
