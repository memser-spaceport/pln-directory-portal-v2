/**
 * Master data for CurrentRound component
 * This file contains all section data in a centralized location
 * Can be replaced with API calls in the future
 */

import { IPastRoundData } from '../types/current-round.types';
import { DISCLOSURE_URL, SUPPORT_URL, SUPPORT_EMAIL } from '@/constants/plaa';

/**
 * Past Round 10 (November 2025) Master Data
 */
export const pastRound10Data: IPastRoundData = {
  // ============================================================================
  // Meta Information
  // ============================================================================
  meta: {
    roundId: 'round-10-nov-2025',
    roundNumber: 10,
    isCurrentRound: false,
    month: 'November',
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
    onboardedParticipants: 46,
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
      'Distinguished Network Contributions'
    ],
    totalPointsCollected: '12,900',
    totalTokensDistributed: '8,458',
    labweek25IncentivizedActivities: [
      'Bring a Friend to Happy Hour',
    ]
  },

  // ============================================================================
  // Leaderboard Section Data
  // ============================================================================
  leaderboard: [
    { rank: 1, name: 'Bradley Holden', activities: '', points: 2200 },
    { rank: 2, name: 'William Scott', activities: '', points: 2150 },
    { rank: 3, name: 'Theresa Therriault', activities: '', points: 1100 },
    { rank: 4, name: 'Anuj Pandey', activities: '', points: 750 },
    { rank: 5, name: 'Lynnette Nolan', activities: '', points: 700 },
    { rank: 6, name: 'Molly Mackinlay', activities: '', points: 700 },
    { rank: 7, name: 'Raymond Cheng', activities: '', points: 700 },
    { rank: 8, name: 'Juan Benet', activities: '', points: 600 },
    { rank: 9, name: 'Diana Stern', activities: '', points: 500 },
    { rank: 10, name: 'Ian Brunner', activities: '', points: 500 },
    { rank: 11, name: 'Stef Wykoff', activities: '', points: 500 },
  ],
};

/**
 * Export as default for easy importing
 */
export default pastRound10Data;
