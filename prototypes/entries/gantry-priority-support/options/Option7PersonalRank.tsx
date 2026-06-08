'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { mockGantryItem, PRIORITY_LABELS, type MockPriority } from '../mocks';
import { AdminPreview } from '../shared/AdminPreview';
import { MockGantryCard } from '../shared/MockGantryCard';
import { PriorityModal } from '../shared/PriorityModal';
import s from '../shared/SupportControls.module.scss';

/** Option 7 — Personal ranked list: support on card + link to rank your needs. */
export function Option7PersonalRank() {
  const [supported, setSupported] = useState(false);
  const [priority, setPriority] = useState<MockPriority>('medium');
  const [modalOpen, setModalOpen] = useState(false);
  const [rankPanelOpen, setRankPanelOpen] = useState(false);
  const [count, setCount] = useState(mockGantryItem.upvoteCount);
  const [myRank, setMyRank] = useState<number | null>(null);

  const support = () => {
    if (supported) {
      setSupported(false);
      setMyRank(null);
      setCount((c) => c - 1);
      return;
    }
    setModalOpen(true);
  };

  const confirm = () => {
    setSupported(true);
    setCount((c) => c + 1);
    setModalOpen(false);
    setRankPanelOpen(true);
  };

  return (
    <>
      <MockGantryCard
        item={{ ...mockGantryItem, upvoteCount: count }}
        supportControl={
          <div>
            <button type="button" className={clsx(s.needThis, supported && s.needThisActive)} onClick={support}>
              {supported ? `Supported · ${PRIORITY_LABELS[priority]}` : 'I need this'}
            </button>
            {supported && (
              <p className={s.rankHint}>
                {myRank ? <>Your rank: #{myRank} in </> : <>Add to </>}
                <button type="button" className={s.rankLink} onClick={() => setRankPanelOpen(true)}>
                  My priorities
                </button>
              </p>
            )}
          </div>
        }
        adminPreview={
          <AdminPreview
            item={{ ...mockGantryItem, upvoteCount: count }}
            viewerPriority={supported ? priority : null}
            extra={myRank ? `Relative rank among your needs: #${myRank}` : undefined}
          />
        }
      />
      {modalOpen && (
        <PriorityModal
          title="Support this need"
          hint="Then drag it in My priorities to rank against your other needs."
          value={priority}
          onChange={setPriority}
          onConfirm={confirm}
          onCancel={() => setModalOpen(false)}
        />
      )}
      {rankPanelOpen && (
        <div className={s.modalBackdrop} role="presentation" onClick={() => setRankPanelOpen(false)}>
          <div className={s.modal} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h4 className={s.modalTitle}>My priorities (mock)</h4>
            <p className={s.modalHint}>Drag to rank — strongest signal for admins when aggregated.</p>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: '24px' }}>
              <li>
                <button type="button" className={s.rankLink} onClick={() => setMyRank(1)}>
                  Export member lists to CSV
                </button>
              </li>
              <li>Improve search filters</li>
              <li>Bulk email notifications</li>
            </ol>
            <div className={s.modalActions}>
              <button type="button" className={s.btnPrimary} onClick={() => setRankPanelOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
