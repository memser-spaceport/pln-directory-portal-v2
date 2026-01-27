/**
 * Master data for CurrentRound component
 * This file contains all section data in a centralized location
 * Can be replaced with API calls in the future
 */

import { IPastRoundData } from '../types/current-round.types';
import { DISCLOSURE_URL, SUPPORT_URL, SUPPORT_EMAIL } from '@/constants/plaa';

/**
 * Past Round 6 (July 2025) Master Data
 */
export const pastRound6Data: IPastRoundData = {
  // ============================================================================
  // Meta Information
  // ============================================================================
  meta: {
    roundId: 'round-6-jul-2025',
    roundNumber: 6,
    isCurrentRound: false,
    month: 'July',
    year: 2025,
    lastUpdated: '2025-12-18T00:00:00',
  },

  // ============================================================================
  // Hero Section Data
  // ============================================================================
  hero: {
    title: 'PL Alignment Asset',
    subtitle:
      'The PL Alignment Asset connects contributions across the Protocol Labs network — turning collaboration into shared success.',
    actions: [
      {
        label: 'Submit Activities',
        url: 'https://forms.gle/DiACtNgcsaAS8B6P8',
        type: 'primary',
        openInNewTab: true,
      },
      {
        label: 'Check Your Token Balance',
        url: 'https://app.surus.io/',
        type: 'secondary',
        icon: '/icons/rounds/filecoin.svg',
        openInNewTab: true,
      },
    ],
  },

  // ============================================================================
  // Stats Section Data
  // ============================================================================
  stats: {
    onboardedParticipants: 41,
    regionsUnlocked: ['USA'],
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
      'Propose a Cross-Company Project/Initiative',
      'Network Introductions',
      'Referral Program',
      'Survey Completion',
      'Alignment Asset Program Contributions',
      'Distinguished Network Contributions',
    ],
    totalPointsCollected: '8,000',
    totalTokensDistributed: '5,711',
  },

  // ============================================================================
  // Leaderboard Section Data
  // ============================================================================
  leaderboard: [
    { rank: 1, name: 'David Casey', activities: '', points: 1050 },
    { rank: 2, name: 'Molly Mackinlay', activities: '', points: 900 },
    { rank: 3, name: 'Rich Chang', activities: '', points: 850 },
    { rank: 4, name: 'Evan Miyazono', activities: '', points: 650 },
    { rank: 5, name: 'Monica Ortel', activities: '', points: 500 },
    { rank: 6, name: 'Kevin Houng', activities: '', points: 450 },
    { rank: 7, name: 'Bradley Holden', activities: '', points: 450 },
    { rank: 8, name: 'Stefaan Vervaet', activities: '', points: 450 },
    { rank: 9, name: 'Erick Watson', activities: '', points: 400 },
    { rank: 10, name: 'David Huseby', activities: '', points: 300 },
    { rank: 11, name: 'Juan Benet', activities: '', points: 300 },
  ],
};

/**
 * Export as default for easy importing
 */
export default pastRound6Data;
