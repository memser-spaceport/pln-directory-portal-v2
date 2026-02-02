// Type for date range picker value - matches the library's Value type
export type LooseValue = Date | null | [Date | null, Date | null];
export type DateRangeValue = LooseValue;

// Type for investor data
export type Investor = {
  id: number;
  name: string;
  company: string;
  avatar: string;
  investmentFocus: string[];
  interaction: string;
  date: string;
  time: string;
  typicalCheckSize: string;
};

// Form type for table filters
export type TableFiltersForm = {
  search: string;
  interaction: { label: string; value: string } | null;
  sortBy: { label: string; value: string } | null;
};

// Type for engagement chart data
export type EngagementChartDataPoint = {
  date: Date;
  profileViewed: number;
  interested: number;
  connected: number;
  liked: number;
  introMade: number;
  feedbackGiven: number;
  viewedSlide: number;
  videoWatched: number;
  founderProfileClicked: number;
  teamPageClicked: number;
  teamWebsiteClicked: number;
};

// Type for legend item
export type LegendItem = {
  label: string;
  color: string;
};
