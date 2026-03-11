/**
 * Master data for PastRound component
 * This file contains all section data for Round 13 (February 2026)
 * Can be replaced with API calls in the future
 */

import { IPastRoundData } from '../types/current-round.types';

/**
 * Past Round 13 (February 2026) Master Data
 */
export const pastRound13Data: IPastRoundData = {
  // ============================================================================
  // Meta Information
  // ============================================================================
  meta: {
    roundId: 'round-13-feb-2026',
    roundNumber: 13,
    isCurrentRound: false,
    month: 'February',
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
    onboardedParticipants: 55,
    regionsUnlocked: ['USA', 'Germany', 'Switzerland', 'Portugal'],
    incentivizedActivities: [
      'Curate X Spaces',
      'Create a Replicable Playbook or Template',
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
      'Construct an Alignment Asset Case Study'
    ],
    totalPointsCollected: '8,531',
    // totalTokensAvailable: '10,000',
    totalTokensDistributed: 'TBC',
    numberOfBuybacks: 0
  },

  // ============================================================================
  // Leaderboard Section Data
  // ============================================================================
  leaderboard: [
    { rank: 1, name: 'Michael Stachiw', activities: '', points: 675 },
    { rank: 2, name: 'Jennifer Denini', activities: '', points: 512 },
    { rank: 3, name: 'Ian Brunner', activities: '', points: 485 },
    { rank: 4, name: 'Eshan Chordia', activities: '', points: 450 },
    { rank: 5, name: 'Rich Chang', activities: '', points: 375 },
    { rank: 6, name: 'William Scott', activities: '', points: 375 },
    { rank: 7, name: 'Diego Leal Togni', activities: '', points: 375 },
    { rank: 8, name: 'Derrick Lam', activities: '', points: 300 },
    { rank: 9, name: 'Camille Bagnall', activities: '', points: 300 },
    { rank: 10, name: 'Laura Brewer', activities: '', points: 275 }
  ],
};

/**
 * Export as default for easy importing
 */
export default pastRound13Data;
