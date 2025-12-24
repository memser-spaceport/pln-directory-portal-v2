/**
 * Master data for CurrentRound component
 * This file contains all section data in a centralized location
 * Can be replaced with API calls in the future
 */

import { IPastRoundData } from '../types/current-round.types';
import { DISCLOSURE_URL, SUPPORT_URL, SUPPORT_EMAIL } from '@/constants/plaa';

/**
 * Past Round 7 (August 2025) Master Data
 */
export const pastRound7Data: IPastRoundData = {
  // ============================================================================
  // Meta Information
  // ============================================================================
  meta: {
    roundId: 'round-7-aug-2025',
    roundNumber: 7,
    isCurrentRound: false,
    month: 'August',
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
    onboardedParticipants: 41,
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
    totalPointsCollected: '14,350',
    totalTokensDistributed: '7,053',
    numberOfBuybacks: 1,
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

  // ============================================================================
  // Buyback Auction Section Data (Round 11 - December 2025)
  // ============================================================================
  buybackSimulation: {
    headerDescription: 'This first simulation tested the core mechanics of the reverse auction model — how participants submitted bids, how the clearing price was determined, and how tokens were allocated under the buyback pool. It revealed early patterns such as faster fills at lower bid prices and concentrated pool usage, establishing a baseline for understanding participation behavior and operational flow before later refinements.',
    summary: {
      title: 'Buyback Simulation #1 - Key Results',
      items: [
        {
          icon: '/icons/rounds/buy_action_results/wallet-01.svg',
          label: 'Total Buyback Pool',
          value: '$47,623.10'
        },
        {
          icon: '/icons/rounds/buy_action_results/pie-chart.svg',
          label: 'Pool Used',
          value: '99.98%'
        },
        {
          icon: '/icons/rounds/buy_action_results/coins-02.svg',
          label: 'Clearing Price',
          value: '$14.00'
        },
        {
          icon: '/icons/rounds/buy_action_results/analytics-01.svg',
          label: 'Capped Allocation',
          value: '$23,811.55 (50% cap)'
        },
        {
          icon: '/icons/rounds/buy_action_results/dollar-02.svg',
          label: 'Tokens Purchased',
          value: '3,401'
        },
        {
          icon: '/icons/rounds/buy_action_results/user-multiple.svg',
          label: 'Winning Bidders',
          value: '5'
        }
      ]
    },
    bids: [
      { bidderId: 'Bidder #12', tokensBid: '1,400', tokenPrice: '$10.25', bidValue: '$14,350.00', status: 'Fully Filled', amtFilled: '$14,350', accepted: '1,025', aggFill: '$14,350', percentCapture: '30.13%' },
      { bidderId: 'Bidder #13', tokensBid: '400', tokenPrice: '$12.00', bidValue: '$4,800.00', status: 'Partially Filled', amtFilled: '$4,788', accepted: '342', aggFill: '$19,138', percentCapture: '10.05%' },
      { bidderId: 'Bidder #2', tokensBid: '300', tokenPrice: '$12.00', bidValue: '$3,600.00', status: 'Partially Filled', amtFilled: '$3,598', accepted: '257', aggFill: '$22,736', percentCapture: '7.56%' },
      { bidderId: 'Bidder #8', tokensBid: '300', tokenPrice: '$12.00', bidValue: '$3,600.00', status: 'Partially Filled', amtFilled: '$3,598', accepted: '257', aggFill: '$26,334', percentCapture: '7.56%' },
      { bidderId: 'Bidder #2', tokensBid: '300', tokenPrice: '$14.00', bidValue: '$4,200.00', status: 'Fully Filled', amtFilled: '$4,200', accepted: '300', aggFill: '$30,534', percentCapture: '8.82%' },
      { bidderId: 'Bidder #9', tokensBid: '1,400', tokenPrice: '$14.00', bidValue: '$19,600.00', status: 'Partially Filled', amtFilled: '$17,080', accepted: '1,220', aggFill: '$47,614', percentCapture: '35.86%' }
    ]
  },
};

/**
 * Export as default for easy importing
 */
export default pastRound7Data;
