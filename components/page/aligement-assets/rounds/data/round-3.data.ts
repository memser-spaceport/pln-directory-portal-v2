/**
 * Master data for CurrentRound component
 * This file contains all section data in a centralized location
 * Can be replaced with API calls in the future
 */

import { IPastRoundData } from '../types/current-round.types';
import { DISCLOSURE_URL, SUPPORT_URL, SUPPORT_EMAIL } from '@/constants/plaa';

/**
 * Past Round 3 (April 2025) Master Data
 */
export const pastRound3Data: IPastRoundData = {
  // ============================================================================
  // Meta Information
  // ============================================================================
  meta: {
    roundId: 'round-3-apr-2025',
    roundNumber: 3,
    isCurrentRound: false,
    month: 'April',
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
    totalPointsCollected: '15,250',
    totalTokensDistributed: '6,636'
  },

  // ============================================================================
  // Leaderboard Section Data
  // ============================================================================
  leaderboard: [
  ],
};

/**
 * Export as default for easy importing
 */
export default pastRound3Data;
