/**
 * Type definitions for CurrentRound component master data structure
 * Each section's data is organized for easy API integration and maintainability
 */

// ============================================================================
// Common Types
// ============================================================================

/**
 * Represents a link with display text and URL
 */
export interface LinkItem {
  text: string;
  url: string;
}

/**
 * Represents an action button with styling options
 */
export interface ActionButton {
  label: string;
  url: string;
  type: 'primary' | 'secondary';
  icon?: string;
  openInNewTab?: boolean;
}

// ============================================================================
// Hero Section Types
// ============================================================================

export interface HeroSectionData {
  title: string;
  subtitle: string;
  actions: ActionButton[];
}

// ============================================================================
// Round Description Section Types
// ============================================================================

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

// ============================================================================
// Snapshot Progress Section Types
// ============================================================================

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

// ============================================================================
// Chart Section Types
// ============================================================================

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

// ============================================================================
// Stats Section Types
// ============================================================================

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

// ============================================================================
// Leaderboard Section Types
// ============================================================================

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

// ============================================================================
// Buyback Auction Section Types
// ============================================================================

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
  status: 'Fully Filled' | 'Partially Filled' | 'Not Filled';
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
  headerDescription: string;
  summary: BuybackSummary;
  bids: BuybackBidEntry[];
}

// ============================================================================
// Learn More Section Types
// ============================================================================

export interface LearnMoreSectionData {
  faqUrl: string;
}


// ============================================================================
// Master Current Round Data Type
// ============================================================================

/**
 * Master data structure containing all section data for the CurrentRound component
 * This structure can be populated from an API response
 */
export interface CurrentRoundData {
  /** Metadata about the round */
  meta: {
    roundId: string;
    roundNumber: number;
    isCurrentRound: boolean;
    lastUpdated: string; // ISO date string
  };
  
  /** Hero section with title, subtitle, and action buttons */
  hero: HeroSectionData;
  
  /** Round description with badge and paragraphs */
  roundDescription: RoundDescriptionSectionData;
  
  /** Snapshot progress with dates and tip content */
  snapshotProgress: SnapshotProgressSectionData;
  
  /** Chart section with KPI pillar data */
  chart: ChartSectionData;
  
  /** Statistics section with participant and activity data */
  stats: StatsSectionData;
  
  /** Leaderboard section with current and all-time rankings */
  leaderboard: LeaderboardSectionData;
  
  /** Buyback auction section with results and bid data */
  buybackAuction: BuybackAuctionSectionData;
  
  /** Learn more section with FAQ link */
  learnMore: LearnMoreSectionData;
  
}


export interface IPastRoundData {
  meta: {
    roundId: string;
    roundNumber: number;
    isCurrentRound: boolean;
    month: string;
    year: number;
    lastUpdated: string; // ISO date string
  };
  
  /** Hero section with title, subtitle, and action buttons */
  hero: HeroSectionData;

  /** Leaderboard section with current and all-time rankings */
  leaderboard: LeaderboardEntry[];
  stats: StatsSectionData;
  buybackSimulation: BuybackSimulationSectionData;
}