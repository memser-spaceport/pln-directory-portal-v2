'use client';

import { useMemo } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, Row } from '@tanstack/react-table';
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
import s from './OutreachInvestorTable.module.scss';

interface Props {
  investors: OutreachInvestor[];
  visibleColumns: string[];
  onRowClick: (id: string) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  teamLookup?: Map<string, PlPortfolioTeam>;
  canEdit?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  sortValue?: string;
  onSortChange?: (sort: string) => void;
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
  co_invested_team_ids: 'Co-invested Teams',
};

const SORTABLE_COLUMNS: Record<string, string> = {
  name: 'last_name',
  firm: 'firm',
  last_sent_date: 'last_sent_date',
  engagement_tier: 'engagement_tier',
  outreach_touches: 'outreach_touches',
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
    onLoadMore,
    hasMore,
    sortValue,
    onSortChange,
  } = props;

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
            <div className={s.nameCellContent}>
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
            <span className={s.arrowIcon} aria-hidden>
              <ArrowUpRightIcon />
            </span>
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
            <div className={s.firmCellContent}>
              <div className={s.firmText}>{row.original.firm || <span className={s.muted}>Independent</span>}</div>
              {row.original.firm_domain && <div className={s.firmSub}>{row.original.firm_domain}</div>}
            </div>
            {row.original.firm && (
              <span className={s.arrowIcon} aria-hidden>
                <ArrowUpRightIcon />
              </span>
            )}
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
        header: 'Co-invested Teams',
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

    const byId = new Map(allCols.map((c) => [c.id!, c]));
    return visibleColumns.map((id) => byId.get(id)).filter(Boolean) as ColumnDef<OutreachInvestor>[];
  }, [visibleColumns, teamNameLookup]);

  const [sortField, sortDir] = (sortValue || '').split(':') as [string, string | undefined];

  const handleColumnSort = (columnId: string) => {
    const field = SORTABLE_COLUMNS[columnId];
    if (!field || !onSortChange) return;
    if (sortField === field) {
      onSortChange(sortDir === 'asc' ? `${field}:desc` : `${field}:asc`);
    } else {
      onSortChange(`${field}:asc`);
    }
  };

  const getColSortDir = (columnId: string): 'asc' | 'desc' | null => {
    const field = SORTABLE_COLUMNS[columnId];
    if (!field || sortField !== field) return null;
    return sortDir === 'asc' || sortDir === 'desc' ? sortDir : null;
  };

  const table = useReactTable({
    data: investors,
    columns,
    getCoreRowModel: getCoreRowModel(),
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
    const target = e.target as HTMLElement;
    if (target.closest('input[type="checkbox"]') || target.closest('a') || target.closest('button')) return;
    onRowClick(row.original.investor_id);
  };

  const allHeaders = table.getHeaderGroups()[0]?.headers ?? [];
  const nameHeader = allHeaders.find((h) => h.id === 'name');
  const scrollableHeaders = allHeaders.filter((h) => h.id !== 'name');
  const draggableColumnIds = visibleColumns.filter((id) => id !== 'name');

  return (
    <div className={s.wrap}>
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
                  {nameHeader && (
                    <th
                      className={clsx(
                        s.th,
                        s.frozenName,
                        canEdit ? s.frozenNameWithCheckbox : s.frozenNameNoCheckbox,
                        SORTABLE_COLUMNS['name'] && s.thSortable,
                        getColSortDir('name') && s.thSorted,
                      )}
                      onClick={() => handleColumnSort('name')}
                    >
                      {flexRender(nameHeader.column.columnDef.header, nameHeader.getContext())}
                      <span className={s.sortIcon}>
                        {getColSortDir('name') === 'asc' ? '▲' : getColSortDir('name') === 'desc' ? '▼' : '↕'}
                      </span>
                    </th>
                  )}
                  <SortableContext items={draggableColumnIds} strategy={horizontalListSortingStrategy}>
                    {scrollableHeaders.map((h) => {
                      const canSort = !!SORTABLE_COLUMNS[h.id];
                      const colSortDir = getColSortDir(h.id);
                      return (
                        <DraggableColumnHeader
                          key={h.id}
                          id={h.id}
                          onClick={canSort ? () => handleColumnSort(h.id) : undefined}
                          className={clsx(s.th, canSort && s.thSortable, colSortDir && s.thSorted)}
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {canSort && (
                            <span className={s.sortIcon}>
                              {colSortDir === 'asc' ? '▲' : colSortDir === 'desc' ? '▼' : '↕'}
                            </span>
                          )}
                        </DraggableColumnHeader>
                      );
                    })}
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

const ArrowUpRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
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

export { COLUMN_LABELS };
