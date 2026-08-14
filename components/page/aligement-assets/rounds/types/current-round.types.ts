export interface LinkItem {
  text: string;
  url: string;
}

export interface ActionButton {
  label: string;
  url: string;
  type: 'primary' | 'secondary';
  icon?: string;
  openInNewTab?: boolean;
}

export interface HeroSectionData {
  title: string;
  subtitle: string;
  actions: ActionButton[];
}

export interface RoundDescriptionParagraph {
  text: string;
  links?: Array<{
    placeholder: string;
    url: string;
    text: string;
  }>;
}

export interface RoundDescriptionSectionData {
  roundNumber: number;
  monthYear: string;
  badgeText: string;
  paragraphs: RoundDescriptionParagraph[];
}

export interface TipLink {
  prefix: string;
  linkText: string;
  suffix?: string;
  url: string;
}

export interface TipContent {
  tipText: string;
  exploreTitle: string;
  links: TipLink[];
  bottomLink: LinkItem;
}

export interface SnapshotProgressSectionData {
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  tipContent: TipContent;
}

export interface ChartEntry {
  name: string;
  value: number;
}

export interface ChartSectionData {
  title: string;
  subtitle: string;
  chartData: ChartEntry[];
  maxValue: number;
}

export interface StatsSectionData {
  onboardedParticipants: number;
  regionsUnlocked: string[];
  incentivizedActivities: string[];
  totalPointsCollected: string;
  totalTokensAvailable?: string;
  totalTokensDistributed?: string;
  numberOfBuybacks?: number;
  labweek25IncentivizedActivities?: string[];
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  activities: string;
  points: number;
  avatar?: string;
}

export interface LeaderboardSectionData {
  currentSnapshotData: LeaderboardEntry[];
  cumulativeData: LeaderboardEntry[];
}

export interface BuybackHeaderStats {
  totalFilled: string;
  fillRate: string;
}

export interface BuybackSummaryItem {
  icon: string;
  label: string;
  value: string;
}

export interface BuybackSummary {
  title: string;
  items: BuybackSummaryItem[];
}

export interface BuybackBidEntry {
  bidderId: string;
  tokensBid: string;
  tokenPrice: string;
  bidValue: string;
  status: 'Fully Filled' | 'Partially Filled' | 'Not Filled' | 'Limit' | 'Pro Rata';
  amtFilled: string;
  accepted: string;
  aggFill: string;
  percentCapture: string;
}

export interface BuybackAuctionSectionData {
  headerStats: BuybackHeaderStats;
  summary: BuybackSummary;
  bids: BuybackBidEntry[];
}

export interface BuybackSimulationSectionData {
  title: string;
  headerDescription: string;
  totalFilled?: string;
  summary: BuybackSummary;
  bids: BuybackBidEntry[];
}

export interface LearnMoreSectionData {
  faqUrl: string;
}

export interface CurrentRoundData {
  meta: {
    roundNumber: number;
    isCurrentRound: boolean;
    lastUpdated: string; // ISO date string
  };
  hero: HeroSectionData;
  roundDescription: RoundDescriptionSectionData;
  snapshotProgress: SnapshotProgressSectionData;
  chart: ChartSectionData;
  stats: StatsSectionData;
  leaderboard: LeaderboardSectionData;
  buybackAuction: BuybackAuctionSectionData;
  learnMore: LearnMoreSectionData;
}

export interface IPastRoundData {
  meta: {
    roundNumber: number;
    isCurrentRound: boolean;
    month: string;
    year: number;
    lastUpdated: string; // ISO date string
  };
  hero: HeroSectionData;
  leaderboard: LeaderboardEntry[];
  stats: StatsSectionData;
}
