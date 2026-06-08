'use client';

import { useRef, useState } from 'react';
import { clsx } from 'clsx';
import { mockGantryItem } from '../mocks';
import { AdminPreview } from '../shared/AdminPreview';
import { MockGantryCard } from '../shared/MockGantryCard';
import s from '../shared/SupportControls.module.scss';

type AxisLevel = 'low' | 'high';

function quadrant(importance: AxisLevel, urgency: AxisLevel): string {
  if (importance === 'high' && urgency === 'high') return 'Do first';
  if (importance === 'high') return 'Schedule';
  if (urgency === 'high') return 'Delegate';
  return 'Backlog';
}

/** Option 5 — Two-axis: Importance + Urgency (Eisenhower-lite popover). */
export function Option5TwoAxis() {
  const [supported, setSupported] = useState(false);
  const [importance, setImportance] = useState<AxisLevel>('low');
  const [urgency, setUrgency] = useState<AxisLevel>('low');
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(mockGantryItem.upvoteCount);
  const wrapRef = useRef<HTMLDivElement>(null);

  const imp = importance;
  const urg = urgency;

  const toggleSupport = () => {
    if (supported) {
      setSupported(false);
      setCount((c) => c - 1);
      setOpen(false);
      return;
    }
    setOpen(true);
  };

  const confirm = () => {
    setSupported(true);
    setCount((c) => c + 1);
    setOpen(false);
  };

  return (
    <MockGantryCard
      item={{ ...mockGantryItem, upvoteCount: count }}
      supportControl={
        <div className={s.popover} ref={wrapRef}>
          <button type="button" className={clsx(s.needThis, supported && s.needThisActive)} onClick={toggleSupport}>
            {supported ? 'Supported' : 'I need this'}
          </button>
          {supported && (
            <>
              <span className={s.quadrantBadge}>{quadrant(imp, urg)}</span>
              <button type="button" className={s.refineButton} onClick={() => setOpen(true)}>
                Edit importance / urgency
              </button>
            </>
          )}
          {open && (
            <div className={s.popoverPanel}>
              <div className={s.fieldGroup}>
                <label className={s.fieldLabel} htmlFor="importance">
                  Importance
                </label>
                <select
                  id="importance"
                  className={s.select}
                  value={imp}
                  onChange={(e) => setImportance(e.target.value as AxisLevel)}
                >
                  <option value="low">Low</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className={s.fieldGroup}>
                <label className={s.fieldLabel} htmlFor="urgency">
                  Urgency
                </label>
                <select
                  id="urgency"
                  className={s.select}
                  value={urg}
                  onChange={(e) => setUrgency(e.target.value as AxisLevel)}
                >
                  <option value="low">Low</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className={s.modalActions}>
                <button type="button" className={s.btnSecondary} onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button type="button" className={s.btnPrimary} onClick={confirm}>
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>
      }
      adminPreview={
        <AdminPreview
          item={{ ...mockGantryItem, upvoteCount: count }}
          extra={supported ? `Importance: ${imp} · Urgency: ${urg} · Quadrant: ${quadrant(imp, urg)}` : undefined}
        />
      }
    />
  );
}
