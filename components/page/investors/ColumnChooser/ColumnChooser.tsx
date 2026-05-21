'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { useInvestorColumnStore } from '@/services/investors/store';
import { COLUMN_PRESETS, INVESTOR_COLUMN_GROUPS, ColumnPresetKey } from '@/services/investors/constants';
import { COLUMN_LABELS } from '../OutreachInvestorTable/OutreachInvestorTable';
import s from './ColumnChooser.module.scss';

const PRESET_LABEL: Record<ColumnPresetKey, string> = {
  outreach: 'Outreach view',
  enrichment_qa: 'Enrichment QA view',
};

/**
 * Popover to manage which columns are visible in the investor table. Reads
 * + writes to useInvestorColumnStore (persisted to localStorage so the user's
 * column preferences survive across sessions).
 */
export function ColumnChooser() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const visibleColumns = useInvestorColumnStore((s) => s.visibleColumns);
  const preset = useInvestorColumnStore((s) => s.preset);
  const setPreset = useInvestorColumnStore((s) => s.actions.setPreset);
  const toggleColumn = useInvestorColumnStore((s) => s.actions.toggleColumn);

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!popoverRef.current || !triggerRef.current) return;
      if (popoverRef.current.contains(e.target as Node) || triggerRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const visibleSet = new Set(visibleColumns);

  const popover = open && (
    <div
      ref={popoverRef}
      className={s.popover}
      style={{ top: pos.top, right: pos.right }}
    >
      <div className={s.presetRow}>
        {(Object.keys(COLUMN_PRESETS) as ColumnPresetKey[]).map((key) => (
          <button
            key={key}
            className={clsx(s.presetBtn, preset === key && s.presetBtnActive)}
            onClick={() => setPreset(key)}
          >
            {PRESET_LABEL[key]}
          </button>
        ))}
      </div>
      <div className={s.body}>
        {INVESTOR_COLUMN_GROUPS.map((group) => (
          <div key={group.group} className={s.group}>
            <div className={s.groupTitle}>{group.group}</div>
            {group.group === 'Person' && (
              <label className={s.option}>
                <input type="checkbox" checked={visibleSet.has('name')} onChange={() => toggleColumn('name')} />
                <span>{COLUMN_LABELS.name}</span>
              </label>
            )}
            {group.columns.map((col) => (
              <label key={col} className={s.option}>
                <input type="checkbox" checked={visibleSet.has(col)} onChange={() => toggleColumn(col)} />
                <span>{COLUMN_LABELS[col] ?? col}</span>
              </label>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={s.root}>
      <button ref={triggerRef} className={s.trigger} onClick={handleOpen}>
        ⚙ Columns ({visibleColumns.length})
      </button>
      {typeof document !== 'undefined' && popover && createPortal(popover, document.body)}
    </div>
  );
}
