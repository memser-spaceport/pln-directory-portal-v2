'use client';

// Mobile "More" overflow menu — collapses the secondary toolbar actions (Columns
// + Export) so the toolbar stays a tidy single row (Filters · Sort · More) instead
// of wrapping. Reuses the production column-chooser popover styling.
import clsx from 'clsx';
import { Popover } from '@base-ui-components/react/popover';
import s from '@/components/page/founders/FounderColumnChooser/FounderColumnChooser.module.scss';
import { TOGGLEABLE_COLUMNS } from './FounderColumnChooserMock';
import m from './MoreMenuMock.module.scss';

interface Props {
  visibleColumns: string[];
  toggleColumn: (col: string) => void;
  onExport: () => void;
  exportCount: number;
  exportDisabled: boolean;
}

export function MoreMenuMock({ visibleColumns, toggleColumn, onExport, exportCount, exportDisabled }: Props) {
  const visibleSet = new Set(visibleColumns);

  return (
    <Popover.Root>
      <Popover.Trigger className={clsx(s.trigger, m.iconTrigger)} aria-label="More options">
        <MoreIcon />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className={s.positioner} align="end" sideOffset={4}>
          <Popover.Popup className={s.popover}>
            <div className={m.sectionLabel}>Columns ({visibleColumns.length})</div>
            <div className={s.body}>
              <label className={clsx(s.option, s.optionFixed)}>
                <input type="checkbox" checked disabled />
                <span>Founder</span>
              </label>
              {TOGGLEABLE_COLUMNS.map((col) => (
                <label key={col.key} className={s.option}>
                  <input type="checkbox" checked={visibleSet.has(col.key)} onChange={() => toggleColumn(col.key)} />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
            <div className={m.divider} />
            <button type="button" className={m.exportItem} onClick={onExport} disabled={exportDisabled}>
              <ExportIcon />
              Export CSV{exportCount > 0 ? ` (${exportCount})` : ''}
            </button>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

const MoreIcon = () => (
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
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

const ExportIcon = () => (
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
    <path d="M12 15V3" />
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
  </svg>
);
