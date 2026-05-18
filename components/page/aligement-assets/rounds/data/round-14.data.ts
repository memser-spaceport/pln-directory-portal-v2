import { IPastRoundData } from '../types/current-round.types';

export const pastRound14Data: IPastRoundData = {
  meta: {
    roundId: 'round-14-mar-2026',
    roundNumber: 14,
    isCurrentRound: false,
    month: 'March',
    year: 2026,
    lastUpdated: '2026-03-31T00:00:00'
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
    onboardedParticipants: 58,
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
    totalPointsCollected: '12,375',
    totalTokensDistributed: '9,970',
    numberOfBuybacks: 0
  },

  leaderboard: [
  ],
};

export default pastRound14Data;
