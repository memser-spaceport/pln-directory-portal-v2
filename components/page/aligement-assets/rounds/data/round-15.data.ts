import { IPastRoundData } from '../types/current-round.types';

export const pastRound15Data: IPastRoundData = {
  meta: {
    roundId: 'round-15-apr-2026',
    roundNumber: 15,
    isCurrentRound: false,
    month: 'April',
    year: 2026,
    lastUpdated: '2026-04-30T00:00:00'
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
    onboardedParticipants: 59,
    regionsUnlocked: ['USA', 'Germany', 'Switzerland', 'Portugal'],
    incentivizedActivities: [
      'Curate X Spaces',
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
    totalPointsCollected: '3,000',
    totalTokensDistributed: '0',
    numberOfBuybacks: 0
  },

  leaderboard: [
    { rank: 1, name: 'David Casey', activities: '', points: 1400 },
    { rank: 2, name: 'David Dao', activities: '', points: 450 },
    { rank: 3, name: 'Molly Mackinlay', activities: '', points: 450 },
    { rank: 4, name: 'Bradley Holden', activities: '', points: 300 },
    { rank: 5, name: 'Jeremy Kloth', activities: '', points: 300 },
    { rank: 6, name: 'Juan Benet', activities: '', points: 300 },
    { rank: 7, name: 'Anuj Pandey', activities: '', points: 150 },
    { rank: 8, name: 'Lynnette Nolan', activities: '', points: 150 },
    { rank: 9, name: 'Theresa Therriault', activities: '', points: 150 },
    { rank: 10, name: 'Justin Melillo', activities: '', points: 100 }
  ],
};

export default pastRound15Data;
