/**
 * Master data for CurrentRound component
 * This file contains all section data in a centralized location
 * Can be replaced with API calls in the future
 */

import { IPastRoundData } from '../types/current-round.types';
import { DISCLOSURE_URL, SUPPORT_URL, SUPPORT_EMAIL } from '@/constants/plaa';

/**
 * Past Round 9 (October 2025) Master Data
 */
export const pastRound9Data: IPastRoundData = {
  // ============================================================================
  // Meta Information
  // ============================================================================
  meta: {
    roundId: 'round-9-oct-2025',
    roundNumber: 9,
    isCurrentRound: false,
    month: 'October',
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
    onboardedParticipants: 44,
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
    totalPointsCollected: '7,400',
    totalTokensDistributed: '7,060',
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
    headerDescription: 'This second simulation, compared with the first, showed how different bid patterns and participation levels affect clearing prices, pool usage, and token allocation outcomes. With a wider spread of bid values and higher activity, it produced clearer differences in demand, fill rates, and bidder distribution. These insights informed refinements to handling partial fills, applying the cap, and understanding how bid density shapes the final clearing price.',
    totalFilled: '$35,300',
    summary: {
      title: 'Buyback Simulation #2 - Key Results',
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
      { bidderId: 'Bidder #1', tokensBid: '10', tokenPrice: '$1.00', bidValue: '$10', status: 'Fully Filled', amtFilled: '$20', accepted: '$1.00', aggFill: '$20', percentCapture: '0.06%' },
      { bidderId: 'Bidder #1', tokensBid: '10', tokenPrice: '$2.00', bidValue: '$20', status: 'Fully Filled', amtFilled: '$20', accepted: '$1.00', aggFill: '$40', percentCapture: '0.06%' },
      { bidderId: 'Bidder #1', tokensBid: '10', tokenPrice: '$3.00', bidValue: '$30', status: 'Partially Filled', amtFilled: '$20', accepted: '$1.00', aggFill: '$60', percentCapture: '0.06%' },
      { bidderId: 'Bidder #1', tokensBid: '10', tokenPrice: '$4.00', bidValue: '$40', status: 'Fully Filled', amtFilled: '$40', accepted: '$2.00', aggFill: '$100', percentCapture: '0.11%' },
      { bidderId: 'Bidder #1', tokensBid: '10', tokenPrice: '$5.00', bidValue: '$50', status: 'Partially Filled', amtFilled: '$40', accepted: '$2.00', aggFill: '$140', percentCapture: '0.11%' },
      { bidderId: 'Bidder #1', tokensBid: '10', tokenPrice: '$6.00', bidValue: '$60', status: 'Fully Filled', amtFilled: '$60', accepted: '$3.00', aggFill: '$200', percentCapture: '0.17%' },
      { bidderId: 'Bidder #1', tokensBid: '10', tokenPrice: '$7.00', bidValue: '$70', status: 'Partially Filled', amtFilled: '$60', accepted: '$3.00', aggFill: '$260', percentCapture: '0.17%' },
      { bidderId: 'Bidder #1', tokensBid: '10', tokenPrice: '$8.00', bidValue: '$80', status: 'Fully Filled', amtFilled: '$80', accepted: '$4.00', aggFill: '$340', percentCapture: '0.23%' },
      { bidderId: 'Bidder #1', tokensBid: '10', tokenPrice: '$9.00', bidValue: '$90', status: 'Partially Filled', amtFilled: '$80', accepted: '$4.00', aggFill: '$420', percentCapture: '0.23%' },
      { bidderId: 'Bidder #2', tokensBid: '100', tokenPrice: '$9.00', bidValue: '$900', status: 'Fully Filled', amtFilled: '$900', accepted: '$45.00', aggFill: '$1,320', percentCapture: '2.55%' },
      { bidderId: 'Bidder #1', tokensBid: '10', tokenPrice: '$10.00', bidValue: '$100', status: 'Fully Filled', amtFilled: '$100', accepted: '$5', aggFill: '$1,420', percentCapture: '0.28%' },
      { bidderId: 'Bidder #2', tokensBid: '100', tokenPrice: '$10.00', bidValue: '$1,000', status: 'Fully Filled', amtFilled: '$1,000', accepted: '$50', aggFill: '$2,420', percentCapture: '2.83%' },
      { bidderId: 'Bidder #1', tokensBid: '10', tokenPrice: '$11.00', bidValue: '$110', status: 'Partially Filled', amtFilled: '$100', accepted: '$5', aggFill: '$2,520', percentCapture: '0.28%' },
      { bidderId: 'Bidder #2', tokensBid: '100', tokenPrice: '$11.00', bidValue: '$1,100', status: 'Fully Filled', amtFilled: '$1,100', accepted: '$55', aggFill: '$3,620', percentCapture: '3.11%' },
      { bidderId: 'Bidder #1', tokensBid: '10', tokenPrice: '$12.00', bidValue: '$120', status: 'Fully Filled', amtFilled: '$120', accepted: '$6', aggFill: '$3,740', percentCapture: '0.34%' },
      { bidderId: 'Bidder #1', tokensBid: '10', tokenPrice: '$12.00', bidValue: '$120', status: 'Fully Filled', amtFilled: '$120', accepted: '$6', aggFill: '$3,860', percentCapture: '0.34%' },
      { bidderId: 'Bidder #1', tokensBid: '10', tokenPrice: '$13.00', bidValue: '$130', status: 'Partially Filled', amtFilled: '$120', accepted: '$6', aggFill: '$3,980', percentCapture: '0.34%' },
      { bidderId: 'Bidder #2', tokensBid: '100', tokenPrice: '$13.00', bidValue: '$1,300', status: 'Fully Filled', amtFilled: '$1,300', accepted: '$65', aggFill: '$5,280', percentCapture: '3.68%' },
      { bidderId: 'Bidder #3', tokensBid: '80', tokenPrice: '$13.00', bidValue: '$1,040', status: 'Fully Filled', amtFilled: '$1,040', accepted: '$52', aggFill: '$6,320', percentCapture: '2.94%' },
      { bidderId: 'Bidder #2', tokensBid: '100', tokenPrice: '$14.00', bidValue: '$1,400', status: 'Fully Filled', amtFilled: '$1,400', accepted: '$70', aggFill: '$7,720', percentCapture: '3.96%' },
      { bidderId: 'Bidder #1', tokensBid: '10', tokenPrice: '$15.00', bidValue: '$150', status: 'Partially Filled', amtFilled: '$140', accepted: '$7', aggFill: '$7,860', percentCapture: '0.40%' },
      { bidderId: 'Bidder #2', tokensBid: '100', tokenPrice: '$15.00', bidValue: '$1,500', status: 'Fully Filled', amtFilled: '$1,500', accepted: '$75', aggFill: '$9,360', percentCapture: '4.25%' },
      { bidderId: 'Bidder #2', tokensBid: '100', tokenPrice: '$17.00', bidValue: '$1,700', status: 'Fully Filled', amtFilled: '$1,700', accepted: '$85', aggFill: '$11,060', percentCapture: '4.81%' },
      { bidderId: 'Bidder #4', tokensBid: '100', tokenPrice: '$18.00', bidValue: '$1,800', status: 'Fully Filled', amtFilled: '$1,800', accepted: '$90', aggFill: '$12,860', percentCapture: '5.10%' },
      { bidderId: 'Bidder #2', tokensBid: '100', tokenPrice: '$18.00', bidValue: '$1,800', status: 'Fully Filled', amtFilled: '$1,800', accepted: '$90', aggFill: '$14,660', percentCapture: '5.10%' },
      { bidderId: 'Bidder #5', tokensBid: '1000', tokenPrice: '$19.25', bidValue: '$19,250', status: 'Limit', amtFilled: '$17,660', accepted: '$883', aggFill: '$32,320', percentCapture: '50.00%' },
      { bidderId: 'Bidder #1', tokensBid: '25', tokenPrice: '$20.00', bidValue: '$500', status: 'Pro Rata', amtFilled: '$60', accepted: '$3', aggFill: '$32,380', percentCapture: '0.17%' },
      { bidderId: 'Bidder #6', tokensBid: '1000', tokenPrice: '$20.00', bidValue: '$20,000', status: 'Pro Rata', amtFilled: '$2,440', accepted: '$122', aggFill: '$34,820', percentCapture: '6.91%' },
      { bidderId: 'Bidder #7', tokensBid: '100', tokenPrice: '$20.00', bidValue: '$2,000', status: 'Pro Rata', amtFilled: '$240', accepted: '$12', aggFill: '$35,060', percentCapture: '0.68%' },
      { bidderId: 'Bidder #2', tokensBid: '100', tokenPrice: '$20.00', bidValue: '$2,000', status: 'Pro Rata', amtFilled: '$240', accepted: '12', aggFill: '$35,300', percentCapture: '0.68%' }
    ]
  },
};

/**
 * Export as default for easy importing
 */
export default pastRound9Data;
