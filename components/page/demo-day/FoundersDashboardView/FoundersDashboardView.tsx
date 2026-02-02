'use client';

import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { DemoDayState } from '@/app/actions/demo-day.actions';
import { IUserInfo } from '@/types/shared.types';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import Image from 'next/image';
import { Button } from '@/components/common/Button';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, ColumnDef } from '@tanstack/react-table';
import { FormProvider, useForm } from 'react-hook-form';
import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';

import s from './FoundersDashboardView.module.scss';
import DatePicker from '@wojtekmaj/react-daterange-picker';
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css';
import 'react-calendar/dist/Calendar.css';
import {
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
  DownloadIcon,
  InfoIcon,
  CalendarIcon,
  SearchIcon,
} from '@/components/page/demo-day/FoundersDashboardView/components/Icons';
import { DateRangeValue, Investor, TableFiltersForm } from './types';
import { ArrowUpRightIcon } from '@/components/icons';
import { getStatusConfig, INTERACTION_OPTIONS, SORT_OPTIONS } from './helpers';

const MOCK_INVESTORS: Investor[] = [
  {
    id: 1,
    name: 'Sarah Chen',
    company: 'Sequoia Capital',
    avatar: '',
    investmentFocus: ['DeFi', 'Infrastructure', 'AI'],
    typicalCheckSize: '85',
    interaction: 'Very Interested',
    date: 'Jan 26, 2026',
    time: '2:30 PM',
  },
  {
    id: 2,
    name: 'Michael Park',
    company: 'a16z Crypto',
    avatar: '',
    investmentFocus: ['DeFi', 'Gaming', 'NFT'],
    typicalCheckSize: '72',
    interaction: 'Interested',
    date: 'Jan 26, 2026',
    time: '1:15 PM',
  },
];

// Create column helper for type-safe column definitions
const columnHelper = createColumnHelper<Investor>();

const LEGEND_ITEMS = [
  { label: 'Page Views', color: '#156FF7' },
  { label: 'Slide Views', color: '#44D5BB' },
  { label: 'Video Views', color: '#F59E0B' },
  { label: 'Founder', color: '#EF4444' },
  { label: 'Team Page', color: '#8B5CF6' },
  { label: 'Team Website', color: '#EC4899' },
  { label: 'Liked', color: '#10B981' },
  { label: 'Connected', color: '#6366F1' },
  { label: 'Invest', color: '#F97316' },
  { label: 'Intro Requested', color: '#14B8A6' },
  { label: 'Feedback Requested', color: '#A855F7' },
];

interface FoundersDashboardViewProps {
  demoDayState?: DemoDayState;
  userInfo?: IUserInfo;
}

