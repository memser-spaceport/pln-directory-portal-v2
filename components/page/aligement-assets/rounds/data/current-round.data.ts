/**
 * Master data for CurrentRound component
 * This file contains all section data in a centralized location
 * Can be replaced with API calls in the future
 */

import { CurrentRoundData } from '../types/current-round.types';
import { DISCLOSURE_URL, SUPPORT_URL, SUPPORT_EMAIL } from '@/constants/plaa';

/**
 * Current Round 17 (June 2026) Master Data
 */
export const currentRoundData: CurrentRoundData = {
  // ============================================================================
  // Meta Information
  // ============================================================================
  meta: {
    roundId: 'round-17-jun-2026',
    roundNumber: 17,
    isCurrentRound: true,
    lastUpdated: '2026-06-01T00:00:00'
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
    roundNumber: 17,
    monthYear: 'June 2026',
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
    startDate: '2026-06-01T00:00:00',
    endDate: '2026-06-30T23:59:59',
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
        url: '/alignment-asset/rounds/16'
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
      { name: 'Knowledge', value: 0 },
      { name: 'Network Tooling', value: 0 },
      { name: 'People/Talent', value: 0 },
      { name: 'Programs', value: 0 },
      { name: 'Projects', value: 0 }
    ]
  },

  // ============================================================================
  // Stats Section Data
  // ============================================================================
  stats: {
    onboardedParticipants: 0,
    regionsUnlocked: ['USA', 'Germany', 'Switzerland', 'Portugal'],
    incentivizedActivities: [
      'Curate X Spaces',
      'Host Office Hours',
      'Create a Blog for the Network',
      'Complete or Update Your PL Directory Profile',
      'Design a Custom Incentive Experiment',
      'Contribute Your Compensation Data',
      'Talent Referral Program',
      'Create an Incentivized Activity',
      'Network Introductions',
      'Referral Program',
      'Survey Completion',
      'Alignment Asset Program Contributions',
      'Distinguished Network Contributions',
      'Help Organize an Event',
      'Construct an Alignment Asset Case Study',
      'Respond to an IRL Gathering',
      'Contribute a High-Quality Response to the Forum',
      'Share a Reusable AI Resource or Tool',
      'Rank Among the Network\'s Most Supportive Members'
    ],
    totalPointsCollected: '0',
    totalTokensAvailable: '10,000',
    numberOfBuybacks: 0
  },

  // ============================================================================
  // Leaderboard Section Data
  // ============================================================================
  leaderboard: {
    currentSnapshotData: [],
    cumulativeData: []
  },

  // ============================================================================
  // Buyback Auction Section Data (Round 17 - June 2026)
  // ============================================================================
  buybackAuction: {
    headerStats: {
      totalFilled: '$0.00',
      fillRate: '0%'
    },
    summary: {
      title: 'Buyback Auction - June 2026 - Key Results',
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
