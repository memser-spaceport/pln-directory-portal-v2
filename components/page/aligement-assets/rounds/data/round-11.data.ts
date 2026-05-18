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
  ],

  // ============================================================================
  // Buyback Auction Section Data (Round 11 - December 2025)
  // ============================================================================
  buybackSimulation: {
    title: 'Live Buyback Auction',
    headerDescription: 'The first buyback auction for Round 11 demonstrated strong participation with 99.98% pool utilization. The auction cleared at $14.00 per token, with 5 winning bidders purchasing 3,401 tokens from a total pool of $47,623.10.',
    totalFilled: '$47,614',
    summary: {
      title: 'Buyback Auction #1 - Key Results',
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

