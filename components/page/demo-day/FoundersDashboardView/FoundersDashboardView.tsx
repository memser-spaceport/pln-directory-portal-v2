'use client';

import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { DemoDayState } from '@/app/actions/demo-day.actions';
import { IUserInfo } from '@/types/shared.types';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { Button } from '@/components/common/Button';
import { flexRender } from '@tanstack/react-table';
import { FormProvider, useForm } from 'react-hook-form';
import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';

import s from './FoundersDashboardView.module.scss';
import { DateRangePicker } from '@/components/form/DateRangePicker';
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
  SearchIcon,
} from '@/components/page/demo-day/FoundersDashboardView/components/Icons';
import { EngagementChartDataPoint, Investor, LegendItem, TableFiltersForm } from './types';
import { getStatusConfig, INTERACTION_OPTIONS, SORT_OPTIONS } from './helpers';
import { EngagementChart } from './components/EngagementChart';
import { useActivityTable } from '@/components/page/demo-day/FoundersDashboardView/hooks';

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

  const [dateRange, setDateRange] = useState<[Date, Date] | null>(() => {
    const endDate = new Date(2026, 0, 26); // Jan 26, 2026
    const startDate = new Date(2026, 0, 20); // Jan 20, 2026
    return [startDate, endDate];
  });

  const handleDateRangeChange = (value: [Date, Date] | null) => {
    setDateRange(value);
  };

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

  const handleExportCSV = () => {
    // TODO: Implement CSV export functionality
    console.log('Exporting CSV with filters:', { searchValue, interactionValue, sortByValue });
  };

  const filteredData = useMemo(() => {
    let data = MOCK_INVESTORS;

    if (searchValue && searchValue.trim() !== '') {
      const searchLower = searchValue.toLowerCase().trim();
      data = data.filter((investor) => investor.name.toLowerCase().includes(searchLower));
    }

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

  const { table } = useActivityTable(filteredData, sortByValue);

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
            <DateRangePicker
              label="Select date range"
              placeholder="Select date range"
              value={dateRange}
              onChange={handleDateRangeChange}
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
