/**
 * Master data for CurrentRound component
 * This file contains all section data in a centralized location
 * Can be replaced with API calls in the future
 */

import { CurrentRoundData } from '../types/current-round.types';

/**
 * Current Round 11 (December 2025) Master Data
 */
export const currentRoundData: CurrentRoundData = {
  // ============================================================================
  // Meta Information
  // ============================================================================
  meta: {
    roundId: 'round-11-dec-2025',
    roundNumber: 11,
    isCurrentRound: true,
    lastUpdated: '2025-12-18T00:00:00'
  },

  // ============================================================================
  // Hero Section Data
  // ============================================================================
  hero: {
    title: 'PL Alignment Asset',
    subtitle: 'The PL Alignment Asset connects contributions across the Protocol Labs network — turning collaboration into shared success.',
    actions: [
      {
        label: 'Submit Activities',
        url: 'https://forms.gle/DiACtNgcsaAS8B6P8',
        type: 'primary',
        openInNewTab: true
      },
      {
        label: 'Check Your Token Balance',
        url: 'https://app.surus.io/',
        type: 'secondary',
        icon: '/icons/rounds/filecoin.svg',
        openInNewTab: true
      }
    ]
  },

  // ============================================================================
  // Round Description Section Data
  // ============================================================================
  roundDescription: {
    roundNumber: 11,
    monthYear: 'December 2025',
    badgeText: 'Current Round',
    paragraphs: [
      {
        text: 'Up to 10,000 tokens are allocated each month for verified contributions through {incentivizedActivities} completed and submitted by network contributors. Each category is allocated a fixed portion of these tokens based on network priorities.',
        links: [
          {
            placeholder: '{incentivizedActivities}',
            text: 'Incentivized Activities',
            url: '#'
          }
        ]
      },
      {
        text: 'Your token amount depends on participation within each category: when more people contribute, the token pool is more widely distributed; when activity is lower in a category, more tokens are available per contributor.'
      },
      {
        text: 'Some categories update in real time, while others rely on participants submitting information. Consequently, the point totals may not always reflect the most recent activity — especially for activities such as Custom Incentive Experiments, Blog Creation, Talent Referrals, Curated X Spaces, and Referral Program submissions. Our new {unifiedForm} streamlines most submissions, though some activities will still require manual updates. We\'ll continue updating as new submissions come in and are working toward more automation in 2026.',
        links: [
          {
            placeholder: '{unifiedForm}',
            text: 'unified reporting form',
            url: 'https://forms.gle/DiACtNgcsaAS8B6P8'
          }
        ]
      },
      {
        text: 'Each round represents a single monthly snapshot period. View the token allocations and activity levels for the current round below. You can also view the point-to-token conversion results across previous rounds {previousRounds}.',
        links: [
          {
            placeholder: '{previousRounds}',
            text: 'here',
            url: '#'
          }
        ]
      }
    ]
  },

  // ============================================================================
  // Snapshot Progress Section Data
  // ============================================================================
  snapshotProgress: {
    startDate: '2025-12-01T00:00:00',
    endDate: '2025-12-31T23:59:59',
    tipContent: {
      tipText: 'Lower activity in a category generally means more tokens available to collect per contributor, while higher activity means tokens are distributed more widely.',
      exploreTitle: 'Explore where you can make the biggest impact this month:',
      links: [
        {
          prefix: 'Browse activities you can complete in the',
          linkText: 'Incentivized Activities List',
          url: '#'
        },
        {
          prefix: 'Learn how',
          linkText: 'Point-to-Token Conversion',
          suffix: 'works',
          url: '#'
        },
        {
          prefix: 'Review the full',
          linkText: 'Incentive Model',
          suffix: 'and see how point collection mapped to token distribution in previous rounds',
          url: '#'
        }
      ],
      bottomLink: {
        text: 'See what happened in the last round',
        url: '#'
      }
    }
  },

  // ============================================================================
  // Chart Section Data
  // ============================================================================
  chart: {
    title: 'Total Points Collected Per KPI Pillar In Current Snapshot Period (updated weekly)',
    subtitle: 'Please note: totals may not include the most recent submissions, as some activities rely on participant reporting.',
    maxValue: 1000,
    chartData: [
      { name: 'Brand', value: 0 },
      { name: 'Capital', value: 0 },
      { name: 'Knowledge Sharing', value: 300 },
      { name: 'Network Tooling', value: 400 },
      { name: 'People/Talent', value: 50 },
      { name: 'Programs', value: 600 },
      { name: 'Projects', value: 400 }
    ]
  },

  // ============================================================================
  // Stats Section Data
  // ============================================================================
  stats: {
    onboardedParticipants: 47,
    regionsUnlocked: ['USA', 'Germany', 'Switzerland'],
    incentivizedActivities: [
      'Curate X Spaces',
      'Shared Resource or Cost-Saving Initiative',
      'Create a Replicable Playbook or Template',
      'Host Office Hours',
      'Create a blog for the network',
      'Complete or update your PL Directory Profile',
      'Design a Custom Incentive Experiment',
      'Contribute your compensation data',
      'Talent Referral Program',
      'Create an Incentivized Activity',
      'Propose a Cross-Company Project/Initiative',
      'Network Introductions',
      'Referral Program',
      'Survey Completion',
      'Alignment Asset Program Contributions',
      'Distinguished Network Contributions'
    ],
    totalPointsCollected: '1,750',
    totalTokensAvailable: '10,000',
    numberOfBuybacks: 1
  },

  // ============================================================================
  // Leaderboard Section Data
  // ============================================================================
  leaderboard: {
    currentSnapshotData: [
      { rank: 1, name: 'David Casey', activities: '', points: 1000 },
      { rank: 2, name: 'Theresa Therriault', activities: '', points: 950 },
      { rank: 3, name: 'Dottie Wang', activities: '', points: 200 },
      { rank: 4, name: 'Anuj Pandey', activities: '', points: 150 },
      { rank: 5, name: 'Michael Stachiw', activities: '', points: 150 },
      { rank: 6, name: 'Bradley Holden', activities: '', points: 100 },
      { rank: 7, name: 'Jeff De Gregorio', activities: '', points: 100 },
      { rank: 8, name: 'Ian Brunner', activities: '', points: 100 },
      { rank: 9, name: 'Matthew Koch', activities: '', points: 0 },
      { rank: 10, name: 'Stefanie Wykoff', activities: '', points: 0 },
      { rank: 11, name: 'Victoria DeVesty', activities: '', points: 0 },
      { rank: 12, name: 'Justin Melillo', activities: '', points: 0 },
      { rank: 13, name: 'Connor Dales', activities: '', points: 0 },
      { rank: 14, name: 'Julio Garcia', activities: '', points: 0 },
      { rank: 15, name: 'Francesca Cohen', activities: '', points: 0 },
      { rank: 16, name: 'Kevin Houng', activities: '', points: 0 },
      { rank: 17, name: 'Rich Chang', activities: '', points: 0 },
      { rank: 18, name: 'Erick Watson', activities: '', points: 0 },
      { rank: 19, name: 'Corey James', activities: '', points: 0 },
      { rank: 20, name: 'Diana Stern', activities: '', points: 0 },
      { rank: 21, name: 'Stefaan Vervaet', activities: '', points: 0 },
      { rank: 22, name: 'Carl Cervone', activities: '', points: 0 },
      { rank: 23, name: 'Laura Brewer', activities: '', points: 0 },
      { rank: 24, name: 'Chris Brocoum', activities: '', points: 0 },
      { rank: 25, name: 'Ashley Franck', activities: '', points: 0 },
      { rank: 26, name: 'Monica Ortel', activities: '', points: 0 },
      { rank: 27, name: 'Jonathan Victor', activities: '', points: 0 },
      { rank: 28, name: 'Cyril Delattre', activities: '', points: 0 },
      { rank: 29, name: 'Raymond Cheng', activities: '', points: 0 },
      { rank: 30, name: 'William Scott', activities: '', points: 0 },
      { rank: 31, name: 'Patrick Kim', activities: '', points: 0 },
      { rank: 32, name: 'Zachary von Naumann', activities: '', points: 0 },
      { rank: 33, name: 'Molly Mackinlay', activities: '', points: 0 },
      { rank: 34, name: 'Juan Benet', activities: '', points: 0 },
      { rank: 35, name: 'Russell Dempsey', activities: '', points: 0 },
      { rank: 36, name: 'Derrick Lam', activities: '', points: 0 },
      { rank: 37, name: 'Karla Tang', activities: '', points: 0 },
      { rank: 38, name: 'Arleen Teranishi', activities: '', points: 0 },
      { rank: 39, name: 'Rohit Goel', activities: '', points: 0 },
      { rank: 40, name: 'David Huseby', activities: '', points: 0 },
      { rank: 41, name: 'René Pinnell', activities: '', points: 0 },
      { rank: 42, name: 'Evan Miyazono', activities: '', points: 0 },
      { rank: 43, name: 'Eshan Chordia', activities: '', points: 0 },
      { rank: 44, name: 'Alex Feerst', activities: '', points: 0 },
      { rank: 45, name: 'Lynnette Nolan', activities: '', points: 0 },
      { rank: 46, name: 'Michelle Lee', activities: '', points: 0 }
    ],
    cumulativeData: [
      { rank: 1, name: 'Anuj Pandey', activities: '', points: 8125 },
      { rank: 2, name: 'Bradley Holden', activities: '', points: 8100 },
      { rank: 3, name: 'Molly Mackinlay', activities: '', points: 7600 },
      { rank: 4, name: 'Rich Chang', activities: '', points: 6050 },
      { rank: 5, name: 'Diana Stern', activities: '', points: 5800 },
      { rank: 6, name: 'Theresa Therriault', activities: '', points: 5650 },
      { rank: 7, name: 'David Casey', activities: '', points: 5400 },
      { rank: 8, name: 'Raymond Cheng', activities: '', points: 5350 },
      { rank: 9, name: 'Stefanie Wykoff', activities: '', points: 5250 },
      { rank: 10, name: 'Kevin Houng', activities: '', points: 4850 },
      { rank: 11, name: 'Juan Benet', activities: '', points: 4600 },
      { rank: 12, name: 'William Scott', activities: '', points: 4100 },
      { rank: 13, name: 'Ian Brunner', activities: '', points: 4050 },
      { rank: 14, name: 'Cyril Delattre', activities: '', points: 3250 },
      { rank: 15, name: 'Chris Brocoum', activities: '', points: 2750 },
      { rank: 16, name: 'Laura Brewer', activities: '', points: 2700 },
      { rank: 17, name: 'Derrick Lam', activities: '', points: 2650 },
      { rank: 18, name: 'Victoria DeVesty', activities: '', points: 2500 },
      { rank: 19, name: 'Eshan Chordia', activities: '', points: 2200 },
      { rank: 20, name: 'Jeff De Gregorio', activities: '', points: 2050 },
      { rank: 21, name: 'Stefaan Vervaet', activities: '', points: 1900 },
      { rank: 22, name: 'Michael Stachiw', activities: '', points: 1900 },
      { rank: 23, name: 'Erick Watson', activities: '', points: 1900 },
      { rank: 24, name: 'Matthew Koch', activities: '', points: 1600 },
      { rank: 25, name: 'Lynnette Nolan', activities: '', points: 1250 },
      { rank: 26, name: 'Monica Ortel', activities: '', points: 1200 },
      { rank: 27, name: 'Jonathan Victor', activities: '', points: 1200 },
      { rank: 28, name: 'Connor Dales', activities: '', points: 1100 },
      { rank: 29, name: 'Francesca Cohen', activities: '', points: 1000 },
      { rank: 30, name: 'Carl Cervone', activities: '', points: 900 },
      { rank: 31, name: 'Evan Miyazono', activities: '', points: 850 },
      { rank: 32, name: 'Ashley Franck', activities: '', points: 850 },
      { rank: 33, name: 'Dottie Wang', activities: '', points: 800 },
      { rank: 34, name: 'Zachary von Naumann', activities: '', points: 600 },
      { rank: 35, name: 'Corey James', activities: '', points: 600 },
      { rank: 36, name: 'Karla Tang', activities: '', points: 500 },
      { rank: 37, name: 'Patrick Kim', activities: '', points: 450 },
      { rank: 38, name: 'Julio Garcia', activities: '', points: 350 },
      { rank: 39, name: 'Russell Dempsey', activities: '', points: 300 },
      { rank: 40, name: 'Rohit Goel', activities: '', points: 300 },
      { rank: 41, name: 'David Huseby', activities: '', points: 300 },
      { rank: 42, name: 'Justin Melillo', activities: '', points: 200 },
      { rank: 43, name: 'Arleen Teranishi', activities: '', points: 200 }
    ]
  },

  // ============================================================================
  // Buyback Auction Section Data (Round 11 - December 2025)
  // ============================================================================
  buybackAuction: {
    headerStats: {
      totalFilled: '$47,614.00',
      fillRate: '99.98%'
    },
    summary: {
      title: 'Buyback Auction #1 - December 2025 - Key Results',
      items: [
        {
          icon: '/icons/rounds/buy_action_results/wallet-01.svg',
          label: 'Total Buyback Pool',
          value: '$47,623.10'
        },
        {
          icon: '/icons/rounds/buy_action_results/pie-chart.svg',
          label: 'Pool Used',
          value: '99.98%'
        },
        {
          icon: '/icons/rounds/buy_action_results/coins-02.svg',
          label: 'Clearing Price',
          value: '$14.00'
        },
        {
          icon: '/icons/rounds/buy_action_results/analytics-01.svg',
          label: 'Capped Allocation',
          value: '$23,811.55 (50% cap)'
        },
        {
          icon: '/icons/rounds/buy_action_results/dollar-02.svg',
          label: 'Tokens Purchased',
          value: '3,401'
        },
        {
          icon: '/icons/rounds/buy_action_results/user-multiple.svg',
          label: 'Winning Bidders',
          value: '5'
        }
      ]
    },
    bids: [
      { bidderId: 'Bidder #12', tokensBid: '1,400', tokenPrice: '$10.25', bidValue: '$14,350.00', status: 'Fully Filled', amtFilled: '$14,350', accepted: '1,025', aggFill: '$14,350', percentCapture: '30.13%' },
      { bidderId: 'Bidder #13', tokensBid: '400', tokenPrice: '$12.00', bidValue: '$4,800.00', status: 'Partially Filled', amtFilled: '$4,788', accepted: '342', aggFill: '$19,138', percentCapture: '10.05%' },
      { bidderId: 'Bidder #2', tokensBid: '300', tokenPrice: '$12.00', bidValue: '$3,600.00', status: 'Partially Filled', amtFilled: '$3,598', accepted: '257', aggFill: '$22,736', percentCapture: '7.56%' },
      { bidderId: 'Bidder #8', tokensBid: '300', tokenPrice: '$12.00', bidValue: '$3,600.00', status: 'Partially Filled', amtFilled: '$3,598', accepted: '257', aggFill: '$26,334', percentCapture: '7.56%' },
      { bidderId: 'Bidder #2', tokensBid: '300', tokenPrice: '$14.00', bidValue: '$4,200.00', status: 'Fully Filled', amtFilled: '$4,200', accepted: '300', aggFill: '$30,534', percentCapture: '8.82%' },
      { bidderId: 'Bidder #9', tokensBid: '1,400', tokenPrice: '$14.00', bidValue: '$19,600.00', status: 'Partially Filled', amtFilled: '$17,080', accepted: '1,220', aggFill: '$47,614', percentCapture: '35.86%' }
    ]
  },

  // ============================================================================
  // Learn More Section Data
  // ============================================================================
  learnMore: {
    faqUrl: '#'
  },

  // ============================================================================
  // Disclaimer Section Data
  // ============================================================================
  disclaimer: {
    disclosureUrl: 'https://docs.google.com/document/d/1St-tNjvgTTyHy0Ta5XUBUJkP4d3me4MJU2Dotx6046U/edit?tab=t.0'
  },

  // ============================================================================
  // Support Section Data
  // ============================================================================
  support: {
    scheduleUrl: 'https://directory.plnetwork.io/members/cldvoaw2y05x5u21k7lrmitp1',
    email: 'plaa-wg@plrs.xyz'
  }
};

/**
 * Export as default for easy importing
 */
export default currentRoundData;
