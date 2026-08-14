// Round-specific fields here are overridden at request time by live stats;
// only edit this file for the round-independent copy (hero, paragraphs, tip
// content, labels) or as a fallback if the live fetch fails.

import { CurrentRoundData } from '../types/current-round.types';
import { DISCLOSURE_URL, SUPPORT_URL, SUPPORT_EMAIL } from '@/constants/plaa';

export const currentRoundData: CurrentRoundData = {
  meta: {
    roundNumber: 19,
    isCurrentRound: true,
    lastUpdated: '2026-08-11T00:00:00'
  },

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
        label: 'Manage your Surus Account',
        url: 'https://app.surus.io/',
        type: 'secondary',
        icon: '/icons/rounds/filecoin.svg',
        openInNewTab: true
      }
    ]
  },

  roundDescription: {
    roundNumber: 19,
    monthYear: 'August 2026',
    badgeText: 'Current Round',
    paragraphs: [
      {
        text: 'Up to 10,000 PLAA is allocated each month for verified contributions through {incentivizedActivities} completed and submitted by network contributors. Each category is allocated a fixed portion of the PLAA based on network priorities.',
        links: [
          {
            placeholder: '{incentivizedActivities}',
            text: 'activities',
            url: '/alignment-asset/activities'
          }
        ]
      },
      {
        text: 'Your PLAA amount depends on participation within each category: when more people contribute, the PLAA pool is more widely distributed; when activity is lower in a category, more PLAA is available per contributor.'
      },
      {
        text: 'Some categories update in real time, while others rely on participants submitting information. Consequently, the point totals may not always reflect the most recent activity — especially for activities such as Custom Incentive Experiments, Talent Referrals, Curate X Spaces, and Referral Program submissions. Our new activity assistant bot streamlines most submissions, though some activities will still require submission via a Google form or manual updates. We\'ll continue updating as new submissions come in and are working toward more automations this year.'
      },
      {
        text: 'Each round represents a single monthly snapshot period. View the PLAA allocations and activity levels for the current round below. You can also view the point-to-PLAA conversion results across previous rounds {previousRounds}.',
        links: [
          {
            placeholder: '{previousRounds}',
            text: 'on the Incentive Model page',
            url: '/alignment-asset/incentive-model'
          }
        ]
      }
    ]
  },

  snapshotProgress: {
    startDate: '2026-08-01T00:00:00',
    endDate: '2026-08-31T23:59:59',
    tipContent: {
      tipText: 'Lower activity in a category generally means more PLAA is available to collect per contributor, while higher activity means PLAA is distributed more widely.',
      exploreTitle: 'Explore where you can make the biggest impact this month:',
      links: [
        {
          prefix: 'Browse activities you can complete in the',
          linkText: 'Activities List',
          url: '/alignment-asset/activities'
        },
        {
          prefix: 'Learn how',
          linkText: 'Point-to-PLAA Conversion',
          suffix: 'works',
          url: '/alignment-asset/faqs#point-to-token-conversion'
        },
        {
          prefix: 'Review the full',
          linkText: 'Incentive Model',
          suffix: 'and see how point collection mapped to PLAA distribution in previous rounds',
          url: '/alignment-asset/incentive-model'
        }
      ],
      bottomLink: {
        text: 'See what happened in the last round (Round 18)',
        url: '/alignment-asset/rounds/18'
      }
    }
  },

  chart: {
    title: 'Total Points Collected Per KPI category In Current Snapshot Period (updated weekly)',
    subtitle: 'Please note: totals may not include the most recent submissions, as some activities rely on participant reporting.',
    maxValue: 500,
    chartData: [
      { name: 'Brand', value: 0 },
      { name: 'Knowledge', value: 450 },
      { name: 'Network Tooling', value: 200 },
      { name: 'People/Talent', value: 0 },
      { name: 'Programs', value: 0 },
      { name: 'Projects', value: 500 }
    ]
  },

  stats: {
    onboardedParticipants: 63,
    regionsUnlocked: ['USA', 'Germany', 'Switzerland', 'Portugal'],
    incentivizedActivities: [
      'Thoughtful Responder',
      'Quick Conversationalist',
      'Host Office Hours',
      'Make a Network Introduction',
      'High Value Connector',
      'Attend an IRL Gathering',
      'Complete a PLAA Survey',
      'Give Excellent Survey Feedback',
      'Complete a Survey',
      'Refer New Alignment Asset Participants',
      'Top the Leaderboard',
      'Give a Network Kudos',
      'Host or Co-Host an X Space',
      'Write and publish a case study about the Alignment Asset',
      'Refer a Potential Team Member to a PL Network Org',
      'Propose a New Activity for the PLAA',
      'Help Organize an Event',
      'Highlight an Outstanding Network Contribution',
      'Share an AI Resource or Tool You Built',
      'Contribute to the Alignment Asset Program',
      'Build an AI App',
      'Setup Your PL Directory Profile',
      'Share Compensation Data',
      'Design a Custom Incentive Experiment'
    ],
    // Sum of chart.chartData values above (450 + 200 + 500)
    totalPointsCollected: '1,150',
    totalTokensAvailable: '10,000',
    numberOfBuybacks: 0
  },

  leaderboard: {
    currentSnapshotData: [],
    cumulativeData: []
  },

  buybackAuction: {
    headerStats: {
      totalFilled: '$0.00',
      fillRate: '0%'
    },
    summary: {
      title: 'Buyback Auction - July 2026 - Key Results',
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
          label: 'PLAA Redeemed',
          value: 'TBD'
        },
        {
          icon: '/icons/rounds/buy_action_results/user-multiple.svg',
          label: 'Accepted Bidders',
          value: 'TBD'
        }
      ]
    },
    bids: []
  },

  learnMore: {
    faqUrl: '/alignment-asset/faqs'
  },

};

export default currentRoundData;
