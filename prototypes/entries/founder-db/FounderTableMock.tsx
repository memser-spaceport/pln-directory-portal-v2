'use client';

import { Fragment, useMemo } from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import clsx from 'clsx';
import type { FounderItem } from '@/services/founders/types';
import { founderHeadline, getFundTag } from '@/services/founders/types';
import { LabOsBadge } from '@/components/page/investors/LabOsBadge/LabOsBadge';
import { FounderReviewStateBadge } from '@/components/page/founders/FounderReviewStateBadge/FounderReviewStateBadge';
import { FounderSignalBadges } from '@/components/page/founders/FounderSignalBadges/FounderSignalBadges';
import { FUND_LABEL } from '@/services/founders/constants';
// Reuse the production table styling so the prototype tracks production 1:1.
import s from '@/components/page/founders/FounderTable/FounderTable.module.scss';
import { AlignmentLevel } from './AlignmentLevel';
import v0 from './FounderTableMock.module.scss';

// Size of the "Strong fit · top N" group. A fixed top-N (not the whole "High"
// tier) is what differentiates: production has ~399 high-alignment founders.
const TOP_GROUP = 10;

interface Props {
  founders: FounderItem[];
  onRowClick: (id: string) => void;
  isLoading?: boolean;
  visibleColumns: string[];
  /** Show the "Strong fit · top N" group header. Only meaningful when sorted Alignment desc. */
  showCutLine?: boolean;
  /** Show the left checkbox column + select-all (wired to a bulk action upstream). */
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
}

