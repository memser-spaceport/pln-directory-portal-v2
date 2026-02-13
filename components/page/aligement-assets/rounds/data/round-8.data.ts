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
        //url: 'https://forms.gle/DiACtNgcsaAS8B6P8',
        url: '/alignment-asset/activities',
        type: 'primary',
        openInNewTab: false,
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
    onboardedParticipants: 44,
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
    totalPointsCollected: '11,450',
    totalTokensDistributed: '8,460',
  },

  // ============================================================================
  // Leaderboard Section Data
  // ============================================================================
  leaderboard: [
    { rank: 1, name: 'Molly Mackinlay', activities: '', points: 1350 },
    { rank: 2, name: 'Rich Chang', activities: '', points: 1300 },
    { rank: 3, name: 'Eshan Chordia', activities: '', points: 800 },
    { rank: 4, name: 'Theresa Therriault', activities: '', points: 800 },
    { rank: 5, name: 'Ian Brunner', activities: '', points: 750 },
    { rank: 6, name: 'Raymond Cheng', activities: '', points: 700 },
    { rank: 7, name: 'Jeff De Gregorio', activities: '', points: 550 },
    { rank: 8, name: 'Juan Benet', activities: '', points: 450 },
    { rank: 9, name: 'Zachary von Naumann', activities: '', points: 400 },
    { rank: 10, name: 'Chris Brocoum', activities: '', points: 350 },
    { rank: 11, name: 'Cyril Delattre', activities: '', points: 350 },
    { rank: 12, name: 'David Casey', activities: '', points: 350 },
    { rank: 13, name: 'Diana Stern', activities: '', points: 350 },
  ],
};

/**
 * Export as default for easy importing
 */
export default pastRound8Data;
