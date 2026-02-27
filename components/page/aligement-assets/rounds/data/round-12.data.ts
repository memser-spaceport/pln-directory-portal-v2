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
        //url: 'https://forms.gle/DiACtNgcsaAS8B6P8',
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
  // Stats Section Data
  // ============================================================================
  stats: {
    onboardedParticipants: 51,
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
    totalPointsCollected: '0',
    totalTokensDistributed: '8,315',
    numberOfBuybacks: 0
  },

  // ============================================================================
  // Leaderboard Section Data (Round 12: Top Contributors)
  // ============================================================================
  leaderboard: [
    { rank: 1, name: 'Ian Brunner', activities: '', points: 2300 },
    { rank: 2, name: 'Bradley Holden', activities: '', points: 1400 },
    { rank: 3, name: 'Rich Chang', activities: '', points: 1250 },
    { rank: 4, name: 'Juan Benet', activities: '', points: 1050 },
    { rank: 5, name: 'Anuj Pandey', activities: '', points: 550 },
    { rank: 6, name: 'Molly Mackinlay', activities: '', points: 550 },
    { rank: 7, name: 'William Scott', activities: '', points: 350 },
    { rank: 8, name: 'Michael Stachiw', activities: '', points: 275 },
    { rank: 9, name: 'Shae Biron', activities: '', points: 275 },
    { rank: 10, name: 'Theresa Therriault', activities: '', points: 275 }
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
