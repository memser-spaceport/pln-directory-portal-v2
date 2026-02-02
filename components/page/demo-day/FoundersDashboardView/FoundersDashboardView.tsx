'use client';

import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { DemoDayState } from '@/app/actions/demo-day.actions';
import { IUserInfo } from '@/types/shared.types';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import Image from 'next/image';
import { Button } from '@/components/common/Button';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, ColumnDef } from '@tanstack/react-table';

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
} from '@/components/page/demo-day/FoundersDashboardView/components/Icons';

// Type for date range picker value - matches the library's Value type
type LooseValue = Date | null | [Date | null, Date | null];
type DateRangeValue = LooseValue;

// Mock data for chart
const MOCK_CHART_DATA = [
  {
    date: 'Jan 20',
    pageViews: 278,
    slideViews: 150,
    videoViews: 100,
    founderViews: 90,
    teamPage: 80,
    teamWebsite: 45,
    liked: 35,
    connected: 23,
    invest: 21,
    intro: 4,
    feedback: 3,
  },
  {
    date: 'Jan 21',
    pageViews: 224,
    slideViews: 120,
    videoViews: 83,
    founderViews: 64,
    teamPage: 56,
    teamWebsite: 38,
    liked: 26,
    connected: 20,
    invest: 17,
    intro: 3,
    feedback: 2,
  },
  {
    date: 'Jan 22',
    pageViews: 224,
    slideViews: 75,
    videoViews: 46,
    founderViews: 40,
    teamPage: 35,
    teamWebsite: 23,
    liked: 16,
    connected: 13,
    invest: 10,
    intro: 3,
    feedback: 2,
  },
  {
    date: 'Jan 23',
    pageViews: 70,
    slideViews: 60,
    videoViews: 40,
    founderViews: 30,
    teamPage: 20,
    teamWebsite: 14,
    liked: 10,
    connected: 8,
    invest: 6,
    intro: 3,
    feedback: 1,
  },
  {
    date: 'Jan 24',
    pageViews: 90,
    slideViews: 65,
    videoViews: 46,
    founderViews: 38,
    teamPage: 29,
    teamWebsite: 21,
    liked: 14,
    connected: 10,
    invest: 6,
    intro: 4,
    feedback: 2,
  },
  {
    date: 'Jan 25',
    pageViews: 160,
    slideViews: 95,
    videoViews: 60,
    founderViews: 52,
    teamPage: 45,
    teamWebsite: 30,
    liked: 22,
    connected: 16,
    invest: 12,
    intro: 4,
    feedback: 2,
  },
  {
    date: 'Jan 26',
    pageViews: 85,
    slideViews: 55,
    videoViews: 40,
    founderViews: 30,
    teamPage: 25,
    teamWebsite: 18,
    liked: 13,
    connected: 10,
    invest: 8,
    intro: 3,
    feedback: 2,
  },
];

// Type for investor data
type Investor = {
  id: number;
  name: string;
  company: string;
  avatar: string;
  interests: string[];
  engagementScore: number;
  sentiment: string;
  date: string;
  time: string;
};

