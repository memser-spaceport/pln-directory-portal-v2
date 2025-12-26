import React from 'react';

import { ISubItem } from '@/components/core/navbar/type';
import { CalendarBlankIcon, UsersThreeIcon } from '@/components/icons';
import { MembersIcon, TeamsIcon, ProjectsIcon } from '../components/icons';

export const DIRECTORY_LINKS: ISubItem[] = [
  {
    icon: <MembersIcon />,
    href: '/members',
    title: 'Members',
    description: 'Connect with individuals across the network',
  },
  {
    icon: <TeamsIcon />,
    href: '/teams',
    title: 'Teams',
    description: 'Discover organizations in web3, AI, neurotech and other innovation areas',
  },
  {
    icon: <ProjectsIcon />,
    href: '/projects',
    title: 'Projects',
    description: 'See what the network is building',
  },
] as const;

export const EVENT_LINKS: ISubItem[] = [
  {
    href: '/events/irl',
    icon: <UsersThreeIcon />,
    title: 'IRL Gatherings',
    description: 'Explore major events and attendees by location',
  },
  {
    href: '/events',
    icon: <CalendarBlankIcon />,
    title: 'Schedule',
    description: 'Browse and register for all upcoming events',
  },
] as const;
