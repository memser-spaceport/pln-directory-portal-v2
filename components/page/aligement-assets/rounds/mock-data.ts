// Mock data for rounds page components - matching Figma design exactly

export interface LeaderboardEntry {
  rank: number;
  name: string;
  activities: string;
  points: number;
  avatar?: string;
}

export interface StatsData {
  onboardedParticipants: number;
  regionsUnlocked: string[];
  incentivizedActivities: string[][];
  totalPointsCollected: string;
  totalTokensAvailable: string;
  numberOfBuybacks: number;
}

export interface SnapshotProgress {
  title: string;
  period: string;
  timeRemaining: string;
  progressPercentage: number;
}

export interface BuybackAuctionData {
  clearingPrice: string;
  totalTokensBoughtBack: string;
  totalBidValue: string;
  auctionFillRate: string;
  bids: BuybackBidEntry[];
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

export interface AuctionSummary {
  walletAddress: string;
  tokenShare: string;
  clearing: string;
}

// Current Snapshot Leaderboard Data (December 2025)
export const mockCurrentSnapshotLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: "Theresa Therriault", activities: "", points: 950 },
  { rank: 2, name: "Dottie Wang", activities: "", points: 200 },
  { rank: 3, name: "Anuj Pandey", activities: "", points: 150 },
  { rank: 4, name: "Michael Stachiw", activities: "", points: 150 },
  { rank: 5, name: "Bradley Holden", activities: "", points: 100 },
  { rank: 6, name: "Ian Brunner", activities: "", points: 100 },
  { rank: 7, name: "Jeff De Gregorio", activities: "", points: 100 }
];

// Cumulative Points Leaderboard Data (All-time)
export const mockCumulativeLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: "Anuj Pandey", activities: "", points: 8125 },
  { rank: 2, name: "Bradley Holden", activities: "", points: 8100 },
  { rank: 3, name: "Molly Mackinlay", activities: "", points: 7600 },
  { rank: 4, name: "Rich Chang", activities: "", points: 6050 },
  { rank: 5, name: "Diana Stern", activities: "", points: 5800 },
  { rank: 6, name: "Theresa Therriault", activities: "", points: 5650 },
  { rank: 7, name: "David Casey", activities: "", points: 5400 },
  { rank: 8, name: "Raymond Cheng", activities: "", points: 5350 },
  { rank: 9, name: "Stefanie Wykoff", activities: "", points: 5250 },
  { rank: 10, name: "Kevin Houng", activities: "", points: 4850 },
  { rank: 11, name: "Juan Benet", activities: "", points: 4600 },
  { rank: 12, name: "William Scott", activities: "", points: 4100 },
  { rank: 13, name: "Ian Brunner", activities: "", points: 4050 },
  { rank: 14, name: "Cyril Delattre", activities: "", points: 3250 },
  { rank: 15, name: "Chris Brocoum", activities: "", points: 2750 },
  { rank: 16, name: "Laura Brewer", activities: "", points: 2700 },
  { rank: 17, name: "Derrick Lam", activities: "", points: 2650 },
  { rank: 18, name: "Victoria DeVesty", activities: "", points: 2500 },
  { rank: 19, name: "Eshan Chordia", activities: "", points: 2200 },
  { rank: 20, name: "Jeff De Gregorio", activities: "", points: 2050 },
  { rank: 21, name: "Stefaan Vervaet", activities: "", points: 1900 },
  { rank: 22, name: "Michael Stachiw", activities: "", points: 1900 },
  { rank: 23, name: "Erick Watson", activities: "", points: 1900 },
  { rank: 24, name: "Matthew Koch", activities: "", points: 1600 },
  { rank: 25, name: "Lynnette Nolan", activities: "", points: 1250 },
  { rank: 26, name: "Monica Ortel", activities: "", points: 1200 },
  { rank: 27, name: "Jonathan Victor", activities: "", points: 1200 },
  { rank: 28, name: "Connor Dales", activities: "", points: 1100 },
  { rank: 29, name: "Francesca Cohen", activities: "", points: 1000 },
  { rank: 30, name: "Carl Cervone", activities: "", points: 900 },
  { rank: 31, name: "Evan Miyazono", activities: "", points: 850 },
  { rank: 32, name: "Ashley Franck", activities: "", points: 850 },
  { rank: 33, name: "Dottie Wang", activities: "", points: 800 },
  { rank: 34, name: "Zachary von Naumann", activities: "", points: 600 },
  { rank: 35, name: "Corey James", activities: "", points: 600 },
  { rank: 36, name: "Karla Tang", activities: "", points: 500 },
  { rank: 37, name: "Patrick Kim", activities: "", points: 450 },
  { rank: 38, name: "Julio Garcia", activities: "", points: 350 },
  { rank: 39, name: "Russell Dempsey", activities: "", points: 300 },
  { rank: 40, name: "Rohit Goel", activities: "", points: 300 },
  { rank: 41, name: "David Huseby", activities: "", points: 300 },
  { rank: 42, name: "Justin Melillo", activities: "", points: 200 },
  { rank: 43, name: "Arleen Teranishi", activities: "", points: 200 }
];

