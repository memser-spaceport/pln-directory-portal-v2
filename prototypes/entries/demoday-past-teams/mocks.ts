import type { DemoDayState } from '@/app/actions/demo-day.actions';

// Mocked "already happened" (COMPLETED) demo day. Mirrors the shape the real
// completed page receives from getDemoDayState — no API call here.
export const mockCompletedDemoDay: DemoDayState = {
  uid: 'demoday-f25',
  title: 'PL Demo Day F25',
  description:
    'Showcased 28 teams from Pre-Seed to Series A+ across AI, neurotech, robotics, web3, and crypto. Explore the teams that presented below.',
  shortDescription: 'Fall 2025 cohort',
  status: 'COMPLETED',
  access: 'none',
  date: '2025-11-12T00:00:00.000Z',
  slugURL: 'pl-demo-day-f25',
  supportEmail: 'pldemoday@protocol.ai',
  teamsCount: 28,
  investorsCount: 120,
  confidentialityAccepted: true,
  isDemoDayAdmin: false,
};
