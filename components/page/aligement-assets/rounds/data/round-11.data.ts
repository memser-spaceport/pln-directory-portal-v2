/**
 * Master data for PastRound component
 * This file contains all section data for Round 11 (December 2025)
 * Can be replaced with API calls in the future
 */

import { IPastRoundData } from '../types/current-round.types';
import { DISCLOSURE_URL, SUPPORT_URL, SUPPORT_EMAIL } from '@/constants/plaa';

/**
 * Past Round 11 (December 2025) Master Data
 */
export const pastRound11Data: IPastRoundData = {
  // ============================================================================
  // Meta Information
  // ============================================================================
  meta: {
    roundId: 'round-11-dec-2025',
    roundNumber: 11,
    isCurrentRound: false,
    month: 'December',
    year: 2025,
    lastUpdated: '2026-01-18T00:00:00'
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
    onboardedParticipants: 48,
    regionsUnlocked: ['USA', 'Germany', 'Switzerland'],
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
    totalPointsCollected: '6,100',
    totalTokensDistributed: '8,346', // Tokens still calculating
    numberOfBuybacks: 1
  },

  // ============================================================================
  // Leaderboard Section Data
  // ============================================================================
  leaderboard: [
    { rank: 1, name: 'David Casey', activities: '', points: 1600 },
    { rank: 2, name: 'Theresa Therriault', activities: '', points: 950 },
    { rank: 3, name: 'Bradley Holden', activities: '', points: 500 },
    { rank: 4, name: 'Michael Stachiw', activities: '', points: 350 },
    { rank: 5, name: 'Dottie Wang', activities: '', points: 300 },
    { rank: 6, name: 'Connor Dales', activities: '', points: 200 },
    { rank: 7, name: 'Eshan Chordia', activities: '', points: 200 },
    { rank: 8, name: 'Ian Brunner', activities: '', points: 200 },
    { rank: 9, name: 'Jeff De Gregorio', activities: '', points: 200 },
    { rank: 10, name: 'Lynnette Nolan', activities: '', points: 200 },
    { rank: 11, name: 'Rich Chang', activities: '', points: 200 },
    { rank: 12, name: 'Zachary von Naumann', activities: '', points: 200 },

    // { rank: 4, name: 'Anuj Pandey', activities: '', points: 150 },
    // { rank: 9, name: 'Matthew Koch', activities: '', points: 0 },
    // { rank: 10, name: 'Stefanie Wykoff', activities: '', points: 0 },
    // { rank: 11, name: 'Victoria DeVesty', activities: '', points: 0 },
    // { rank: 12, name: 'Justin Melillo', activities: '', points: 0 },
    // { rank: 14, name: 'Julio Garcia', activities: '', points: 0 },
    // { rank: 15, name: 'Francesca Cohen', activities: '', points: 0 },
    // { rank: 16, name: 'Kevin Houng', activities: '', points: 0 },
    // { rank: 18, name: 'Erick Watson', activities: '', points: 0 },
    // { rank: 19, name: 'Corey James', activities: '', points: 0 },
    // { rank: 20, name: 'Diana Stern', activities: '', points: 0 },
    // { rank: 21, name: 'Stefaan Vervaet', activities: '', points: 0 },
    // { rank: 22, name: 'Carl Cervone', activities: '', points: 0 },
    // { rank: 23, name: 'Laura Brewer', activities: '', points: 0 },
    // { rank: 24, name: 'Chris Brocoum', activities: '', points: 0 },
    // { rank: 25, name: 'Ashley Franck', activities: '', points: 0 },
    // { rank: 26, name: 'Monica Ortel', activities: '', points: 0 },
    // { rank: 27, name: 'Jonathan Victor', activities: '', points: 0 },
    // { rank: 28, name: 'Cyril Delattre', activities: '', points: 0 },
    // { rank: 29, name: 'Raymond Cheng', activities: '', points: 0 },
    // { rank: 30, name: 'William Scott', activities: '', points: 0 },
    // { rank: 31, name: 'Patrick Kim', activities: '', points: 0 },
    // { rank: 33, name: 'Molly Mackinlay', activities: '', points: 0 },
    // { rank: 34, name: 'Juan Benet', activities: '', points: 0 },
    // { rank: 35, name: 'Russell Dempsey', activities: '', points: 0 },
    // { rank: 36, name: 'Derrick Lam', activities: '', points: 0 },
    // { rank: 37, name: 'Karla Tang', activities: '', points: 0 },
    // { rank: 38, name: 'Arleen Teranishi', activities: '', points: 0 },
    // { rank: 39, name: 'Rohit Goel', activities: '', points: 0 },
    // { rank: 40, name: 'David Huseby', activities: '', points: 0 },
    // { rank: 41, name: 'René Pinnell', activities: '', points: 0 },
    // { rank: 42, name: 'Evan Miyazono', activities: '', points: 0 },
    // { rank: 44, name: 'Alex Feerst', activities: '', points: 0 },
    // { rank: 46, name: 'Michelle Lee', activities: '', points: 0 }
  ],

  // ============================================================================
  // Buyback Auction Section Data (Round 11 - December 2025)
  // ============================================================================
  buybackSimulation: {
    headerDescription: 'The first buyback auction for Round 11 demonstrated strong participation with 99.98% pool utilization. The auction cleared at $14.00 per token, with 5 winning bidders purchasing 3,401 tokens from a total pool of $47,623.10.',
    totalFilled: '$47,614',
    summary: {
      title: 'Buyback Auction #1 - December 2025 - Key Results',
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
export default pastRound11Data;