// Legacy mock data (for backwards compatibility)
export const mockLeaderboardData: LeaderboardEntry[] = mockCurrentSnapshotLeaderboard;

// Mock statistics data - exact from Figma
export const mockStatsData: StatsData = {
  onboardedParticipants: 47,
  regionsUnlocked: ["USA", "Germany", "Switzerland"],
  incentivizedActivities: [
    ["PL Directory Profile", "Share Compensation Data", "Design a Custom Incentive Experiment"],
    ["Write a Blog or Article", "Host or Curate an X Space", "Complete the Monthly Survey"],
    ["Create a Playbook or Template", "Lead or Join a Cross-Company Project", "Refer a New Team Member or Collaborator"],
    ["Propose a New Incentivized Activity", "Make a Network Introduction", "Highlight an Outstanding Network Contribution"],
    ["Bring New Members Into the Alignment Asset", "Host Office Hours", "Contribute to the Alignment Asset Program"],
    ["Shared Resource or Cost-Saving Initiative"]
  ],
  totalPointsCollected: "##",
  totalTokensAvailable: "10,000",
  numberOfBuybacks: 1
};

// Mock snapshot progress data - exact from Figma
export const mockSnapshotProgress: SnapshotProgress = {
  title: "Current Snapshot Period - December 1-31, 2025",
  period: "December 1-31, 2025",
  timeRemaining: "Time remaining in current snapshot period",
  progressPercentage: 3.23 // Based on Figma progress bar
};

// Mock buyback auction data - exact from Figma
export const mockBuybackAuctionData: BuybackAuctionData = {
  clearingPrice: "$10.00 135 bids",
  totalTokensBoughtBack: "100%",
  totalBidValue: "Calculating...",
  auctionFillRate: "60.6%",
  bids: [
    { bidderId: "Bidder #1", tokensBid: "10", tokenPrice: "$ 1.00", bidValue: "$ 10", status: "Fully Filled", amtFilled: "$ 20", accepted: "1", aggFill: "$ 20", percentCapture: "0.06%" },
    { bidderId: "Bidder #1", tokensBid: "10", tokenPrice: "$ 2.00", bidValue: "$ 20", status: "Fully Filled", amtFilled: "$ 20", accepted: "3 / 25", aggFill: "$ 40", percentCapture: "0.06%" },
    { bidderId: "Bidder #1", tokensBid: "10", tokenPrice: "$ 3.00", bidValue: "$ 30", status: "Partially Filled", amtFilled: "$ 20", accepted: "3 / 25", aggFill: "$ 60", percentCapture: "0.11%" },
    { bidderId: "Bidder #1", tokensBid: "10", tokenPrice: "$ 4.00", bidValue: "$ 40", status: "Fully Filled", amtFilled: "$ 40", accepted: "3 / 25", aggFill: "$ 100", percentCapture: "0.11%" },
    { bidderId: "Bidder #1", tokensBid: "10", tokenPrice: "$ 5.00", bidValue: "$ 50", status: "Partially Filled", amtFilled: "$ 40", accepted: "3 / 25", aggFill: "$ 140", percentCapture: "0.17%" },
    { bidderId: "Bidder #1", tokensBid: "10", tokenPrice: "$ 6.00", bidValue: "$ 60", status: "Fully Filled", amtFilled: "$ 60", accepted: "3 / 25", aggFill: "$ 200", percentCapture: "0.17%" },
    { bidderId: "Bidder #1", tokensBid: "10", tokenPrice: "$ 7.00", bidValue: "$ 70", status: "Partially Filled", amtFilled: "$ 60", accepted: "3 / 25", aggFill: "$ 260", percentCapture: "0.23%" },
    { bidderId: "Bidder #1", tokensBid: "10", tokenPrice: "$ 8.00", bidValue: "$ 80", status: "Fully Filled", amtFilled: "$ 80", accepted: "3 / 25", aggFill: "$ 340", percentCapture: "0.23%" },
    { bidderId: "Bidder #1", tokensBid: "10", tokenPrice: "$ 9.00", bidValue: "$ 90", status: "Partially Filled", amtFilled: "$ 80", accepted: "3 / 25", aggFill: "$ 420", percentCapture: "2.55%" },
    { bidderId: "Bidder #1", tokensBid: "100", tokenPrice: "$ 9.00", bidValue: "$ 900", status: "Fully Filled", amtFilled: "$ 900", accepted: "3 / 25", aggFill: "$ 1,320", percentCapture: "0.28%" },
  ]
};

