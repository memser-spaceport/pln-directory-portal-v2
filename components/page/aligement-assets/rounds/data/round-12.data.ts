/**
 * Master data for PastRound component
 * This file contains all section data for Round 12 (January 2026)
 * Can be replaced with API calls in the future
 */

import { IPastRoundData } from '../types/current-round.types';

/**
 * Past Round 12 (January 2026) Master Data
 */
export const pastRound12Data: IPastRoundData = {
  // ============================================================================
  // Meta Information
  // ============================================================================
  meta: {
    roundId: 'round-12-jan-2026',
    roundNumber: 12,
    isCurrentRound: false,
    month: 'January',
    year: 2026,
    lastUpdated: '2026-02-03T00:00:00'
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
  // Stats Section Data
  // ============================================================================
  stats: {
    onboardedParticipants: 49,
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
    totalPointsCollected: '3,050',
    totalTokensAvailable: '10,000',
    numberOfBuybacks: 0
  },

  // ============================================================================
  // Leaderboard Section Data
  // ============================================================================
  leaderboard: [
    { rank: 1, name: 'Ian Brunner', activities: '', points: 350 },
    { rank: 2, name: 'Theresa Therriault', activities: '', points: 300 },
    { rank: 3, name: 'Bradley Holden', activities: '', points: 200 },
    { rank: 4, name: 'Connor Dales', activities: '', points: 200 },
    { rank: 5, name: 'Cyril Delattre', activities: '', points: 200 },
    { rank: 6, name: 'Eshan Chordia', activities: '', points: 200 },
    { rank: 7, name: 'Jeff De Gregorio', activities: '', points: 200 },
    { rank: 8, name: 'Michael Stachiw', activities: '', points: 200 },
    { rank: 9, name: 'Juan Benet', activities: '', points: 150 },
    { rank: 10, name: 'Molly Mackinlay', activities: '', points: 150 },
    { rank: 11, name: 'David Casey', activities: '', points: 100 },
    { rank: 12, name: 'Dottie Wang', activities: '', points: 100 },
    { rank: 13, name: 'Justin Melillo', activities: '', points: 100 },
    { rank: 14, name: 'Laura Brewer', activities: '', points: 100 },
    { rank: 15, name: 'Matthew Koch', activities: '', points: 100 },
    { rank: 16, name: 'Rich Chang', activities: '', points: 100 },
    { rank: 17, name: 'Rohit Goel', activities: '', points: 100 },
    { rank: 18, name: 'William Scott', activities: '', points: 100 },
    { rank: 19, name: 'Zachary von Naumann', activities: '', points: 100 }
  ],

  // ============================================================================
  // Buyback Auction Section Data (Round 12 - January 2026)
  // ============================================================================
  // Note: Buyback auction data will be added once the auction occurs
};

/**
 * Export as default for easy importing
 */
export default pastRound12Data;
