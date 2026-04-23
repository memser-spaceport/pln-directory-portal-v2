import React from 'react';

import { ISubItem } from '@/components/core/navbar/type';
import { CalendarBlankIcon, ContributorIcon, UsersThreeIcon } from '@/components/icons';
import { MembersIcon, TeamsIcon, ProjectsIcon, KnowledgeBaseIcon, AccessControlIcon, DealsIcon, FounderGuidesIcon, DemoDayIcon, AnalyticsIcon, PrototypesIcon } from '../components/icons';

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
    href: '/events/all',
    icon: <CalendarBlankIcon />,
    title: 'All Events',
    description: 'Browse and register for all upcoming events',
  },
  {
    href: '/events/contributors',
    icon: <ContributorIcon />,
    title: 'Event Contributors',
    description: 'Hosts, speakers, and sponsors',
  },
] as const;

export const PROTOTYPE_LINKS: ISubItem[] = [
  {
    href: '/knowledge-base',
    icon: <KnowledgeBaseIcon />,
    title: 'Knowledge Base',
    description: 'Articles and resources from the network',
    section: 'Product Prototypes',
  },
  {
    href: '/deals-landing',
    icon: <DealsIcon />,
    title: 'Deals Landing Page',
    description: 'Unauthenticated vendor conversion page mockup',
    section: 'Product Prototypes',
  },
  {
    href: '/access-control',
    icon: <AccessControlIcon />,
    title: 'Access Control',
    description: 'RBAC management interface mockup',
    section: 'Admin Prototypes',
  },
  {
    href: '/rbac-v1-prototype',
    icon: <AccessControlIcon />,
    title: 'RBAC V1',
    description: 'Admin Office access management redesign · v1.1 spec',
    section: 'Admin Prototypes',
  },
] as const;

export const DEALS_LINK: ISubItem = {
  icon: <DealsIcon />,
  href: '/deals',
  title: 'Deals',
  description: 'Exclusive tools and perks for founders.',
};

export const FOUNDER_GUIDES_LINK: ISubItem = {
  icon: <FounderGuidesIcon />,
  href: '/founder-guides',
  title: 'Founder Guides',
  description: 'Structured, expert-driven guides for startup founders.',
};

export const DEMO_DAY_LINK: ISubItem = {
  icon: <DemoDayIcon />,
  href: '/demoday',
  title: 'Demo Days',
  description: 'Exclusive events where founders pitch to selected investors.',
};

export const DEMO_DAY_ANALYTICS_LINK: ISubItem = {
  icon: <AnalyticsIcon />,
  href: '/demo-day-analytics',
  title: 'Demo Day Analytics',
  description: 'Track Demo Day activity across teams, events, and interactions.',
};
