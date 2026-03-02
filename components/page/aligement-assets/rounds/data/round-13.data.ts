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
    totalPointsCollected: '2,095',
    // totalTokensAvailable: '10,000',
    totalTokensDistributed: 'TBC',
    numberOfBuybacks: 0
  },

  // ============================================================================
  // Leaderboard Section Data
  // ============================================================================
  leaderboard: [
    // { rank: 1, name: 'Jennifer Denini', activities: '', points: 512 },
    // { rank: 2, name: 'Michael Stachiw', activities: '', points: 400 },
    // { rank: 3, name: 'Derrick Lam', activities: '', points: 200 },
    // { rank: 4, name: 'Ian Brunner', activities: '', points: 198 },
    // { rank: 5, name: 'Jeff De Gregorio', activities: '', points: 198 },
    // { rank: 6, name: 'Bradley Holden', activities: '', points: 150 },
    // { rank: 7, name: 'Corey James', activities: '', points: 150 },
    // { rank: 8, name: 'Camille Bagnall', activities: '', points: 100 },
    // { rank: 9, name: 'David Casey', activities: '', points: 100 },
    // { rank: 10, name: 'Raymond Cheng', activities: '', points: 62 },
    // { rank: 11, name: 'Theresa Therriault', activities: '', points: 25 },
    // { rank: 12, name: 'Alex Feerst', activities: '', points: 0 },
    // { rank: 13, name: 'Anuj Pandey', activities: '', points: 0 },
    // { rank: 14, name: 'Arleen Teranishi', activities: '', points: 0 },
    // { rank: 15, name: 'Ashley Franck', activities: '', points: 0 },
    // { rank: 16, name: 'Cameron Wood', activities: '', points: 0 },
    // { rank: 17, name: 'Carl Cervone', activities: '', points: 0 },
    // { rank: 18, name: 'Chris Brocoum', activities: '', points: 0 },
    // { rank: 19, name: 'Connor Dales', activities: '', points: 0 },
    // { rank: 20, name: 'Cyril Delattre', activities: '', points: 0 },
    // { rank: 21, name: 'David Huseby', activities: '', points: 0 },
    // { rank: 22, name: 'Diana Stern', activities: '', points: 0 },
    // { rank: 23, name: 'Diego Leal Togni', activities: '', points: 0 },
    // { rank: 24, name: 'Dottie Wang', activities: '', points: 0 },
    // { rank: 25, name: 'Erick Watson', activities: '', points: 0 },
    // { rank: 26, name: 'Eshan Chordia', activities: '', points: 0 },
    // { rank: 27, name: 'Evan Miyazono', activities: '', points: 0 },
    // { rank: 28, name: 'Francesca Cohen', activities: '', points: 0 },
    // { rank: 29, name: 'Holke Brammer', activities: '', points: 0 },
    // { rank: 30, name: 'Jonathan Victor', activities: '', points: 0 },
    // { rank: 31, name: 'Juan Benet', activities: '', points: 0 },
    // { rank: 32, name: 'Julio Garcia', activities: '', points: 0 },
    // { rank: 33, name: 'Justin Melillo', activities: '', points: 0 },
    // { rank: 34, name: 'Karla Tang', activities: '', points: 0 },
    // { rank: 35, name: 'Kevin Houng', activities: '', points: 0 },
    // { rank: 36, name: 'Laura Brewer', activities: '', points: 0 },
    // { rank: 37, name: 'Lynnette Nolan', activities: '', points: 0 },
    // { rank: 38, name: 'Matthew Koch', activities: '', points: 0 },
    // { rank: 39, name: 'Michelle Lee', activities: '', points: 0 },
    // { rank: 40, name: 'Molly Mackinlay', activities: '', points: 0 },
    // { rank: 41, name: 'Monica Ortel', activities: '', points: 0 },
    // { rank: 42, name: 'Patrick Kim', activities: '', points: 0 },
    // { rank: 43, name: 'René Pinnell', activities: '', points: 0 },
    // { rank: 44, name: 'Rich Chang', activities: '', points: 0 },
    // { rank: 45, name: 'Rohit Goel', activities: '', points: 0 },
    // { rank: 46, name: 'Russell Dempsey', activities: '', points: 0 },
    // { rank: 47, name: 'Sabeen Ali', activities: '', points: 0 },
    // { rank: 48, name: 'Shae Biron', activities: '', points: 0 },
    // { rank: 49, name: 'Stefaan Vervaet', activities: '', points: 0 },
    // { rank: 50, name: 'Stefanie Wykoff', activities: '', points: 0 },
    // { rank: 51, name: 'Victoria DeVesty', activities: '', points: 0 },
    // { rank: 52, name: 'William Scott', activities: '', points: 0 },
    // { rank: 53, name: 'Yolan Romailler', activities: '', points: 0 },
    // { rank: 54, name: 'Zachary von Naumann', activities: '', points: 0 }
  ],
};

/**
 * Export as default for easy importing
 */
export default pastRound13Data;