// Mock data for investors table
const MOCK_INVESTORS: Investor[] = [
  {
    id: 1,
    name: 'Sarah Chen',
    company: 'Sequoia Capital',
    avatar: '',
    interests: ['DeFi', 'Infrastructure', 'AI'],
    engagementScore: 85,
    sentiment: 'Very Interested',
    date: 'Jan 26, 2026',
    time: '2:30 PM',
  },
  {
    id: 2,
    name: 'Michael Park',
    company: 'a16z Crypto',
    avatar: '',
    interests: ['DeFi', 'Gaming', 'NFT'],
    engagementScore: 72,
    sentiment: 'Interested',
    date: 'Jan 26, 2026',
    time: '1:15 PM',
  },
  {
    id: 3,
    name: 'Emily Johnson',
    company: 'Paradigm',
    avatar: '',
    interests: ['Storage', 'AI', 'Decentralized Identity'],
    engagementScore: 68,
    sentiment: 'Considering',
    date: 'Jan 25, 2026',
    time: '4:45 PM',
  },
  {
    id: 4,
    name: 'David Kim',
    company: 'Polychain Capital',
    avatar: '',
    interests: ['Storage', 'Infrastructure', 'L2'],
    engagementScore: 65,
    sentiment: 'Interested',
    date: 'Jan 25, 2026',
    time: '11:20 AM',
  },
  {
    id: 5,
    name: 'Lisa Wang',
    company: 'Multicoin Capital',
    avatar: '',
    interests: ['Compute', 'Gaming'],
    engagementScore: 58,
    sentiment: 'Positive',
    date: 'Jan 24, 2026',
    time: '3:00 PM',
  },
  {
    id: 6,
    name: 'James Wilson',
    company: 'Electric Capital',
    avatar: '',
    interests: ['Developer Tools', 'Decentralized Storage'],
    engagementScore: 52,
    sentiment: 'Very Interested',
    date: 'Jan 24, 2026',
    time: '10:30 AM',
  },
  {
    id: 7,
    name: 'Anna Lee',
    company: 'Dragonfly',
    avatar: '',
    interests: ['DeFi', 'AI'],
    engagementScore: 48,
    sentiment: 'Positive',
    date: 'Jan 23, 2026',
    time: '5:15 PM',
  },
  {
    id: 8,
    name: 'Robert Brown',
    company: 'Pantera Capital',
    avatar: '',
    interests: ['Infrastructure', 'Decentralized Identity'],
    engagementScore: 45,
    sentiment: 'Neutral',
    date: 'Jan 23, 2026',
    time: '2:00 PM',
  },
  {
    id: 9,
    name: 'Jennifer Martinez',
    company: 'Framework Ventures',
    avatar: '',
    interests: ['Developer Tools', 'Decentralized Storage'],
    engagementScore: 42,
    sentiment: 'Very Interested',
    date: 'Jan 22, 2026',
    time: '11:45 AM',
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

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 10.6667V8M8 5.33333H8.00667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z"
      stroke="#94A3B8"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowUpRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4.66667 11.3333L11.3333 4.66667M11.3333 4.66667H4.66667M11.3333 4.66667V11.3333"
      stroke="#94A3B8"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6.66667 1.66667V4.16667M13.3333 1.66667V4.16667M2.5 7.5H17.5M4.16667 3.33333H15.8333C16.7538 3.33333 17.5 4.07953 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16667C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07953 3.24619 3.33333 4.16667 3.33333Z"
      stroke="#455468"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const getStatusConfig = (status: DemoDayState['status'] | undefined) => {
  switch (status) {
    case 'UPCOMING':
      return {
        label: 'Upcoming',
        className: s.badgeUpcoming,
      };
    case 'ACTIVE':
      return {
        label: 'Active',
        className: s.badgeActive,
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        className: s.badgeCompleted,
      };
    case 'ARCHIVED':
      return {
        label: 'Archived',
        className: s.badgeArchived,
      };
    case 'REGISTRATION_OPEN':
      return {
        label: 'Registration Open',
        className: s.badgeRegistrationOpen,
      };
    default:
      return {
        label: status,
        className: s.badgeDefault,
      };
  }
};

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
      columnHelper.accessor('interests', {
        header: 'Interests',
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
      columnHelper.accessor('engagementScore', {
        header: 'Engagement Score',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('sentiment', {
        header: 'Sentiment',
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
          <div className={s.tableActions}>
            <div className={s.tableTags}>
              <Badge variant="brand">All Investors</Badge>
              <Badge variant="default">Very Interested</Badge>
              <Badge variant="default">Interested</Badge>
              <Badge variant="default">Considering</Badge>
            </div>
            <div className={s.tableFilters}>
              <select className={s.filterSelect}>
                <option>All Sentiments</option>
              </select>
              <select className={s.filterSelect}>
                <option>All Interests</option>
              </select>
              <Button variant="secondary" size="s">
                Export CSV
              </Button>
            </div>
          </div>
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
