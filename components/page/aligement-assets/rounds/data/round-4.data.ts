/**
 * Master data for CurrentRound component
 * This file contains all section data in a centralized location
 * Can be replaced with API calls in the future
 */

import { IPastRoundData } from '../types/current-round.types';
import { DISCLOSURE_URL, SUPPORT_URL, SUPPORT_EMAIL } from '@/constants/plaa';

/**
 * Past Round 4 (May 2025) Master Data
 */
export const pastRound4Data: IPastRoundData = {
  // ============================================================================
  // Meta Information
  // ============================================================================
  meta: {
    roundId: 'round-4-may-2025',
    roundNumber: 4,
    isCurrentRound: false,
    month: 'May',
    year: 2025,
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
  // Stats Section Data
  // ============================================================================
  stats: {
    onboardedParticipants: 37,
    regionsUnlocked: ['USA'],
    incentivizedActivities: [
      'Curate X Spaces',
      'Host Office Hours',
      'Create a blog for the network',
      'Complete or update your PL Directory Profile',
      'Contribute your compensation data',
      'Talent Referral Program',
      'Network Introductions',
      'Survey Completion',
      'Alignment Asset Program Contributions',
      'Distinguished Network Contributions',
    ],
    totalPointsCollected: '10,825',
    totalTokensDistributed: '8,337'
  },

  // ============================================================================
  // Leaderboard Section Data
  // ============================================================================
  leaderboard: [
      { rank: 1, name: 'Anuj Pandey', activities: '', points: 1375 },
      { rank: 2, name: 'Molly Mackinlay', activities: '', points: 1350 },
      { rank: 3, name: 'Victoria DeVesty', activities: '', points: 1300 },
      { rank: 4, name: 'Derrick Lam', activities: '', points: 1100 },
      { rank: 5, name: 'Jonathan Victor', activities: '', points: 1000 },
      { rank: 6, name: 'Chris Brocoum', activities: '', points: 750 },
      { rank: 7, name: 'Diana Stern', activities: '', points: 750 },
      { rank: 8, name: 'William Scott', activities: '', points: 600 },
      { rank: 9, name: 'Rich Chang', activities: '', points: 500 },
      { rank: 10, name: 'Carl Cervone', activities: '', points: 300 },
      { rank: 11, name: 'Cyril Delattre', activities: '', points: 300 },
      { rank: 12, name: 'Juan Benet', activities: '', points: 300 },
  ],
};

/**
 * Export as default for easy importing
 */
export default pastRound4Data;
