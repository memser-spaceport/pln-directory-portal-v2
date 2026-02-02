import Image from 'next/image';
import { columnHelper } from './helpers';
import { useMemo } from 'react';
import { ColumnDef, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { ArrowUpRightIcon } from '@/components/page/demo-day/FoundersDashboardView/components/Icons';
import { Investor } from '@/components/page/demo-day/FoundersDashboardView/types';

import s from './FoundersDashboardView.module.scss';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';

type SelectValue = {
  label: string;
  value: string;
} | null;

export function useActivityTable(filteredData: Investor[], sortByValue: SelectValue) {
  // Convert sortBy dropdown value to SortingState for the table
  const sorting = useMemo<SortingState>(() => {
    const sortValue = sortByValue?.value;
    switch (sortValue) {
      case 'recent':
        return [{ id: 'date', desc: true }];
      case 'oldest':
        return [{ id: 'date', desc: false }];
      case 'engagement_high':
        return [{ id: 'typicalCheckSize', desc: true }];
      case 'desc':
        return [{ id: 'investor', desc: false }]; // A-Z
      case 'asc':
        return [{ id: 'investor', desc: true }]; // Z-A
      default:
        return [];
    }
  }, [sortByValue]);

  // Define columns for the investor table
  const columns = useMemo<ColumnDef<Investor, any>[]>(
    () => [
      columnHelper.accessor((row) => row, {
        id: 'investor',
        header: 'Investor',
        cell: (info) => {
          const investor = info.getValue();
          return (
            <div className={s.investorCell}>
              <div className={s.investorAvatar}>
                {investor.avatar ? (
                  <Image src={investor.avatar} alt={investor.name} width={40} height={40} />
                ) : (
                  <div className={s.avatarPlaceholder}>{investor.name.charAt(0)}</div>
                )}
              </div>
              <div className={s.investorInfo}>
                <span className={s.investorName}>{investor.name}</span>
                <span className={s.investorCompany}>{investor.company}</span>
              </div>
              <ArrowUpRightIcon />
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const nameA = rowA.original.name.toLowerCase();
          const nameB = rowB.original.name.toLowerCase();
          return nameA.localeCompare(nameB);
        },
      }),
      columnHelper.accessor('investmentFocus', {
        header: 'Investment Focus',
        cell: (info) => (
          <div className={s.interestBadges}>
            {info.getValue().map((interest: string) => (
              <Badge key={interest} variant="default" className={s.interestBadge}>
                {interest}
              </Badge>
            ))}
          </div>
        ),
      }),
      columnHelper.accessor('typicalCheckSize', {
        header: 'Typical Check Size',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('interaction', {
        header: 'Interaction',
        cell: (info) => {
          const sentiment = info.getValue();
          return (
            <Badge
              variant={sentiment === 'Very Interested' ? 'success' : sentiment === 'Interested' ? 'brand' : 'default'}
              className={s.sentimentBadge}
            >
              {sentiment}
            </Badge>
          );
        },
      }),
      columnHelper.accessor((row) => ({ date: row.date, time: row.time }), {
        id: 'date',
        header: 'Date',
        cell: (info) => {
          const { date, time } = info.getValue();
          return (
            <div className={s.dateCell}>
              <span className={s.dateText}>{date}</span>
              <span className={s.timeText}>{time}</span>
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          // Parse date strings like "Jan 26, 2026" and time like "2:30 PM"
          const parseDateTime = (dateStr: string, timeStr: string) => {
            const dateTime = new Date(`${dateStr} ${timeStr}`);
            return dateTime.getTime();
          };
          const timeA = parseDateTime(rowA.original.date, rowA.original.time);
          const timeB = parseDateTime(rowB.original.date, rowB.original.time);
          return timeA - timeB;
        },
      }),
      columnHelper.display({
        id: 'action',
        header: 'Action',
        cell: () => (
          <Button variant="secondary" size="s">
            Request Intro
          </Button>
        ),
      }),
    ],
    [],
  );

  // Initialize the table with sorting and filtered data
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return {
    table,
  };
}
