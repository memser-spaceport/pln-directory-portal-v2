'use client';

import { useMemo, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  Row,
} from '@tanstack/react-table';
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import clsx from 'clsx';
import { DraggableColumnHeader } from './DraggableColumnHeader';
import { useInvestorMutationOverlay, useInvestorColumnStore, applyOverlayToInvestor } from '@/services/investors/store';
import type { OutreachInvestor, PlPortfolioTeam } from '@/services/investors/types';
import { INVESTOR_TYPE_LABEL, STAGE_FOCUS_LABEL } from '@/services/investors/constants';
import { EngagementTierBadge } from '../EngagementTierBadge/EngagementTierBadge';
import { EmailStatusPill } from '../EmailStatusPill/EmailStatusPill';
import { SectorTagsList } from '../SectorTagsList/SectorTagsList';
import { LabOsBadge } from '../LabOsBadge/LabOsBadge';
import { CoInvestorBadge } from '../CoInvestorBadge/CoInvestorBadge';
import { TagsCell } from '../TagsCell/TagsCell';
import { ColumnChooser } from '../ColumnChooser/ColumnChooser';
import s from './OutreachInvestorTable.module.scss';

interface Props {
  investors: OutreachInvestor[];
  visibleColumns: string[];
  onRowClick: (id: string) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  /** Optional team-id → team-name lookup for the co-investor tooltip. */
  teamLookup?: Map<string, PlPortfolioTeam>;
  /** Hide bulk-action checkboxes when user lacks edit permission. */
  canEdit?: boolean;
  /** Called when the user clicks Export CSV. Parent owns the export logic. */
  onExport?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const COLUMN_LABELS: Record<string, string> = {
  name: 'Name',
  firm: 'Team',
  title: 'Role',
  investor_type: 'Type',
  stage_focus: 'Stage',
  sector_tags: 'Industry / Sector',
  geo_focus: 'Geo',
  engagement_tier: 'Tier',
  email_status: 'Email',
  last_sent_date: 'Last sent',
  outreach_touches: 'Touches',
  enrichment_status: 'Enrichment',
  enrichment_date: 'Enriched on',
  last_enrichment_attempt: 'Last attempt',
  enrichment_notes: 'Notes',
  source: 'Source',
  fund_thesis: 'Thesis',
  aum_range: 'AUM',
  check_size_range: 'Check size',
  recent_deals: 'Recent deals',
  outreach_campaigns: 'Campaigns',
  opened: 'Opened',
  clicked: 'Clicked',
  registered: 'Registered',
  first_sent_date: 'First sent',
  email: 'Email address',
  linkedin_url: 'LinkedIn',
  firm_domain: 'Firm domain',
  dedupe_key: 'Dedupe key',
  canonical_id: 'Canonical ID',
  investor_id: 'Investor ID',
  lab_os_profile: 'In LabOS',
  co_invested_team_ids: 'Co-investor',
  tags: 'Tags',
};

export function OutreachInvestorTable(props: Props) {
  const {
    investors: rawInvestors,
    visibleColumns,
    onRowClick,
    selectedIds,
    onSelectionChange,
    teamLookup,
    canEdit,
    onExport,
    onLoadMore,
    hasMore,
  } = props;

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'engagement_tier', desc: false },
    { id: 'last_sent_date', desc: true },
  ]);

  const columnActions = useInvestorColumnStore((s) => s.actions);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleColumnDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIdx = visibleColumns.indexOf(active.id as string);
    const newIdx = visibleColumns.indexOf(over.id as string);
    if (oldIdx !== -1 && newIdx !== -1) {
      columnActions.setVisibleColumns(arrayMove(visibleColumns, oldIdx, newIdx));
    }
  };

  // Hydrate investors with mutation overlay (tags etc.) — V1 mock only
  const overrides = useInvestorMutationOverlay((s) => s.overrides);
  const investors = useMemo(
    () => rawInvestors.map((inv) => applyOverlayToInvestor(inv, overrides)),
    [rawInvestors, overrides],
  );

  const teamNameLookup = useMemo(() => {
    if (!teamLookup) return undefined;
    const out: Record<string, string> = {};
    teamLookup.forEach((t, id) => {
      out[id] = t.team_name;
    });
    return out;
  }, [teamLookup]);

  const columns = useMemo<ColumnDef<OutreachInvestor>[]>(() => {
    const allCols: ColumnDef<OutreachInvestor>[] = [
      {
        id: 'name',
        header: 'Name',
        accessorFn: (r) => `${r.first_name} ${r.last_name}`.trim(),
        cell: ({ row }) => (
          <div className={s.nameCell}>
            <div className={s.nameRow}>
              <span className={s.nameText}>
                {row.original.first_name} {row.original.last_name}
              </span>
            </div>
            {row.original.title ? (
              <div className={s.nameSub}>{row.original.title}</div>
            ) : (
              <div className={s.nameSubMuted}>{row.original.email}</div>
            )}
            {row.original.lab_os_profile && (
              <div className={s.nameBadge}>
                <LabOsBadge profile={row.original.lab_os_profile} variant="pill" />
              </div>
            )}
          </div>
        ),
        enableSorting: true,
        size: 200,
      },
      {
        id: 'firm',
        header: 'Team',
        accessorKey: 'firm',
        cell: ({ row }) => (
          <div className={s.firmCell}>
            <div className={s.firmText}>{row.original.firm || <span className={s.muted}>Independent</span>}</div>
            {row.original.firm_domain && <div className={s.firmSub}>{row.original.firm_domain}</div>}
          </div>
        ),
        enableSorting: true,
        size: 200,
      },
      {
        id: 'title',
        header: 'Role',
        accessorKey: 'title',
        cell: ({ getValue }) =>
          getValue<string>() ? <span>{getValue<string>()}</span> : <span className={s.muted}>—</span>,
      },
      {
        id: 'investor_type',
        header: 'Type',
        accessorKey: 'investor_type',
        cell: ({ getValue }) => INVESTOR_TYPE_LABEL[getValue<keyof typeof INVESTOR_TYPE_LABEL>()] ?? '—',
      },
      {
        id: 'stage_focus',
        header: 'Stage',
        accessorKey: 'stage_focus',
        cell: ({ getValue }) => STAGE_FOCUS_LABEL[getValue<keyof typeof STAGE_FOCUS_LABEL>()] ?? '—',
      },
      {
        id: 'sector_tags',
        header: 'Industry / Sector',
        accessorFn: (r) => r.sector_tags.join(','),
        cell: ({ row }) => <SectorTagsList tags={row.original.sector_tags} max={3} />,
        enableSorting: false,
      },
      {
        id: 'co_invested_team_ids',
        header: 'Co-investor',
        accessorFn: (r) => r.co_invested_team_ids.length,
        cell: ({ row }) => {
          const ids = row.original.co_invested_team_ids;
          if (ids.length === 0) return <span className={s.muted}>—</span>;
          const visible = ids.slice(0, 2);
          const overflow = ids.length - visible.length;
          const overflowNames = ids
            .slice(2)
            .map((id) => teamNameLookup?.[id] ?? id)
            .join(', ');
          return (
            <span className={s.coTeamsRow}>
              {visible.map((id) => (
                <span key={id} className={s.coTeamChip} title={teamNameLookup?.[id] ?? id}>
                  {teamNameLookup?.[id] ?? id}
                </span>
              ))}
              {overflow > 0 && (
                <span className={s.coTeamMore} title={`+${overflow} more: ${overflowNames}`}>
                  +{overflow}
                </span>
              )}
            </span>
          );
        },
      },
      {
        id: 'engagement_tier',
        header: 'Tier',
        accessorKey: 'engagement_tier',
        cell: ({ getValue }) => (
          <EngagementTierBadge tier={getValue<'T1_registered' | 'T2_clicked' | 'T3_opened' | 'T4_cold'>()} compact />
        ),
      },
      {
        id: 'email_status',
        header: 'Email',
        accessorKey: 'email_status',
        cell: ({ getValue }) => (
          <EmailStatusPill status={getValue<'verified' | 'catch_all' | 'unverified' | 'invalid' | 'unknown'>()} />
        ),
      },
      {
        id: 'last_sent_date',
        header: 'Last sent',
        accessorKey: 'last_sent_date',
        cell: ({ getValue }) => getValue<string>() || <span className={s.muted}>—</span>,
      },
      {
        id: 'outreach_touches',
        header: 'Touches',
        accessorKey: 'outreach_touches',
      },
      {
        id: 'tags',
        header: 'Tags',
        accessorFn: (r) => r.tags.join(','),
        cell: ({ row }) => <TagsCell investorId={row.original.investor_id} tags={row.original.tags} compact />,
        enableSorting: false,
      },
      // Hidden-by-default columns (appear only when user toggles them on)
      { id: 'source', header: 'Source', accessorKey: 'source' },
      { id: 'geo_focus', header: 'Geo', accessorKey: 'geo_focus' },
      {
        id: 'fund_thesis',
        header: 'Thesis',
        accessorKey: 'fund_thesis',
        cell: ({ getValue }) => <span className={s.thesisCell}>{getValue<string>() || '—'}</span>,
      },
      { id: 'aum_range', header: 'AUM', accessorKey: 'aum_range' },
      { id: 'check_size_range', header: 'Check size', accessorKey: 'check_size_range' },
      {
        id: 'recent_deals',
        header: 'Recent deals',
        accessorKey: 'recent_deals',
        cell: ({ getValue }) => <span className={s.thesisCell}>{getValue<string>() || '—'}</span>,
      },
      { id: 'outreach_campaigns', header: 'Campaigns', accessorKey: 'outreach_campaigns' },
      { id: 'opened', header: 'Opened', accessorKey: 'opened' },
      { id: 'clicked', header: 'Clicked', accessorKey: 'clicked' },
      { id: 'registered', header: 'Registered', accessorKey: 'registered' },
      { id: 'first_sent_date', header: 'First sent', accessorKey: 'first_sent_date' },
      { id: 'enrichment_status', header: 'Enrichment', accessorKey: 'enrichment_status' },
      { id: 'enrichment_date', header: 'Enriched on', accessorKey: 'enrichment_date' },
      { id: 'last_enrichment_attempt', header: 'Last attempt', accessorKey: 'last_enrichment_attempt' },
      { id: 'enrichment_notes', header: 'Notes', accessorKey: 'enrichment_notes' },
      { id: 'dedupe_key', header: 'Dedupe key', accessorKey: 'dedupe_key' },
      { id: 'canonical_id', header: 'Canonical ID', accessorKey: 'canonical_id' },
      { id: 'investor_id', header: 'Investor ID', accessorKey: 'investor_id' },
      { id: 'email', header: 'Email address', accessorKey: 'email' },
      {
        id: 'linkedin_url',
        header: 'LinkedIn',
        accessorKey: 'linkedin_url',
        cell: ({ getValue }) =>
          getValue<string>() ? (
            <a href={getValue<string>()} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              link ↗
            </a>
          ) : (
            <span className={s.muted}>—</span>
          ),
      },
      { id: 'firm_domain', header: 'Firm domain', accessorKey: 'firm_domain' },
      {
        id: 'lab_os_profile',
        header: 'In LabOS',
        accessorFn: (r) => (r.lab_os_profile ? 1 : 0),
        cell: ({ row }) => <LabOsBadge profile={row.original.lab_os_profile} variant="chip" />,
      },
    ];

    // Filter to user-visible columns, in their requested order
    const byId = new Map(allCols.map((c) => [c.id!, c]));
    return visibleColumns.map((id) => byId.get(id)).filter(Boolean) as ColumnDef<OutreachInvestor>[];
  }, [visibleColumns, teamNameLookup]);

  const columnIds = useMemo(() => new Set(columns.map((c) => c.id!)), [columns]);
  const activeSorting = useMemo(() => sorting.filter((s) => columnIds.has(s.id)), [sorting, columnIds]);

  const table = useReactTable({
    data: investors,
    columns,
    state: { sorting: activeSorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const allChecked = investors.length > 0 && investors.every((i) => selectedIds.has(i.investor_id));
  const someChecked = !allChecked && investors.some((i) => selectedIds.has(i.investor_id));
  const toggleAll = () => {
    if (allChecked) {
      const next = new Set(selectedIds);
      investors.forEach((i) => next.delete(i.investor_id));
      onSelectionChange(next);
    } else {
      const next = new Set(selectedIds);
      investors.forEach((i) => next.add(i.investor_id));
      onSelectionChange(next);
    }
  };
  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    onSelectionChange(next);
  };

  const handleRowClick = (row: Row<OutreachInvestor>, e: React.MouseEvent<HTMLTableRowElement>) => {
    // Don't open drawer when clicking the checkbox column or a link / button inside the row
    const target = e.target as HTMLElement;
    if (target.closest('input[type="checkbox"]') || target.closest('a') || target.closest('button')) return;
    onRowClick(row.original.investor_id);
  };

  // Split headers: name is frozen (non-draggable), everything else is draggable
  const allHeaders = table.getHeaderGroups()[0]?.headers ?? [];
  const nameHeader = allHeaders.find((h) => h.id === 'name');
  const scrollableHeaders = allHeaders.filter((h) => h.id !== 'name');
  const draggableColumnIds = visibleColumns.filter((id) => id !== 'name');

  return (
    <div className={s.wrap}>
      <div className={s.toolbar}>
        <div className={s.toolbar_left}>
          {selectedIds.size > 0 ? (
            <span className={s.selection}>
              <strong>{selectedIds.size}</strong> selected
              <button className={s.linkBtn} onClick={() => onSelectionChange(new Set())}>
                Clear
              </button>
            </span>
          ) : (
            <span className={s.muted}>{investors.length.toLocaleString()} investors</span>
          )}
        </div>
        <div className={s.toolbar_right}>
          {canEdit && onExport && (
            <button className={s.toolbarBtn} onClick={onExport} disabled={investors.length === 0}>
              ⤓ Export CSV{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
            </button>
          )}
          <ColumnChooser />
        </div>
      </div>

      <div className={s.tableWrap} id="investors-table-scroll">
        <InfiniteScroll
          scrollableTarget="body"
          dataLength={investors.length}
          hasMore={hasMore ?? false}
          next={onLoadMore ?? (() => {})}
          loader={<div className={s.sentinelLoader}>Loading more…</div>}
          style={{ overflow: 'unset' }}
        >
          <DndContext sensors={sensors} onDragEnd={handleColumnDragEnd}>
            <table className={s.table}>
              <thead>
                <tr>
                  {canEdit && (
                    <th className={s.checkboxCol}>
                      <input
                        type="checkbox"
                        checked={allChecked}
                        ref={(el) => {
                          if (el) el.indeterminate = someChecked;
                        }}
                        onChange={toggleAll}
                      />
                    </th>
                  )}
                  {/* Name column: frozen, non-draggable */}
                  {nameHeader && (
                    <th
                      className={clsx(
                        s.th,
                        s.frozenName,
                        canEdit ? s.frozenNameWithCheckbox : s.frozenNameNoCheckbox,
                        nameHeader.column.getCanSort() && s.thSortable,
                        nameHeader.column.getIsSorted() && s.thSorted,
                      )}
                      onClick={nameHeader.column.getCanSort() ? nameHeader.column.getToggleSortingHandler() : undefined}
                    >
                      {flexRender(nameHeader.column.columnDef.header, nameHeader.getContext())}
                      {nameHeader.column.getCanSort() && (
                        <span className={s.sortIcon}>
                          {nameHeader.column.getIsSorted() === 'asc'
                            ? '▲'
                            : nameHeader.column.getIsSorted() === 'desc'
                              ? '▼'
                              : '↕'}
                        </span>
                      )}
                    </th>
                  )}
                  {/* Draggable scrollable columns */}
                  <SortableContext items={draggableColumnIds} strategy={horizontalListSortingStrategy}>
                    {scrollableHeaders.map((h) => (
                      <DraggableColumnHeader
                        key={h.id}
                        id={h.id}
                        onClick={h.column.getCanSort() ? h.column.getToggleSortingHandler() : undefined}
                        className={clsx(
                          s.th,
                          h.column.getCanSort() && s.thSortable,
                          h.column.getIsSorted() && s.thSorted,
                        )}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {h.column.getCanSort() && (
                          <span className={s.sortIcon}>
                            {h.column.getIsSorted() === 'asc' ? '▲' : h.column.getIsSorted() === 'desc' ? '▼' : '↕'}
                          </span>
                        )}
                      </DraggableColumnHeader>
                    ))}
                  </SortableContext>
                </tr>
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + (canEdit ? 1 : 0)} className={s.empty}>
                      No investors match the current filters.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={clsx(s.row, selectedIds.has(row.original.investor_id) && s.rowSelected)}
                      onClick={(e) => handleRowClick(row, e)}
                    >
                      {canEdit && (
                        <td className={s.checkboxCol}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(row.original.investor_id)}
                            onChange={() => toggleOne(row.original.investor_id)}
                          />
                        </td>
                      )}
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={clsx(
                            s.td,
                            cell.column.id === 'name' && s.frozenName,
                            cell.column.id === 'name' && (canEdit ? s.frozenNameWithCheckbox : s.frozenNameNoCheckbox),
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DndContext>
        </InfiniteScroll>
      </div>
    </div>
  );
}

export { COLUMN_LABELS };
