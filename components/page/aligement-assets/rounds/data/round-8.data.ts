/**
 * Master data for CurrentRound component
 * This file contains all section data in a centralized location
 * Can be replaced with API calls in the future
 */

import { IPastRoundData } from '../types/current-round.types';
import { DISCLOSURE_URL, SUPPORT_URL, SUPPORT_EMAIL } from '@/constants/plaa';

/**
 * Past Round 8 (September 2025) Master Data
 */
export const pastRound8Data: IPastRoundData = {
  // ============================================================================
  // Meta Information
  // ============================================================================
  meta: {
    roundId: 'round-8-sep-2025',
    roundNumber: 8,
    isCurrentRound: false,
    month: 'September',
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
    onboardedParticipants: 43,
    regionsUnlocked: ['USA'],
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
    totalPointsCollected: '11,450',
    totalTokensDistributed: '8,460'
  },

  // ============================================================================
  // Leaderboard Section Data
  // ============================================================================
  leaderboard: [
      { rank: 1, name: 'David Casey', activities: '', points: 1000 },
      { rank: 2, name: 'Theresa Therriault', activities: '', points: 950 },
      { rank: 3, name: 'Dottie Wang', activities: '', points: 200 },
      { rank: 4, name: 'Anuj Pandey', activities: '', points: 150 },
      { rank: 5, name: 'Michael Stachiw', activities: '', points: 150 },
      { rank: 6, name: 'Bradley Holden', activities: '', points: 100 },
      { rank: 7, name: 'Jeff De Gregorio', activities: '', points: 100 },
      { rank: 8, name: 'Ian Brunner', activities: '', points: 100 },
      { rank: 9, name: 'Matthew Koch', activities: '', points: 0 },
      { rank: 10, name: 'Stefanie Wykoff', activities: '', points: 0 },
  ],
};

/**
 * Export as default for easy importing
 */
export default pastRound8Data;
