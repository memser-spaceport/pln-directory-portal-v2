import { IPastRoundData } from '../types/current-round.types';

/**
 * Past Round 17 (June 2026) Master Data
 * Final June snapshot — archived when Round 18 opened.
 * The Top 10 leaderboard is served from the backend (PAST_ROUND entries).
 */
export const pastRound17Data: IPastRoundData = {
  meta: {
    roundId: 'round-17-jun-2026',
    roundNumber: 17,
    isCurrentRound: false,
    month: 'June',
    year: 2026,
    lastUpdated: '2026-06-30T23:59:59'
  },

  hero: {
    title: 'PL Alignment Asset',
    subtitle: 'The PL Alignment Asset connects contributions across the Protocol Labs network — turning collaboration into shared success.',
    actions: [
      {
        label: 'Submit Activities',
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

  stats: {
    onboardedParticipants: 62,
    regionsUnlocked: ['USA', 'Germany', 'Switzerland', 'Portugal'],
    incentivizedActivities: [
      'Curate X Spaces',
      'Host Office Hours',
      'Create a Blog for the Network',
      'Complete or Update Your PL Directory Profile',
      'Design a Custom Incentive Experiment',
      'Contribute Your Compensation Data',
      'Talent Referral Program',
      'Create an Incentivized Activity',
      'Network Introductions',
      'Referral Program',
      'Survey Completion',
      'Alignment Asset Program Contributions',
      'Distinguished Network Contributions',
      'Help Organize an Event',
      'Construct an Alignment Asset Case Study',
      'Respond to an IRL Gathering',
      'Contribute a High-Quality Response to the Forum',
    ],
    totalPointsCollected: '5,250',
    totalTokensDistributed: 'TBD',
    numberOfBuybacks: 0
  },

  leaderboard: [
  ],
};

export default pastRound17Data;