export const FoundersDashboardView: React.FC<FoundersDashboardViewProps> = ({ demoDayState, userInfo }) => {
  const statusConfig = getStatusConfig(demoDayState?.status);

  const STATS = [
    {
      id: 'uniqueInvestors',
      label: 'Unique Investors',
      value: 1234,
      tooltip: 'Number of distinct investors\n' + 'who interacted with your team\n' + 'during the selected date range.',
      change: 'Interacted with your profile',
      icon: <UserIcon />,
    },
    {
      id: 'investorCtas',
      label: 'Investor CTAs',
      value: 856,
      tooltip: '',
      change: 'Like, Connect, Investment Interest',
      icon: <ChartIcon />,
    },
    {
      id: 'profileViews',
      label: 'Profile Views',
      value: 423,
      tooltip: '',
      change: '96 unique. 75 repeat ',
      icon: <EyeIcon />,
    },
    {
      id: 'viewedSlide',
      label: 'Viewed Slide',
      value: 312,
      tooltip: '',
      change: '96 investors',
      icon: <TVIcon />,
    },
    {
      id: 'watchedVideo',
      label: 'Watched Video',
      value: 189,
      tooltip: '',
      change: '67 investors',
      icon: <VideoIcon />,
    },
    {
      id: 'founderProfileClicks',
      label: 'Founder profile clicks',
      value: 145,
      tooltip: '',
      change: '67 investors',
      icon: <UserFocusIcon />,
    },
    {
      id: 'teamPageClicks',
      label: 'Team page clicks',
      value: 78,
      tooltip: '',
      change: '67 investors',
      icon: <LayoutIcon />,
    },
    {
      id: 'teamWebsiteClicks',
      label: 'Team Wensite Clicks',
      value: 45,
      tooltip: '',
      change: '67 investors',
      icon: <GlobeIcon />,
    },
    {
      id: 'connections',
      label: 'Connections',
      value: 12,
      tooltip: '',
      change: '56 investors',
      icon: <ConnectionIcon />,
    },
    {
      id: 'investmentInterest',
      label: 'Investment Interest',
      value: 8,
      tooltip: '',
      change: '24 investors',
      icon: <MoneyBagIcon />,
    },
  ];

  // Date range state - default to last 7 days
  const [dateRange, setDateRange] = useState<DateRangeValue>(() => {
    const endDate = new Date(2026, 0, 26); // Jan 26, 2026
    const startDate = new Date(2026, 0, 20); // Jan 20, 2026
    return [startDate, endDate];
  });

  // Handler for date range change
  const handleDateRangeChange = (value: DateRangeValue) => {
    setDateRange(value);
  };

  // Form for table filters
  const filterMethods = useForm<TableFiltersForm>({
    defaultValues: {
      search: '',
      interaction: INTERACTION_OPTIONS[0],
      sortBy: SORT_OPTIONS[0],
    },
  });

  const { watch: watchFilters } = filterMethods;
  const searchValue = watchFilters('search');
  const interactionValue = watchFilters('interaction');
  const sortByValue = watchFilters('sortBy');

  // Handler for export CSV
  const handleExportCSV = () => {
    // TODO: Implement CSV export functionality
    console.log('Exporting CSV with filters:', { searchValue, interactionValue, sortByValue });
  };

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

  // Initialize the table
  const table = useReactTable({
    data: MOCK_INVESTORS,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className={s.root}>
      <div className={s.content}>
        {/* Header Section */}
        <div className={s.header}>
          <div className={s.titleSection}>
            <div className={s.titleRow}>
              <h1 className={s.title}>Activity Feed</h1>
              <Badge variant="brand" className={statusConfig.className}>
                &bull; {statusConfig.label}
              </Badge>
            </div>
            <p className={s.subtitle}>Track investor engagement with your team. This dashboard is private.</p>
          </div>
          <div className={s.datePickerWrapper}>
            <label className={s.datePickerLabel}>Select date range</label>
            <DatePicker
              onChange={handleDateRangeChange as any}
              value={dateRange as any}
              className={s.dateRangePicker}
              calendarProps={{ className: s.calendar }}
              clearIcon={null}
              calendarIcon={CalendarIcon}
              format="MMM d, y"
              rangeDivider=" - "
            />
          </div>
        </div>

        {/* Section 1: Summary Stats */}
        <section className={s.section}>
          <div className={s.sectionHeader}>
            <h2 className={s.sectionTitle}>Engagement Overview</h2>
            <p className={s.sectionSubtitle}>See how investors interacted with your team.</p>
          </div>
          <div className={s.statsGrid}>
            {STATS.map((stat) => (
              <div key={stat.id} className={s.statCard}>
                <div className={s.statIcon}>{stat.icon}</div>
                <div className={s.statContent}>
                  <span className={s.statValue}>{stat.value.toLocaleString()}</span>
                  <div className={s.statLabelRow}>
                    <span className={s.statLabel}>{stat.label}</span>
                    <Tooltip trigger={<InfoIcon />} content={stat.tooltip} />
                  </div>
                  <span className={s.statChange}>{stat.change}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className={s.divider} />

        {/* Section 2: Engagement Funnel */}
        <section className={s.section}>
          <div className={s.sectionHeader}>
            <h2 className={s.sectionTitle}>Engagement Funnel</h2>
            <p className={s.sectionSubtitle}>Daily breakdown of investor engagement across different touchpoints</p>
          </div>
          <div className={s.chartCard}>
            <div className={s.chartLegend}>
              {LEGEND_ITEMS.map((item) => (
                <div key={item.label} className={s.legendItem}>
                  <span className={s.legendDot} style={{ backgroundColor: item.color }} />
                  <span className={s.legendLabel}>{item.label}</span>
                </div>
              ))}
            </div>
            <div className={s.chartPlaceholder}>
              <p>Chart visualization placeholder</p>
              <p className={s.chartNote}>Stacked bar chart showing daily engagement data</p>
            </div>
          </div>
        </section>

        <div className={s.divider} />

        {/* Section 3: Investor Activity */}
        <section className={s.section}>
          <div className={s.sectionHeader}>
            <h2 className={s.sectionTitle}>Investor Activity</h2>
            <p className={s.sectionSubtitle}>Detailed view of investor interactions with your profile</p>
          </div>
          <FormProvider {...filterMethods}>
            <div className={s.tableActions}>
              <div className={s.searchField}>
                <FormField name="search" placeholder="Search investors" icon={<SearchIcon />} />
              </div>
              <div className={s.filterField}>
                <FormSelect name="interaction" placeholder="All interactions" options={INTERACTION_OPTIONS} />
              </div>
              <div className={s.filterField}>
                <FormSelect name="sortBy" placeholder="Most recent" options={SORT_OPTIONS} />
              </div>
              <Button variant="secondary" size="l" onClick={handleExportCSV} className={s.exportButton}>
                <DownloadIcon />
                Export (CSV)
              </Button>
            </div>
          </FormProvider>
          <div className={s.tableWrapper}>
            <table className={s.table}>
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={s.pagination}>
            <span className={s.paginationInfo}>Showing 1-9 of 24 investors</span>
          </div>
        </section>
      </div>
    </div>
  );
};
