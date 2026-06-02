'use client';

import { Popover } from '@base-ui-components/react/popover';
import { useFounderColumnStore } from '@/services/founders/store';
import { FOUNDER_COLUMNS } from '@/services/founders/constants';
import s from './FounderColumnChooser.module.scss';

// 'name' is always visible — not toggleable
const TOGGLEABLE_COLUMNS = FOUNDER_COLUMNS.filter((c) => c.key !== 'name');

export function FounderColumnChooser() {
  const visibleColumns = useFounderColumnStore((s) => s.visibleColumns);
  const toggleColumn = useFounderColumnStore((s) => s.toggleColumn);

  const visibleSet = new Set(visibleColumns);

  return (
    <Popover.Root>
      <Popover.Trigger className={s.trigger}>
        <span className={s.triggerIcon}>
          <ColumnsIcon />
        </span>
        Columns ({visibleColumns.length})
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className={s.positioner} align="end" sideOffset={4}>
          <Popover.Popup className={s.popover}>
            <div className={s.body}>
              <label className={clsx(s.option, s.optionFixed)}>
                <input type="checkbox" checked disabled />
                <span>Founder</span>
              </label>
              {TOGGLEABLE_COLUMNS.map((col) => (
                <label key={col.key} className={s.option}>
                  <input
                    type="checkbox"
                    checked={visibleSet.has(col.key)}
                    onChange={() => toggleColumn(col.key)}
                  />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

import clsx from 'clsx';

const ColumnsIcon = () => (
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
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
    <path d="M15 3v18" />
  </svg>
);
