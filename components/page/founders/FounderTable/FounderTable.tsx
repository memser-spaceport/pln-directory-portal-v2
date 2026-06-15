'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import clsx from 'clsx';
import type { FounderItem } from '@/services/founders/types';
import { founderHeadline, getFundTag } from '@/services/founders/types';
import { LabOsBadge } from '@/components/page/investors/LabOsBadge/LabOsBadge';
import { FounderReviewStateBadge } from '../FounderReviewStateBadge/FounderReviewStateBadge';
import { FounderSignalBadges } from '../FounderSignalBadges/FounderSignalBadges';
import { FUND_LABEL } from '@/services/founders/constants';
import { useFoundersAnalytics } from '@/analytics/founders.analytics';
import s from './FounderTable.module.scss';

interface Props {
  founders: FounderItem[];
  selectedFounderId: string | null;
  onRowClick: (id: string) => void;
  isLoading?: boolean;
  visibleColumns: string[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isFetchingMore?: boolean;
}

export function FounderTable({
  founders,
  selectedFounderId,
  onRowClick,
  isLoading,
  visibleColumns,
  onLoadMore,
  hasMore,
  isFetchingMore,
}: Props) {
  const analytics = useFoundersAnalytics();
  const visibleSet = new Set(visibleColumns);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !onLoadMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isFetchingMore) {
          onLoadMore();
        }
      },
      { rootMargin: '300px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, onLoadMore]);

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

  if (isLoading && founders.length === 0) {
    return <div className={s.loading}>Loading founders…</div>;
  }

  return (
    <div className={s.wrap}>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className={clsx(s.th, h.column.id === 'name' && s.frozenName)}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={clsx(s.row, row.original.founderId === selectedFounderId && s.rowSelected)}
                onClick={() => {
                  onRowClick(row.original.founderId);
                  analytics.onDrawerOpened(row.original.founderId);
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={clsx(s.td, cell.column.id === 'name' && s.frozenName)}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
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

      <div ref={sentinelRef} className={s.sentinel} />
      {isFetchingMore && <div className={s.sentinelLoader}>Loading more…</div>}
    </div>
  );
}
