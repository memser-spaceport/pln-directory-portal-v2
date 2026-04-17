/**
 * Master data for CurrentRound component
 * This file contains all section data in a centralized location
 * Can be replaced with API calls in the future
 */

import { CurrentRoundData } from '../types/current-round.types';
import { DISCLOSURE_URL, SUPPORT_URL, SUPPORT_EMAIL } from '@/constants/plaa';

/**
 * Current Round 14 (April 2026) Master Data
 */
export const currentRoundData: CurrentRoundData = {
  // ============================================================================
  // Meta Information
  // ============================================================================
  meta: {
    roundId: 'round-15-apr-2026',
    roundNumber: 15,
    isCurrentRound: true,
    lastUpdated: '2026-04-16T00:00:00'
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
        url: '/alignment-asset/activities',
        type: 'primary',
        openInNewTab: false
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
    roundNumber: 15,
    monthYear: 'April 2026',
    badgeText: 'Current Round',
    paragraphs: [
      {
        text: 'Up to 10,000 tokens are allocated each month for verified contributions through {incentivizedActivities} completed and submitted by network contributors. Each category is allocated a fixed portion of these tokens based on network priorities.',
        links: [
          {
            placeholder: '{incentivizedActivities}',
            text: 'Incentivized Activities',
            url: '/alignment-asset/activities'
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
            url: '/alignment-asset/incentive-model'
          }
        ]
      }
    ]
  },

  // ============================================================================
  // Snapshot Progress Section Data
  // ============================================================================
  snapshotProgress: {
    startDate: '2026-04-01T00:00:00',
    endDate: '2026-04-30T23:59:59',
    tipContent: {
      tipText: 'Lower activity in a category generally means more tokens available to collect per contributor, while higher activity means tokens are distributed more widely.',
      exploreTitle: 'Explore where you can make the biggest impact this month:',
      links: [
        {
          prefix: 'Browse activities you can complete in the',
          linkText: 'Incentivized Activities List',
          url: '/alignment-asset/activities'
        },
        {
          prefix: 'Learn how',
          linkText: 'Point-to-Token Conversion',
          suffix: 'works',
          url: '/alignment-asset/faqs#point-to-token-conversion'
        },
        {
          prefix: 'Review the full',
          linkText: 'Incentive Model',
          suffix: 'and see how point collection mapped to token distribution in previous rounds',
          url: '/alignment-asset/incentive-model'
        }
      ],
      bottomLink: {
        text: 'See what happened in the last round',
        url: '/alignment-asset/rounds/14'
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
      { name: 'Knowledge', value: 1500 },
      { name: 'Network Tooling', value: 0 },
      { name: 'People/Talent', value: 0 },
      { name: 'Programs', value: 300 },
      { name: 'Projects', value: 0 }
    ]
  },

  // ============================================================================
  // Stats Section Data
  // ============================================================================
  stats: {
    onboardedParticipants: 59,
    regionsUnlocked: ['USA', 'Germany', 'Switzerland', 'Portugal'],
    incentivizedActivities: [
      'Curate X Spaces',
      'Host Office Hours',
      'Create a blog for the network',
      'Complete or update your PL Directory Profile',
      'Design a Custom Incentive Experiment',
      'Contribute your compensation data',
      'Talent Referral Program',
      'Create an Incentivized Activity',
      'Network Introductions',
      'Referral Program',
      'Survey Completion',
      'Alignment Asset Program Contributions',
      'Distinguished Network Contributions',
      'Help Organize an Event',
      'Construct an Alignment Asset Case Study',
      'Respond to an IRL Gathering'
    ],
    totalPointsCollected: '1,800',
    totalTokensAvailable: '10,000',
    numberOfBuybacks: 0
  },

  // ============================================================================
  // Leaderboard Section Data
  // ============================================================================
  leaderboard: {
    currentSnapshotData: [
      { rank: 1, name: 'David Doe', activities: '', points: 450 },
      { rank: 2, name: 'Jeremy Kloth', activities: '', points: 300 },
      { rank: 3, name: 'Molly Mackinlay', activities: '', points: 300 },
      { rank: 4, name: 'Anuj Pandey', activities: '', points: 150 },
      { rank: 5, name: 'Bradley Holden', activities: '', points: 150 },
      { rank: 6, name: 'Juan Benet', activities: '', points: 150 },
      { rank: 7, name: 'Lynnette Nolan', activities: '', points: 150 },
      { rank: 8, name: 'Theresa Therriault', activities: '', points: 150 },
      { rank: 9, name: 'Alex Feerst', activities: '', points: 0 },
      { rank: 10, name: 'Arleen Teranishi', activities: '', points: 0 },
      { rank: 11, name: 'Ashley Franck', activities: '', points: 0 },
      { rank: 12, name: 'Cameron Wood', activities: '', points: 0 },
      { rank: 13, name: 'Camille Bagnall', activities: '', points: 0 },
      { rank: 14, name: 'Carl Cervone', activities: '', points: 0 },
      { rank: 15, name: 'Chris Brocoum', activities: '', points: 0 },
      { rank: 16, name: 'Connor Dales', activities: '', points: 0 },
      { rank: 17, name: 'Corey James', activities: '', points: 0 },
      { rank: 18, name: 'Cyril Delattre', activities: '', points: 0 },
      { rank: 19, name: 'David Casey', activities: '', points: 0 },
      { rank: 20, name: 'David Huseby', activities: '', points: 0 },
      { rank: 21, name: 'Derrick Lam', activities: '', points: 0 },
      { rank: 22, name: 'Diana Stern', activities: '', points: 0 },
      { rank: 23, name: 'Diego Leal Togni', activities: '', points: 0 },
      { rank: 24, name: 'Dottie Wang', activities: '', points: 0 },
      { rank: 25, name: 'Erick Watson', activities: '', points: 0 },
      { rank: 26, name: 'Eshan Chordia', activities: '', points: 0 },
      { rank: 27, name: 'Evan Miyazono', activities: '', points: 0 },
      { rank: 28, name: 'Francesca Cohen', activities: '', points: 0 },
      { rank: 29, name: 'Holke Brammer', activities: '', points: 0 },
      { rank: 30, name: 'Ian Brunner', activities: '', points: 0 },
      { rank: 31, name: 'Jeff De Gregorio', activities: '', points: 0 },
      { rank: 32, name: 'Jennifer Denini', activities: '', points: 0 },
      { rank: 33, name: 'Jonathan Victor', activities: '', points: 0 },
      { rank: 34, name: 'Julien Gruber', activities: '', points: 0 },
      { rank: 35, name: 'Julio Garcia', activities: '', points: 0 },
      { rank: 36, name: 'Justin Melillo', activities: '', points: 0 },
      { rank: 37, name: 'Karla Tang', activities: '', points: 0 },
      { rank: 38, name: 'Kevin Houng', activities: '', points: 0 },
      { rank: 39, name: 'Laura Brewer', activities: '', points: 0 },
      { rank: 40, name: 'Matthew Koch', activities: '', points: 0 },
      { rank: 41, name: 'Michael Stachiw', activities: '', points: 0 },
      { rank: 42, name: 'Michelle Lee', activities: '', points: 0 },
      { rank: 43, name: 'Monica Ortel', activities: '', points: 0 },
      { rank: 44, name: 'Patrick Kim', activities: '', points: 0 },
      { rank: 45, name: 'Patrick McClurg', activities: '', points: 0 },
      { rank: 46, name: 'Raymond Cheng', activities: '', points: 0 },
      { rank: 47, name: 'René Pinnell', activities: '', points: 0 },
      { rank: 48, name: 'Rich Chang', activities: '', points: 0 },
      { rank: 49, name: 'Rohit Goel', activities: '', points: 0 },
      { rank: 50, name: 'Russell Dempsey', activities: '', points: 0 },
      { rank: 51, name: 'Sabeen Ali', activities: '', points: 0 },
      { rank: 52, name: 'Sean Escola', activities: '', points: 0 },
      { rank: 53, name: 'Shae Biron', activities: '', points: 0 },
      { rank: 54, name: 'Stefaan Vervaet', activities: '', points: 0 },
      { rank: 55, name: 'Stefanie Wykoff', activities: '', points: 0 },
      { rank: 56, name: 'Victoria DeVesty', activities: '', points: 0 },
      { rank: 57, name: 'William Scott', activities: '', points: 0 },
      { rank: 58, name: 'Yolan Romailler', activities: '', points: 0 },
      { rank: 59, name: 'Zachary von Naumann', activities: '', points: 0 }
    ],
    cumulativeData: [
      { rank: 1, name: 'David Casey', activities: '', points: 12750 },
      { rank: 2, name: 'Bradley Holden', activities: '', points: 10600 },
      { rank: 3, name: 'Anuj Pandey', activities: '', points: 8925 },
      { rank: 4, name: 'Molly Mackinlay', activities: '', points: 8850 },
      { rank: 5, name: 'Ian Brunner', activities: '', points: 8585 },
      { rank: 6, name: 'Rich Chang', activities: '', points: 7875 },
      { rank: 7, name: 'Diana Stern', activities: '', points: 6600 },
      { rank: 8, name: 'Theresa Therriault', activities: '', points: 6350 },
      { rank: 9, name: 'Raymond Cheng', activities: '', points: 5974 },
      { rank: 10, name: 'Juan Benet', activities: '', points: 5650 },
      { rank: 11, name: 'Stefanie Wykoff', activities: '', points: 5350 },
      { rank: 12, name: 'Kevin Houng', activities: '', points: 5312 },
      { rank: 13, name: 'William Scott', activities: '', points: 5025 },
      { rank: 14, name: 'Cyril Delattre', activities: '', points: 3550 },
      { rank: 15, name: 'Eshan Chordia', activities: '', points: 3350 },
      { rank: 16, name: 'Michael Stachiw', activities: '', points: 3150 },
      { rank: 17, name: 'Laura Brewer', activities: '', points: 3075 },
      { rank: 18, name: 'Derrick Lam', activities: '', points: 3050 },
      { rank: 19, name: 'Jeff De Gregorio', activities: '', points: 2998 },
      { rank: 20, name: 'Chris Brocoum', activities: '', points: 2850 },
      { rank: 21, name: 'Victoria DeVesty', activities: '', points: 2600 },
      { rank: 22, name: 'Lynnette Nolan', activities: '', points: 2325 },
      { rank: 23, name: 'Matthew Koch', activities: '', points: 2200 },
      { rank: 24, name: 'Erick Watson', activities: '', points: 2200 },
      { rank: 25, name: 'Stefaan Vervaet', activities: '', points: 2000 },
      { rank: 26, name: 'Connor Dales', activities: '', points: 1700 },
      { rank: 27, name: 'Monica Ortel', activities: '', points: 1300 },
      { rank: 28, name: 'Jonathan Victor', activities: '', points: 1200 },
      { rank: 29, name: 'Francesca Cohen', activities: '', points: 1100 },
      { rank: 30, name: 'Zachary von Naumann', activities: '', points: 1000 },
      { rank: 31, name: 'Dottie Wang', activities: '', points: 1000 },
      { rank: 32, name: 'Carl Cervone', activities: '', points: 1000 },
      { rank: 33, name: 'Evan Miyazono', activities: '', points: 950 },
      { rank: 34, name: 'Ashley Franck', activities: '', points: 950 },
      { rank: 35, name: 'Corey James', activities: '', points: 850 },
      { rank: 36, name: 'Jennifer Denini', activities: '', points: 837 },
      { rank: 37, name: 'Yolan Romailler', activities: '', points: 700 },
      { rank: 38, name: 'Rohit Goel', activities: '', points: 700 },
      { rank: 39, name: 'Patrick Kim', activities: '', points: 700 },
      { rank: 40, name: 'Diego Leal Togni', activities: '', points: 675 },
      { rank: 41, name: 'Karla Tang', activities: '', points: 500 },
      { rank: 42, name: 'Russell Dempsey', activities: '', points: 400 },
      { rank: 43, name: 'Arleen Teranishi', activities: '', points: 400 },
      { rank: 44, name: 'Julio Garcia', activities: '', points: 350 },
      { rank: 45, name: 'Justin Melillo', activities: '', points: 300 },
      { rank: 46, name: 'David Huseby', activities: '', points: 300 },
      { rank: 47, name: 'Camille Bagnall', activities: '', points: 300 },
      { rank: 48, name: 'Shae Biron', activities: '', points: 275 },
      { rank: 49, name: 'Sabeen Ali', activities: '', points: 250 },
      { rank: 50, name: 'René Pinnell', activities: '', points: 200 }
    ]
  },

  // ============================================================================
  // Buyback Auction Section Data (Round 15 - April 2026)
  // ============================================================================
  buybackAuction: {
    headerStats: {
      totalFilled: '$0.00',
      fillRate: '0%'
    },
    summary: {
      title: 'Buyback Auction - April 2026 - Key Results',
      items: [
        {
          icon: '/icons/rounds/buy_action_results/wallet-01.svg',
          label: 'Total Buyback Pool',
          value: 'TBD'
        },
        {
          icon: '/icons/rounds/buy_action_results/pie-chart.svg',
          label: 'Pool Used',
          value: 'TBD'
        },
        {
          icon: '/icons/rounds/buy_action_results/coins-02.svg',
          label: 'Clearing Price',
          value: 'TBD'
        },
        {
          icon: '/icons/rounds/buy_action_results/analytics-01.svg',
          label: 'Capped Allocation',
          value: 'TBD'
        },
        {
          icon: '/icons/rounds/buy_action_results/dollar-02.svg',
          label: 'Tokens Purchased',
          value: 'TBD'
        },
        {
          icon: '/icons/rounds/buy_action_results/user-multiple.svg',
          label: 'Winning Bidders',
          value: 'TBD'
        }
      ]
    },
    bids: []
  },

  // ============================================================================
  // Learn More Section Data
  // ============================================================================
  learnMore: {
    faqUrl: '/alignment-asset/faqs'
  },

};

/**
 * Export as default for easy importing
 */
export default currentRoundData;
