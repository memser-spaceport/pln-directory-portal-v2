import Image from 'next/image';
import { columnHelper } from './helpers';
import React, { useMemo } from 'react';
import { ColumnDef, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import {
  ArrowUpRightIcon,
  ChartIcon,
  ConnectionIcon,
  EyeIcon,
  GlobeIcon,
  LayoutIcon,
  MoneyBagIcon,
  TVIcon,
  UserFocusIcon,
  UserIcon,
  VideoIcon,
} from '@/components/page/demo-day/FoundersDashboardView/components/Icons';
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

export function useStatsCards() {
  return useMemo(() => {
    return [
      {
        id: 'uniqueInvestors',
        label: 'Unique Investors',
        value: 1234,
        tooltip: (
          <span>
            Number of distinct investors
            <br />
            who interacted with your team
            <br /> the selected date range
          </span>
        ),

        change: 'Interacted with your profile',
        icon: <UserIcon />,
      },
      {
        id: 'investorCtas',
        label: 'Investor CTAs',
        value: 856,
        tooltip: (
          <div>
            Total number of high-intent actions taken by investors. Includes:
            <ul style={{ listStyle: 'inside' }}>
              <li>Investment Interest</li>
              <li>Connect</li>
              <li>Like</li>
              <li>Made Intro</li>
              <li>Gave Feedback</li>
            </ul>
          </div>
        ),

        change: 'Like, Connect, Investment Interest',
        icon: <ChartIcon />,
      },
      {
        id: 'profileViews',
        label: 'Profile Views',
        value: 423,
        tooltip: 'Total views of your team’s\n' + 'Demo Day profile. Includes\n' + 'unique and repeat views.',
        change: '96 unique. 75 repeat ',
        icon: <EyeIcon />,
      },
      {
        id: 'viewedSlide',
        label: 'Viewed Slide',
        value: 312,
        tooltip:
          'Number of times investors\n' +
          'opened your pitch deck.\n' +
          'Counts slide opens, not\n' +
          'total slides viewed.',
        change: '96 investors',
        icon: <TVIcon />,
      },
      {
        id: 'watchedVideo',
        label: 'Watched Video',
        value: 189,
        tooltip:
          'Number of investors who\n' +
          'started watching your pitch\n' +
          'video. Number of investors\n' +
          'who started watching\n' +
          'your pitch video.',
        change: '67 investors',
        icon: <VideoIcon />,
      },
      {
        id: 'founderProfileClicks',
        label: 'Founder profile clicks',
        value: 145,
        tooltip:
          'Clicks on individual founder\n' +
          'profiles from your team page. Indicates interest in the team\n' +
          'behind the product.',
        change: '67 investors',
        icon: <UserFocusIcon />,
      },
      {
        id: 'teamPageClicks',
        label: 'Team page clicks',
        value: 78,
        tooltip:
          'Clicks navigating to your\n' +
          'main team. Indicates investors\n' +
          'exploring your team context\n' +
          'beyond the pitch.',
        change: '67 investors',
        icon: <LayoutIcon />,
      },
      {
        id: 'teamWebsiteClicks',
        label: 'Team Website Clicks',
        value: 45,
        tooltip: 'Clicks to your external company\n' + 'website. Strong intent signal for\n' + 'further due diligence.',
        change: '67 investors',
        icon: <GlobeIcon />,
      },
      {
        id: 'connections',
        label: 'Connections',
        value: 12,
        tooltip: 'Number of investors who\n' + 'requested a connection.',
        change: '56 investors',
        icon: <ConnectionIcon />,
      },
      {
        id: 'investmentInterest',
        label: 'Investment Interest',
        value: 8,
        tooltip: 'Number of investors who\n' + 'expressed interest in investing.',
        change: '24 investors',
        icon: <MoneyBagIcon />,
      },
    ];
  }, []);
}
