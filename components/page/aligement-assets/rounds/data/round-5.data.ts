/**
 * Master data for CurrentRound component
 * This file contains all section data in a centralized location
 * Can be replaced with API calls in the future
 */

import { IPastRoundData } from '../types/current-round.types';
import { DISCLOSURE_URL, SUPPORT_URL, SUPPORT_EMAIL } from '@/constants/plaa';

/**
 * Past Round 5 (June 2025) Master Data
 */
export const pastRound5Data: IPastRoundData = {
  // ============================================================================
  // Meta Information
  // ============================================================================
  meta: {
    roundId: 'round-5-jun-2025',
    roundNumber: 5,
    isCurrentRound: false,
    month: 'June',
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
      'Survey Completion',
      'Alignment Asset Program Contributions',
      'Distinguished Network Contributions',
    ],
    totalPointsCollected: '9,950',
    totalTokensDistributed: '4,914',
  },

  // ============================================================================
  // Leaderboard Section Data
  // ============================================================================
  leaderboard: [
    { rank: 1, name: 'Anuj Pandey', activities: '', points: 2550 },
    { rank: 2, name: 'David Casey', activities: '', points: 1450 },
    { rank: 3, name: 'Rich Chang', activities: '', points: 1300 },
    { rank: 4, name: 'Kevin Houng', activities: '', points: 1100 },
    { rank: 5, name: 'Ian Brunner', activities: '', points: 900 },
    { rank: 6, name: 'Diana Stern', activities: '', points: 500 },
    { rank: 7, name: 'Ashley Franck', activities: '', points: 450 },
    { rank: 8, name: 'Theresa Therriault', activities: '', points: 400 },
    { rank: 9, name: 'Connor Dales', activities: '', points: 400 },
    { rank: 10, name: 'Erick Watson', activities: '', points: 300 },
  ],
};

/**
 * Export as default for easy importing
 */
export default pastRound5Data;