export function FounderTableMock({
  founders,
  onRowClick,
  isLoading,
  visibleColumns,
  showCutLine,
  selectable,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: Props) {
  const visibleSet = new Set(visibleColumns);

  // Select-all / indeterminate state across the currently visible rows.
  const allChecked = !!selectable && founders.length > 0 && founders.every((f) => selectedIds?.has(f.founderId));
  const someChecked = !!selectable && !allChecked && founders.some((f) => selectedIds?.has(f.founderId));

  const columns = useMemo<ColumnDef<FounderItem>[]>(
    () => [
      {
        id: 'name',
        header: 'Founder',
        cell: ({ row }) => {
          const f = row.original;
          const headline = founderHeadline(f);
          const pedigree = f.pedigree ?? f.rawPayload?.pedigree;
          return (
            <div className={s.nameCell}>
              {headline && (
                <span className={s.headlinePrimary} title={headline}>
                  {headline.length > 120 ? headline.slice(0, 120) + '…' : headline}
                </span>
              )}
              <span className={s.nameSecondary}>{f.name}</span>
              {pedigree && (
                <span className={s.pedigreeLine} title={pedigree}>
                  {pedigree.length > 80 ? pedigree.slice(0, 80) + '…' : pedigree}
                </span>
              )}
              <FounderSignalBadges founder={f} />
              {f.labOsProfile && <LabOsBadge profile={f.labOsProfile} variant="chip" />}
            </div>
          );
        },
      },
      {
        id: 'fundTags',
        header: 'Fund',
        cell: ({ row }) => {
          const tags = row.original.rawPayload?.fund_tags ?? [];
          if (!tags.length) return <span className={s.muted}>—</span>;
          return (
            <div className={s.tagRow}>
              {tags.map((t, i) => {
                const key = getFundTag(t);
                if (!key) return null;
                return (
                  <span key={`${key}-${i}`} className={s.fundTag}>
                    {FUND_LABEL[key] ?? key}
                  </span>
                );
              })}
            </div>
          );
        },
      },
      {
        // v0: re-introduced Alignment column, magnitude-encoded.
        id: 'alignmentMax',
        header: 'Alignment',
        cell: ({ row }) => {
          const v = row.original.alignmentMax;
          return v !== undefined && v !== null ? <AlignmentLevel value={v} /> : <span className={s.muted}>—</span>;
        },
      },
      {
        id: 'sources',
        header: 'Sources',
        cell: ({ row }) => {
          const count = row.original.sources?.length ?? 0;
          return count > 0 ? (
            <span className={s.sourcesBadge}>
              {count} source{count !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className={s.muted}>—</span>
          );
        },
      },
      {
        id: 'plnProximity',
        header: 'PLN Proximity',
        cell: ({ row }) => {
          const value = row.original.plnProximity;
          if (value == null) return <span className={s.muted}>—</span>;
          return <span>{Math.round(value * 100)}%</span>;
        },
      },
      {
        id: 'reviewState',
        header: 'Status',
        cell: ({ row }) => <FounderReviewStateBadge status={row.original.reviewState.status} />,
      },
    ],
    [],
  );

  const filteredColumns = useMemo(
    () => columns.filter((col) => col.id === 'name' || visibleSet.has(col.id as string)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns, visibleColumns],
  );

  const table = useReactTable({
    data: founders,
    columns: filteredColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  // "Strong fit · top N" header sits above the first N rows (list is sorted
  // Alignment desc). No "below" rule — the header alone marks the top group.
  const topCount = Math.min(TOP_GROUP, founders.length);
  const showTopHeader = !!showCutLine && topCount > 0;

  if (isLoading && founders.length === 0) {
    return <div className={s.loading}>Loading founders…</div>;
  }

  return (
    <div className={s.wrap}>
      <div className={clsx(s.tableWrap, v0.tableSurface)}>
        <table className={s.table}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className={clsx(
                      s.th,
                      h.column.id === 'name' && s.frozenName,
                      h.column.id === 'name' && v0.nameCol,
                      h.column.id !== 'name' && v0.cell,
                    )}
                  >
                    {h.column.id === 'name' && selectable ? (
                      <span className={v0.nameSelect}>
                        <input
                          type="checkbox"
                          checked={allChecked}
                          ref={(el) => {
                            if (el) el.indeterminate = someChecked;
                          }}
                          onChange={() => onToggleSelectAll?.()}
                          aria-label="Select all founders"
                        />
                        {/* Empty rank-width spacer so "Founder" aligns over the names below. */}
                        <span className={v0.rankBadge} aria-hidden="true" />
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </span>
                    ) : (
                      flexRender(h.column.columnDef.header, h.getContext())
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                {showTopHeader && row.index === 0 && (
                  <tr>
                    <td className={v0.groupHeadCell} colSpan={filteredColumns.length}>
                      <span className={v0.groupHeadLabel}>
                        <span aria-hidden="true">★</span>
                        <span>Strong fit · top {topCount}</span>
                      </span>
                    </td>
                  </tr>
                )}
                <tr
                  className={clsx(s.row, selectedIds?.has(row.original.founderId) && s.rowSelected)}
                  onClick={(e) => {
                    // Don't open the drawer when the click was on the row checkbox.
                    if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;
                    onRowClick(row.original.founderId);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={clsx(
                        s.td,
                        cell.column.id === 'name' && s.frozenName,
                        cell.column.id === 'name' && v0.nameCol,
                        cell.column.id !== 'name' && v0.cell,
                      )}
                    >
                      {cell.column.id === 'name' ? (
                        <span className={v0.nameSelect}>
                          {selectable && (
                            <input
                              type="checkbox"
                              checked={selectedIds?.has(row.original.founderId) ?? false}
                              onChange={() => onToggleSelect?.(row.original.founderId)}
                              aria-label={`Select ${row.original.name}`}
                            />
                          )}
                          {/* Rank on every row; the top 10 are highlighted green. */}
                          <span className={clsx(v0.rankBadge, showTopHeader && row.index < TOP_GROUP && v0.rankTop)}>
                            {row.index + 1}
                          </span>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          {/* Arrow appears on row hover — "opens detail", matching the Investor table. */}
                          <span className={v0.arrowIcon} aria-hidden="true">
                            <ArrowUpRightIcon />
                          </span>
                        </span>
                      ) : (
                        flexRender(cell.column.columnDef.cell, cell.getContext())
                      )}
                    </td>
                  ))}
                </tr>
              </Fragment>
            ))}
            {founders.length === 0 && !isLoading && (
              <tr>
                <td colSpan={filteredColumns.length} className={s.empty}>
                  No founders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const ArrowUpRightIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </svg>
);
