'use client';

import clsx from 'clsx';
import { Popover } from '@base-ui-components/react/popover';
import { useInvestorColumnStore } from '@/services/investors/store';
import { COLUMN_PRESETS, INVESTOR_COLUMN_GROUPS, ColumnPresetKey } from '@/services/investors/constants';
import { COLUMN_LABELS } from '../OutreachInvestorTable/OutreachInvestorTable';
import s from './ColumnChooser.module.scss';

const PRESET_LABEL: Record<ColumnPresetKey, string> = {
  outreach: 'Outreach view',
  enrichment_qa: 'Enrichment QA view',
};

export function ColumnChooser() {
  const visibleColumns = useInvestorColumnStore((s) => s.visibleColumns);
  const preset = useInvestorColumnStore((s) => s.preset);
  const setPreset = useInvestorColumnStore((s) => s.actions.setPreset);
  const toggleColumn = useInvestorColumnStore((s) => s.actions.toggleColumn);

  const visibleSet = new Set(visibleColumns);

  return (
    <Popover.Root>
      <Popover.Trigger className={s.trigger}>
        <span className={s.triggerIcon}>
          <SettingsIcon />
        </span>
        Columns ({visibleColumns.length})
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className={s.positioner} align="end" sideOffset={4}>
          <Popover.Popup className={s.popover}>
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
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