// Auction summary data - exact from Figma
export const mockAuctionSummary: AuctionSummary[] = [
  { walletAddress: "Wallet Address", tokenShare: "Token Share", clearing: "Clearing..." },
  { walletAddress: "$10.00 135 bids (cap)", tokenShare: "", clearing: "" }
];

// Round description content - exact from Figma
export const roundDescriptionContent = {
  title: "Round 11: December 2025",
  badge: "Current Round",
  paragraphs: [
    `Up to 10,000 tokens are allocated each month for verified contributions through <a href="#">Incentivized Activities</a> completed and submitted by network contributors. Each category is allocated a fixed portion of these tokens based on network priorities.`,
    `Your token amount depends on participation within each category: when more people contribute, the token pool is more widely distributed; when activity is lower in a category, more tokens are available per contributor.`,
    `Some categories update in real time, while others rely on participants submitting information. Consequently, the point totals may not always reflect the most recent activity — especially for activities such as Custom Incentive Experiments, Blog Creation, Talent Referrals, Curated X Spaces, and Referral Program submissions. Our new <a href="#">unified reporting form</a> streamlines most submissions, though some activities will still require manual updates. We'll continue updating as new submissions come in and are working toward more automation in 2026.`,
    `Each round represents a single monthly snapshot period. View the token allocations and activity levels for the current round below. You can also view the point-to-token conversion results across previous rounds <a href="#">here</a>.`
  ]
};

// Tip section content - exact from Figma
export const tipSectionContent = {
  tipText: `<strong>Tip:</strong> Lower activity in a category generally means more tokens available to collect per contributor, while higher activity means tokens are distributed more widely.`,
  exploreTitle: "Explore where you can make the biggest impact this month:",
  links: [
    { text: "Browse activities you can complete in the", linkText: "Incentivized Activities List", url: "#" },
    { text: "Learn how", linkText: "Point-to-Token Conversion", afterText: "works", url: "#" },
    { text: "Review the full", linkText: "Incentive Model", afterText: "and see how point collection mapped to token distribution in previous rounds", url: "#" }
  ],
  bottomLink: { text: "See what happened in the last round", url: "#" }
};

// Disclaimer content - exact from Figma
export const disclaimerContent = `The Alignment Asset is still in private beta, and we're actively experimenting. The points program may evolve at any time as we learn and improve. While the alignment asset trust ultimately controls token distributions, and we cannot guarantee the conversion of points to tokens, your participation now puts you at the forefront of this exciting initiative. This is for informational purposes only, and is not legal, financial, investment, or tax advice. Please read our <a href="https://docs.google.com/document/d/1St-tNjvgTTyHy0Ta5XUBUJkP4d3me4MJU2Dotx6046U/edit?tab=t.0">disclosure</a>.`;

// Learn more content - exact from Figma
export const learnMoreContent = "Read the FAQ for details on batch auctions, clearing price calculation, and how bids are selected.";

// Support content - exact from Figma  
export const supportContent = `Have questions or need help with onboarding? <a href="#">Schedule office hours</a> for 1:1 support or email <a href="mailto:plaa-wg@plrs.xyz">plaa-wg@plrs.xyz</a>.`;

// Chart data interface
export interface ChartDataEntry {
  name: string;
  value: number;
}

// Mock chart data - exact from Figma
export const mockChartData: ChartDataEntry[] = [
  { name: 'Brand', value: 12500 },
  { name: 'Capital', value: 0 },
  { name: 'Knowledge Sharing', value: 17500 },
  { name: 'Network Tooling', value: 11450 },
  { name: 'People/Talent', value: 6650 },
  { name: 'Programs', value: 4250 },
  { name: 'Projects', value: 500 }
];
