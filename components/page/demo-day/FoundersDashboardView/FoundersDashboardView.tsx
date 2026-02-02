'use client';

import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { DemoDayState } from '@/app/actions/demo-day.actions';
import { IUserInfo } from '@/types/shared.types';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import Image from 'next/image';
import { Button } from '@/components/common/Button';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
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
import { DateRangeValue, EngagementChartDataPoint, Investor, LegendItem, TableFiltersForm } from './types';
import { ArrowUpRightIcon } from '@/components/icons';
import { getStatusConfig, INTERACTION_OPTIONS, SORT_OPTIONS } from './helpers';
import { EngagementChart } from './components/EngagementChart';

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

const MOCK_CHART_DATA: EngagementChartDataPoint[] = [
  {
    date: new Date(2026, 0, 20),
    profileViewed: 1590,
    interested: 800,
    connected: 23,
    liked: 12,
    introMade: 5,
    feedbackGiven: 3,
    viewedSlide: 10,
    videoWatched: 2,
    founderProfileClicked: 8,
    teamPageClicked: 6,
    teamWebsiteClicked: 4,
  },
  {
    date: new Date(2026, 0, 21),
    profileViewed: 90,
    interested: 100,
    connected: 23,
    liked: 12,
    introMade: 5,
    feedbackGiven: 3,
    viewedSlide: 10,
    videoWatched: 2,
    founderProfileClicked: 8,
    teamPageClicked: 6,
    teamWebsiteClicked: 4,
  },
];

// Create column helper for type-safe column definitions
const columnHelper = createColumnHelper<Investor>();

const LEGEND_ITEMS: LegendItem[] = [
  { label: 'Profile Viewed', color: '#156FF7' },
  { label: 'Investment interest', color: '#44D5BB' },
  { label: 'Connected', color: '#F59E0B' },
  { label: 'Liked', color: '#EF4444' },
  { label: 'Intro made', color: '#8B5CF6' },
  { label: 'Feedback given', color: '#EC4899' },
  { label: 'Viewed slide', color: '#10B981' },
  { label: 'Video watched', color: '#6366F1' },
  { label: 'Founder profile clicked', color: '#F97316' },
  { label: 'Team page clicked', color: '#14B8A6' },
  { label: 'Team website clicked', color: '#A855F7' },
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

  // Filter data based on search input and interaction dropdown
  const filteredData = useMemo(() => {
    let data = MOCK_INVESTORS;

    // Filter by search (investor name)
    if (searchValue && searchValue.trim() !== '') {
      const searchLower = searchValue.toLowerCase().trim();
      data = data.filter((investor) => investor.name.toLowerCase().includes(searchLower));
    }

    // Filter by interaction type
    if (interactionValue && interactionValue.value !== 'all') {
      const interactionMap: Record<string, string[]> = {
        interested: ['Very Interested', 'Interested'],
        connected: ['Connected'],
        liked: ['Liked'],
        introMade: ['Intro Made'],
        feedbackGiven: ['Feedback Given'],
        viewedSlide: ['Viewed Slide'],
        pitchVideoWatched: ['Pitch Video Watched'],
        profileViewed: ['Profile Viewed'],
        founderProfileClicked: ['Founder Profile Clicked'],
        teamPageClicked: ['Team Page Clicked'],
        teamWebsiteClicked: ['Team Website Clicked'],
      };
      const allowedInteractions = interactionMap[interactionValue.value] || [];
      data = data.filter((investor) => allowedInteractions.includes(investor.interaction));
    }

    return data;
  }, [searchValue, interactionValue]);

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
            <EngagementChart data={MOCK_CHART_DATA} legendItems={LEGEND_ITEMS} />
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
            <span className={s.paginationInfo}>
              Showing {filteredData.length > 0 ? 1 : 0}-{filteredData.length} of {MOCK_INVESTORS.length} investors
            </span>
          </div>
        </section>
      </div>
    </div>
  );
};
